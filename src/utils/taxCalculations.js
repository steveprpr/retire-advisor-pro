// Tax calculation utilities
// Estimates only — for educational planning purposes.
// Always consult a licensed tax professional.

import { DEFAULT_ASSUMPTIONS } from '../config/defaults.js'
import { STATE_TAX_DATA } from '../data/stateTaxData.js'

// ── Federal Income Tax (bracket method) ───────────────────────────────────────
export function computeFederalTax(taxableIncome, filingStatus = 'mfj') {
  if (!taxableIncome || taxableIncome <= 0) return { tax: 0, effectiveRate: 0, marginalRate: 0 }

  const brackets = filingStatus === 'mfj'
    ? DEFAULT_ASSUMPTIONS.federalBrackets2024MFJ
    : DEFAULT_ASSUMPTIONS.federalBrackets2024Single

  let tax = 0
  let prev = 0
  let marginalRate = 0

  for (const bracket of brackets) {
    const taxable = Math.min(taxableIncome, bracket.upTo) - prev
    if (taxable <= 0) break
    tax += taxable * bracket.rate
    marginalRate = bracket.rate
    prev = bracket.upTo
    if (taxableIncome <= bracket.upTo) break
  }

  return {
    tax,
    effectiveRate: taxableIncome > 0 ? tax / taxableIncome : 0,
    marginalRate,
  }
}

// ── Standard Deduction ─────────────────────────────────────────────────────────
export function getStandardDeduction(filingStatus = 'mfj', age = 65) {
  const base = filingStatus === 'mfj'
    ? DEFAULT_ASSUMPTIONS.standardDeductionMFJ2024
    : DEFAULT_ASSUMPTIONS.standardDeductionSingle2024
  // Additional deduction for age 65+
  const ageAddition = age >= 65 ? (filingStatus === 'mfj' ? 3100 : 1950) : 0
  return base + ageAddition
}

// ── Social Security Taxable Portion ───────────────────────────────────────────
export function computeSSITaxablePortion(ssBenefit, otherIncome, filingStatus = 'mfj') {
  if (!ssBenefit || ssBenefit <= 0) return { taxableSS: 0, taxableRate: 0 }

  const halfSS = ssBenefit * 0.5
  const combinedIncome = otherIncome + halfSS

  const threshold50 = filingStatus === 'mfj'
    ? DEFAULT_ASSUMPTIONS.ssTaxable50PctThresholdMFJ
    : DEFAULT_ASSUMPTIONS.ssTaxable50PctThresholdSingle
  const threshold85 = filingStatus === 'mfj'
    ? DEFAULT_ASSUMPTIONS.ssTaxable85PctThresholdMFJ
    : DEFAULT_ASSUMPTIONS.ssTaxable85PctThresholdSingle

  let taxableSS = 0
  let taxableRate = 0

  if (combinedIncome <= threshold50) {
    taxableSS = 0
    taxableRate = 0
  } else if (combinedIncome <= threshold85) {
    taxableSS = Math.min(0.50 * ssBenefit, 0.50 * (combinedIncome - threshold50))
    taxableRate = 0.50
  } else {
    taxableSS = Math.min(
      0.85 * ssBenefit,
      0.85 * (combinedIncome - threshold85) + 0.50 * Math.min(threshold85 - threshold50, combinedIncome - threshold50)
    )
    taxableRate = 0.85
  }

  return { taxableSS, taxableRate }
}

