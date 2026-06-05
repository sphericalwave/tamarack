#!/usr/bin/env python3
"""
receipt_matcher.py

Match PDF/image receipts against master timesheet expenses using Claude vision.
Verified receipts are renamed and organized into client/project folders.
Unmatched receipts are copied to a failed/ subfolder.

Usage:
  python3 tools/receipt_matcher.py [options]

Options:
  --receipts DIR      Raw receipts folder (default: receipts/)
  --timesheet FILE    Master Excel (default: timesheet/master-timesheet.xlsx)
  --output DIR        Output root (default: receipts_verified/)
  --api-key KEY       Anthropic API key (or ANTHROPIC_API_KEY env var)
  --threshold N       Match score 0-100, default 55
  --dry-run           Preview without moving files
  --sheet NAME        Expenses sheet name (default: Expenses)
"""

import argparse
import base64
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from datetime import datetime, date
from difflib import SequenceMatcher
from pathlib import Path
from typing import Optional

import openpyxl

# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

# Payment types that never have receipts
_NO_RECEIPT_TYPES = {"per diem", "mileage"}

RECEIPT_EXTS = {".pdf", ".jpg", ".jpeg", ".png", ".heic", ".webp", ".tiff", ".tif"}


@dataclass
class Expense:
    seq: int
    employee: str
    project_raw: str          # e.g. "AAN - Detour Gold"
    date: date
    subtotal: Optional[float]
    tax: Optional[float]
    tip: Optional[float]
    total: float
    vendor_notes: str
    tax_rate: Optional[str]
    payment_type: str
    client: str = field(init=False)
    project: str = field(init=False)
    matched: bool = field(default=False, init=False)

    def __post_init__(self):
        self.client, self.project = parse_project(self.project_raw)

    @property
    def needs_receipt(self) -> bool:
        return self.payment_type.lower().strip() not in _NO_RECEIPT_TYPES


@dataclass
class ReceiptExtract:
    """Claude's vision extraction result for one receipt file."""
    path: Path
    date: Optional[date]
    vendor: Optional[str]
    subtotal: Optional[float]
    tax: Optional[float]
    tip: Optional[float]
    total: Optional[float]
    raw_response: str
    model_used: str = "unknown"
    error: Optional[str] = None


@dataclass
class MatchResult:
    receipt: ReceiptExtract
    expense: Optional[Expense]
    score: float          # 0–100
    verified: bool
    dest_path: Optional[Path] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def parse_project(project_raw: str) -> tuple[str, str]:
    """Split 'CLIENT – Project Name' into (client, project)."""
    # Try em-dash, then en-dash, then plain hyphen with spaces
    for sep in [" – ", " — ", " - "]:
        if sep in project_raw:
            parts = project_raw.split(sep, 1)
            return parts[0].strip(), parts[1].strip()
    return project_raw.strip(), "General"


def sanitize_name(text: str, max_words: int = 4) -> str:
    """Turn free-form text into a safe filename component."""
    # Remove common prefixes/suffixes like room numbers, 'for ...', parentheticals
    text = re.sub(r"\(.*?\)", "", text)
    # Replace slashes, dashes, spaces with underscore
    text = re.sub(r"[\s/\\–\-]+", "_", text.strip())
    # Remove any char that isn't alphanumeric or underscore
    text = re.sub(r"[^\w]", "", text)
    # Collapse multiple underscores
    text = re.sub(r"_+", "_", text).strip("_")
    # Limit to first N words (split on underscore)
    parts = text.split("_")
    return "_".join(parts[:max_words])


def vendor_slug(vendor_notes: str) -> str:
    """Short vendor slug for filenames — first 3 meaningful tokens."""
    # Drop leading stop-words and generic terms
    stop = {"for", "to", "from", "the", "a", "an", "and", "rm", "room", "no"}
    tokens = re.split(r"[\s\-–/\\]+", vendor_notes.strip())
    meaningful = [t for t in tokens if t.lower() not in stop and t]
    slug = "_".join(meaningful[:3])
    return sanitize_name(slug, max_words=3)


