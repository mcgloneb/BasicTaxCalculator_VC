import { activeConfig } from './config';
import type { StudentLoanPlan, TaxYearConfig } from './config';

export type Inputs = {
  salary: number; // pounds per year
  dividends: number; // pounds per year
  studentLoan: StudentLoanPlan;
};

export type IncomeTaxBreakdown = {
  basic: number; // pence
  higher: number; // pence
  additional: number; // pence
  total: number; // pence
};

export type DividendTaxBreakdown = {
  allowanceApplied: number; // pence at 0%
  basic: number; // pence
  higher: number; // pence
  additional: number; // pence
  total: number; // pence
};

export type NIBreakdown = {
  main: number; // pence at main rate
  upper: number; // pence at upper rate
  total: number; // pence
};

export type StudentLoan = {
  plan: StudentLoanPlan;
  amount: number; // pence
};

export type Result = {
  taxYear: string;
  inputs: Inputs;
  personalAllowanceUsedOnSalary: number; // pence
  personalAllowanceUsedOnDividends: number; // pence
  incomeTax: IncomeTaxBreakdown;
  dividendTax: DividendTaxBreakdown;
  nationalInsurance: NIBreakdown;
  studentLoan: StudentLoan;
  totals: {
    taxOnly: number; // pence (income tax + dividend tax)
    taxAndNI: number; // pence
    netIncome: number; // pence
    monthly: {
      taxOnly: number; // pence
      taxAndNI: number; // pence
      netIncome: number; // pence
    };
  };
};

const toPence = (pounds: number) => Math.max(0, Math.round(pounds * 100));
const fromPence = (pence: number) => pence / 100;

const bps = (amountPence: number, rateBps: number) => {
  const res = (BigInt(amountPence) * BigInt(rateBps) + 5000n) / 10000n; // round half up
  return Number(res);
};

const divRound = (amountPence: number, divisor: number) => {
  const res = (BigInt(amountPence) + BigInt(Math.floor(divisor / 2))) / BigInt(divisor);
  return Number(res);
};

