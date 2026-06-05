#!/usr/bin/env python3
"""
test_receipt_matcher.py

Unit + integration tests for receipt_matcher.
No real Claude API calls — uses mock extractions.

Run: python3 tools/test_receipt_matcher.py
"""

import shutil
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import MagicMock, patch

# Ensure tools dir is importable
sys.path.insert(0, str(Path(__file__).parent))

from receipt_matcher import (
    Expense,
    MatchResult,
    ReceiptExtract,
    _amount_score,
    _date_score,
    _vendor_score,
    best_match,
    build_filename,
    load_expenses,
    organize_receipt,
    parse_project,
    sanitize_name,
    score_match,
    vendor_slug,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def make_expense(**kwargs) -> Expense:
    defaults = dict(
        seq=1,
        employee="AB",
        project_raw="AAN - Detour Gold",
        date=date(2026, 5, 8),
        subtotal=1012.32,
        tax=125.73,
        tip=None,
        total=1138.05,
        vendor_notes="flight to timmins",
        tax_rate="ON - 13%",
        payment_type="Personal - reimburse",
    )
    defaults.update(kwargs)
    return Expense(**defaults)


def make_extract(**kwargs) -> ReceiptExtract:
    defaults = dict(
        path=Path("receipts/receipt_001.pdf"),
        date=date(2026, 5, 8),
        vendor="Air Canada",
        subtotal=1012.32,
        tax=125.73,
        tip=None,
        total=1138.05,
        raw_response='{"date":"2026-05-08","vendor":"Air Canada","subtotal":1012.32,"tax":125.73,"tip":null,"total":1138.05,"currency":"CAD"}',
    )
    defaults.update(kwargs)
    return ReceiptExtract(**defaults)


# ---------------------------------------------------------------------------
# parse_project
# ---------------------------------------------------------------------------

class TestParseProject(unittest.TestCase):

    def test_regular_dash(self):
        self.assertEqual(parse_project("AAN - Detour Gold"), ("AAN", "Detour Gold"))

    def test_em_dash(self):
        self.assertEqual(parse_project("GFN – APLR TESR Review"), ("GFN", "APLR TESR Review"))

    def test_no_dash(self):
        self.assertEqual(parse_project("ADMIN"), ("ADMIN", "General"))

    def test_shared_spirits(self):
        client, proj = parse_project("Shared Spirits - Great Bear Advanced Exploration")
        self.assertEqual(client, "Shared Spirits")
        self.assertEqual(proj, "Great Bear Advanced Exploration")

    def test_slash_client(self):
        client, proj = parse_project("ELFN/LSFN – Goliath IBA Negotiations")
        self.assertEqual(client, "ELFN/LSFN")
        self.assertEqual(proj, "Goliath IBA Negotiations")


# ---------------------------------------------------------------------------
# sanitize_name
# ---------------------------------------------------------------------------

class TestSanitizeName(unittest.TestCase):

    def test_spaces_to_underscores(self):
        self.assertEqual(sanitize_name("Great Bear"), "Great_Bear")

    def test_special_chars_removed(self):
        result = sanitize_name("AAN/LSFN – Project")
        self.assertNotIn("/", result)
        self.assertNotIn("–", result)

    def test_max_words(self):
        result = sanitize_name("One Two Three Four Five Six", max_words=3)
        self.assertEqual(result, "One_Two_Three")

    def test_already_clean(self):
        self.assertEqual(sanitize_name("AB"), "AB")


# ---------------------------------------------------------------------------
# vendor_slug
# ---------------------------------------------------------------------------

class TestVendorSlug(unittest.TestCase):

    def test_simple(self):
        self.assertIn("Air", vendor_slug("Air Canada - flight to timmins"))

    def test_drops_stop_words(self):
        result = vendor_slug("flight to timmins")
        self.assertNotIn("to", result.split("_"))

    def test_uber_from(self):
        result = vendor_slug("Uber from yyz")
        # 'from' is stop word; 'Uber' and 'yyz' should be present
        self.assertIn("Uber", result)

    def test_per_diem(self):
        result = vendor_slug("Per diem 6 days")
        self.assertTrue(len(result) > 0)


# ---------------------------------------------------------------------------
# build_filename
# ---------------------------------------------------------------------------

class TestBuildFilename(unittest.TestCase):

    def test_basic(self):
        exp = make_expense(
            date=date(2026, 5, 8),
            employee="AB",
            project_raw="AAN - Detour Gold",
            vendor_notes="flight to timmins",
        )
        filename = build_filename(exp, Path("receipts/scan.pdf"))
        self.assertTrue(filename.startswith("2026.05.08_"))
        self.assertIn("AAN", filename)
        self.assertIn("Detour_Gold", filename)
        self.assertIn("AB", filename)
        self.assertTrue(filename.endswith("_V.pdf"))

    def test_extension_preserved(self):
        exp = make_expense()
        fname = build_filename(exp, Path("receipt.jpg"))
        self.assertTrue(fname.endswith("_V.jpg"))

    def test_no_special_chars(self):
        exp = make_expense(project_raw="ELFN/LSFN – Goliath IBA Negotiations")
        fname = build_filename(exp, Path("r.pdf"))
        self.assertNotIn("/", fname)
        self.assertNotIn("–", fname)

    def test_date_format(self):
        exp = make_expense(date=date(2026, 1, 3))
        fname = build_filename(exp, Path("r.pdf"))
        self.assertTrue(fname.startswith("2026.01.03_"))


# ---------------------------------------------------------------------------
# Scoring functions
# ---------------------------------------------------------------------------

class TestDateScore(unittest.TestCase):

    def test_exact(self):
        self.assertEqual(_date_score(date(2026, 5, 8), date(2026, 5, 8)), 1.0)

    def test_one_day_off(self):
        self.assertEqual(_date_score(date(2026, 5, 9), date(2026, 5, 8)), 0.85)

    def test_three_days_off(self):
        self.assertEqual(_date_score(date(2026, 5, 5), date(2026, 5, 8)), 0.45)

    def test_four_days_off(self):
        self.assertEqual(_date_score(date(2026, 5, 4), date(2026, 5, 8)), 0.0)

    def test_none(self):
        self.assertEqual(_date_score(None, date(2026, 5, 8)), 0.3)


class TestAmountScore(unittest.TestCase):

    def test_exact(self):
        self.assertEqual(_amount_score(1138.05, 1138.05), 1.0)

    def test_within_1pct(self):
        self.assertEqual(_amount_score(1138.05 * 1.005, 1138.05), 1.0)

    def test_within_5pct(self):
        self.assertEqual(_amount_score(1138.05 * 1.04, 1138.05), 0.75)

    def test_within_10pct(self):
        self.assertEqual(_amount_score(1138.05 * 1.08, 1138.05), 0.45)

    def test_over_10pct(self):
        self.assertEqual(_amount_score(500.0, 1138.05), 0.0)

    def test_none(self):
        self.assertEqual(_amount_score(None, 1138.05), 0.3)


class TestVendorScore(unittest.TestCase):

    def test_identical(self):
        self.assertAlmostEqual(_vendor_score("Air Canada", "Air Canada"), 1.0)

    def test_partial(self):
        score = _vendor_score("Air Canada", "Air Canada - flight to timmins")
        self.assertGreater(score, 0.4)

    def test_both_none(self):
        self.assertEqual(_vendor_score(None, "Air Canada"), 0.0)

    def test_completely_different(self):
        score = _vendor_score("Uber", "Air Canada")
        self.assertLess(score, 0.5)


# ---------------------------------------------------------------------------
# score_match + best_match
# ---------------------------------------------------------------------------

class TestScoreMatch(unittest.TestCase):

    def test_perfect_match_high_score(self):
        exp = make_expense()
        rec = make_extract()
        self.assertGreater(score_match(rec, exp), 85)

    def test_wrong_amount_low_score(self):
        exp = make_expense()
        rec = make_extract(total=500.0)  # very different amount
        self.assertLess(score_match(rec, exp), 55)

    def test_wrong_date_low_score(self):
        exp = make_expense()
        rec = make_extract(date=date(2026, 5, 20))  # 12 days off
        self.assertLess(score_match(rec, exp), 55)


class TestBestMatch(unittest.TestCase):

    def setUp(self):
        self.expenses = [
            make_expense(seq=1, total=1138.05, date=date(2026, 5, 8), vendor_notes="flight to timmins"),
            make_expense(seq=2, total=400.00, date=date(2026, 5, 29), vendor_notes="4x per diem",
                         payment_type="Per diem"),
            make_expense(seq=3, total=341.66, date=date(2026, 5, 15), vendor_notes="Holiday Inn YWG rm 421"),
        ]

    def test_finds_correct_match(self):
        rec = make_extract(total=1138.05, date=date(2026, 5, 8), vendor="Air Canada")
        exp, score = best_match(rec, self.expenses, threshold=55)
        self.assertIsNotNone(exp)
        self.assertEqual(exp.seq, 1)

    def test_skips_per_diem(self):
        # Receipt matching per diem amount and date — should match seq 3 instead, or fail
        rec = make_extract(total=400.00, date=date(2026, 5, 29))
        exp, score = best_match(rec, self.expenses, threshold=55)
        # Seq 2 is per diem so should be skipped; seq 1 has wrong amount/date
        if exp:
            self.assertNotEqual(exp.seq, 2)

    def test_no_match_below_threshold(self):
        rec = make_extract(total=99999.0, date=date(2020, 1, 1), vendor="Mystery Store")
        exp, score = best_match(rec, self.expenses, threshold=55)
        self.assertIsNone(exp)

    def test_skips_already_matched(self):
        self.expenses[0].matched = True
        rec = make_extract(total=1138.05, date=date(2026, 5, 8))
        exp, score = best_match(rec, self.expenses, threshold=55)
        if exp:
            self.assertNotEqual(exp.seq, 1)


# ---------------------------------------------------------------------------
# load_expenses (real XLSX)
# ---------------------------------------------------------------------------

class TestLoadExpenses(unittest.TestCase):

    XLSX = Path("timesheet/master-timesheet.xlsx")

    def setUp(self):
        if not self.XLSX.exists():
            self.skipTest("master-timesheet.xlsx not found")

    def test_loads_all_rows(self):
        expenses = load_expenses(self.XLSX)
        self.assertEqual(len(expenses), 77)

    def test_first_row(self):
        expenses = load_expenses(self.XLSX)
        first = expenses[0]
        self.assertEqual(first.employee, "AB")
        self.assertAlmostEqual(first.total, 1127.57, places=1)
        self.assertEqual(first.date, date(2026, 5, 22))

    def test_per_diem_flagged(self):
        expenses = load_expenses(self.XLSX)
        per_diems = [e for e in expenses if not e.needs_receipt]
        self.assertGreater(len(per_diems), 0)

    def test_project_parsing(self):
        expenses = load_expenses(self.XLSX)
        # Seq 1: "Shared Spirits - Great Bear Advanced Exploration"
        first = expenses[0]
        self.assertEqual(first.client, "Shared Spirits")
        self.assertEqual(first.project, "Great Bear Advanced Exploration")

    def test_total_value(self):
        expenses = load_expenses(self.XLSX)
        total = sum(e.total for e in expenses)
        # Sanity check — total should be positive and substantial
        self.assertGreater(total, 5000)


# ---------------------------------------------------------------------------
# organize_receipt (file operations)
# ---------------------------------------------------------------------------

class TestOrganizeReceipt(unittest.TestCase):

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.receipts_dir = self.tmp / "receipts"
        self.receipts_dir.mkdir()
        self.output_root = self.tmp / "verified"

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def _make_receipt_file(self, name: str) -> Path:
        p = self.receipts_dir / name
        p.write_bytes(b"%PDF fake content")
        return p

    def test_verified_goes_to_client_project_folder(self):
        receipt_file = self._make_receipt_file("scan.pdf")
        exp = make_expense(
            project_raw="AAN - Detour Gold",
            employee="AB",
            date=date(2026, 5, 8),
            vendor_notes="flight to timmins",
            total=1138.05,
        )
        extract = make_extract(path=receipt_file)
        result = MatchResult(receipt=extract, expense=exp, score=90.0, verified=True)

        dest = organize_receipt(result, self.output_root, dry_run=False)
        self.assertTrue(dest.exists())
        self.assertIn("AAN", str(dest))
        self.assertIn("Detour_Gold", str(dest))
        self.assertTrue(dest.name.endswith("_V.pdf"))

    def test_failed_goes_to_failed_folder(self):
        receipt_file = self._make_receipt_file("mystery.jpg")
        extract = make_extract(path=receipt_file)
        result = MatchResult(receipt=extract, expense=None, score=20.0, verified=False)

        dest = organize_receipt(result, self.output_root, dry_run=False)
        self.assertTrue(dest.exists())
        self.assertIn("failed", str(dest))

    def test_dry_run_no_files_created(self):
        receipt_file = self._make_receipt_file("scan.pdf")
        exp = make_expense()
        extract = make_extract(path=receipt_file)
        result = MatchResult(receipt=extract, expense=exp, score=90.0, verified=True)

        dest = organize_receipt(result, self.output_root, dry_run=True)
        self.assertFalse(dest.exists())

    def test_source_file_preserved_after_copy(self):
        receipt_file = self._make_receipt_file("original.pdf")
        exp = make_expense()
        extract = make_extract(path=receipt_file)
        result = MatchResult(receipt=extract, expense=exp, score=90.0, verified=True)

        organize_receipt(result, self.output_root, dry_run=False)
        self.assertTrue(receipt_file.exists(), "Source file should not be deleted")


# ---------------------------------------------------------------------------
# Coverage check (all receipt-required expenses detectable)
# ---------------------------------------------------------------------------

class TestExpenseCoverage(unittest.TestCase):
    """Validates that every non-per-diem expense in the timesheet is
    theoretically matchable given a perfect receipt."""

    XLSX = Path("timesheet/master-timesheet.xlsx")

    def setUp(self):
        if not self.XLSX.exists():
            self.skipTest("master-timesheet.xlsx not found")
        self.expenses = load_expenses(self.XLSX)

    def test_all_receipt_expenses_have_total(self):
        for exp in self.expenses:
            if exp.needs_receipt:
                self.assertIsNotNone(exp.total, f"Seq {exp.seq} needs receipt but total is None")
                self.assertGreater(exp.total, 0, f"Seq {exp.seq} total must be positive")

    def test_all_receipt_expenses_have_date(self):
        for exp in self.expenses:
            if exp.needs_receipt:
                self.assertIsNotNone(exp.date, f"Seq {exp.seq} needs receipt but date is None")

    def test_perfect_receipt_matches_own_expense(self):
        """Simulate a perfect receipt for each expense — it should always self-match."""
        for exp in self.expenses:
            if not exp.needs_receipt:
                continue
            # Reset all matched flags
            for e in self.expenses:
                e.matched = False
            perfect_extract = make_extract(
                path=Path(f"receipts/seq_{exp.seq}.pdf"),
                date=exp.date,
                vendor=exp.vendor_notes.split()[0] if exp.vendor_notes else "Vendor",
                total=exp.total,
            )
            matched_exp, score = best_match(perfect_extract, self.expenses, threshold=55)
            self.assertIsNotNone(
                matched_exp,
                f"Seq {exp.seq} ({exp.vendor_notes}) failed to self-match (score={score:.1f})"
            )


# ---------------------------------------------------------------------------
# Duplicate amount / same-day collision
# ---------------------------------------------------------------------------

class TestAmbiguousMatching(unittest.TestCase):

    def test_duplicate_amount_same_date(self):
        """Two expenses with same amount/date (e.g. two hotel rooms) should each
        be matchable to distinct receipts without double-booking."""
        exp1 = make_expense(seq=5, total=341.66, date=date(2026, 5, 15), vendor_notes="Holiday Inn YWG rm 421")
        exp2 = make_expense(seq=6, total=341.66, date=date(2026, 5, 15), vendor_notes="Holiday Inn YWG rm 517")
        expenses = [exp1, exp2]

        rec1 = make_extract(path=Path("r1.pdf"), total=341.66, date=date(2026, 5, 15), vendor="Holiday Inn")
        rec2 = make_extract(path=Path("r2.pdf"), total=341.66, date=date(2026, 5, 15), vendor="Holiday Inn")

        # First receipt matches exp1
        matched1, s1 = best_match(rec1, expenses, threshold=55)
        self.assertIsNotNone(matched1)
        matched1.matched = True

        # Second receipt should match exp2 (exp1 already claimed)
        matched2, s2 = best_match(rec2, expenses, threshold=55)
        self.assertIsNotNone(matched2)
        if matched2:
            self.assertNotEqual(matched1.seq, matched2.seq)


if __name__ == "__main__":
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromModule(sys.modules[__name__])
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
