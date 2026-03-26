/**
 * taxCalculations.test.js
 *
 * Verifies federal tax brackets, SS taxable portion tiers, Roth conversion
 * math, and full retirement tax estimates.
 */

import { describe, it, expect } from 'vitest'
import {
  computeFederalTax,
  getStandardDeduction,
  computeSSITaxablePortion,
  computeRothConversion,
  computeRetirementTax,
} from '../utils/taxCalculations.js'

// ── Federal Brackets (2024 MFJ) ───────────────────────────────────────────────
// 10%: $0–$23,200 | 12%: $23,200–$94,300 | 22%: $94,300–$201,050
describe('computeFederalTax — MFJ', () => {
  it('returns zero for zero income', () => {
    const { tax, effectiveRate } = computeFederalTax(0, 'mfj')
    expect(tax).toBe(0)
    expect(effectiveRate).toBe(0)
  })

  it('taxes income within 10% bracket correctly', () => {
    // $10,000 × 10% = $1,000
    const { tax, marginalRate } = computeFederalTax(10000, 'mfj')
    expect(tax).toBeCloseTo(1000, 0)
    expect(marginalRate).toBe(0.10)
  })

  it('taxes income spanning 10% and 12% brackets correctly', () => {
    // $23,200 × 10% = $2,320
    // ($50,000 − $23,200) × 12% = $26,800 × 12% = $3,216
    // Total = $5,536
    const { tax, marginalRate } = computeFederalTax(50000, 'mfj')
    expect(tax).toBeCloseTo(5536, 0)
    expect(marginalRate).toBe(0.12)
  })

  it('taxes income spanning 3 brackets correctly', () => {
    // $23,200 × 10% = $2,320
    // ($94,300 − $23,200) × 12% = $71,100 × 12% = $8,532
    // ($150,000 − $94,300) × 22% = $55,700 × 22% = $12,254
    // Total = $23,106
    const { tax, marginalRate } = computeFederalTax(150000, 'mfj')
    expect(tax).toBeCloseTo(23106, 0)
    expect(marginalRate).toBe(0.22)
  })

  it('effective rate is always less than marginal rate', () => {
    const { tax, effectiveRate, marginalRate } = computeFederalTax(200000, 'mfj')
    expect(effectiveRate).toBeLessThan(marginalRate)
    expect(effectiveRate).toBe(tax / 200000)
  })
})

describe('computeFederalTax — Single', () => {
  it('taxes $40,000 single income correctly', () => {
    // $11,600 × 10% = $1,160
    // ($40,000 − $11,600) × 12% = $28,400 × 12% = $3,408
    // Total = $4,568
    const { tax, marginalRate } = computeFederalTax(40000, 'single')
    expect(tax).toBeCloseTo(4568, 0)
    expect(marginalRate).toBe(0.12)
  })
})

// ── Standard Deduction ────────────────────────────────────────────────────────
describe('getStandardDeduction', () => {
  it('returns base MFJ deduction for under 65', () => {
    expect(getStandardDeduction('mfj', 55)).toBe(29200)
  })

  it('returns base single deduction for under 65', () => {
    expect(getStandardDeduction('single', 55)).toBe(14600)
  })

  it('adds age 65+ bonus for MFJ', () => {
    // Base $29,200 + $3,100 = $32,300
    expect(getStandardDeduction('mfj', 65)).toBe(32300)
    expect(getStandardDeduction('mfj', 70)).toBe(32300)
  })

  it('adds age 65+ bonus for single', () => {
    // Base $14,600 + $1,950 = $16,550
    expect(getStandardDeduction('single', 65)).toBe(16550)
  })
})

// ── Social Security Taxable Portion ───────────────────────────────────────────
// MFJ thresholds: $32,000 (50%) and $44,000 (85%)
// combined income = otherIncome + (SS × 0.5)
describe('computeSSITaxablePortion — MFJ', () => {
  it('returns 0% taxable when combined income below $32,000', () => {
    // SS = $1,000/mo = $12,000/yr | otherIncome = $10,000
    // combined = $10,000 + $6,000 = $16,000 < $32,000 → 0% taxable
    const { taxableSS, taxableRate } = computeSSITaxablePortion(12000, 10000, 'mfj')
    expect(taxableSS).toBe(0)
    expect(taxableRate).toBe(0)
  })

  it('taxes up to 50% when combined income between thresholds', () => {
    // SS = $12,000/yr | otherIncome = $30,000
    // combined = $30,000 + $6,000 = $36,000 (between $32K and $44K)
    // 50% tier applies
    const { taxableRate } = computeSSITaxablePortion(12000, 30000, 'mfj')
    expect(taxableRate).toBe(0.50)
  })

  it('taxes up to 85% when combined income exceeds $44,000', () => {
    // SS = $24,000/yr | otherIncome = $60,000
    // combined = $60,000 + $12,000 = $72,000 > $44,000 → 85% tier
    const { taxableRate } = computeSSITaxablePortion(24000, 60000, 'mfj')
    expect(taxableRate).toBe(0.85)
    // Max taxable SS = 85% × $24,000 = $20,400
    const { taxableSS } = computeSSITaxablePortion(24000, 60000, 'mfj')
    expect(taxableSS).toBeLessThanOrEqual(24000 * 0.85 + 1)
  })

  it('returns 0 when SS benefit is 0', () => {
    const { taxableSS } = computeSSITaxablePortion(0, 50000, 'mfj')
    expect(taxableSS).toBe(0)
  })
})

