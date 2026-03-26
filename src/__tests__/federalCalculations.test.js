/**
 * federalCalculations.test.js
 *
 * Verifies FERS/CSRS pension math against OPM published formulas.
 * All hand-calculated expected values are documented inline.
 */

import { describe, it, expect } from 'vitest'
import {
  getMRA,
  getSSFRA,
  applyFersCola,
  computeAutoHigh3,
  computeFersPension,
  computeSRS,
  sickLeaveToServiceYears,
} from '../utils/federalCalculations.js'

// ── MRA Table ─────────────────────────────────────────────────────────────────
describe('getMRA', () => {
  it('returns 55 for born 1947 or earlier', () => {
    expect(getMRA(1940)).toBe(55)
    expect(getMRA(1947)).toBe(55)
  })

  it('returns graduated MRA for transition years', () => {
    expect(getMRA(1948)).toBeCloseTo(55 + 2 / 12, 5)
    expect(getMRA(1952)).toBeCloseTo(55 + 10 / 12, 5)
  })

  it('returns 56 for birth years 1953–1964', () => {
    expect(getMRA(1953)).toBe(56)
    expect(getMRA(1960)).toBe(56)
    expect(getMRA(1964)).toBe(56)
  })

  it('returns 57 for born 1970 or later', () => {
    expect(getMRA(1970)).toBe(57)
    expect(getMRA(1985)).toBe(57)
    expect(getMRA(2000)).toBe(57)
  })

  it('returns 57 as default when no birthYear given', () => {
    expect(getMRA(null)).toBe(57)
    expect(getMRA(undefined)).toBe(57)
  })
})

// ── SS FRA Table ──────────────────────────────────────────────────────────────
describe('getSSFRA', () => {
  it('returns 65 for born 1937 or earlier', () => {
    expect(getSSFRA(1930)).toBe(65)
    expect(getSSFRA(1937)).toBe(65)
  })

  it('returns 66 for birth years 1943–1954', () => {
    expect(getSSFRA(1943)).toBe(66)
    expect(getSSFRA(1954)).toBe(66)
  })

  it('returns 67 for born 1960 or later', () => {
    expect(getSSFRA(1960)).toBe(67)
    expect(getSSFRA(1975)).toBe(67)
  })

  it('returns 67 as default when no birthYear given', () => {
    expect(getSSFRA(null)).toBe(67)
  })
})

// ── FERS COLA Cap ─────────────────────────────────────────────────────────────
describe('applyFersCola', () => {
  it('applies full COLA when CPI ≤ 2%', () => {
    // $1,000 annuity at 1.5% CPI → $1,015
    expect(applyFersCola(1000, 0.015)).toBeCloseTo(1015, 2)
    expect(applyFersCola(1000, 0.02)).toBeCloseTo(1020, 2)
  })

  it('caps at 2% when CPI is between 2% and 3%', () => {
    // CPI = 2.5% → FERS gets exactly 2%
    expect(applyFersCola(1000, 0.025)).toBeCloseTo(1020, 2)
    expect(applyFersCola(1000, 0.03)).toBeCloseTo(1020, 2)
  })

  it('applies CPI − 1% when CPI > 3%', () => {
    // CPI = 4% → FERS gets 3%
    expect(applyFersCola(1000, 0.04)).toBeCloseTo(1030, 2)
    // CPI = 5% → FERS gets 4%
    expect(applyFersCola(1000, 0.05)).toBeCloseTo(1040, 2)
  })
})

// ── Sick Leave Credit ─────────────────────────────────────────────────────────
describe('sickLeaveToServiceYears', () => {
  it('converts months to fractional years', () => {
    expect(sickLeaveToServiceYears(12)).toBe(1)
    expect(sickLeaveToServiceYears(6)).toBe(0.5)
    expect(sickLeaveToServiceYears(0)).toBe(0)
  })

  it('handles null/undefined gracefully', () => {
    expect(sickLeaveToServiceYears(null)).toBe(0)
    expect(sickLeaveToServiceYears(undefined)).toBe(0)
  })
})

// ── SRS Calculation ───────────────────────────────────────────────────────────
describe('computeSRS', () => {
  it('computes SRS correctly: (serviceYrs / 40) × ssAt62', () => {
    // 20 years service, $1,200/mo SS at 62 → (20/40) × $1,200 = $600/mo
    expect(computeSRS(20, 1200)).toBe(600)
    // 30 years service, $1,200/mo → (30/40) × $1,200 = $900/mo
    expect(computeSRS(30, 1200)).toBe(900)
  })

  it('returns 0 when inputs are missing', () => {
    expect(computeSRS(0, 1200)).toBe(0)
    expect(computeSRS(20, 0)).toBe(0)
  })
})

