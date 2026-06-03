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

Tests cover merge completeness — verifying no rows are silently dropped when parsing employee workbooks.

```bash
npm test
```

Tests read the `.xlsx` files in `timesheet/` and assert:

- Every file yields at least one hours row
- Merged row count equals the sum of per-file counts (hours and expenses)
- No parsed row is missing required fields (Employee, Date, Hours / Total)

To run tests against a different set of workbooks, drop `.xlsx` files into `timesheet/` and re-run.

## Build & deploy

```bash
npm run build     # production build → dist/
npm run deploy    # build + push to GitHub Pages
```
