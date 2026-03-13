// Default assumption values — all editable in the Assumptions Panel
// These are used as the starting values and "Reset to defaults" target.

export const DEFAULT_ASSUMPTIONS = {
  // ── Returns ──────────────────────────────────────────────────────────────
  tspStockReturn: 0.07,           // 7% — TSP C/S fund historical avg
  tspBondReturn: 0.04,            // 4% — TSP F/G fund blended avg
  tspBlendedReturn: 0.065,        // 6.5% — typical balanced target date
  rothIraReturn: 0.08,            // 8% — Roth IRA growth ETF assumption
  brokerageReturn: 0.07,          // 7%
  dividendYield: {
    SCHD: 0.035,                  // 3.5% current yield
    VYM: 0.030,
    NOBL: 0.021,
    JEPI: 0.075,
  },
  schdDividendGrowth: 0.10,       // 10%/yr historical dividend growth
  schdPriceGrowth: 0.08,          // 8%/yr price appreciation

  // ── Inflation ─────────────────────────────────────────────────────────────
  inflationRate: 0.025,           // 2.5% general inflation
  healthcareInflationRate: 0.05,  // 5% — healthcare inflates faster
  collegeInflationRate: 0.05,     // 5% — college cost inflation
  homeAppreciationRate: 0.03,     // 3%

  // ── FERS / CSRS ───────────────────────────────────────────────────────────
  fersMultiplierStandard: 0.01,   // 1.0%
  fersMultiplierEnhanced: 0.011,  // 1.1% (age 62+, 20+ years)
  fersEarlyPenaltyRate: 0.05,     // 5% per year under 62
  fersCOLA: 0.02,                 // 2% — net FERS COLA (CPI-based, capped)
  csrsCOLA: 0.025,                // 2.5% — CSRS full COLA
  fersSickLeaveHoursPerYear: 2087, // OPM formula for sick leave credit
  survivorBenefitReductionFull: 0.10,   // 10% annuity reduction
  survivorBenefitReductionPartial: 0.05, // 5% annuity reduction

  // ── Social Security ───────────────────────────────────────────────────────
  ssReductionAt62: 0.25,          // 25% reduction vs FRA (for those with FRA=67)
  ssDelayedCreditPerYear: 0.08,   // 8%/yr credit for delaying past FRA
  ssCOLA: 0.025,                  // 2.5% average SS COLA assumption
  wepGpoApplies: false,           // WEP/GPO repealed Jan 2025 (Social Security Fairness Act)
  spousalBenefitRate: 0.50,       // 50% of higher earner's PIA

  // ── TSP / 401k ────────────────────────────────────────────────────────────
  tspContributionLimit2024: 23000,        // IRS 2024 elective deferral limit
  tspCatchupLimit2024: 7500,              // IRS 2024 catch-up (age 50+)
  tspContributionLimit2025: 23500,        // IRS 2025 update
  rothIraContributionLimit2024: 7000,
  rothIraContributionLimitCatchup2024: 1000,
  backdoorRothIncomeThresholdMFJ: 236000, // 2024 Roth IRA MAGI limit (MFJ)
  backdoorRothIncomeThresholdSingle: 161000,

  // ── Tax ───────────────────────────────────────────────────────────────────
  // Federal brackets used in tax calculations (2024, MFJ)
  federalBrackets2024MFJ: [
    { rate: 0.10, upTo: 23200 },
    { rate: 0.12, upTo: 94300 },
    { rate: 0.22, upTo: 201050 },
    { rate: 0.24, upTo: 383900 },
    { rate: 0.32, upTo: 487450 },
    { rate: 0.35, upTo: 731200 },
    { rate: 0.37, upTo: Infinity },
  ],
  federalBrackets2024Single: [
    { rate: 0.10, upTo: 11600 },
    { rate: 0.12, upTo: 47150 },
    { rate: 0.22, upTo: 100525 },
    { rate: 0.24, upTo: 191950 },
    { rate: 0.32, upTo: 243725 },
    { rate: 0.35, upTo: 609350 },
    { rate: 0.37, upTo: Infinity },
  ],
  standardDeductionMFJ2024: 29200,
  standardDeductionSingle2024: 14600,
  // SS taxable thresholds (combined income = AGI + half SS)
  ssTaxable50PctThresholdMFJ: 32000,
  ssTaxable85PctThresholdMFJ: 44000,
  ssTaxable50PctThresholdSingle: 25000,
  ssTaxable85PctThresholdSingle: 34000,
  // FERS annuity taxable portion (employee contributions excluded)
  fersAnnuityTaxablePct: 0.95,    // ~95% taxable (simplified)

  // ── Home / Real Estate ────────────────────────────────────────────────────
  homeSellingCostsPct: 0.06,      // 6% (agent commissions + closing)

  // ── Portfolio / Withdrawal ────────────────────────────────────────────────
  safeWithdrawalRate: 0.04,       // 4% rule
  portfolioDrawdownReturn: 0.05,  // 5% growth during drawdown phase
  surplusReinvestmentReturn: 0.05,

  // ── Monte Carlo ────────────────────────────────────────────────────────────
  monteCarloRuns: 500,
  stockVolatility: 0.15,          // ±15% annual std dev
  bondVolatility: 0.05,
  inflationVolatility: 0.01,      // ±1% inflation variance

  // ── 529 ───────────────────────────────────────────────────────────────────
  plan529GrowthRate: 0.07,        // 7% typical 529 plan growth
  collegeAnnualCost2024: 35000,   // $35K/yr national avg (room + tuition)
  plan529SuperfundLimit2024: 95000, // 5-year gift tax exclusion superfund limit

  // ── VA ─────────────────────────────────────────────────────────────────────
  vaCOLARate: 0.025,              // VA disability COLA assumption

  // ── Life Expectancy Defaults ───────────────────────────────────────────────
  defaultLifeExpectancy: 90,
  defaultSpouseLifeExpectancy: 92,
}

// IRS contribution limits by year (for auto-suggest badges)
export const IRS_LIMITS = {
  2024: { tsp: 23000, catchup: 7500, rothIra: 7000, rothCatchup: 1000 },
  2025: { tsp: 23500, catchup: 7500, rothIra: 7000, rothCatchup: 1000 },
}

// FERS MRA lookup table (birth year → Minimum Retirement Age)
// Source: OPM — https://www.opm.gov/retirement-services/fers-information/eligibility/
export const FERS_MRA_TABLE = {
  // Born 1947 or earlier
  before1948: 55,
  1948: 55.5,
  1949: 56,
  1950: 56.5,
  1951: 57,
  1952: 57,
  1953: 57, // 57 yrs 2 months — simplified to 57
  1954: 57,
  1955: 57,
  1956: 57,
  1957: 57,
  1958: 57,
  1959: 57,
  1960: 57,
  1961: 57,
  1962: 57,
  1963: 57,
  1964: 57,
  // Born 1965 or later: 57
  after1964: 57,
}

// Social Security Full Retirement Age by birth year
export const SS_FRA_TABLE = {
  1937: 65,
  1938: 65.167,
  1939: 65.333,
  1940: 65.5,
  1941: 65.667,
  1942: 65.833,
  1943: 66,
  1944: 66,
  1945: 66,
  1946: 66,
  1947: 66,
  1948: 66,
  1949: 66,
  1950: 66,
  1951: 66,
  1952: 66,
  1953: 66,
  1954: 66,
  1955: 66.167,
  1956: 66.333,
  1957: 66.5,
  1958: 66.667,
  1959: 66.833,
  1960: 67,
  after1960: 67,
}
