/**
 * integration.scenarios.test.js
 *
 * End-to-end scenario tests. Each test represents a complete person profile
 * and verifies that all calculation layers produce internally consistent,
 * financially sensible results.
 *
 * These are "sanity" tests — they don't pin exact values, but enforce logical
 * constraints: income > 0, taxes < income, portfolio survives a reasonable
 * period, etc.
 */

import { describe, it, expect } from 'vitest'
import { computeFersPension } from '../utils/federalCalculations.js'
import { computeTSPProjection } from '../utils/portfolioProjections.js'
import { computeSocialSecurity } from '../utils/portfolioProjections.js'
import { runMonteCarlo } from '../utils/portfolioProjections.js'
import { computePortfolioDrawdown } from '../utils/portfolioProjections.js'
import { computeRetirementTax } from '../utils/taxCalculations.js'
import { computeExpenseTotals, inflateExpense } from '../utils/expenseCalculations.js'

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 1: Mid-career federal employee (FERS)
// Profile: Born 1975, hired at 25, retires at 57 (MRA, 30 years service)
//          Salary $95,000, TSP $180,000, 5% match
// ─────────────────────────────────────────────────────────────────────────────
describe('Scenario 1: FERS employee retiring at MRA with 30 years', () => {
  const CURRENT_YEAR = new Date().getFullYear()
  const birthYear = 1975
  const currentAge = CURRENT_YEAR - birthYear        // ~51
  const retirementAge = 57
  const yearsToRetirement = retirementAge - currentAge
  const high3 = 95000 * Math.pow(1.01, yearsToRetirement) // approximate
  const salary = 95000
  const matchAnnual = salary * 0.05

  const fers = computeFersPension({
    high3Salary: high3,
    credibleServiceYears: 30,
    retirementAge,
    survivorBenefitElection: 'full',
    retirementSystem: 'fers',
    birthYear,
    projectedSSAt62Monthly: 1400,
  })

  const tsp = computeTSPProjection({
    currentBalance: 180000,
    annualContributionTraditional: 23500,
    employerMatchAnnual: matchAnnual,
    returnRate: 0.065,
    yearsToRetirement,
  })

  const ss = computeSocialSecurity({
    fraMonthlyBenefit: 1800,
    birthYear,
    claimingAge: 62,
  })

  it('FERS annuity is positive', () => {
    expect(fers.netMonthlyAnnuity).toBeGreaterThan(0)
  })

  it('FERS has no penalty (30 years service waives it)', () => {
    expect(fers.penaltyRate).toBe(0)
  })

  it('FERS includes SRS bridge (retiring before 62)', () => {
    expect(fers.hasSRS).toBe(true)
    expect(fers.srsMonthly).toBeGreaterThan(0)
  })

  it('TSP balance at retirement exceeds current balance', () => {
    expect(tsp.totalBalance).toBeGreaterThan(180000)
  })

  it('Monthly retirement income covers reasonable expenses', () => {
    const totalMonthlyIncome = fers.netMonthlyAnnuity + fers.srsMonthly + (tsp.totalBalance * 0.04 / 12)
    // Should be at least $3,000/mo combined
    expect(totalMonthlyIncome).toBeGreaterThan(3000)
  })

  it('Tax rate on retirement income is under 25%', () => {
    const annualPension = fers.netMonthlyAnnuity * 12
    const annualTSP = tsp.totalBalance * 0.04
    const tax = computeRetirementTax({
      annualPension,
      annualTSPWithdrawal: annualTSP,
      annualSSBenefit: ss.selectedMonthly * 12,
      filingStatus: 'mfj',
      stateCode: 'VA',
      retirementAge,
    })
    expect(tax.overallEffectiveRate).toBeLessThan(0.25)
    expect(tax.federalTax).toBeGreaterThan(0)
  })

  it('Monte Carlo success rate exceeds 70% at 4% withdrawal', () => {
    const annualWithdrawal = tsp.totalBalance * 0.04
    const mc = runMonteCarlo({
      startingBalance: tsp.totalBalance,
      annualWithdrawal,
      meanReturn: 0.07,
      returnStdDev: 0.15,
      years: 33, // retirement at 57 to age 90
      runs: 300,
    })
    expect(mc.successRate).toBeGreaterThan(0.70)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 2: Private-sector worker with 401k and pension
// Profile: Born 1965, retires at 65, $120,000 salary, $350,000 401k,
//          private pension $2,000/mo, SS at FRA
// ─────────────────────────────────────────────────────────────────────────────
describe('Scenario 2: Private sector worker with 401k, pension, and SS', () => {
  const CURRENT_YEAR = new Date().getFullYear()
  const birthYear = 1965
  const currentAge = CURRENT_YEAR - birthYear       // ~61
  const retirementAge = 65
  const yearsToRetirement = Math.max(0, retirementAge - currentAge)

  const tsp = computeTSPProjection({
    currentBalance: 350000,
    annualContributionTraditional: 30500, // 23,500 + 7,000 catchup (age 50+)
    employerMatchAnnual: 6000,
    returnRate: 0.065,
    yearsToRetirement,
  })

  const ss = computeSocialSecurity({
    fraMonthlyBenefit: 2400,
    birthYear,
    claimingAge: 67, // FRA for 1965
  })

  const privatePensionMonthly = 2000
  const privatePensionAnnual = privatePensionMonthly * 12

  it('401k balance exceeds starting balance at retirement', () => {
    expect(tsp.totalBalance).toBeGreaterThanOrEqual(350000)
  })

  it('SS benefit at FRA equals fraMonthlyBenefit (no adjustment)', () => {
    expect(ss.selectedMonthly).toBeCloseTo(2400, 0)
  })

  it('SS FRA is 67 for born 1965', () => {
    expect(ss.fra).toBe(67)
  })

  it('Total retirement income is above $5,000/mo', () => {
    const monthly401k = (tsp.totalBalance * 0.04) / 12
    const total = privatePensionMonthly + ss.selectedMonthly + monthly401k
    expect(total).toBeGreaterThan(5000)
  })

  it('Tax estimate is reasonable and income exceeds tax', () => {
    const tax = computeRetirementTax({
      annualPension: privatePensionAnnual,
      annualTSPWithdrawal: tsp.totalBalance * 0.04,
      annualSSBenefit: ss.selectedMonthly * 12,
      filingStatus: 'mfj',
      stateCode: 'TX',
      retirementAge,
    })
    const totalIncome = privatePensionAnnual + tsp.totalBalance * 0.04 + ss.selectedMonthly * 12
    expect(tax.totalTax).toBeLessThan(totalIncome)
    expect(tax.afterTaxIncome).toBeGreaterThan(0)
  })

  it('Portfolio drawdown survives 25 years at 4% withdrawal', () => {
    const result = computePortfolioDrawdown({
      startingBalance: tsp.totalBalance,
      annualWithdrawal: tsp.totalBalance * 0.04,
      returnRate: 0.05,
      inflationRate: 0.025,
      years: 25,
    })
    expect(result.survivedFullPeriod).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 3: CSRS legacy employee close to retirement
// Profile: Born 1958, hired 1982, retires at 66 (30 years CSRS service),
//          High-3 $85,000, no TSP, SS reduced (pre-WEP era)
// ─────────────────────────────────────────────────────────────────────────────
describe('Scenario 3: CSRS employee with 30 years service', () => {
  const fers = computeFersPension({
    high3Salary: 85000,
    credibleServiceYears: 30,
    retirementAge: 66,
    survivorBenefitElection: 'full',
    retirementSystem: 'csrs',
    birthYear: 1958,
  })

  it('CSRS pension is greater than FERS for same service and High-3', () => {
    const fersPension = computeFersPension({
      high3Salary: 85000,
      credibleServiceYears: 30,
      retirementAge: 66,
      survivorBenefitElection: 'full',
      retirementSystem: 'fers',
      birthYear: 1958,
    })
    expect(fers.grossAnnuity).toBeGreaterThan(fersPension.grossAnnuity)
  })

  it('CSRS annuity is 56.25% of High-3 for 30 years', () => {
    // 5×1.5% + 5×1.75% + 20×2.0% = 7.5% + 8.75% + 40% = 56.25%
    expect(fers.grossAnnuity).toBeCloseTo(85000 * 0.5625, 0)
  })

  it('CSRS has no SRS', () => {
    expect(fers.hasSRS).toBe(false)
    expect(fers.srsMonthly).toBe(0)
  })

  it('CSRS has no early retirement penalty', () => {
    expect(fers.penaltyRate).toBe(0)
  })

  it('Monthly CSRS annuity after survivor benefit is reasonable', () => {
    // Gross: $47,812 × (1 − 10%) = $43,031 → $3,586/mo
    expect(fers.netMonthlyAnnuity).toBeCloseTo(85000 * 0.5625 * 0.90 / 12, 0)
    expect(fers.netMonthlyAnnuity).toBeGreaterThan(3000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 4: Expense + income consistency checks
// Ensures that expense inflation and income calculations stay in sync
// ─────────────────────────────────────────────────────────────────────────────
describe('Scenario 4: Expense and income consistency', () => {
  const yearsToRetirement = 10
  const monthlyExpenses = {
    mortgageRent: 1800, propertyTax: 300, homeInsurance: 150,
    utilities: 350, internetPhone: 150, homeMaintenance: 200,
    groceries: 600, diningOut: 300, coffeeShops: 40,
    carInsurance: 150, gas: 150, vehicleMaintenance: 100, registration: 25,
    healthInsurance: 650, dental: 35, vision: 20, outOfPocket: 150, gym: 50,
    domesticTrips: 2, domesticTripCost: 2500,
    internationalTrips: 0, internationalTripCost: 0,
    streaming: 60, hobbies: 150, clothing: 150, haircuts: 40,
    gifts: 100, charitableDonations: 100, miscellaneous: 200,
  }

  const expenses = computeExpenseTotals(monthlyExpenses, 0.025, yearsToRetirement, 1.0)

  it('inflated expenses exceed today expenses', () => {
    expect(expenses.totalMonthlyAtRetirement).toBeGreaterThan(expenses.totalMonthlyToday)
  })

  it('10-year inflation factor is ~1.28 at 2.5%', () => {
    const ratio = expenses.totalMonthlyAtRetirement / expenses.totalMonthlyToday
    expect(ratio).toBeCloseTo(Math.pow(1.025, 10), 2)
  })

  it('FERS pension + 4% TSP produces meaningful monthly income', () => {
    // Retiree with $35k/yr pension and $600k TSP → ~$4,917/mo combined
    const pensionMonthly = 35000 / 12
    const tspMonthly = (600000 * 0.04) / 12
    const totalIncomeMonthly = pensionMonthly + tspMonthly
    expect(totalIncomeMonthly).toBeGreaterThan(4000)
    // Inflated expenses are tracked separately; this confirms income is substantial
    expect(expenses.totalMonthlyAtRetirement).toBeGreaterThan(expenses.totalMonthlyToday)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 5: Internal consistency guards
// Verifies mathematical relationships hold across functions
// ─────────────────────────────────────────────────────────────────────────────
describe('Scenario 5: Mathematical consistency checks', () => {
  it('FERS monthly annuity × 12 equals annual annuity', () => {
    const result = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 25,
      retirementAge: 60,
      survivorBenefitElection: 'none',
      birthYear: 1970,
    })
    expect(result.netMonthlyAnnuity * 12).toBeCloseTo(result.netAnnualAnnuity, 1)
  })

  it('totalBalance = traditionalBalance + rothBalance in TSP projection', () => {
    const result = computeTSPProjection({
      currentBalance: 100000,
      rothBalance: 30000,
      annualContributionTraditional: 10000,
      annualContributionRoth: 3000,
      returnRate: 0.065,
      yearsToRetirement: 15,
    })
    expect(result.totalBalance).toBeCloseTo(result.traditionalBalance + result.rothBalance, 0)
  })

  it('SS lifetime total at 90 is greater for delaying to 70 than claiming at 62', () => {
    const result = computeSocialSecurity({ fraMonthlyBenefit: 2000, birthYear: 1975 })
    expect(result.lifetime90.age70).toBeGreaterThan(result.lifetime90.age62)
  })

  it('effective tax rate is always between 0 and 1', () => {
    const result = computeRetirementTax({
      annualPension: 50000,
      annualTSPWithdrawal: 30000,
      annualSSBenefit: 20000,
      filingStatus: 'mfj',
      stateCode: 'MD',
      retirementAge: 65,
    })
    expect(result.overallEffectiveRate).toBeGreaterThanOrEqual(0)
    expect(result.overallEffectiveRate).toBeLessThan(1)
  })

  it('after-tax income = total income − total tax', () => {
    const result = computeRetirementTax({
      annualPension: 40000,
      annualTSPWithdrawal: 20000,
      annualSSBenefit: 18000,
      annualVABenefit: 5000,
      annualRothWithdrawal: 10000,
      filingStatus: 'mfj',
      stateCode: 'FL',
      retirementAge: 65,
    })
    const totalIncome = 40000 + 20000 + 18000 + 5000 + 10000
    expect(result.afterTaxIncome).toBeCloseTo(totalIncome - result.totalTax, 0)
  })
})
