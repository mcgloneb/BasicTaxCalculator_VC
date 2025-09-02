export type StudentLoanPlan = 'none' | 'plan_1' | 'plan_2';

export type TaxYearConfig = {
  yearLabel: string;
  personalAllowance: number; // pence
  personalAllowanceTaperStart: number; // pence
  dividendAllowance: number; // pence
  additionalRateThreshold: number; // pence (gross income threshold guiding band widths)
  basicRateBand: number; // pence (width of basic rate band for taxable income)
  rates: {
    incomeBasicBps: number; // 20% => 2000
    incomeHigherBps: number; // 40% => 4000
    incomeAdditionalBps: number; // 45% => 4500
    divBasicBps: number; // 8.75% => 875
    divHigherBps: number; // 33.75% => 3375
    divAdditionalBps: number; // 39.35% => 3935
    niMainBps: number; // 8% => 800
    niUpperBps: number; // 2% => 200
    slRateBps: number; // 9% => 900
  };
  ni: {
    primaryThreshold: number; // pence
    upperEarningsLimit: number; // pence
  };
  studentLoans: {
    plan_1: { threshold: number }; // pence
    plan_2: { threshold: number }; // pence
  };
};

// 2024/25 (6 Apr 2024 – 5 Apr 2025) — rUK only
export const config2024_25: TaxYearConfig = {
  yearLabel: '2024/25',
  personalAllowance: 12_570_00,
  personalAllowanceTaperStart: 100_000_00,
  dividendAllowance: 500_00,
  additionalRateThreshold: 125_140_00,
  basicRateBand: 37_700_00,
  rates: {
    incomeBasicBps: 2000,
    incomeHigherBps: 4000,
    incomeAdditionalBps: 4500,
    divBasicBps: 875,
    divHigherBps: 3375,
    divAdditionalBps: 3935,
    niMainBps: 800,
    niUpperBps: 200,
    slRateBps: 900,
  },
  ni: {
    primaryThreshold: 12_570_00,
    upperEarningsLimit: 50_270_00,
  },
  studentLoans: {
    plan_1: { threshold: 24_990_00 },
    plan_2: { threshold: 27_295_00 },
  },
};

// 2025/26 (6 Apr 2025 – 5 Apr 2026) — assume rUK bands unchanged; updated loan thresholds per gov.uk
export const config2025_26: TaxYearConfig = {
  yearLabel: '2025/26',
  personalAllowance: 12_570_00,
  personalAllowanceTaperStart: 100_000_00,
  dividendAllowance: 500_00, // HMRC shows £500 for 2024/25; no announced change for 2025/26
  additionalRateThreshold: 125_140_00,
  basicRateBand: 37_700_00,
  rates: {
    incomeBasicBps: 2000,
    incomeHigherBps: 4000,
    incomeAdditionalBps: 4500,
    divBasicBps: 875,
    divHigherBps: 3375,
    divAdditionalBps: 3935,
    niMainBps: 800,
    niUpperBps: 200,
    slRateBps: 900,
  },
  ni: {
    primaryThreshold: 12_570_00,
    upperEarningsLimit: 50_270_00,
  },
  studentLoans: {
    plan_1: { threshold: 26_065_00 },
    plan_2: { threshold: 28_470_00 },
  },
};

export const taxYearMap: Record<string, TaxYearConfig> = {
  '2024/25': config2024_25,
  '2025/26': config2025_26,
};

export const activeConfig = config2024_25;