def build_filename(expense: Expense, receipt_path: Path, suffix: str = "_V") -> str:
    """
    Build canonical filename.
    Convention: YYYY.MM.DD_Client_Project_Vendor_Employee[_V].ext
    """
    date_str = expense.date.strftime("%Y.%m.%d")
    client_s = sanitize_name(expense.client, max_words=3)
    project_s = sanitize_name(expense.project, max_words=4)
    vendor_s = vendor_slug(expense.vendor_notes)
    emp = sanitize_name(expense.employee, max_words=1)
    ext = receipt_path.suffix.lower()
    return f"{date_str}_{client_s}_{project_s}_{vendor_s}_{emp}{suffix}{ext}"


def _to_float(val) -> Optional[float]:
    try:
        return float(val) if val is not None else None
    except (TypeError, ValueError):
        return None


def _to_date(val) -> Optional[date]:
    if isinstance(val, (datetime,)):
        return val.date()
    if isinstance(val, date):
        return val
    if isinstance(val, str):
        for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"]:
            try:
                return datetime.strptime(val.strip(), fmt).date()
            except ValueError:
                pass
    return None


# ---------------------------------------------------------------------------
# Expense loading
# ---------------------------------------------------------------------------

def load_expenses(xlsx_path: Path, sheet_name: str = "Expenses") -> list[Expense]:
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    ws = wb[sheet_name]
    rows = list(ws.iter_rows(values_only=True))
    header = [str(c).strip() if c else "" for c in rows[0]]

    col = {name: idx for idx, name in enumerate(header)}

    expenses = []
    for row in rows[1:]:
        if not any(row):
            continue
        total_raw = _to_float(row[col.get("Total", 7)])
        date_raw = _to_date(row[col.get("Date", 3)])
        if total_raw is None or date_raw is None:
            continue  # skip malformed rows
        exp = Expense(
            seq=int(row[col.get("Seq", 0)] or 0),
            employee=str(row[col.get("Employee", 1)] or "").strip(),
            project_raw=str(row[col.get("Project", 2)] or "").strip(),
            date=date_raw,
            subtotal=_to_float(row[col.get("Expense Amount", 4)]),
            tax=_to_float(row[col.get("Tax", 5)]),
            tip=_to_float(row[col.get("Tip", 6)]),
            total=total_raw,
            vendor_notes=str(row[col.get("Vendor and Notes", 8)] or "").strip(),
            tax_rate=str(row[col.get("Tax Rate", 9)] or ""),
            payment_type=str(row[col.get("Payment Type", 10)] or ""),
        )
        expenses.append(exp)
    return expenses


# ---------------------------------------------------------------------------
# Vision extraction
# ---------------------------------------------------------------------------

# Formats Claude's API natively accepts
_NATIVE_MEDIA = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".pdf": "application/pdf",
}

# Formats that need conversion via sips (macOS built-in) before sending
_NEEDS_CONVERSION = {".heic", ".tiff", ".tif"}


def _convert_to_jpeg(path: Path) -> Path:
    """Convert HEIC/TIFF to JPEG using macOS sips. Returns a temp file path."""
    tmp = Path(tempfile.mktemp(suffix=".jpg"))
    result = subprocess.run(
        ["sips", "-s", "format", "jpeg", str(path), "--out", str(tmp)],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"sips conversion failed: {result.stderr.strip()}")
    return tmp


def _encode_file(path: Path) -> tuple[str, str, Optional[Path]]:
    """
    Return (media_type, base64_data, temp_path).
    temp_path is set when a conversion temp file was created — caller must delete it.
    """
    ext = path.suffix.lower()
    temp_path: Optional[Path] = None

    if ext in _NEEDS_CONVERSION:
        temp_path = _convert_to_jpeg(path)
        encode_path = temp_path
        media_type = "image/jpeg"
    else:
        encode_path = path
        media_type = _NATIVE_MEDIA.get(ext, "image/jpeg")

    data = base64.standard_b64encode(encode_path.read_bytes()).decode("utf-8")
    return media_type, data, temp_path