// ── FERS Pension Core ─────────────────────────────────────────────────────────
describe('computeFersPension — standard FERS', () => {
  it('computes basic 1.0% annuity correctly', () => {
    // High-3: $100,000 | Service: 30 yrs | Age: 60 | No survivor benefit
    // Gross = $100,000 × 1.0% × 30 = $30,000/yr = $2,500/mo
    const result = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 30,
      retirementAge: 60,
      survivorBenefitElection: 'none',
      retirementSystem: 'fers',
      birthYear: 1970,
    })
    expect(result.grossAnnuity).toBeCloseTo(30000, 0)
    expect(result.netMonthlyAnnuity).toBeCloseTo(2500, 0)
    expect(result.penaltyRate).toBe(0)
  })

  it('applies 1.1% enhanced multiplier at age 62+ with 20+ years', () => {
    // High-3: $100,000 | Service: 25 yrs | Age: 62
    // Gross = $100,000 × 1.1% × 25 = $27,500/yr = $2,291.67/mo
    const result = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 25,
      retirementAge: 62,
      survivorBenefitElection: 'none',
      retirementSystem: 'fers',
      birthYear: 1963,
    })
    expect(result.grossAnnuity).toBeCloseTo(27500, 0)
    expect(result.netMonthlyAnnuity).toBeCloseTo(2291.67, 0)
  })

  it('does NOT apply 1.1% when under age 62', () => {
    const result = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 25,
      retirementAge: 60,
      survivorBenefitElection: 'none',
      retirementSystem: 'fers',
      birthYear: 1965,
    })
    // 1.0% multiplier: 100,000 × 0.01 × 25 = $25,000/yr
    expect(result.grossAnnuity).toBeCloseTo(25000, 0)
  })

  it('does NOT apply 1.1% at 62+ with fewer than 20 years', () => {
    const result = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 15,
      retirementAge: 62,
      survivorBenefitElection: 'none',
      retirementSystem: 'fers',
      birthYear: 1963,
    })
    // 1.0% still used: $100,000 × 0.01 × 15 = $15,000
    expect(result.grossAnnuity).toBeCloseTo(15000, 0)
  })

  it('applies full survivor benefit 10% reduction', () => {
    // Gross = $30,000/yr → after 10% reduction = $27,000/yr = $2,250/mo
    const result = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 30,
      retirementAge: 60,
      survivorBenefitElection: 'full',
      retirementSystem: 'fers',
      birthYear: 1970,
    })
    expect(result.netAnnualAnnuity).toBeCloseTo(27000, 0)
    expect(result.netMonthlyAnnuity).toBeCloseTo(2250, 0)
  })

  it('applies partial survivor benefit 5% reduction', () => {
    // Gross = $30,000 → after 5% = $28,500
    const result = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 30,
      retirementAge: 60,
      survivorBenefitElection: 'partial',
      retirementSystem: 'fers',
      birthYear: 1970,
    })
    expect(result.netAnnualAnnuity).toBeCloseTo(28500, 0)
  })
})

describe('computeFersPension — early retirement penalty', () => {
  it('applies 5%/yr penalty for MRA+10 under age 62', () => {
    // Born 1970 → MRA = 57. Retire at 57 with 12 years (MRA+10 eligible).
    // 5 years under 62 → 25% penalty
    // Gross = $100,000 × 1.0% × 12 = $12,000
    // After penalty: $12,000 × (1 − 0.25) = $9,000
    const result = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 12,
      retirementAge: 57,
      survivorBenefitElection: 'none',
      retirementSystem: 'fers',
      birthYear: 1970,
    })
    expect(result.penaltyRate).toBeCloseTo(0.25, 5)
    expect(result.annuityAfterPenalty).toBeCloseTo(9000, 0)
  })

  it('waives penalty when service ≥ 30 years at MRA', () => {
    const result = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 30,
      retirementAge: 57,
      survivorBenefitElection: 'none',
      retirementSystem: 'fers',
      birthYear: 1970,
    })
    expect(result.penaltyRate).toBe(0)
    expect(result.isEarlyRetirement).toBe(false)
  })

  it('waives penalty when age ≥ 60 with 20+ years', () => {
    const result = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 22,
      retirementAge: 60,
      survivorBenefitElection: 'none',
      retirementSystem: 'fers',
      birthYear: 1965,
    })
    expect(result.penaltyRate).toBe(0)
  })
})

describe('computeFersPension — military buyback and sick leave', () => {
  it('adds military buyback years to totalService', () => {
    const withoutMilitary = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 25,
      militaryBuybackYears: 0,
      retirementAge: 60,
      survivorBenefitElection: 'none',
      birthYear: 1970,
    })
    const withMilitary = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 25,
      militaryBuybackYears: 4,
      retirementAge: 60,
      survivorBenefitElection: 'none',
      birthYear: 1970,
    })
    // Military adds 4 years → 4% more annuity
    expect(withMilitary.grossAnnuity - withoutMilitary.grossAnnuity).toBeCloseTo(4000, 0)
    expect(withMilitary.totalService).toBeCloseTo(29, 0)
  })

  it('adds sick leave credit to totalService', () => {
    const result = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 20,
      unusedSickLeaveMonths: 12, // 1 additional year
      retirementAge: 60,
      survivorBenefitElection: 'none',
      birthYear: 1970,
    })
    expect(result.totalService).toBeCloseTo(21, 1)
    // Gross = $100,000 × 1.0% × 21 = $21,000
    expect(result.grossAnnuity).toBeCloseTo(21000, 0)
  })
})