// ── Roth Conversion ───────────────────────────────────────────────────────────
describe('computeRothConversion', () => {
  it('returns all zeros when strategy is none', () => {
    const result = computeRothConversion({ strategy: 'none' })
    expect(result.annualConversionAmount).toBe(0)
    expect(result.annualTaxCost).toBe(0)
    expect(result.netLifetimeBenefit).toBe(0)
  })

  it('computes conversion window correctly', () => {
    // start=60, end=72 → 12 years
    const result = computeRothConversion({
      strategy: 'fill_12',
      ordinaryIncomeInConversionYears: 30000,
      traditionalBalance: 500000,
      startAge: 60,
      endAge: 72,
      filingStatus: 'mfj',
    })
    expect(result.yearsOfConversion).toBe(12)
    expect(result.annualConversionAmount).toBeGreaterThan(0)
    expect(result.marginalRate).toBe(0.12)
  })

  it('uses 22% marginal rate for fill_22 strategy', () => {
    const result = computeRothConversion({
      strategy: 'fill_22',
      ordinaryIncomeInConversionYears: 30000,
      traditionalBalance: 500000,
      startAge: 60,
      endAge: 72,
      filingStatus: 'mfj',
    })
    expect(result.marginalRate).toBe(0.22)
    expect(result.annualConversionAmount).toBeGreaterThan(0)
  })

  it('uses custom amount for custom strategy', () => {
    const result = computeRothConversion({
      strategy: 'custom',
      customAmount: 20000,
      ordinaryIncomeInConversionYears: 30000,
      traditionalBalance: 500000,
      startAge: 60,
      endAge: 72,
      filingStatus: 'mfj',
    })
    expect(result.annualConversionAmount).toBe(20000)
    expect(result.totalConverted).toBe(20000 * 12)
  })

  it('tax cost equals conversion amount × marginal rate', () => {
    const result = computeRothConversion({
      strategy: 'custom',
      customAmount: 15000,
      ordinaryIncomeInConversionYears: 20000,
      traditionalBalance: 200000,
      startAge: 60,
      endAge: 70,
      filingStatus: 'single',
    })
    expect(result.annualTaxCost).toBe(Math.round(result.annualConversionAmount * result.marginalRate))
  })
})

// ── Full Retirement Tax Estimate ──────────────────────────────────────────────
describe('computeRetirementTax', () => {
  it('computes a reasonable effective rate for a typical federal retiree', () => {
    // FERS pension $30,000/yr + TSP withdrawal $20,000 + SS $18,000
    // MFJ, FL (no state income tax), age 65
    const result = computeRetirementTax({
      annualPension: 30000,
      annualTSPWithdrawal: 20000,
      annualSSBenefit: 18000,
      filingStatus: 'mfj',
      stateCode: 'FL',
      retirementAge: 65,
    })
    expect(result.federalTax).toBeGreaterThan(0)
    // Effective rate on total income should be under 20%
    expect(result.overallEffectiveRate).toBeLessThan(0.20)
    expect(result.afterTaxIncome).toBeGreaterThan(0)
    // After-tax income should be less than total income
    const total = 30000 + 20000 + 18000
    expect(result.afterTaxIncome).toBeLessThan(total)
  })

  it('VA benefit does not increase taxable income', () => {
    const withoutVA = computeRetirementTax({
      annualPension: 30000,
      annualTSPWithdrawal: 10000,
      filingStatus: 'mfj',
      stateCode: 'VA',
      retirementAge: 65,
    })
    const withVA = computeRetirementTax({
      annualPension: 30000,
      annualTSPWithdrawal: 10000,
      annualVABenefit: 20000,
      filingStatus: 'mfj',
      stateCode: 'VA',
      retirementAge: 65,
    })
    // VA benefit is tax-free — federal tax should not change
    expect(withVA.federalTax).toBe(withoutVA.federalTax)
    // But after-tax income should include VA benefit
    expect(withVA.afterTaxIncome).toBeGreaterThan(withoutVA.afterTaxIncome)
  })

  it('Roth withdrawal does not increase taxable income', () => {
    const withoutRoth = computeRetirementTax({
      annualPension: 30000,
      filingStatus: 'single',
      stateCode: '',
      retirementAge: 65,
    })
    const withRoth = computeRetirementTax({
      annualPension: 30000,
      annualRothWithdrawal: 10000,
      filingStatus: 'single',
      stateCode: '',
      retirementAge: 65,
    })
    expect(withRoth.federalTax).toBe(withoutRoth.federalTax)
  })

  it('returns zero tax for zero income', () => {
    const result = computeRetirementTax({})
    expect(result.federalTax).toBe(0)
    expect(result.totalTax).toBe(0)
  })

  it('totalTax equals federalTax + stateTax', () => {
    const result = computeRetirementTax({
      annualPension: 40000,
      annualTSPWithdrawal: 20000,
      filingStatus: 'mfj',
      stateCode: 'CA',
      retirementAge: 65,
    })
    expect(result.totalTax).toBeCloseTo(result.federalTax + result.stateTax, 0)
  })
})