_EXTRACT_PROMPT = """You are a receipt parser. Extract data from this receipt and return ONLY valid JSON with these fields:
{
  "date": "YYYY-MM-DD or null",
  "vendor": "merchant or vendor name (short, 1-4 words)",
  "subtotal": <number or null>,
  "tax": <number or null>,
  "tip": <number or null>,
  "total": <number or null>,
  "currency": "CAD or USD or other"
}
Rules:
- date: the transaction date, not statement date
- vendor: the business name, not a description
- subtotal: pre-tax amount
- total: the final charged amount (including tax and tip)
- Use null for any field not present
- Numbers must be plain floats (no $ signs or commas)
- Return ONLY the JSON object, nothing else"""


_MODEL_HAIKU = "claude-haiku-4-5-20251001"
_MODEL_SONNET = "claude-sonnet-4-6"


def extract_receipt(path: Path, client, model: str = _MODEL_HAIKU) -> ReceiptExtract:
    """Send one receipt to Claude vision and return structured extraction."""
    temp_path: Optional[Path] = None
    try:
        media_type, b64_data, temp_path = _encode_file(path)
    except Exception as e:
        return ReceiptExtract(
            path=path, date=None, vendor=None, subtotal=None,
            tax=None, tip=None, total=None, raw_response="",
            model_used=model, error=f"File prep error: {e}",
        )

    try:
        if media_type == "application/pdf":
            content_block = {
                "type": "document",
                "source": {"type": "base64", "media_type": "application/pdf", "data": b64_data},
            }
        else:
            content_block = {
                "type": "image",
                "source": {"type": "base64", "media_type": media_type, "data": b64_data},
            }

        response = client.messages.create(
            model=model,
            max_tokens=512,
            messages=[{"role": "user", "content": [content_block, {"type": "text", "text": _EXTRACT_PROMPT}]}],
        )

        raw = response.content[0].text.strip()
        raw_clean = re.sub(r"^```(?:json)?\s*", "", raw)
        raw_clean = re.sub(r"\s*```$", "", raw_clean)
        data = json.loads(raw_clean)

        return ReceiptExtract(
            path=path,
            date=_to_date(data.get("date")),
            vendor=data.get("vendor"),
            subtotal=_to_float(data.get("subtotal")),
            tax=_to_float(data.get("tax")),
            tip=_to_float(data.get("tip")),
            total=_to_float(data.get("total")),
            raw_response=raw,
            model_used=model,
        )

    except json.JSONDecodeError as e:
        return ReceiptExtract(
            path=path, date=None, vendor=None, subtotal=None,
            tax=None, tip=None, total=None, raw_response="",
            model_used=model, error=f"JSON parse error: {e}",
        )
    except Exception as e:
        return ReceiptExtract(
            path=path, date=None, vendor=None, subtotal=None,
            tax=None, tip=None, total=None, raw_response="",
            model_used=model, error=str(e),
        )
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()


