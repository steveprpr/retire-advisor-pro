// Federal civilian (FERS/CSRS) retirement calculations
// Source: OPM — https://www.opm.gov/retirement-services/

import { DEFAULT_ASSUMPTIONS } from '../config/defaults.js'

// ── MRA Calculator (exact per OPM statute) ────────────────────────────────────
// Returns MRA as decimal years (e.g. 55.167 = 55y 2mo)
export function getMRA(birthYear) {
  if (!birthYear) return 57
  const year = parseInt(birthYear)
  if (year <= 1947) return 55
  if (year === 1948) return 55 + 2 / 12   // 55y 2mo
  if (year === 1949) return 55 + 4 / 12   // 55y 4mo
  if (year === 1950) return 55 + 6 / 12   // 55y 6mo
  if (year === 1951) return 55 + 8 / 12   // 55y 8mo
  if (year === 1952) return 55 + 10 / 12  // 55y 10mo
  if (year >= 1953 && year <= 1964) return 56
  if (year === 1965) return 56 + 2 / 12
  if (year === 1966) return 56 + 4 / 12
  if (year === 1967) return 56 + 6 / 12
  if (year === 1968) return 56 + 8 / 12
  if (year === 1969) return 56 + 10 / 12
  return 57  // born 1970+
}

// Returns MRA as readable string e.g. "56" or "56y 2mo"
export function getMRADisplay(birthYear) {
  const mra = getMRA(birthYear)
  const years = Math.floor(mra)
  const months = Math.round((mra - years) * 12)
  if (months === 0) return `${years}`
  return `${years}y ${months}mo`
}

// ── SS Full Retirement Age ─────────────────────────────────────────────────────
export function getSSFRA(birthYear) {
  if (!birthYear) return 67
  const year = parseInt(birthYear)
  if (year <= 1937) return 65
  if (year === 1938) return 65 + 2 / 12
  if (year === 1939) return 65 + 4 / 12
  if (year === 1940) return 65 + 6 / 12
  if (year === 1941) return 65 + 8 / 12
  if (year === 1942) return 65 + 10 / 12
  if (year >= 1943 && year <= 1954) return 66
  if (year === 1955) return 66 + 2 / 12
  if (year === 1956) return 66 + 4 / 12
  if (year === 1957) return 66 + 6 / 12
  if (year === 1958) return 66 + 8 / 12
  if (year === 1959) return 66 + 10 / 12
  return 67  // 1960+
}

// ── FERS COLA Cap Rule ─────────────────────────────────────────────────────────
// FERS: CPI≤2%→full, 2%<CPI≤3%→2%, CPI>3%→CPI−1%
// NOTE: FERS COLA does NOT begin until age 62.
export function applyFersCola(annuity, cpiRate) {
  if (cpiRate <= 0.02) return annuity * (1 + cpiRate)
  if (cpiRate <= 0.03) return annuity * 1.02
  return annuity * (1 + cpiRate - 0.01)
}

// ── High-3 Auto-Calculation ────────────────────────────────────────────────────
// Average of the 3 highest consecutive years of basic pay before retirement.
// For most career employees this is the last 3 years.
export function computeAutoHigh3(currentSalary, growthRate, targetRetirementAge, currentAge, freezeAge) {
  if (!currentSalary || currentSalary <= 0) return 0
  const rate = growthRate || 0.01
  const age = currentAge || 55
  const retAge = targetRetirementAge || 60
  const yearsToRetirement = Math.max(0, retAge - age)
  if (yearsToRetirement === 0) return currentSalary

  const yearsToFreeze = freezeAge
    ? Math.max(0, Math.min(yearsToRetirement, freezeAge - age))
    : yearsToRetirement

  const getSalaryAtYear = (y) => {
    const effectiveY = Math.min(y, yearsToFreeze)
    return currentSalary * Math.pow(1 + rate, effectiveY)
  }

  const n = yearsToRetirement
  if (n >= 3) {
    return (getSalaryAtYear(n - 1) + getSalaryAtYear(n - 2) + getSalaryAtYear(n - 3)) / 3
  }
  if (n === 2) return (getSalaryAtYear(1) + getSalaryAtYear(0)) / 2
  return getSalaryAtYear(0)
}

