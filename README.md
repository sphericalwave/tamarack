# Tamarack Environmental — Time & Expense Tracker

Internal web app for tracking time entries and expenses across projects, with a tool to merge individual employee Excel workbooks into a single master sheet.

## Getting started

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173/tamarack/` (port may increment if already in use).

Demo accounts (password: `password`):

| Role | Email |
|------|-------|
| PM | pm@tamarack.ca |
| Staff | km@tamarack.ca · ab@tamarack.ca · sr@tamarack.ca |

## Features

- **Time Entry** — log hours against project phases with billing notes
- **Expenses** — record expenses with tax, tip, and payment type
- **Dashboard** — summary of hours and spend by project
- **Projects / Admin** — manage projects, phases, and employees
- **Merge Sheets** — upload employee `.xlsx` workbooks and download a merged master file

## Merge Sheets

Drop one or more employee workbooks onto the Merge Sheets page. Each workbook must contain sheets named `Hours`, `Expenses`, `Projects`, and `Employees`.

The downloaded `master-timesheet.xlsx` includes:

- Dates formatted `dd-mmm-yy` as proper Excel date cells
- Currency formatting on Expense Amount, Tax, Tip, and Total columns
- Seq column in red, with configurable start numbers for Time and Expense sequences
- Columns auto-sized to content
- Hours and Expenses sorted alphabetically by employee

## Tests

```bash
npm test
```

21 tests across two suites. All tests are fast (no network, no browser).

### Merge sheet integrity

Tests read the `.xlsx` files in `timesheet/` and verify the parse + merge pipeline end-to-end. Drop replacement workbooks into `timesheet/` and re-run to validate a new month.

| # | Test |
|---|------|
| 1 | Every employee file yields at least one hours row |
| 2 | Merged hours row count equals the sum of per-file counts |
| 3 | Merged expense row count equals the sum of per-file counts |
| 4 | No hours row is missing Employee, Date, or Hours |
| 5 | No expense row is missing Employee or Total |
| 6 | Every hours entry from every employee file appears in the master with identical values |
| 7 | Every expense entry from every employee file appears in the master with identical values |
| 8 | Master Hours cells display without a trailing decimal point (e.g. `8` not `8.`) |

### Project hours calculation

Pure-function tests for the hours-by-project computation used by the pie chart on the Projects page.

**`computeProjectHours`**

| # | Test |
|---|------|
| 1 | Returns empty array when there are no time entries |
| 2 | Excludes projects that have no time entries |
| 3 | Ignores entries whose project ID does not match any known project |
| 4 | Sums multiple entries for the same project |
| 5 | Sums hours correctly across multiple projects |
| 6 | Returns projects sorted descending by hours |
| 7 | Rounds accumulated hours to two decimal places |

**`slicesForChart`**

| # | Test |
|---|------|
| 1 | Returns empty array for empty input |
| 2 | Computes `pct` proportionally for each slice |
| 3 | All `pct` values sum to 1 |
| 4 | Does not add an Other slice when project count is within the limit |
| 5 | Groups excess projects into a single Other slice when over the limit |
| 6 | Single-project input gets `pct` of 1 |

## Receipt Matcher

Matches receipt files (PDF, JPG, PNG, HEIC, WEBP) against expenses in the master timesheet using Claude vision. Verified receipts are renamed and organized into a `client/project/` folder structure. Unmatched receipts are copied to a `failed/` folder for manual review.

### Setup

```bash
pip3 install openpyxl anthropic
export ANTHROPIC_API_KEY=sk-ant-...
```

### Usage

1. Drop receipt files into `receipts/`
2. Run the matcher:

```bash
python3 tools/receipt_matcher.py
```

Verified receipts land in `receipts_verified/Client/Project/` with this naming convention:

```
YYYY.MM.DD_Client_Project_Vendor_Employee_V.ext
```

Unmatched receipts are copied to `receipts_verified/failed/`.

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--receipts DIR` | `receipts/` | Folder containing raw receipt files |
| `--timesheet FILE` | `timesheet/master-timesheet.xlsx` | Master Excel workbook |
| `--output DIR` | `receipts_verified/` | Output root folder |
| `--threshold N` | `55` | Match confidence score 0–100 (lower = more permissive) |
| `--dry-run` | — | Preview actions without copying any files |
| `--api-key KEY` | `$ANTHROPIC_API_KEY` | Anthropic API key |

### How matching works

Each receipt is sent to Claude vision, which extracts date, vendor, subtotal, tax, and total. That is scored against every unmatched expense row:

- **45%** — date proximity (exact → ±3 days)
- **45%** — total amount (within 1% → 10%)
- **10%** — fuzzy vendor name match

Score ≥ threshold → verified. Per diem and mileage rows are excluded (no receipt expected).

#### Two-pass model strategy

The tool runs **Haiku** by default — it's fast and cheap (~$0.002/receipt) and handles clean printed receipts well. If a receipt fails, it automatically retries with **Sonnet**, which is more capable on difficult images (low contrast, handwriting, photos of physical receipts):