def extract_receipt_with_fallback(
    path: Path, client, expenses: list[Expense], threshold: float
) -> tuple[ReceiptExtract, str]:
    """
    Try Haiku first. Fall back to Sonnet if:
      - Haiku returns an error, or
      - Haiku extracts fields but no expense matches above threshold.
    Returns (extract, reason) where reason is 'haiku', 'sonnet-error', or 'sonnet-low-score'.
    """
    extract = extract_receipt(path, client, model=_MODEL_HAIKU)

    if extract.error:
        print(f"  ⚠ Haiku error ({extract.error}) — retrying with Sonnet")
        extract = extract_receipt(path, client, model=_MODEL_SONNET)
        return extract, "sonnet-error-fallback"

    _, score = best_match(extract, expenses, threshold)
    if score < threshold:
        print(f"  ⚠ Haiku score {score:.1f} below threshold — retrying with Sonnet")
        sonnet_extract = extract_receipt(path, client, model=_MODEL_SONNET)
        if not sonnet_extract.error:
            _, sonnet_score = best_match(sonnet_extract, expenses, threshold)
            if sonnet_score > score:
                return sonnet_extract, "sonnet-score-fallback"
        # Sonnet didn't help or errored — return original Haiku result
        return extract, "haiku-kept"

    return extract, "haiku"


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------

def _date_score(r_date: Optional[date], e_date: date) -> float:
    """0–1 score based on date proximity."""
    if r_date is None:
        return 0.3  # partial credit — date unreadable but not disqualifying
    delta = abs((r_date - e_date).days)
    return {0: 1.0, 1: 0.85, 2: 0.65, 3: 0.45}.get(delta, 0.0)


def _amount_score(r_total: Optional[float], e_total: float) -> float:
    """0–1 score based on total amount proximity."""
    if r_total is None:
        return 0.3
    if e_total == 0:
        return 1.0 if r_total == 0 else 0.0
    diff_pct = abs(r_total - e_total) / e_total
    if diff_pct <= 0.01:
        return 1.0
    if diff_pct <= 0.05:
        return 0.75
    if diff_pct <= 0.10:
        return 0.45
    return 0.0


def _vendor_score(r_vendor: Optional[str], e_vendor: str) -> float:
    """0–1 fuzzy match on vendor name."""
    if not r_vendor or not e_vendor:
        return 0.0
    ratio = SequenceMatcher(None, r_vendor.lower(), e_vendor.lower()).ratio()
    # Also try matching r_vendor against just the first word of e_vendor
    first_word = e_vendor.split()[0].lower() if e_vendor.split() else ""
    if first_word:
        ratio = max(ratio, SequenceMatcher(None, r_vendor.lower(), first_word).ratio())
    return ratio


def score_match(receipt: ReceiptExtract, expense: Expense) -> float:
    """
    Return a 0–100 composite match score.
    Weights: date 45%, amount 45%, vendor 10%.
    """
    ds = _date_score(receipt.date, expense.date)
    ams = _amount_score(receipt.total, expense.total)
    vs = _vendor_score(receipt.vendor, expense.vendor_notes)
    return (ds * 0.45 + ams * 0.45 + vs * 0.10) * 100


def best_match(receipt: ReceiptExtract, expenses: list[Expense], threshold: float) -> tuple[Optional[Expense], float]:
    """Find the best unmatched expense for a receipt. Returns (expense, score)."""
    candidates = [(exp, score_match(receipt, exp)) for exp in expenses if exp.needs_receipt and not exp.matched]
    if not candidates:
        return None, 0.0
    best_exp, best_score = max(candidates, key=lambda x: x[1])
    if best_score >= threshold:
        return best_exp, best_score
    return None, best_score


# ---------------------------------------------------------------------------
# File operations
# ---------------------------------------------------------------------------

def organize_receipt(
    result: MatchResult,
    output_root: Path,
    dry_run: bool,
) -> Path:
    """Copy/move receipt to its destination. Returns the destination path."""
    if result.verified and result.expense:
        exp = result.expense
        dest_dir = output_root / sanitize_name(exp.client, 3) / sanitize_name(exp.project, 4)
        filename = build_filename(exp, result.receipt.path)
    else:
        dest_dir = output_root / "failed"
        filename = result.receipt.path.name

    dest_path = dest_dir / filename

    if not dry_run:
        dest_dir.mkdir(parents=True, exist_ok=True)
        # Use copy so originals stay intact
        shutil.copy2(result.receipt.path, dest_path)

    return dest_path


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