// ── Service Years at Retirement (from SCD) ────────────────────────────────────
// scdMonth and scdDay are optional (1-based). When provided, calculation is
// precise to the day; otherwise falls back to whole-year arithmetic.
export function computeServiceYearsAtRetirement(scdYear, targetRetirementAge, birthYear, scdMonth, scdDay) {
  if (!scdYear || !birthYear) return null
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentAge = currentYear - parseInt(birthYear)
  const yearsToRetirement = Math.max(0, (targetRetirementAge || 60) - currentAge)
  const retirementYear = currentYear + yearsToRetirement

  if (scdMonth && scdDay) {
    // Precise: retirement is assumed to occur on the birthday month of retirementYear
    const birthMonth = today.getMonth() + 1  // approximate; refine if birthMonth available
    const retirementDate = new Date(retirementYear, birthMonth - 1, 1)
    const scdDate = new Date(parseInt(scdYear), parseInt(scdMonth) - 1, parseInt(scdDay))
    const msPerYear = 1000 * 60 * 60 * 24 * 365.25
    return Math.max(0, (retirementDate - scdDate) / msPerYear)
  }

  return Math.max(0, retirementYear - parseInt(scdYear))
}

// ── SS PIA Estimation — AIME Bend Point Formula (2024) ────────────────────────
// Estimates FRA monthly benefit (PIA) from career salary history.
// Use this when user hasn't provided an SSA statement.
export function estimateSSPIA({
  currentSalary = 0,
  currentAge = 55,
  careerStartAge = 22,
  claimingAge = 67,
  salaryGrowthRate = 0.01,
  wepApplies = false,
  ssWorkHistory30plus = false,
} = {}) {
  if (!currentSalary || currentSalary <= 0) return 0

  const rate = Math.max(0, salaryGrowthRate || 0.01)
  const earnings = []

  // Past earnings — back-calculate using reverse salary growth
  const yearsWorked = Math.max(0, currentAge - careerStartAge)
  for (let y = 0; y < yearsWorked; y++) {
    const yearsAgo = yearsWorked - y
    earnings.push(currentSalary / Math.pow(1 + rate, yearsAgo))
  }

  // Future earnings — project forward to claiming age
  const yearsUntilClaiming = Math.max(0, claimingAge - currentAge)
  for (let y = 1; y <= yearsUntilClaiming; y++) {
    earnings.push(currentSalary * Math.pow(1 + rate, y))
  }

  // Top 35 earning years → AIME
  const sorted = [...earnings].sort((a, b) => b - a)
  const top35 = sorted.slice(0, 35)
  const aime = top35.reduce((sum, e) => sum + e, 0) / 420  // 35 × 12 months

  // 2024 PIA bend points
  const BP1 = 1174
  const BP2 = 7078

  let pia
  if (aime <= BP1) {
    pia = aime * 0.90
  } else if (aime <= BP2) {
    pia = BP1 * 0.90 + (aime - BP1) * 0.32
  } else {
    pia = BP1 * 0.90 + (BP2 - BP1) * 0.32 + (aime - BP2) * 0.15
  }

  // WEP: reduces first-bend 90% factor to 40% (max reduction $587/mo in 2024)
  if (wepApplies && !ssWorkHistory30plus) {
    let wepPIA
    if (aime <= BP1) {
      wepPIA = aime * 0.40
    } else if (aime <= BP2) {
      wepPIA = BP1 * 0.40 + (aime - BP1) * 0.32
    } else {
      wepPIA = BP1 * 0.40 + (BP2 - BP1) * 0.32 + (aime - BP2) * 0.15
    }
    const wepReduction = Math.min(pia - wepPIA, 587)
    pia = Math.max(pia - wepReduction, pia * 0.50)
  }

  return Math.round(pia * 10) / 10  // round to $0.10 per SSA rules
}

// ── FERS Special Retirement Supplement (SRS) ──────────────────────────────────
// Paid from retirement (at MRA+) to age 62. Approximates FERS-covered SS.
// Formula: (fersServiceYears / 40) × projectedSSBenefitAt62
export function computeSRS(fersServiceYears, projectedSSAt62Monthly) {
  if (!fersServiceYears || !projectedSSAt62Monthly) return 0
  return Math.round((fersServiceYears / 40) * projectedSSAt62Monthly)
}

// ── Sick Leave Service Credit ─────────────────────────────────────────────────
export function sickLeaveToServiceYears(sickLeaveMonths) {
  if (!sickLeaveMonths) return 0
  return sickLeaveMonths / 12
}

