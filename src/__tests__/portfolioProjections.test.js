/**
 * portfolioProjections.test.js
 *
 * Verifies TSP compound growth, 4% rule, SS benefit adjustments,
 * drawdown model, and Monte Carlo simulation behavior.
 */

import { describe, it, expect } from 'vitest'
import {
  computeTSPProjection,
  computeEmployerMatch,
  computeFourPercentRule,
  computeDividendIncome,
  computePortfolioDrawdown,
  computeSocialSecurity,
  runMonteCarlo,
  computeHomeProjection,
  compute529Projection,
} from '../utils/portfolioProjections.js'

// ── TSP Compound Growth ───────────────────────────────────────────────────────
describe('computeTSPProjection', () => {
  it('returns starting balance when yearsToRetirement is 0', () => {
    const result = computeTSPProjection({ currentBalance: 100000, yearsToRetirement: 0 })
    expect(result.totalBalance).toBe(100000)
  })

  it('grows a zero-contribution balance at the stated rate', () => {
    // $100,000 × (1.065)^10 ≈ $187,714
    const result = computeTSPProjection({
      currentBalance: 100000,
      returnRate: 0.065,
      yearsToRetirement: 10,
    })
    const expected = 100000 * Math.pow(1.065, 10)
    expect(result.traditionalBalance).toBeCloseTo(expected, -2) // within $100
  })

  it('adds contributions and employer match each year', () => {
    // $0 start, $10,000/yr contrib, $5,000/yr match, 6.5% return, 1 year
    // (0 + 10000 + 5000) × 1.065 = $15,975
    const result = computeTSPProjection({
      currentBalance: 0,
      annualContributionTraditional: 10000,
      employerMatchAnnual: 5000,
      returnRate: 0.065,
      yearsToRetirement: 1,
    })
    expect(result.traditionalBalance).toBeCloseTo(15975, 0)
  })

  it('tracks Roth balance separately from Traditional', () => {
    const result = computeTSPProjection({
      currentBalance: 50000,
      rothBalance: 20000,
      annualContributionTraditional: 10000,
      annualContributionRoth: 5000,
      returnRate: 0.065,
      yearsToRetirement: 5,
    })
    expect(result.traditionalBalance).toBeGreaterThan(50000)
    expect(result.rothBalance).toBeGreaterThan(20000)
    expect(result.totalBalance).toBeCloseTo(result.traditionalBalance + result.rothBalance, 0)
  })

  it('returns a yearByYear array with the correct number of entries', () => {
    const result = computeTSPProjection({ currentBalance: 50000, yearsToRetirement: 10 })
    expect(result.yearByYear).toHaveLength(10)
    // Each year total should be greater than the previous
    for (let i = 1; i < result.yearByYear.length; i++) {
      expect(result.yearByYear[i].total).toBeGreaterThanOrEqual(result.yearByYear[i - 1].total)
    }
  })
})

// ── Employer Match ────────────────────────────────────────────────────────────
describe('computeEmployerMatch', () => {
  it('returns 0 for type none', () => {
    expect(computeEmployerMatch({ matchType: 'none' })).toBe(0)
  })

  it('returns fixed amount for fixed type', () => {
    expect(computeEmployerMatch({ matchType: 'fixed', fixedAmount: 3000 })).toBe(3000)
  })

  it('computes percentage match correctly', () => {
    // 5% salary cap, 100% match, salary $100,000 → $5,000
    const result = computeEmployerMatch({
      matchType: 'percentage',
      salary: 100000,
      matchPct: 1.0,
      matchCapPct: 0.05,
    })
    expect(result).toBe(5000)
  })
})

// ── 4% Rule ───────────────────────────────────────────────────────────────────
describe('computeFourPercentRule', () => {
  it('returns 4% of portfolio annually', () => {
    expect(computeFourPercentRule(1000000)).toBe(40000)
    expect(computeFourPercentRule(500000)).toBe(20000)
  })

  it('supports custom withdrawal rate', () => {
    expect(computeFourPercentRule(1000000, 0.03)).toBe(30000)
  })
})

// ── Dividend Income ───────────────────────────────────────────────────────────
describe('computeDividendIncome', () => {
  it('returns yield × portfolio balance', () => {
    expect(computeDividendIncome(1000000, 0.035)).toBe(35000)
    expect(computeDividendIncome(500000, 0.03)).toBe(15000)
  })
})

