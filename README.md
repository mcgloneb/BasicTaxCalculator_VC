UK Tax Calculator (2024/25 rUK)

Overview
- Single-page app to estimate UK personal taxes for the 2024/25 tax year (England/Wales/NI only).
- Inputs: salary, dividend income, student loan plan (none, Plan 1, Plan 2).
- Outputs: income tax by band, dividend tax by band, NI by band, student loan, totals, net income, and monthly equivalents.

Quick Start
- Requirements: Node 20+
- Commands:
  - `cd web && npm install`
  - `npm run dev` to launch the app locally
  - `npm run test` to run unit tests once
  - `npm run build && npm run preview` to build and preview

Assumptions & Scope
- Tax year locked: 2024/25. rUK only (Scotland excluded).
- Personal Allowance tapering applies; no other allowances (marriage, blind person’s allowance, pension, gift aid) or other income types.
- Employee NI only (under State Pension age). Dividends not subject to NI.
- Student Loans: Plan 1 or Plan 2 at 9% above thresholds. No Postgraduate Loan.
- Rounding: nearest penny for all components; monthly figures are simple annual/12.

Implementation Notes
- Calc engine at `web/src/lib/calc.ts` with constants in `web/src/lib/config.ts`.
- UI in `web/src/App.tsx`; simple validation with React Hook Form + Zod.
- Tests at `web/src/lib/calc.test.ts` covering key thresholds and edge cases.