// ── FERS Annuity Calculator ───────────────────────────────────────────────────
export function computeFersPension({
  high3Salary = 0,
  credibleServiceYears = 0,
  retirementAge = 60,
  militaryBuybackYears = 0,
  unusedSickLeaveMonths = 0,
  partTimeProration = 1.0,
  survivorBenefitElection = 'full',
  retirementSystem = 'fers',
  specialCategory = 'standard',
  birthYear,
  projectedSSAt62Monthly = 0,
} = {}) {
  if (!high3Salary || !credibleServiceYears) return getEmptyFersResult()

  const sickLeaveYears = sickLeaveToServiceYears(unusedSickLeaveMonths)
  const totalService = credibleServiceYears + militaryBuybackYears + sickLeaveYears
  const age = retirementAge || 60
  const mra = getMRA(birthYear || 1965)

  if (retirementSystem === 'csrs' || retirementSystem === 'csrs_offset') {
    return computeCSRSAnnuity(high3Salary, totalService, survivorBenefitElection, mra)
  }

  const survivorReduction = {
    full:    DEFAULT_ASSUMPTIONS.survivorBenefitReductionFull,    // 10%
    partial: DEFAULT_ASSUMPTIONS.survivorBenefitReductionPartial, // 5%
    none:    0,
  }[survivorBenefitElection] ?? 0.10

  let grossAnnuity

  if (specialCategory !== 'standard') {
    // LEO / Firefighter / ATC: 1.7% for first 20 special years, 1.0% beyond
    const specialYears = Math.min(credibleServiceYears, 20)
    const regularYears = Math.max(0, credibleServiceYears - 20) + militaryBuybackYears
    grossAnnuity = (high3Salary * 0.017 * specialYears + high3Salary * 0.010 * regularYears) * partTimeProration
  } else {
    // Standard FERS: 1.0%; 1.1% ONLY when BOTH age ≥62 AND service ≥20
    const multiplier = (age >= 62 && totalService >= 20) ? 0.011 : 0.010
    grossAnnuity = high3Salary * multiplier * totalService * partTimeProration
  }

  // ── Early retirement penalty ────────────────────────────────────────────────
  // Penalty (5%/yr under 62) applies to MRA+10 retirements UNLESS:
  //   (a) age ≥ 62
  //   (b) age ≥ 60 AND service ≥ 20 years
  //   (c) service ≥ 30 years (unreduced at MRA)
  const noPenalty = age >= 62 || (age >= 60 && totalService >= 20) || totalService >= 30
  const isMRAplus10 = age >= mra && totalService >= 10

  let penaltyRate = 0
  let penaltyYears = 0

  if (!noPenalty && isMRAplus10) {
    penaltyYears = Math.max(0, 62 - age)
    penaltyRate = Math.min(penaltyYears * DEFAULT_ASSUMPTIONS.fersEarlyPenaltyRate, 1.0)
  }

  const annuityAfterPenalty = grossAnnuity * (1 - penaltyRate)
  const netAnnualAnnuity = annuityAfterPenalty * (1 - survivorReduction)
  const netMonthlyAnnuity = netAnnualAnnuity / 12

  // ── Special Retirement Supplement (SRS) ────────────────────────────────────
  const hasSRS = age >= mra && age < 62 && retirementSystem.startsWith('fers')
  const srsMonthly = hasSRS ? computeSRS(credibleServiceYears, projectedSSAt62Monthly) : 0
  const srsAnnual = srsMonthly * 12

  // ── Three retirement option comparison ─────────────────────────────────────
  const penaltyNote = penaltyRate > 0
    ? `${(penaltyRate * 100).toFixed(0)}% penalty (${penaltyYears} yr under 62)`
    : totalService >= 30 ? 'No penalty (30+ yrs)'
    : (age >= 60 && totalService >= 20) ? 'No penalty (age 60+ with 20+ yrs)'
    : 'No penalty'

  // Option A: Take now
  const optionA = { annual: netAnnualAnnuity, monthly: netMonthlyAnnuity, srsMonthly, note: penaltyNote }

  // Option B: Postpone to age 60 — no penalty if 20+ years
  const multAt60 = (60 >= 62 && totalService >= 20) ? 0.011 : 0.010
  const grossAt60 = high3Salary * multAt60 * totalService * partTimeProration
  const netAt60 = grossAt60 * (1 - survivorReduction)
  const optionB = {
    annual: netAt60,
    monthly: netAt60 / 12,
    srsMonthly: 0,
    note: totalService >= 20 ? 'No penalty (restart at 60 with 20+ yrs)' : 'Penalty reduced',
  }

  // Option C: Postpone to age 62 — full 1.1% if 20+ years, zero penalty
  const multAt62 = totalService >= 20 ? 0.011 : 0.010
  const grossAt62 = high3Salary * multAt62 * totalService * partTimeProration
  const netAt62 = grossAt62 * (1 - survivorReduction)
  const optionC = {
    annual: netAt62,
    monthly: netAt62 / 12,
    srsMonthly: 0,
    note: totalService >= 20 ? '1.1% multiplier + no penalty (62 with 20+ yrs)' : '1.0% multiplier, no penalty',
  }

  return {
    mra,
    mraDisplay: getMRADisplay(birthYear),
    totalService,
    penaltyYears,
    penaltyRate,
    grossAnnuity,
    annuityAfterPenalty,
    survivorReduction,
    netAnnualAnnuity,
    netMonthlyAnnuity,
    monthlyAnnuity: netMonthlyAnnuity,
    srsMonthly,
    srsAnnual,
    hasSRS,
    isEarlyRetirement: penaltyRate > 0,
    colaNote: 'FERS COLA does not begin until age 62',
    options: { takeNow: optionA, postpone60: optionB, postpone62: optionC },
  }
}

