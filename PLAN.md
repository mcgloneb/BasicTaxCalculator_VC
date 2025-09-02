# UK Tax Calculator — Implementation Plan

Version: Draft 2

Tax year locked: 2024/25 (6 Apr 2024 – 5 Apr 2025).

## 1) Goals & Scope

- Inputs: gross annual salary (employment income), annual dividend income, student loan status (`none`, `plan_1`, `plan_2`).
- Outputs:
  - Total income tax and breakdown by bands for non-dividend income (basic, higher, additional).
  - Total employee National Insurance (Class 1) and breakdown by bands.
  - Total dividend tax and breakdown by dividend rates (basic, higher, additional) with allowance applied.
  - Totals summary (aggregate tax and NI), net income, and monthly equivalents (annual/12 for display).
- Constraints: client-side, fast, accurate within standard nearest‑penny rounding (annual view).

Out of scope (locked for MVP): Scottish income tax regime, student Postgraduate Loan (PGL), marriage allowance, blind person’s allowance, pension contributions, charitable gift aid, savings income, High Income Child Benefit Charge, age-related NIC exemptions, non-UK residency cases.

## 2) Tech Stack

- Frontend: React + TypeScript + Vite (SPA; no backend required).
- State & forms: React Hook Form + Zod (input validation and friendly errors).
- Styling: Minimal CSS (CSS modules) or Tailwind (confirm preference).
- Calculations: Pure TypeScript module with tax-year configuration constants. Integer pence arithmetic for accuracy.
- Testing: Vitest (unit tests for edge cases and band boundaries). Optional Playwright for e2e smoke checks.
- Tooling: ESLint + Prettier. Node 20+. Package manager: npm.
- Hosting: Any static host (GitHub Pages, Netlify, or Vercel). No server required.

## 3) Functional Requirements

- Input fields:
  - Salary (annual, GBP)
  - Dividends (annual, GBP)
  - Student loan: none | Plan 1 | Plan 2
- Display:
  - Income tax: total and by income tax band for non-dividend income
  - National Insurance: total and by NI band
  - Dividend tax: total and by dividend tax band, with allowance
  - Totals: aggregate tax + NI; net income; monthly equivalents
- UX niceties (non-blocking, can be deferred): band visualization, effective tax rate, export/print.

## 4) Calculation Overview (2024/25 rUK — England/Wales/NI)

Scope locked to rUK bands only; Scotland’s distinct non-dividend bands are excluded.

### 4.1 Personal Allowance (PA)

- PA base: £12,570.
- Tapering: reduce PA by £1 for every £2 of Adjusted Net Income above £100,000; floor at £0.
- Adjusted Net Income (for this MVP): salary + dividends (no reliefs assumed).
- PA is applied in order: non-savings/non-dividend income first (salary), then savings, then dividends.

### 4.2 Non-Dividend Income Tax Bands (rUK)

- Taxable income bands after PA (non-dividend):
  - Basic rate: 20% on first £37,700 of taxable income.
  - Higher rate: 40% on taxable income from £37,701 up to £125,140 total income threshold (i.e., above basic rate limit, with the upper bound forming at the additional rate threshold).
  - Additional rate: 45% on taxable income above £125,140.
- Note: The higher/additional thresholds interact with total taxable income across categories; see dividends below.

### 4.3 Dividend Tax

- Dividend allowance: £500 at 0% (consumes basic/higher bands).
- Dividend tax rates by remaining band capacity:
  - Basic: 8.75%
  - Higher: 33.75%
  - Additional: 39.35%
- Band ordering/allocation:
  1) Apply PA (if any remains after salary) to dividends.
  2) Apply £500 dividend allowance at 0% (counts toward band usage).
  3) Allocate remaining dividends across bands after considering how much of each band is already used by non-dividend income.

### 4.4 Employee National Insurance (Class 1)

- Applies to employment income (salary) only; dividends are not subject to NI.
- Annual thresholds/rates (2024/25):
  - Primary Threshold (PT): £12,570 (0% below this).
  - Between PT and UEL: 8%.
  - Above UEL (£50,270): 2%.
- Assumptions: under State Pension age; single employment; annualized calculation.

### 4.5 Student Loan Repayments (Annual, Self-Assessment style)

- Charged on total income (salary + dividends) above the relevant plan threshold.
- Plan 1 (assumed 2024/25): threshold £22,015; 9% above threshold.
- Plan 2 (assumed 2024/25): threshold £27,295; 9% above threshold.
- Postgraduate Loan (6%) is excluded per scope.

## 5) Data & Constants Needed (by Tax Year)

Structured as a configuration object per tax year (rUK only in MVP):