// ── Roth Conversion Analysis ───────────────────────────────────────────────────
// Models the tax cost and long-term benefit of converting pre-tax funds to Roth.
export function computeRothConversion({
  strategy = 'none',
  ordinaryIncomeInConversionYears = 0, // pension + SRS + part-time (pre-SS income)
  traditionalBalance = 0,              // TSP traditional + traditional IRA combined
  customAmount = 0,
  startAge = 60,
  endAge = 72,
  returnRate = 0.07,
  filingStatus = 'mfj',
  retirementAge = 60,
  lifeExpectancy = 90,
} = {}) {
  if (strategy === 'none') {
    return { strategy: 'none', annualConversionAmount: 0, annualTaxCost: 0, yearsOfConversion: 0, totalTaxPaid: 0, totalConverted: 0, rothBalanceAdded: 0, breakEvenAge: null, netLifetimeBenefit: 0, marginalRate: 0 }
  }

  const stdDeduction = filingStatus === 'mfj'
    ? DEFAULT_ASSUMPTIONS.standardDeductionMFJ2024
    : DEFAULT_ASSUMPTIONS.standardDeductionSingle2024

  // Top of 12% and 22% brackets (taxable income, after std deduction)
  const top12 = filingStatus === 'mfj' ? 94300 : 47150
  const top22 = filingStatus === 'mfj' ? 201050 : 100525
  const brackets = filingStatus === 'mfj'
    ? DEFAULT_ASSUMPTIONS.federalBrackets2024MFJ
    : DEFAULT_ASSUMPTIONS.federalBrackets2024Single

  // Ordinary income already using up bracket room (after standard deduction)
  const taxableOrdinaryIncome = Math.max(0, ordinaryIncomeInConversionYears - stdDeduction)

  const effectiveStartAge = Math.max(startAge, retirementAge)
  const yearsOfConversion = Math.max(0, endAge - effectiveStartAge)

  let annualConversionAmount = 0
  let marginalRate = 0.22

  if (strategy === 'custom') {
    annualConversionAmount = customAmount
    const totalTaxableIncome = taxableOrdinaryIncome + customAmount
    for (const b of brackets) {
      if (totalTaxableIncome <= b.upTo) { marginalRate = b.rate; break }
      marginalRate = b.rate
    }
  } else {
    const targetTop = strategy === 'fill_12' ? top12 : top22
    const room = Math.max(0, targetTop - taxableOrdinaryIncome)
    // Don't convert more than the balance allows over the conversion window
    const maxByBalance = yearsOfConversion > 0 ? traditionalBalance / yearsOfConversion : room
    annualConversionAmount = Math.min(room, maxByBalance)
    marginalRate = strategy === 'fill_12' ? 0.12 : 0.22
  }

  if (yearsOfConversion <= 0 || annualConversionAmount <= 0) {
    return { strategy, annualConversionAmount: 0, annualTaxCost: 0, yearsOfConversion: 0, totalTaxPaid: 0, totalConverted: 0, rothBalanceAdded: 0, breakEvenAge: null, netLifetimeBenefit: 0, marginalRate }
  }

  const annualTaxCost = Math.round(annualConversionAmount * marginalRate)
  const totalConverted = Math.round(annualConversionAmount * yearsOfConversion)
  const totalTaxPaid = Math.round(annualTaxCost * yearsOfConversion)

  // Roth grows tax-free from mid-conversion to life expectancy
  const avgConversionAge = effectiveStartAge + yearsOfConversion / 2
  const yearsToGrow = Math.max(0, lifeExpectancy - avgConversionAge)
  const rothBalanceAdded = Math.round(totalConverted * Math.pow(1 + returnRate, yearsToGrow))

  // Net benefit: tax saved on future growth vs. tax paid today
  const growthOnConverted = rothBalanceAdded - totalConverted
  const futureTaxSavedOnGrowth = Math.round(growthOnConverted * marginalRate)
  const netLifetimeBenefit = futureTaxSavedOnGrowth - totalTaxPaid

  // Break-even: years after conversion end when cumulative tax-free growth offsets upfront tax
  // annualConversionAmount * (1+r)^n * marginalRate >= annualTaxCost  →  n = log(1+1/returnRate * marginalRate) / log(1+r)
  const breakEvenYears = returnRate > 0 ? Math.log(1 + marginalRate / returnRate) / Math.log(1 + returnRate) : null
  const breakEvenAge = breakEvenYears != null ? Math.round(endAge + breakEvenYears) : null

  return {
    strategy,
    annualConversionAmount: Math.round(annualConversionAmount),
    annualTaxCost,
    yearsOfConversion,
    totalConverted,
    totalTaxPaid,
    rothBalanceAdded,
    breakEvenAge,
    netLifetimeBenefit,
    marginalRate,
  }
}