export function calculate(inputs: Inputs, cfg: TaxYearConfig = activeConfig): Result {
  const salaryP = toPence(inputs.salary);
  const divP = toPence(inputs.dividends);

  // 1) Adjusted Net Income (simplified: salary + dividends)
  const aniP = salaryP + divP;

  // 2) Personal Allowance with tapering (£1 per £2 over threshold)
  const basePA = cfg.personalAllowance;
  let paReduction = 0;
  if (aniP > cfg.personalAllowanceTaperStart) {
    const excess = aniP - cfg.personalAllowanceTaperStart; // pence
    // Reduce PA by £1 (100 p) for every £2 (200 p) excess
    paReduction = Math.min(basePA, Number((BigInt(excess) / 200n) * 100n));
  }
  const personalAllowance = Math.max(0, basePA - paReduction);

  // 3) Apply PA to salary first, then dividends
  const paToSalary = Math.min(personalAllowance, salaryP);
  const salaryTaxable = salaryP - paToSalary;
  const paRemaining = personalAllowance - paToSalary;
  const divAfterPA = Math.max(0, divP - paRemaining);
  const paToDividends = Math.min(paRemaining, divP);

  // 4) Non-dividend income tax (bands based on taxable non-dividend income)
  const basicBand = cfg.basicRateBand;
  const higherBandWidthAfterPA = Math.max(0, cfg.additionalRateThreshold - personalAllowance - basicBand);

  const basicUsedSalary = Math.min(salaryTaxable, basicBand);
  const higherUsedSalary = Math.min(Math.max(0, salaryTaxable - basicUsedSalary), higherBandWidthAfterPA);
  const additionalUsedSalary = Math.max(0, salaryTaxable - basicUsedSalary - higherUsedSalary);

  const taxSalaryBasic = bps(basicUsedSalary, cfg.rates.incomeBasicBps);
  const taxSalaryHigher = bps(higherUsedSalary, cfg.rates.incomeHigherBps);
  const taxSalaryAdditional = bps(additionalUsedSalary, cfg.rates.incomeAdditionalBps);

  // 5) Dividend allowance and band capacities after salary usage
  let basicCapacity = Math.max(0, basicBand - basicUsedSalary);
  let higherCapacity = Math.max(0, higherBandWidthAfterPA - higherUsedSalary);

  const divAllowanceApplied = Math.min(cfg.dividendAllowance, divAfterPA);
  // Allowance consumes band capacity in order (basic -> higher -> additional (unlimited))
  let allowanceLeft = divAllowanceApplied;
  const basicReduce = Math.min(allowanceLeft, basicCapacity);
  basicCapacity -= basicReduce;
  allowanceLeft -= basicReduce;
  const higherReduce = Math.min(allowanceLeft, higherCapacity);
  higherCapacity -= higherReduce;
  allowanceLeft -= higherReduce;
  // remainder of allowance, if any, sits in additional band (no capacity to reduce)

  const divTaxableAfterAllowance = divAfterPA - divAllowanceApplied;

  const divBasicTaxed = Math.min(divTaxableAfterAllowance, basicCapacity);
  const divHigherTaxed = Math.min(Math.max(0, divTaxableAfterAllowance - divBasicTaxed), higherCapacity);
  const divAdditionalTaxed = Math.max(0, divTaxableAfterAllowance - divBasicTaxed - divHigherTaxed);

  const taxDivBasic = bps(divBasicTaxed, cfg.rates.divBasicBps);
  const taxDivHigher = bps(divHigherTaxed, cfg.rates.divHigherBps);
  const taxDivAdditional = bps(divAdditionalTaxed, cfg.rates.divAdditionalBps);

  // 6) National Insurance (employee Class 1) — salary only
  const { primaryThreshold: PT, upperEarningsLimit: UEL } = cfg.ni;
  const niBand1 = Math.max(0, Math.min(salaryP, UEL) - PT);
  const niBand2 = Math.max(0, salaryP - UEL);
  const niMain = bps(niBand1, cfg.rates.niMainBps);
  const niUpper = bps(niBand2, cfg.rates.niUpperBps);
  const niTotal = niMain + niUpper;

  // 7) Student loan (plans 1/2 only), based on total income (simplified)
  let slAmount = 0;
  if (inputs.studentLoan !== 'none') {
    const threshold = cfg.studentLoans[inputs.studentLoan].threshold;
    const slIncome = Math.max(0, salaryP + divP - threshold);
    slAmount = bps(slIncome, cfg.rates.slRateBps);
  }

  // 8) Totals
  const incomeTaxTotal = taxSalaryBasic + taxSalaryHigher + taxSalaryAdditional;
  const dividendTaxTotal = taxDivBasic + taxDivHigher + taxDivAdditional;
  const taxOnly = incomeTaxTotal + dividendTaxTotal;
  const taxAndNI = taxOnly + niTotal;
  const netIncome = salaryP + divP - taxAndNI - slAmount;

  const monthly = {
    taxOnly: divRound(taxOnly, 12),
    taxAndNI: divRound(taxAndNI, 12),
    netIncome: divRound(netIncome, 12),
  };

  return {
    taxYear: cfg.yearLabel,
    inputs,
    personalAllowanceUsedOnSalary: paToSalary,
    personalAllowanceUsedOnDividends: paToDividends,
    incomeTax: {
      basic: taxSalaryBasic,
      higher: taxSalaryHigher,
      additional: taxSalaryAdditional,
      total: incomeTaxTotal,
    },
    dividendTax: {
      allowanceApplied: divAllowanceApplied,
      basic: taxDivBasic,
      higher: taxDivHigher,
      additional: taxDivAdditional,
      total: dividendTaxTotal,
    },
    nationalInsurance: {
      main: niMain,
      upper: niUpper,
      total: niTotal,
    },
    studentLoan: {
      plan: inputs.studentLoan,
      amount: slAmount,
    },
    totals: {
      taxOnly,
      taxAndNI,
      netIncome,
      monthly,
    },
  };
}

export const pounds = (pence: number) => fromPence(pence);