function computeCSRSAnnuity(high3, totalService, survivorBenefitElection, mra) {
  const first5 = Math.min(totalService, 5) * 0.015
  const next5 = Math.min(Math.max(totalService - 5, 0), 5) * 0.0175
  const remaining = Math.max(totalService - 10, 0) * 0.02
  const pct = Math.min(first5 + next5 + remaining, 0.80)
  const grossAnnuity = high3 * pct
  const survivorReduction = survivorBenefitElection === 'full' ? 0.10
    : survivorBenefitElection === 'partial' ? 0.05 : 0
  const netAnnual = grossAnnuity * (1 - survivorReduction)
  return {
    mra: mra || 55,
    mraDisplay: String(mra || 55),
    totalService,
    penaltyYears: 0,
    penaltyRate: 0,
    grossAnnuity,
    annuityAfterPenalty: grossAnnuity,
    survivorReduction,
    netAnnualAnnuity: netAnnual,
    netMonthlyAnnuity: netAnnual / 12,
    monthlyAnnuity: netAnnual / 12,
    srsMonthly: 0,
    srsAnnual: 0,
    hasSRS: false,
    isEarlyRetirement: false,
    colaNote: 'CSRS COLA begins immediately at retirement',
    options: {
      takeNow:    { annual: netAnnual, monthly: netAnnual / 12, srsMonthly: 0, note: 'CSRS' },
      postpone60: { annual: netAnnual, monthly: netAnnual / 12, srsMonthly: 0, note: 'CSRS' },
      postpone62: { annual: netAnnual, monthly: netAnnual / 12, srsMonthly: 0, note: 'CSRS' },
    },
  }
}

function getEmptyFersResult() {
  return {
    mra: 57, mraDisplay: '57', totalService: 0, penaltyYears: 0, penaltyRate: 0,
    grossAnnuity: 0, annuityAfterPenalty: 0, survivorReduction: 0.10,
    netAnnualAnnuity: 0, netMonthlyAnnuity: 0, monthlyAnnuity: 0,
    srsMonthly: 0, srsAnnual: 0, hasSRS: false, isEarlyRetirement: false,
    colaNote: 'FERS COLA does not begin until age 62',
    options: {
      takeNow:    { annual: 0, monthly: 0, srsMonthly: 0, note: '' },
      postpone60: { annual: 0, monthly: 0, srsMonthly: 0, note: '' },
      postpone62: { annual: 0, monthly: 0, srsMonthly: 0, note: '' },
    },
  }
}

// ── FERS Options for Chart 10 ──────────────────────────────────────────────────
export function computeFersOptions(fersResult, lifeExpectancy) {
  if (!fersResult?.options) return null

  const { options } = fersResult

  function lifetimeTotal(startAge, annualAmount) {
    const years = Math.max(0, (lifeExpectancy || 90) - startAge)
    let total = 0
    let current = annualAmount || 0
    for (let y = 0; y < years; y++) {
      total += current
      current = applyFersCola(current, 0.025)
    }
    return total
  }

  const retAge = fersResult.retirementAge || 57
  return {
    takeNow:    { age: retAge, monthly: options.takeNow.monthly,    annual: options.takeNow.annual,    totalLifetime: lifetimeTotal(retAge, options.takeNow.annual),    note: options.takeNow.note },
    postpone60: { age: 60,     monthly: options.postpone60.monthly, annual: options.postpone60.annual, totalLifetime: lifetimeTotal(60,     options.postpone60.annual), note: options.postpone60.note },
    postpone62: { age: 62,     monthly: options.postpone62.monthly, annual: options.postpone62.annual, totalLifetime: lifetimeTotal(62,     options.postpone62.annual), note: options.postpone62.note },
  }
}

// ── Backward-compat alias ──────────────────────────────────────────────────────
export function projectHigh3(currentSalary, growthRate, yearsUntilFreeze) {
  if (!currentSalary || currentSalary <= 0) return 0
  if (yearsUntilFreeze <= 0) return currentSalary
  const rate = growthRate || 0.01
  const yearN   = currentSalary * Math.pow(1 + rate, yearsUntilFreeze)
  const yearNm1 = currentSalary * Math.pow(1 + rate, yearsUntilFreeze - 1)
  const yearNm2 = currentSalary * Math.pow(1 + rate, Math.max(0, yearsUntilFreeze - 2))
  return (yearN + yearNm1 + yearNm2) / 3
}