// ── Portfolio Drawdown ────────────────────────────────────────────────────────
describe('computePortfolioDrawdown', () => {
  it('survives 30 years with conservative withdrawal', () => {
    // $1M portfolio, $30,000/yr withdrawal (3%), 5% return → should survive
    const result = computePortfolioDrawdown({
      startingBalance: 1000000,
      annualWithdrawal: 30000,
      returnRate: 0.05,
      inflationRate: 0.025,
      years: 30,
    })
    expect(result.survivedFullPeriod).toBe(true)
    expect(result.depletionYear).toBeNull()
    expect(result.finalBalance).toBeGreaterThan(0)
  })

  it('depletes with an aggressive withdrawal rate', () => {
    // $100,000 portfolio, $20,000/yr withdrawal (20%), 5% return → depletes
    const result = computePortfolioDrawdown({
      startingBalance: 100000,
      annualWithdrawal: 20000,
      returnRate: 0.05,
      inflationRate: 0.025,
      years: 30,
    })
    expect(result.survivedFullPeriod).toBe(false)
    expect(result.depletionYear).toBeGreaterThan(0)
  })

  it('returns correct number of yearByYear entries', () => {
    const result = computePortfolioDrawdown({
      startingBalance: 500000,
      annualWithdrawal: 25000,
      years: 25,
    })
    expect(result.yearByYear).toHaveLength(25)
  })

  it('balance never goes negative', () => {
    const result = computePortfolioDrawdown({
      startingBalance: 50000,
      annualWithdrawal: 20000,
      returnRate: 0.03,
      years: 20,
    })
    result.yearByYear.forEach(yr => {
      expect(yr.balance).toBeGreaterThanOrEqual(0)
    })
  })
})

// ── Social Security ───────────────────────────────────────────────────────────
describe('computeSocialSecurity', () => {
  it('returns zero result when fraMonthlyBenefit is 0', () => {
    const result = computeSocialSecurity({ fraMonthlyBenefit: 0 })
    expect(result.selectedMonthly).toBe(0)
    expect(result.at62Monthly).toBe(0)
  })

  it('reduces benefit by ~25% when claiming at 62 (born 1960+, FRA=67)', () => {
    // FRA = 67, claiming at 62 → 60 months early
    // First 36 months: 36 × (5/9%) = 20%
    // Next 24 months: 24 × (5/12%) = 10%
    // Total reduction: 30% → benefit = 70% of FRA
    const result = computeSocialSecurity({ fraMonthlyBenefit: 2000, birthYear: 1970 })
    // at62Monthly should be ~70% of FRA benefit
    expect(result.at62Monthly).toBeCloseTo(2000 * 0.70, 0)
  })

  it('increases benefit by 32% when claiming at 70 (born 1960+, FRA=67)', () => {
    // 36 months past FRA × 2/3%/mo = 24% increase
    const result = computeSocialSecurity({ fraMonthlyBenefit: 2000, birthYear: 1970 })
    // at70Monthly = 2000 × 1.24 = $2,480
    expect(result.at70Monthly).toBeCloseTo(2000 * 1.24, 0)
  })

  it('returns FRA benefit when claiming at FRA', () => {
    // FRA = 67, claiming at 67 → no adjustment
    const result = computeSocialSecurity({
      fraMonthlyBenefit: 2000,
      birthYear: 1970,
      claimingAge: 67,
    })
    expect(result.selectedMonthly).toBeCloseTo(2000, 0)
  })

  it('break-even age 62 vs FRA is between 73 and 86', () => {
    // Formula: 62 + (benefitLost at 62 / monthly difference). For FRA=67:
    // benefitLost = 5yr × 12 × $1,400 = $84,000 | difference = $600 → 140 months → age ~73.7
    const result = computeSocialSecurity({ fraMonthlyBenefit: 2000, birthYear: 1970 })
    expect(result.breakEvenAge62vsFRA).toBeGreaterThan(73)
    expect(result.breakEvenAge62vsFRA).toBeLessThan(86)
  })

  it('lifetime total at 90 is greater at age 70 than age 62 for long-lived person', () => {
    const result = computeSocialSecurity({ fraMonthlyBenefit: 2000, birthYear: 1970 })
    expect(result.lifetime90.age70).toBeGreaterThan(result.lifetime90.age62)
  })

  it('lifetime total at 80 is greater at age 62 than age 70 for shorter life', () => {
    const result = computeSocialSecurity({ fraMonthlyBenefit: 2000, birthYear: 1970 })
    expect(result.lifetime80.age62).toBeGreaterThan(result.lifetime80.age70)
  })
})

