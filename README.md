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

## Build & deploy

```bash
npm run build     # production build → dist/
npm run deploy    # build + push to GitHub Pages
```
