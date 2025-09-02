import { describe, it, expect } from 'vitest';
import { calculate } from './calc';
import { config2024_25, config2025_26 } from './config';

describe('UK tax calculator 2024/25 rUK', () => {
  it('zero income', () => {
    const r = calculate({ salary: 0, dividends: 0, studentLoan: 'none' });
    expect(r.incomeTax.total).toBe(0);
    expect(r.dividendTax.total).toBe(0);
    expect(r.nationalInsurance.total).toBe(0);
    expect(r.studentLoan.amount).toBe(0);
    expect(r.totals.netIncome).toBe(0);
  });

  it('salary 50,000, no dividends', () => {
    const r = calculate({ salary: 50_000, dividends: 0, studentLoan: 'none' });
    // PA = 12,570 → taxable salary = 37,430 → tax 20%
    expect(r.incomeTax.total).toBe(7_486_00);
    expect(r.dividendTax.total).toBe(0);
    // NI: (50,000 - 12,570) * 8%
    expect(r.nationalInsurance.total).toBe(2_994_40);
  });

  it('dividends only within PA', () => {
    const r = calculate({ salary: 0, dividends: 2_000, studentLoan: 'none' });
    expect(r.dividendTax.total).toBe(0);
    expect(r.totals.taxAndNI).toBe(0);
  });

  it('salary 100,000 (no taper), no dividends', () => {
    const r = calculate({ salary: 100_000, dividends: 0, studentLoan: 'none' });
    // Tax: 37,700 @20% + 49,730 @40% = 7,540 + 19,892 = 27,432
    expect(r.incomeTax.basic).toBe(7_540_00);
    expect(r.incomeTax.higher).toBe(19_892_00);
    expect(r.incomeTax.additional).toBe(0);
    expect(r.incomeTax.total).toBe(27_432_00);
    // NI: 37,700 @8% + 49,730 @2% = 3,016.00 + 994.60 = 4,010.60
    expect(r.nationalInsurance.total).toBe(4_010_60);
  });

  it('salary 130,000 (PA fully tapered), no dividends', () => {
    const r = calculate({ salary: 130_000, dividends: 0, studentLoan: 'none' });
    // Tax: 37,700 @20% = 7,540; 87,440 @40% = 34,976; 4,860 @45% = 2,187
    expect(r.incomeTax.basic).toBe(7_540_00);
    expect(r.incomeTax.higher).toBe(34_976_00);
    expect(r.incomeTax.additional).toBe(2_187_00);
    expect(r.incomeTax.total).toBe(44_703_00);
    // NI: 37,700 @8% + 79,730 @2% = 3,016.00 + 1,594.60 = 4,610.60
    expect(r.nationalInsurance.total).toBe(4_610_60);
  });

  it('salary 30,000 + dividends 5,000 — dividends in basic band after allowance', () => {
    const r = calculate({ salary: 30_000, dividends: 5_000, studentLoan: 'none' });
    // Salary tax: (30,000 - 12,570)=17,430 @20% => 3,486.00
    expect(r.incomeTax.total).toBe(3_486_00);
    // Dividends: £500 allowance, remaining 4,500 at 8.75% => 393.75
    expect(r.dividendTax.total).toBe(393_75);
  });

  it('salary 50,000 + dividends 10,000 — dividends spill into higher band', () => {
    const r = calculate({ salary: 50_000, dividends: 10_000, studentLoan: 'none' });
    // Salary tax: 7,486.00 from prior test
    expect(r.incomeTax.total).toBe(7_486_00);
    // Dividends: allowance 500 consumes 270 basic + 230 higher; 9,500 taxed in higher @33.75% => 3,206.25
    expect(r.dividendTax.total).toBe(3_206_25);
  });

  // Student loan thresholds validation
  it('Plan 1 SA annual — 2024/25 threshold £24,990 on £100,000 salary', () => {
    const r = calculate({ salary: 100_000, dividends: 0, studentLoan: 'plan_1' }, config2024_25);
    // (100000 - 24990) * 9% = 6750.90
    expect(r.studentLoan.amount).toBe(6_750_90);
  });

  it('Plan 1 SA annual — 2025/26 threshold £26,065 on £100,000 salary', () => {
    const r = calculate({ salary: 100_000, dividends: 0, studentLoan: 'plan_1' }, config2025_26);
    // (100000 - 26065) * 9% = 6654.15
    expect(r.studentLoan.amount).toBe(6_654_15);
  });

  it('Plan 2 SA annual — 2025/26 threshold £28,470 on £100,000 salary', () => {
    const r = calculate({ salary: 100_000, dividends: 0, studentLoan: 'plan_2' }, config2025_26);
    // (100000 - 28470) * 9% = 6437.70
    expect(r.studentLoan.amount).toBe(6_437_70);
  });

  // Dividend allowance stays at £500 in both years (test via PA fully used by salary)
  it('Dividends 600 with salary using full PA — 2024/25 allowance £500 -> tax 8.75% on £100', () => {
    const r = calculate({ salary: 12_570, dividends: 600, studentLoan: 'none' }, config2024_25);
    expect(r.dividendTax.total).toBe(8_75);
  });
  it('Dividends 600 with salary using full PA — 2025/26 allowance £500 -> tax 8.75% on £100', () => {
    const r = calculate({ salary: 12_570, dividends: 600, studentLoan: 'none' }, config2025_26);
    expect(r.dividendTax.total).toBe(8_75);
  });
});