- Personal Allowance: base amount; taper start (£100,000); taper rate (1 per £2); min £0.
- Non-dividend income bands: basic band size (£37,700), rates (20%, 40%, 45%), additional threshold (£125,140). Note: higher band effective width depends on final PA (see Algorithm).
- Dividend allowance amount: £500; dividend rates (8.75%, 33.75%, 39.35%).
- NI thresholds and rates: PT (£12,570), UEL (£50,270), main rate (8%), upper rate (2%).
- Student loan thresholds/rates: Plan 1 (£22,015, 9%); Plan 2 (£27,295, 9%).
- Formatting/rounding: currency (GBP), rounding to nearest penny after each component calculation.

We will implement 2024/25 rUK constants by default and make the config extensible.

## 6) Detailed Algorithm

Given inputs: salary, dividends, studentLoanPlan.

1) Sanitize inputs: coerce to non-negative numbers (GBP pounds), treat missing as 0.
2) Load config for the selected tax year (2024/25 rUK).
3) Compute Adjusted Net Income = salary + dividends (no reliefs in MVP).
4) Compute Personal Allowance:
   - taperExcess = max(0, ANI - 100,000)
   - taperReduction = floor(taperExcess / 2)
   - PA = max(0, 12,570 - taperReduction)
5) Allocate PA:
   - PA_to_salary = min(PA, salary)
   - salary_taxable = salary - PA_to_salary
   - PA_remaining = PA - PA_to_salary
   - divs_after_PA = max(0, dividends - PA_remaining)
6) Compute non-dividend income tax by bands on salary_taxable:
   - basic_band_size = 37,700
   - higher_band_width_after_PA = max(0, 125,140 - PA - basic_band_size)
   - basic_used_by_salary = min(salary_taxable, basic_band_size)
   - higher_used_by_salary = min(max(0, salary_taxable - basic_used_by_salary), higher_band_width_after_PA)
   - additional_used_by_salary = max(0, salary_taxable - basic_used_by_salary - higher_used_by_salary)
   - tax_salary_basic = basic_used_by_salary * 20%
   - tax_salary_higher = higher_used_by_salary * 40%
   - tax_salary_additional = additional_used_by_salary * 45%
7) Compute dividend allowance and band capacities:
   - div_allowance = min(£500, divs_after_PA)
   - Establish remaining band capacities after salary usage:
     • basic_capacity = max(0, basic_band_size - basic_used_by_salary)
     • higher_capacity = max(0, higher_band_width_after_PA - higher_used_by_salary)
   - Consume band capacities with the £500 dividend allowance at 0% (in order basic → higher → additional), reducing capacities accordingly.
   - Remaining dividends (div_after_allowance = divs_after_PA - div_allowance) are then allocated into basic, then higher, then additional at rates:
     • basic_div_taxed = min(div_after_allowance, basic_capacity) at 8.75%
     • higher_div_taxed = min(max(0, div_after_allowance - basic_div_taxed), higher_capacity) at 33.75%
     • additional_div_taxed = max(0, div_after_allowance - basic_div_taxed - higher_div_taxed) at 39.35%
8) NI (employee Class 1) on salary only:
   - ni_band1 = clamp(salary, PT, UEL) - PT → 8%
   - ni_band2 = max(0, salary - UEL) → 2%
   - NI total = 8%*ni_band1 + 2%*ni_band2 (floor to pennies)
9) Student loan (if plan != none):
   - threshold = planThreshold
   - sl_income = max(0, (salary + dividends) - threshold)
   - sl_due = sl_income * 9%
10) Totals and presentation:
   - income_tax_total = tax_salary_basic + tax_salary_higher + tax_salary_additional + dividend_tax_total
   - non-dividend tax breakdown and dividend tax breakdown reported separately
   - NI total reported with band breakdown
   - net_income = salary + dividends - income_tax_total - NI total - sl_due
   - monthly equivalents (display): divide annual totals by 12; note this is a simple pro‑rata, not pay‑period HMRC calculations.

All monetary calculations performed in integer pence to avoid floating-point errors; final outputs rounded to 2dp.

## 7) Data Validation & Rounding

- Inputs: must be finite numbers ≥ 0, max cap (e.g., £10m) to avoid overflow.
- Use integer pence internally; display formatted GBP.
- Round each component to nearest penny; ensure sum of parts matches total (reconcile by computing components first, then summing). No additional HMRC-specific parity requirements beyond nearest penny.

## 8) Testing Strategy

- Unit tests across boundaries: £0, £12,570, £50,270, £100,000, £125,140, dividend allowance (£500), and loan thresholds (Plan 1/2).
- Scenario tests: salary-only, dividends-only, mixed, high income reducing PA, additional rate cases.
- Property tests (optional): monotonicity (more income → not less tax), non-negativity.
- Snapshot tests for sample scenarios to detect accidental changes to constants.

## 9) Milestones

1) Core calculation module with config and unit tests.
2) Simple UI: inputs, computed results, readable breakdowns (incl. monthly equivalents and net income).
3) Polish: validation messages, formatting, accessibility pass.
4) Optional expansions: Scotland regime, tax year selector, savings income, allowances.

## 10) Open Questions

None — scope and parameters are locked per requirements above.