// ── State Income Tax ───────────────────────────────────────────────────────────
export function computeStateTax(taxableIncome, stateCode, isPension = false) {
  if (!stateCode) return { tax: 0, effectiveRate: 0 }
  const stateData = STATE_TAX_DATA[stateCode]
  if (!stateData) return { tax: 0, effectiveRate: 0 }

  // Pension exemption
  if (isPension && stateData.pensionExempt) {
    return { tax: 0, effectiveRate: 0, note: stateData.pensionExemptNote }
  }

  const rate = stateData.incomeTaxRate
  const tax = taxableIncome * rate
  return { tax, effectiveRate: rate }
}

// ── Full Retirement Tax Estimate ───────────────────────────────────────────────
export function computeRetirementTax({
  annualPension = 0,
  annualTSPWithdrawal = 0,       // Traditional (pre-tax)
  annualRothWithdrawal = 0,      // Tax-free
  annualSSBenefit = 0,
  annualVABenefit = 0,           // Always tax-free
  otherIncome = 0,
  filingStatus = 'mfj',
  stateCode = '',
  retirementAge = 65,
  // FERS annuity is ~95% taxable (simplified — employee contribution exclusion)
  fersTaxablePct = DEFAULT_ASSUMPTIONS.fersAnnuityTaxablePct,
} = {}) {

  // Compute AGI (excludes Roth and VA)
  const taxablePension = annualPension * fersTaxablePct
  const taxableTSP = annualTSPWithdrawal
  // Roth and VA are excluded from AGI
  const agi_before_ss = taxablePension + taxableTSP + otherIncome

  // SS taxable portion
  const { taxableSS } = computeSSITaxablePortion(annualSSBenefit, agi_before_ss, filingStatus)
  const totalAGI = agi_before_ss + taxableSS

  // Apply standard deduction
  const standardDeduction = getStandardDeduction(filingStatus, retirementAge)
  const federalTaxableIncome = Math.max(0, totalAGI - standardDeduction)

  // Federal tax
  const { tax: federalTax, effectiveRate: federalEffectiveRate, marginalRate } = computeFederalTax(federalTaxableIncome, filingStatus)

  // State tax (simplified — apply to AGI minus pension exemption)
  const stateData = STATE_TAX_DATA[stateCode]
  const pensionExempt = stateData?.pensionExempt || false
  const stateTaxableIncome = pensionExempt
    ? totalAGI - taxablePension  // pension exempt
    : totalAGI
  const { tax: stateTax, effectiveRate: stateEffectiveRate } = computeStateTax(
    Math.max(0, stateTaxableIncome - standardDeduction * 0.5),  // simplified state deduction
    stateCode,
    false
  )

  const totalTax = federalTax + stateTax
  const totalIncome = annualPension + annualTSPWithdrawal + annualRothWithdrawal + annualSSBenefit + annualVABenefit + otherIncome
  const overallEffectiveRate = totalIncome > 0 ? totalTax / totalIncome : 0
  const afterTaxIncome = totalIncome - totalTax

  return {
    totalAGI,
    federalTaxableIncome,
    federalTax,
    federalEffectiveRate,
    stateTax,
    stateEffectiveRate,
    totalTax,
    overallEffectiveRate,
    marginalRate,
    afterTaxIncome,
    taxableSS,
    ssEffectiveRate: annualSSBenefit > 0 ? taxableSS / annualSSBenefit : 0,
  }
}