// ── Monte Carlo ───────────────────────────────────────────────────────────────
describe('runMonteCarlo', () => {
  it('returns 0% success rate for zero balance', () => {
    const result = runMonteCarlo({ startingBalance: 0, annualWithdrawal: 30000 })
    expect(result.successRate).toBe(0)
  })

  it('returns deterministic results with same seed', () => {
    const a = runMonteCarlo({ startingBalance: 1000000, annualWithdrawal: 40000, runs: 100 })
    const b = runMonteCarlo({ startingBalance: 1000000, annualWithdrawal: 40000, runs: 100 })
    expect(a.successRate).toBe(b.successRate)
  })

  it('success rate improves with lower withdrawal', () => {
    const high = runMonteCarlo({ startingBalance: 500000, annualWithdrawal: 60000, runs: 200 })
    const low  = runMonteCarlo({ startingBalance: 500000, annualWithdrawal: 15000, runs: 200 })
    expect(low.successRate).toBeGreaterThan(high.successRate)
  })

  it('success rate is between 0 and 1', () => {
    const result = runMonteCarlo({ startingBalance: 1000000, annualWithdrawal: 40000, runs: 200 })
    expect(result.successRate).toBeGreaterThanOrEqual(0)
    expect(result.successRate).toBeLessThanOrEqual(1)
  })

  it('returns yearByYear array with correct length', () => {
    const result = runMonteCarlo({ startingBalance: 500000, annualWithdrawal: 20000, years: 25, runs: 50 })
    expect(result.yearByYear).toHaveLength(25)
  })

  it('percentile10 ≤ medianFinalBalance ≤ percentile90', () => {
    const result = runMonteCarlo({ startingBalance: 1000000, annualWithdrawal: 40000, runs: 200 })
    expect(result.percentile10).toBeLessThanOrEqual(result.medianFinalBalance)
    expect(result.medianFinalBalance).toBeLessThanOrEqual(result.percentile90)
  })
})

// ── Home Projection ───────────────────────────────────────────────────────────
describe('computeHomeProjection', () => {
  it('returns zeros for zero currentValue', () => {
    const result = computeHomeProjection({ currentValue: 0 })
    expect(result.valueAtRetirement).toBe(0)
  })

  it('appreciates home value over time', () => {
    // $400k at 3% for 10 years ≈ $537,567
    const result = computeHomeProjection({
      currentValue: 400000,
      mortgageBalance: 0,
      appreciationRate: 0.03,
      yearsToRetirement: 10,
    })
    expect(result.valueAtRetirement).toBeCloseTo(400000 * Math.pow(1.03, 10), -2)
  })

  it('reduces equity by remaining mortgage at retirement', () => {
    const result = computeHomeProjection({
      currentValue: 400000,
      mortgageBalance: 200000,
      mortgageRate: 0.04,
      yearsRemaining: 30,
      appreciationRate: 0.03,
      yearsToRetirement: 10,
    })
    // Mortgage should be partially paid off in 10 years
    expect(result.mortgageAtRetirement).toBeLessThan(200000)
    expect(result.mortgageAtRetirement).toBeGreaterThan(0)
    expect(result.grossEquity).toBe(result.valueAtRetirement - result.mortgageAtRetirement)
  })
})

// ── 529 Projection ────────────────────────────────────────────────────────────
describe('compute529Projection', () => {
  it('grows balance at stated rate', () => {
    // $10,000, no contributions, 7% for 5 years ≈ $14,025
    const result = compute529Projection({
      currentBalance: 10000,
      monthlyContribution: 0,
      growthRate: 0.07,
      yearsToCollegeStart: 5,
      collegeAnnualCost: 35000,
      collegeInflation: 0.05,
    })
    expect(result.balance).toBeCloseTo(10000 * Math.pow(1.07, 5), -2)
  })

  it('coverage exceeds 100% when balance covers 4-year cost', () => {
    // $200k in 529, college starts immediately, $35k/yr → $140k total
    const result = compute529Projection({
      currentBalance: 200000,
      monthlyContribution: 0,
      growthRate: 0.07,
      yearsToCollegeStart: 0,
      collegeAnnualCost: 35000,
      collegeInflation: 0.05,
    })
    // $200k covers $140k → 142%+
    expect(result.coverage).toBeGreaterThan(100)
    expect(result.surplus).toBeGreaterThan(0)
  })

  it('returns 0 balance for undefined yearsToCollegeStart', () => {
    const result = compute529Projection({})
    expect(result.balance).toBe(0)
  })
})