def print_report(
    expenses: list[Expense],
    results: list[MatchResult],
    output_root: Path,
    dry_run: bool,
):
    total_expenses = len(expenses)
    receipt_required = [e for e in expenses if e.needs_receipt]
    matched_expenses = [e for e in expenses if e.matched]
    unmatched_expenses = [e for e in receipt_required if not e.matched]

    verified = [r for r in results if r.verified]
    failed = [r for r in results if not r.verified]

    drystr = " [DRY RUN]" if dry_run else ""
    print(f"\n{'='*60}")
    print(f"RECEIPT MATCHING REPORT{drystr}")
    print(f"{'='*60}")
    print(f"Expenses in timesheet : {total_expenses}")
    print(f"  — require receipts  : {len(receipt_required)}")
    print(f"  — per diem/mileage  : {total_expenses - len(receipt_required)}")
    print(f"\nReceipts processed    : {len(results)}")
    print(f"  — verified ✓        : {len(verified)}")
    print(f"  — failed ✗          : {len(failed)}")
    print(f"\nExpenses with receipt : {len(matched_expenses)}/{len(receipt_required)}")
    print(f"Expenses MISSING receipt: {len(unmatched_expenses)}")

    if verified:
        print(f"\n{'─'*60}")
        print("VERIFIED RECEIPTS:")
        for r in verified:
            exp = r.expense
            model_tag = r.receipt.model_used.split("-")[1] if r.receipt.model_used != "unknown" else "?"
            print(f"  [{r.score:5.1f}][{model_tag}] {r.receipt.path.name}")
            print(f"         → Seq {exp.seq:02d} | {exp.date} | ${exp.total:.2f} | {exp.vendor_notes[:40]}")
            if r.dest_path:
                rel = r.dest_path.relative_to(output_root)
                print(f"         → {rel}")

    if failed:
        print(f"\n{'─'*60}")
        print("FAILED (no match found):")
        for r in failed:
            err = f" [ERROR: {r.receipt.error}]" if r.receipt.error else ""
            extracted = ""
            if r.receipt.total or r.receipt.date:
                extracted = f" | extracted: date={r.receipt.date} total={r.receipt.total} vendor={r.receipt.vendor}"
            print(f"  ✗ {r.receipt.path.name} (best score {r.score:.1f}){err}{extracted}")

    if unmatched_expenses:
        print(f"\n{'─'*60}")
        print("EXPENSES WITHOUT RECEIPT (expected but none found):")
        for exp in unmatched_expenses:
            print(f"  Seq {exp.seq:02d} | {exp.date} | ${exp.total:8.2f} | {exp.employee} | {exp.vendor_notes[:45]}")

    # Test pass/fail summary
    print(f"\n{'='*60}")
    coverage_pct = (len(matched_expenses) / len(receipt_required) * 100) if receipt_required else 100
    print(f"COVERAGE: {coverage_pct:.0f}% of receipt-required expenses matched")

    # Exit code: 0 if all processed receipts verified, non-zero if any failed
    pass_count = len(verified)
    fail_count = len(failed)
    if fail_count == 0 and len(results) > 0:
        print("STATUS: PASS — all receipts matched\n")
        return 0
    elif fail_count > 0:
        print(f"STATUS: FAIL — {fail_count} receipt(s) unmatched\n")
        return 1
    else:
        print("STATUS: NO RECEIPTS FOUND — drop receipts into the receipts/ folder\n")
        return 0


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Match receipts to timesheet expenses via Claude vision.")
    parser.add_argument("--receipts", default="receipts", help="Folder containing raw receipt files")
    parser.add_argument("--timesheet", default="timesheet/master-timesheet.xlsx")
    parser.add_argument("--output", default="receipts_verified", help="Output root folder")
    parser.add_argument("--api-key", default=os.environ.get("ANTHROPIC_API_KEY"), help="Anthropic API key")
    parser.add_argument("--threshold", type=float, default=55, help="Match score threshold (0-100)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without moving files")
    parser.add_argument("--sheet", default="Expenses", help="Sheet name in Excel file")
    args = parser.parse_args()

    receipts_dir = Path(args.receipts)
    timesheet_path = Path(args.timesheet)
    output_root = Path(args.output)

    # Validate inputs
    if not timesheet_path.exists():
        sys.exit(f"ERROR: Timesheet not found: {timesheet_path}")

    if not receipts_dir.exists():
        receipts_dir.mkdir(parents=True)
        print(f"Created receipts folder: {receipts_dir}")
        print("Drop receipt files (PDF, JPG, PNG) into that folder and re-run.")
        return

    # Collect receipt files (recursive — subfolders included)
    receipt_files = [
        f for f in receipts_dir.rglob("*")
        if f.is_file() and f.suffix.lower() in RECEIPT_EXTS
    ]

    print(f"Timesheet    : {timesheet_path}")
    print(f"Receipts dir : {receipts_dir}  ({len(receipt_files)} file(s))")
    print(f"Output root  : {output_root}")
    print(f"Threshold    : {args.threshold}")
    if args.dry_run:
        print("** DRY RUN — no files will be moved **")

    # Load expenses
    expenses = load_expenses(timesheet_path, args.sheet)
    print(f"\nLoaded {len(expenses)} expense rows from '{args.sheet}' sheet.")

    if not receipt_files:
        print("\nNo receipt files found. Drop files into the receipts/ folder and re-run.")
        _print_expense_summary(expenses)
        return

    # Set up Anthropic client
    if not args.api_key:
        sys.exit("ERROR: No API key. Set ANTHROPIC_API_KEY or pass --api-key.")

    import anthropic
    client = anthropic.Anthropic(api_key=args.api_key)

    # Process receipts
    results: list[MatchResult] = []
    for i, receipt_path in enumerate(sorted(receipt_files), 1):
        print(f"\n[{i}/{len(receipt_files)}] Analyzing: {receipt_path.name}")
        extract, model_path = extract_receipt_with_fallback(
            receipt_path, client, expenses, args.threshold
        )
        model_label = f"[{extract.model_used.split('-')[1]}]"  # haiku / sonnet

        if extract.error:
            print(f"  ⚠ {model_label} Extraction error: {extract.error}")
        else:
            print(f"  {model_label} date={extract.date}  total={extract.total}  vendor={extract.vendor}")

        matched_exp, score = best_match(extract, expenses, args.threshold)
        verified = matched_exp is not None

        if verified:
            matched_exp.matched = True
            print(f"  ✓ Matched Seq {matched_exp.seq} | score={score:.1f} | {matched_exp.vendor_notes[:40]}")
        else:
            print(f"  ✗ No match (best score={score:.1f})")

        result = MatchResult(
            receipt=extract,
            expense=matched_exp,
            score=score,
            verified=verified,
        )

        dest = organize_receipt(result, output_root, args.dry_run)
        result.dest_path = dest
        if not args.dry_run:
            action = "→" if verified else "→ failed/"
            print(f"  {action} {dest.relative_to(output_root) if verified else dest.name}")

        results.append(result)

    exit_code = print_report(expenses, results, output_root, args.dry_run)
    sys.exit(exit_code)


def _print_expense_summary(expenses: list[Expense]):
    receipt_required = [e for e in expenses if e.needs_receipt]
    per_diem = [e for e in expenses if not e.needs_receipt]
    print(f"\nExpense summary:")
    print(f"  Total rows         : {len(expenses)}")
    print(f"  Need receipt       : {len(receipt_required)}")
    print(f"  Per diem / mileage : {len(per_diem)}")
    total_reimbursable = sum(e.total for e in expenses)
    print(f"  Total value        : ${total_reimbursable:,.2f}")


if __name__ == "__main__":
    main()
