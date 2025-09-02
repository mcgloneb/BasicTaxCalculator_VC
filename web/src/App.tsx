import { useMemo } from 'react';
import './App.css';
import { calculate } from './lib/calc';
import { formatGBP } from './lib/format';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TaxYearConfig } from './lib/config';
import { taxYearMap } from './lib/config';

type Loan = 'none' | 'plan_1' | 'plan_2';

const schema = z.object({
  salary: z
    .string()
    .trim()
    .default('0')
    .refine((v) => v === '' || /^\d*(\.\d{0,2})?$/.test(v), 'Enter a non-negative amount with up to 2 decimals')
    .transform((v) => (v === '' ? '0' : v)),
  dividends: z
    .string()
    .trim()
    .default('0')
    .refine((v) => v === '' || /^\d*(\.\d{0,2})?$/.test(v), 'Enter a non-negative amount with up to 2 decimals')
    .transform((v) => (v === '' ? '0' : v)),
  loan: z.enum(['none', 'plan_1', 'plan_2']).default('none'),
  taxYear: z.enum(['2024/25', '2025/26']).default('2024/25'),
});

type FormValues = z.infer<typeof schema>;

function App() {
  const { register, watch, formState: { errors, isValid } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    mode: 'onChange',
    defaultValues: { salary: '50000', dividends: '2000', loan: 'none', taxYear: '2024/25' },
  });

  const values = watch();
  const salaryNum = parseFloat(values.salary || '0') || 0;
  const dividendsNum = parseFloat(values.dividends || '0') || 0;
  const loan = values.loan as Loan;
  const taxYear = values.taxYear as keyof typeof taxYearMap;
  const yearCfg: TaxYearConfig = taxYearMap[taxYear];

  const result = useMemo(() => {
    return calculate({ salary: salaryNum, dividends: dividendsNum, studentLoan: loan }, yearCfg);
  }, [salaryNum, dividendsNum, loan, yearCfg]);

  const grossPence = Math.round((salaryNum + dividendsNum) * 100);
  const effTaxRate = grossPence > 0 ? (result.totals.taxAndNI / grossPence) : 0;
  const effDeductionRate = grossPence > 0 ? ((result.totals.taxAndNI + result.studentLoan.amount) / grossPence) : 0;

  return (
    <div className="container">
      <h1>UK Tax Calculator (rUK)</h1>

      <div className="stats">
        <div className="stat-card">
          <div className="stat-label">Gross income</div>
          <div className="stat-value">{formatGBP(grossPence)}</div>
          <div className="stat-sub">&nbsp;</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">Total Deductions</div>
          <div className="stat-value">{formatGBP(result.totals.taxAndNI)}</div>
          <div className="stat-sub">Effective tax rate {Math.round(effTaxRate * 1000) / 10}%</div>
        </div>
        <div className="stat-card good">
          <div className="stat-label">Net income</div>
          <div className="stat-value">{formatGBP(result.totals.netIncome)}</div>
          <div className="stat-sub">Take‑home rate {Math.round((1 - effDeductionRate) * 1000) / 10}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Student loan</div>
          <div className="stat-value">{formatGBP(result.studentLoan.amount)}</div>
          <div className="stat-sub">&nbsp;</div>
        </div>
      </div>
      <div className="grid">
        <section className="panel">
          <h2>Inputs</h2>
          <div className="field">
            <label htmlFor="taxYear">Tax year</label>
            <select id="taxYear" {...register('taxYear')}>
              <option value="2024/25">2024/25</option>
              <option value="2025/26">2025/26</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="salary">Salary (annual, £)</label>
            <input id="salary" inputMode="decimal" {...register('salary')} />
            {errors.salary?.message && <small className="error">{errors.salary.message}</small>}
          </div>
          <div className="field">
            <label htmlFor="dividends">Dividends (annual, £)</label>
            <input id="dividends" inputMode="decimal" {...register('dividends')} />
            {errors.dividends?.message && <small className="error">{errors.dividends.message}</small>}
          </div>
          <div className="field">
            <label htmlFor="loan">Student loan</label>
            <select id="loan" {...register('loan')}>
              <option value="none">None</option>
              <option value="plan_1">Plan 1</option>
              <option value="plan_2">Plan 2</option>
            </select>
          </div>
        </section>

        <section className="panel">
          <h2>Summary — {yearCfg.yearLabel}</h2>
          {!isValid && <div className="notice">Some inputs are invalid; calculations use 0 for invalid fields.</div>}
          <ul className="list">
            <li>
              <span>Income Tax</span>
              <strong>{formatGBP(result.incomeTax.total)}</strong>
            </li>
            <li>
              <span>National Insurance</span>
              <strong>{formatGBP(result.nationalInsurance.total)}</strong>
            </li>
            <li>
              <span>Dividend Tax</span>
              <strong>{formatGBP(result.dividendTax.total)}</strong>
            </li>
            <li>
              <span>Student Loan</span>
              <strong>{formatGBP(result.studentLoan.amount)}</strong>
            </li>
            <li className="total">
              <span>Total Deductions</span>
              <strong>{formatGBP(result.incomeTax.total + result.dividendTax.total + result.nationalInsurance.total + result.studentLoan.amount)}</strong>
            </li>
            <li className="total">
              <span>Net income</span>
              <strong>{formatGBP(result.totals.netIncome)}</strong>
            </li>
          </ul>
          <details>
            <summary>Show monthly equivalents</summary>
            <ul className="list">
              <li>
                <span>Income Tax</span>
                <strong>{formatGBP((result.incomeTax.total / 12) | 0)}</strong>
              </li>
              <li>
                <span>National Insurance</span>
                <strong>{formatGBP((result.nationalInsurance.total / 12) | 0)}</strong>
              </li>
              <li>
                <span>Dividend Tax</span>
                <strong>{formatGBP((result.dividendTax.total / 12) | 0)}</strong>
              </li>
              <li>
                <span>Student Loan</span>
                <strong>{formatGBP((result.studentLoan.amount / 12) | 0)}</strong>
              </li>
              <li className="total">
                <span>Total Deductions</span>
                <strong>{formatGBP(((result.incomeTax.total + result.dividendTax.total + result.nationalInsurance.total + result.studentLoan.amount) / 12) | 0)}</strong>
              </li>
              <li className="total">
                <span>Net income</span>
                <strong>{formatGBP(result.totals.monthly.netIncome)}</strong>
              </li>
            </ul>
            <p className="footnote">Note: Monthly is annual ÷ 12 (not PAYE-period exact).</p>
          </details>
        </section>

        <section className="panel span-2">
          <h2>Breakdown</h2>
          <div className="breakdown-grid">
            <div>
              <h3>Income Tax (salary)</h3>
              <ul className="list">
                <li>
                  <span>Personal Allowance used (salary)</span>
                  <strong>{formatGBP(result.personalAllowanceUsedOnSalary)}</strong>
                </li>
                <li>
                  <span>Basic rate (20%)</span>
                  <strong>{formatGBP(result.incomeTax.basic)}</strong>
                </li>
                <li>
                  <span>Higher rate (40%)</span>
                  <strong>{formatGBP(result.incomeTax.higher)}</strong>
                </li>
                <li>
                  <span>Additional rate (45%)</span>
                  <strong>{formatGBP(result.incomeTax.additional)}</strong>
                </li>
                <li className="subtotal">
                  <span>Total income tax (salary)</span>
                  <strong>{formatGBP(result.incomeTax.total)}</strong>
                </li>
              </ul>
            </div>
            <div>
              <h3>Dividend Tax</h3>
              <ul className="list">
                <li>
                  <span>Personal Allowance used (dividends)</span>
                  <strong>{formatGBP(result.personalAllowanceUsedOnDividends)}</strong>
                </li>
                <li>
                  <span>Dividend allowance (0%)</span>
                  <strong>{formatGBP(result.dividendTax.allowanceApplied)}</strong>
                </li>
                <li>
                  <span>Basic rate (8.75%)</span>
                  <strong>{formatGBP(result.dividendTax.basic)}</strong>
                </li>
                <li>
                  <span>Higher rate (33.75%)</span>
                  <strong>{formatGBP(result.dividendTax.higher)}</strong>
                </li>
                <li>
                  <span>Additional rate (39.35%)</span>
                  <strong>{formatGBP(result.dividendTax.additional)}</strong>
                </li>
                <li className="subtotal">
                  <span>Total dividend tax</span>
                  <strong>{formatGBP(result.dividendTax.total)}</strong>
                </li>
              </ul>
            </div>
            <div>
              <h3>National Insurance</h3>
              <ul className="list">
                <li>
                  <span>Main rate (8%)</span>
                  <strong>{formatGBP(result.nationalInsurance.main)}</strong>
                </li>
                <li>
                  <span>Upper rate (2%)</span>
                  <strong>{formatGBP(result.nationalInsurance.upper)}</strong>
                </li>
                <li className="subtotal">
                  <span>Total NI</span>
                  <strong>{formatGBP(result.nationalInsurance.total)}</strong>
                </li>
              </ul>
            </div>
            <div>
              <h3>Student Loan</h3>
              <ul className="list">
                <li>
                  <span>Plan</span>
                  <strong>{result.studentLoan.plan}</strong>
                </li>
                <li className="subtotal">
                  <span>Amount</span>
                  <strong>{formatGBP(result.studentLoan.amount)}</strong>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
