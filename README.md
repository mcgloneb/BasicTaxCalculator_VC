UK Tax Calculator (rUK)

Overview
- Single-page app to estimate UK personal taxes for rUK (England/Wales/NI) with a tax-year selector.
- Inputs: salary, dividend income, student loan plan (none, Plan 1, Plan 2), tax year (2024/25, 2025/26).
- Outputs: income tax by band, dividend tax by band, NI by band, student loan, totals, net income, and monthly equivalents (collapsed by default).

Quick Start
- Requirements: Node 20+
- Commands:
  - `cd web && npm install`
  - `npm run dev` to launch the app locally
  - `npm run test` to run unit tests once
  - `npm run build && npm run preview` to build and preview

Assumptions & Scope
- rUK only (Scotland excluded).
- Personal Allowance tapering applies; no other allowances (marriage allowance, blind person’s allowance, pension, gift aid) or other income types.
- Employee NI only (under State Pension age). Dividends are not subject to NI.
- Student Loans: Plan 1 or Plan 2 at 9% above thresholds (annual Self Assessment method). No Postgraduate Loan.
- Rounding: nearest penny for all components; monthly figures are annual ÷ 12 (not PAYE-period exact).

Implementation Details
- Engine: `web/src/lib/calc.ts`; configuration: `web/src/lib/config.ts`.
- Year selector drives config:
  - 2024/25: Plan 1 £24,990; Plan 2 £27,295; Dividend allowance £500.
  - 2025/26: Plan 1 £26,065; Plan 2 £28,470; Dividend allowance £500.
- Algorithm (annual, Self Assessment style):
  1) Adjusted Net Income = salary + dividends.
  2) Personal Allowance (PA) = £12,570 reduced by £1 per £2 over £100,000, floor £0.
  3) Apply PA to salary first; any remainder to dividends.
  4) Salary tax bands (after PA): basic 20% up to £37,700; higher 40% up to (additional threshold − PA − basic); additional 45% above £125,140.
  5) Dividend allowance: £500 at 0% consuming bands in order (basic→higher→additional). Remaining dividends taxed at 8.75%/33.75%/39.35% according to remaining capacity after salary.
  6) NI (employee, Class 1) on salary only: 0% up to £12,570; 8% to £50,270; 2% above.
  7) Student loan (annual): 9% of (salary + dividends − plan threshold) for Plan 1/2.
  8) Totals: income tax + dividend tax; add NI; subtract all from gross for net income. Monthly equivalents are annual ÷ 12.
- Arithmetic: integer pence with basis‑points rates; outputs formatted as GBP.
- Validation/UI: React Hook Form + Zod in `web/src/App.tsx`. Monthly equivalents collapsed via `<details>`. High‑contrast UI with stable layout (tabular numerals, fixed amount column).
- Tests: `web/src/lib/calc.test.ts` cover boundaries (PA, UEL, additional rate, dividend allowance, student loan thresholds by year).

Backlog
- See `BACKLOG.md` for unimplemented features (scenario comparison, PAYE vs annual loan toggle, tooltips, export/share, optional regimes).