describe('computeFersPension — SRS bridge payment', () => {
  it('includes SRS when retiring between MRA and age 62', () => {
    // Born 1970 → MRA = 57. Retire at 58 (between MRA and 62).
    const result = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 30,
      retirementAge: 58,
      survivorBenefitElection: 'none',
      retirementSystem: 'fers',
      birthYear: 1970,
      projectedSSAt62Monthly: 1200,
    })
    expect(result.hasSRS).toBe(true)
    // SRS = (30/40) × $1,200 = $900/mo
    expect(result.srsMonthly).toBe(900)
  })

  it('does not include SRS at age 62 or later', () => {
    const result = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 30,
      retirementAge: 62,
      survivorBenefitElection: 'none',
      retirementSystem: 'fers',
      birthYear: 1963,
      projectedSSAt62Monthly: 1200,
    })
    expect(result.hasSRS).toBe(false)
    expect(result.srsMonthly).toBe(0)
  })
})

describe('computeFersPension — CSRS', () => {
  it('uses CSRS tiered formula (1.5% / 1.75% / 2.0%)', () => {
    // High-3: $80,000 | Service: 30 years
    // First 5 yrs:  5 × 1.5% = 7.5%
    // Next 5 yrs:   5 × 1.75% = 8.75%
    // Remaining 20: 20 × 2.0% = 40%
    // Total: 56.25% → Gross = $80,000 × 0.5625 = $45,000
    const result = computeFersPension({
      high3Salary: 80000,
      credibleServiceYears: 30,
      retirementAge: 55,
      survivorBenefitElection: 'none',
      retirementSystem: 'csrs',
      birthYear: 1945,
    })
    expect(result.grossAnnuity).toBeCloseTo(45000, 0)
    expect(result.netMonthlyAnnuity).toBeCloseTo(3750, 0)
  })

  it('caps CSRS at 80% of High-3', () => {
    // 42 years service:
    // 5 × 1.5% + 5 × 1.75% + 32 × 2.0% = 7.5% + 8.75% + 64% = 80.25% → capped at 80%
    const result = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 42,
      retirementAge: 62,
      survivorBenefitElection: 'none',
      retirementSystem: 'csrs',
      birthYear: 1940,
    })
    // 80% cap applied
    expect(result.grossAnnuity).toBeCloseTo(80000, 0)
  })

  it('does not apply early retirement penalty for CSRS', () => {
    const result = computeFersPension({
      high3Salary: 80000,
      credibleServiceYears: 30,
      retirementAge: 55,
      survivorBenefitElection: 'none',
      retirementSystem: 'csrs',
      birthYear: 1945,
    })
    expect(result.penaltyRate).toBe(0)
    expect(result.isEarlyRetirement).toBe(false)
  })
})

describe('computeFersPension — edge cases', () => {
  it('returns zero result when High-3 is 0', () => {
    const result = computeFersPension({ high3Salary: 0, credibleServiceYears: 20 })
    expect(result.netMonthlyAnnuity).toBe(0)
    expect(result.grossAnnuity).toBe(0)
  })

  it('returns zero result when service years are 0', () => {
    const result = computeFersPension({ high3Salary: 100000, credibleServiceYears: 0 })
    expect(result.netMonthlyAnnuity).toBe(0)
  })

  it('monthlyAnnuity and netMonthlyAnnuity are the same value', () => {
    const result = computeFersPension({
      high3Salary: 100000,
      credibleServiceYears: 20,
      retirementAge: 60,
      survivorBenefitElection: 'none',
      birthYear: 1970,
    })
    expect(result.monthlyAnnuity).toBe(result.netMonthlyAnnuity)
  })
})

// ── Auto High-3 ───────────────────────────────────────────────────────────────
describe('computeAutoHigh3', () => {
  it('returns current salary when retiring immediately', () => {
    expect(computeAutoHigh3(100000, 0.01, 55, 55, null)).toBe(100000)
  })

  it('projects salary growth and averages last 3 years', () => {
    // Salary $100k, 1% growth, 5 years to retirement
    // Year 5: $105,101 | Year 4: $104,060 | Year 3: $103,030
    // Average ≈ $104,064
    const result = computeAutoHigh3(100000, 0.01, 60, 55, null)
    expect(result).toBeGreaterThan(100000)
    expect(result).toBeLessThan(110000)
  })

  it('freezes salary growth at freeze age', () => {
    const frozen = computeAutoHigh3(100000, 0.10, 60, 50, 52)
    const notFrozen = computeAutoHigh3(100000, 0.10, 60, 50, null)
    // Frozen result should be much lower (only 2 years of growth before freeze)
    expect(frozen).toBeLessThan(notFrozen)
  })

  it('returns 0 for zero salary', () => {
    expect(computeAutoHigh3(0, 0.01, 60, 55)).toBe(0)
  })
})
