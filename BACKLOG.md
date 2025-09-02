# Backlog

Unimplemented/optional enhancements tracked here. Implemented scope, algorithms, and configuration live in README.

## Scenario Comparison (Baseline vs New Inputs)

- Goal: Compare current deductions to “what‑if” using secondary inputs.
- UX:
  - Inputs panel gains tabs: “Current” and “New”. New tab contains “New Salary (annual)” and “New Dividends (annual)”.
  - Summary and Breakdown display bracketed scenario amounts alongside current values, e.g., “Income Tax  £5,000.00 (£5,500.00)”. Hide brackets if unchanged/empty. Optional ▲/▼ colour‑coded.
  - Monthly equivalents mirror the same pattern.
- Calc: Run two calculations with the same Tax Year and Student Loan plan; reuse existing engine.
- Steps:
  1) Tabs in Inputs; add optional fields to schema.
  2) Memoize baseline + scenario results.
  3) Formatting helper to render base + bracketed scenario.
  4) Apply helper to all monetary lines (summary, breakdown, monthly).
  5) Accessibility + performance considerations (tab navigation, tabular figures, fixed value column).
- Edge cases: PA taper crossing; band reallocation with dividends; NI only affected by salary; thresholds by year; zero‑change hides brackets.
- Tests: Dual‑scenario at key thresholds; snapshots for summary rendering.

## Student Loan PAYE vs Annual Toggle

- Add an optional toggle to display Student Loan as either:
  - Annual (Self Assessment): 9% above annual threshold on total income (current behaviour), and
  - PAYE per‑period: per‑month threshold, 9% on excess, whole‑pound rounding per period (salary only). Show both if helpful.
- Tests for representative salaries to match published PAYE examples.

## Tooltips for Thresholds and Bands

- Inline tooltips over band labels and thresholds (PA, UEL, dividend allowance, plan thresholds) that show figures for the selected tax year.

## Export / Share

- Print/export friendly view, and optional URL state (encode inputs) for deep links.

## Extended Regimes / Scope

- Scotland non‑savings/non‑dividend banding as an optional regime.
- Savings income and allowances (Personal Savings Allowance) as separate inputs.
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

## 10) Nice-to-Haves Backlog

### A) Scenario Comparison (Baseline vs New Inputs)

- Goal: Allow users to compare current deductions with “what‑if” values using secondary inputs. The app continues to work as now for the baseline; when optional “New” values are provided, show bracketed scenario values alongside every line item.

- UX
  - Inputs panel adds a tabbed interface with two tabs: “Current” and “New”.
    - Current tab: existing inputs (Salary, Dividends, Student Loan, Tax Year).
    - New tab: secondary inputs for “New Salary (annual)” and “New Dividends (annual)”. Student loan plan and tax year follow the current selection (same year/plan for both scenarios).
  - Summary and Breakdown rows render as: Label  CurrentAmount  (NewAmount)
    - Example: “Income Tax  £5,000.00 (£5,500.00)”.
    - When “New” inputs are blank or equal to current, bracketed values are hidden to avoid noise.
    - Optional style: colour bracketed value if it’s higher/lower (e.g., red/green) with a subtle ▲/▼ indicator.
  - Monthly equivalents (inside the existing details/summary) mirror the same pattern.

- Calculation
  - Reuse the existing calculator. Compute two results using the same tax‑year config and student loan plan:
    1) Baseline: current Salary/Dividends.
    2) Scenario: New Salary/New Dividends with the same Tax Year + Student Loan plan.
  - No change to formulae; this is a presentation and state-management addition.

- Implementation Steps
  1) UI tabs: Add a simple tabbed control inside the Inputs panel; second tab exposes “New Salary (annual)” and “New Dividends (annual)”.
  2) Validation: Extend Zod schema with optional numeric strings for newSalary/newDividends (same non‑negative, ≤2dp rules). Empty means “no scenario”.
  3) State + compute: When any “New” field differs from Current, run a second calculation; memoize both results.
  4) Rendering helpers: Add a formatter that renders base amount and, if present, appends bracketed scenario amount; include optional up/down styling.
  5) Apply across views: Use the helper in Summary totals and all Breakdown line items (income tax bands, dividend bands, NI bands, student loan, totals, net income, monthly equivalents).
  6) Accessibility: Ensure tabs are keyboard operable and bracketed values include accessible labels (e.g., aria‑label describing “scenario amount”).
  7) Perf: Debounce inputs lightly (calculations are already cheap); ensure no layout shift by reusing tabular numerals and fixed value column.

- Edge Cases to Validate
  - Crossing PA taper threshold (near £100k) and additional‑rate threshold when switching from Current → New.
  - Dividend allowance interactions when salary fills bands differently in the scenario.
  - NI unaffected by dividends; ensure bracketed NI only changes with New Salary.
  - Student loan thresholds per selected year (Plan 1/2) reflected identically in both calculations.
  - Zero‑change case: bracketed values hidden.

- Tests
  - Unit tests computing both baseline and scenario for key thresholds (£12,570, £50,270, £100,000, £125,140, dividend £500, Plan 1/2 thresholds for each tax year).
  - Snapshot tests for a few scenarios verifying dual rendering in Summary and Breakdown.

- Acceptance Criteria
  - Inputs panel has two tabs; “New” tab presents only “New Salary (annual)” and “New Dividends (annual)”.
  - With New inputs set, every monetary line in Summary and Breakdown shows “(ScenarioAmount)” after the baseline amount; hidden when New equals Current/empty.
  - Both calculations use the same Tax Year and Student Loan Plan.
  - Monthly equivalents section mirrors the same bracketed presentation.
  - No noticeable layout shift when toggling or inputting values.