| Trigger | What happens |
|---------|-------------|
| Haiku returns an extraction error | Immediately retry with Sonnet |
| Haiku extracts fields but match score is below threshold | Retry with Sonnet; use whichever score is higher |
| Haiku matches above threshold | Done — Sonnet never called |

The model used for each receipt is shown in brackets in the output (`[haiku]` / `[sonnet]`). This keeps costs low for the bulk of receipts while handling edge cases automatically.

### Tests

```bash
python3 tools/test_receipt_matcher.py
```

52 tests, no API calls required.

**Project parsing** — splits `CLIENT – Project Name` into client and project components

| # | Test |
|---|------|
| 1 | Regular dash separator (`AAN - Detour Gold`) |
| 2 | Em-dash separator (`GFN – APLR TESR Review`) |
| 3 | No separator falls back to General (`ADMIN`) |
| 4 | Multi-word client (`Shared Spirits - Great Bear Advanced Exploration`) |
| 5 | Client name containing a slash (`ELFN/LSFN – Goliath IBA Negotiations`) |

**Filename sanitization** — produces safe, consistent filename components

| # | Test |
|---|------|
| 6 | Spaces converted to underscores |
| 7 | Special characters removed |
| 8 | Output capped at max word count |
| 9 | Already-clean input unchanged |

**Vendor slug** — short vendor token for filenames

| # | Test |
|---|------|
| 10 | Simple vendor name (`Air Canada`) |
| 11 | Stop words dropped (`to`, `from`, `for`, etc.) |
| 12 | `Uber from yyz` → `Uber` retained, `from` dropped |
| 13 | Per diem text produces a non-empty slug |

**Filename builder** — assembles the full `YYYY.MM.DD_Client_Project_Vendor_Employee_V.ext` name

| # | Test |
|---|------|
| 14 | Contains date, client, project, employee, `_V` suffix |
| 15 | Date formatted `YYYY.MM.DD` with zero-padded month and day |
| 16 | Source file extension preserved |
| 17 | No slashes, em-dashes, or other illegal filename characters |

**Date scoring** — 0–1 score based on how close the receipt date is to the expense date

| # | Test |
|---|------|
| 18 | Exact date → 1.0 |
| 19 | One day off → 0.85 |
| 20 | Three days off → 0.45 |
| 21 | Four+ days off → 0.0 |
| 22 | Missing date → 0.3 partial credit |

**Amount scoring** — 0–1 score based on how close the receipt total is to the expense total

| # | Test |
|---|------|
| 23 | Exact amount → 1.0 |
| 24 | Within 1% → 1.0 |
| 25 | Within 5% → 0.75 |
| 26 | Within 10% → 0.45 |
| 27 | Over 10% off → 0.0 |
| 28 | Missing total → 0.3 partial credit |

**Vendor scoring** — 0–1 fuzzy string match between extracted vendor and expense notes

| # | Test |
|---|------|
| 29 | Identical strings → 1.0 |
| 30 | Partial match (`Air Canada` vs `Air Canada - flight to timmins`) → > 0.4 |
| 31 | Missing vendor → 0.0 |
| 32 | Completely different names → < 0.5 |

**Match scoring** — composite score (date 45% + amount 45% + vendor 10%)

| # | Test |
|---|------|
| 33 | Perfect receipt scores > 85 |
| 34 | Wrong amount (large deviation) scores < 55 |
| 35 | Wrong date (12 days off) scores < 55 |

**Best match selection**

| # | Test |
|---|------|
| 36 | Correct expense found from a pool of candidates |
| 37 | Per diem rows are never matched (no receipt expected) |
| 38 | Returns no match when best score is below threshold |
| 39 | Already-matched expenses are skipped (no double-booking) |

**Expense loading** — reads the master timesheet XLSX

| # | Test |
|---|------|
| 40 | All 77 expense rows loaded |
| 41 | First row values match expected employee, total, and date |
| 42 | Per diem / mileage rows are flagged as not requiring a receipt |
| 43 | Project names correctly split into client and project |
| 44 | Sum of all totals is positive and > $5,000 |

**File organisation** — copies files to correct output locations

| # | Test |
|---|------|
| 45 | Verified receipt lands in `output/Client/Project/` with `_V` suffix |
| 46 | Unmatched receipt is copied to `output/failed/` |
| 47 | Dry run creates no files on disk |
| 48 | Source file is preserved after copy (originals untouched) |

**Expense coverage** — validates every receipt-required row in the live timesheet

| # | Test |
|---|------|
| 49 | Every receipt-required expense has a non-null total > 0 |
| 50 | Every receipt-required expense has a non-null date |
| 51 | A perfect synthetic receipt for each expense matches that expense (not another) |

**Ambiguous matching** — same amount and date on multiple rows (e.g. two hotel rooms)

| # | Test |
|---|------|
| 52 | Two receipts with identical amount and date match two distinct expense rows without double-booking |

## Build & deploy

```bash
npm run build     # production build → dist/
npm run deploy    # build + push to GitHub Pages
```
