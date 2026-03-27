// Portfolio projection utilities
// Includes TSP/401k growth, SS calculations, Monte Carlo, and legacy projections

import { getSSFRA } from './federalCalculations.js'

// ── Seeded PRNG (LCG) for deterministic Monte Carlo ──────────────────────────
function createSeededRandom(seed) {
  let state = seed || 12345
  return function() {
    state = (state * 1664525 + 1013904223) & 0xffffffff
    return (state >>> 0) / 0xffffffff
  }
}

// Box-Muller transform: uniform → normal distribution
function boxMuller(u1, u2) {
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

// ── TSP / 401k Compound Growth ────────────────────────────────────────────────
export function computeTSPProjection({
  currentBalance = 0,
  rothBalance = 0,
  annualContributionTraditional = 0,
  annualContributionRoth = 0,
  employerMatchAnnual = 0,
  returnRate = 0.065,
  yearsToRetirement = 20,
  inflationRate = 0.025,
  catchupContribTraditional = 0,
  catchupStartYear = 0,
} = {}) {
  if (yearsToRetirement <= 0) return { traditionalBalance: currentBalance, rothBalance, totalBalance: currentBalance + rothBalance }

  let trad = currentBalance
  let roth = rothBalance
  const yearByYear = []

  for (let y = 1; y <= yearsToRetirement; y++) {
    const catchupActive = catchupStartYear > 0 && y >= catchupStartYear
    const tradContrib = annualContributionTraditional + (catchupActive ? catchupContribTraditional : 0)
    trad = (trad + tradContrib + employerMatchAnnual) * (1 + returnRate)
    roth = (roth + annualContributionRoth) * (1 + returnRate)
    yearByYear.push({
      year: y,
      traditional: Math.round(trad),
      roth: Math.round(roth),
      total: Math.round(trad + roth),
    })
  }

  return {
    traditionalBalance: trad,
    rothBalance: roth,
    totalBalance: trad + roth,
    yearByYear,
  }
}

// ── Employer Match Calculator ──────────────────────────────────────────────────
export function computeEmployerMatch({ matchType, salary, matchPct, matchCapPct, fixedAmount } = {}) {
  if (!matchType || matchType === 'none') return 0
  if (matchType === 'fixed') return fixedAmount || 0
  if (matchType === 'percentage') {
    const matchableContrib = salary * (matchCapPct || 0.05)
    return matchableContrib * (matchPct || 1.0)
  }
  return 0
}

// ── 4% Rule Withdrawal ─────────────────────────────────────────────────────────
export function computeFourPercentRule(portfolioBalance, safeWithdrawalRate = 0.04) {
  return portfolioBalance * safeWithdrawalRate
}

// ── Dividend Income Strategy ───────────────────────────────────────────────────
export function computeDividendIncome(portfolioBalance, dividendYield = 0.035) {
  return portfolioBalance * dividendYield
}

// ── Year-by-Year Drawdown Model ────────────────────────────────────────────────
export function computePortfolioDrawdown({
  startingBalance,
  annualWithdrawal,
  returnRate = 0.05,
  inflationRate = 0.025,
  years = 30,
  withdrawalStrategy = '4pct',  // '4pct' | 'dividend' | 'hybrid'
  dividendYield = 0.035,
} = {}) {
  let balance = startingBalance
  const yearByYear = []
  let depletionYear = null
  let withdrawal = annualWithdrawal

  for (let y = 1; y <= years; y++) {
    if (balance <= 0) {
      if (!depletionYear) depletionYear = y - 1
      yearByYear.push({ year: y, balance: 0, withdrawal: 0, depleted: true })
      continue
    }

    const growth = balance * returnRate
    const actualWithdrawal = Math.min(withdrawal, balance + growth)
    balance = balance + growth - actualWithdrawal

    yearByYear.push({
      year: y,
      balance: Math.max(0, Math.round(balance)),
      withdrawal: Math.round(actualWithdrawal),
      depleted: balance <= 0,
    })

    // Inflate withdrawal each year
    if (withdrawalStrategy === '4pct') {
      withdrawal *= (1 + inflationRate)  // 4% rule adjusts for inflation
    }
  }

  return {
    finalBalance: Math.max(0, balance),
    yearByYear,
    depletionYear,
    survivedFullPeriod: depletionYear === null,
  }
}

// ── Social Security Calculations ───────────────────────────────────────────────
// SSA benefit factor for any claiming age vs FRA.
// Uses per-month reduction/credit per SSA rules:
//   Early: first 36 months = 5/9% per month; beyond 36 months = 5/12% per month
//   Late:  each month past FRA = 2/3% per month (8%/year)
function ssFactorAtAge(claimingAge, fra) {
  const monthsFromFRA = Math.round((claimingAge - fra) * 12)
  if (monthsFromFRA >= 0) {
    return 1 + monthsFromFRA * (2 / 3 / 100)
  }
  const monthsEarly = -monthsFromFRA
  const first36 = Math.min(monthsEarly, 36) * (5 / 9 / 100)
  const beyond36 = Math.max(0, monthsEarly - 36) * (5 / 12 / 100)
  return 1 - (first36 + beyond36)
}

export function computeSocialSecurity({
  fraMonthlyBenefit = 0,
  birthYear,
  claimingAge = null,
  spouseFRABenefit = 0,
  spouseClaimingAge = 67,
  wepGpoApplies = false,
  wepReduction = 0,
  ssCola = 0.025,
} = {}) {
  if (!fraMonthlyBenefit) return getEmptySSResult()

  const fra = getSSFRA(birthYear || 1963)

  // Benefit at exact ages using per-month SSA formula
  const at62Monthly = fraMonthlyBenefit * ssFactorAtAge(62, fra)
  const at70Monthly = fraMonthlyBenefit * ssFactorAtAge(70, fra)

  // WEP reduction (behind feature flag — repealed Jan 2025)
  const wepAdjustment = wepGpoApplies ? wepReduction : 0

  const at62Adjusted = Math.max(0, at62Monthly - wepAdjustment)
  const fraAdjusted = Math.max(0, fraMonthlyBenefit - wepAdjustment)
  const at70Adjusted = Math.max(0, at70Monthly - wepAdjustment)

  // Claiming strategy: use exact per-month formula for any integer age
  const effectiveClaimingAge = claimingAge ?? fra
  const claimFactor = ssFactorAtAge(Math.max(62, Math.min(70, effectiveClaimingAge)), fra)
  const selectedMonthly = Math.max(0, fraMonthlyBenefit * claimFactor - wepAdjustment)

  // Spousal benefit
  const spousalBenefit = Math.max(0, spouseFRABenefit * 0.50)

  // Break-even analysis (62 vs FRA)
  const monthlyDifference = fraAdjusted - at62Adjusted
  const benefitLost = (fra - 62) * 12 * at62Adjusted  // collected at 62 from 62 to FRA
  const breakEvenMonths = monthlyDifference > 0 ? benefitLost / monthlyDifference : Infinity
  const breakEvenAge62vsFRA = 62 + breakEvenMonths / 12

  // Break-even FRA vs 70
  const fraTo70Months = (70 - fra) * 12
  const benefitLostFRA = fraTo70Months * fraAdjusted
  const monthlyGain70 = at70Adjusted - fraAdjusted
  const breakEvenAge67vs70 = monthlyGain70 > 0 ? 70 + benefitLostFRA / (monthlyGain70 * 12) : Infinity

  // Lifetime totals (nominal, no COLA for simplicity)
  function lifetimeTotal(monthlyBenefit, startAge, endAge) {
    if (startAge >= endAge) return 0
    return monthlyBenefit * 12 * (endAge - startAge)
  }

  return {
    fra,
    at62Monthly: at62Adjusted,
    fraMonthly: fraAdjusted,
    at70Monthly: at70Adjusted,
    selectedMonthly,
    selectedAnnual: selectedMonthly * 12,
    spousalBenefit,
    spousalAnnual: spousalBenefit * 12,
    breakEvenAge62vsFRA,
    breakEvenAge67vs70,
    wepApplied: wepGpoApplies,
    // Lifetime totals at different ages
    lifetime80: {
      age62: lifetimeTotal(at62Adjusted, 62, 80),
      fra: lifetimeTotal(fraAdjusted, fra, 80),
      age70: lifetimeTotal(at70Adjusted, 70, 80),
    },
    lifetime90: {
      age62: lifetimeTotal(at62Adjusted, 62, 90),
      fra: lifetimeTotal(fraAdjusted, fra, 90),
      age70: lifetimeTotal(at70Adjusted, 70, 90),
    },
  }
}

function getEmptySSResult() {
  return {
    fra: 67, at62Monthly: 0, fraMonthly: 0, at70Monthly: 0,
    selectedMonthly: 0, selectedAnnual: 0, spousalBenefit: 0, spousalAnnual: 0,
    breakEvenAge62vsFRA: Infinity, breakEvenAge67vs70: Infinity,
    wepApplied: false,
    lifetime80: { age62: 0, fra: 0, age70: 0 },
    lifetime90: { age62: 0, fra: 0, age70: 0 },
  }
}

// ── Monte Carlo Portfolio Survival ────────────────────────────────────────────
export function runMonteCarlo({
  startingBalance,
  annualWithdrawal,
  meanReturn = 0.07,
  returnStdDev = 0.15,
  inflationRate = 0.025,
  inflationStdDev = 0.01,
  years = 30,
  runs = 500,
} = {}) {
  if (!startingBalance || startingBalance <= 0) {
    return { successRate: 0, medianFinalBalance: 0, percentile10: 0, percentile90: 0, yearByYear: [] }
  }

  const rand = createSeededRandom(startingBalance * annualWithdrawal)
  let successCount = 0
  const finalBalances = []

  // Accumulate year-by-year medians for chart
  const yearTotals = new Array(years).fill(0)
  const yearCounts = new Array(years).fill(0)

  for (let r = 0; r < runs; r++) {
    let balance = startingBalance
    let withdrawal = annualWithdrawal
    let succeeded = true

    for (let y = 0; y < years; y++) {
      const u1 = Math.max(0.0001, rand())
      const u2 = Math.max(0.0001, rand())
      const returnShock = boxMuller(u1, u2) * returnStdDev
      const inflShock = boxMuller(Math.max(0.0001, rand()), Math.max(0.0001, rand())) * inflationStdDev

      const actualReturn = meanReturn + returnShock
      const actualInflation = inflationRate + inflShock

      balance = balance * (1 + actualReturn) - withdrawal
      if (balance <= 0) {
        balance = 0
        succeeded = false
      }

      yearTotals[y] += balance
      yearCounts[y]++
      withdrawal *= (1 + Math.max(0, actualInflation))
    }

    if (succeeded) successCount++
    finalBalances.push(Math.max(0, balance))
  }

  finalBalances.sort((a, b) => a - b)
  const medianIdx = Math.floor(runs / 2)

  const yearByYear = yearTotals.map((total, i) => ({
    year: i + 1,
    medianBalance: Math.round(total / (yearCounts[i] || 1)),
  }))

  return {
    successRate: successCount / runs,
    medianFinalBalance: finalBalances[medianIdx] || 0,
    percentile10: finalBalances[Math.floor(runs * 0.1)] || 0,
    percentile90: finalBalances[Math.floor(runs * 0.9)] || 0,
    yearByYear,
  }
}

// ── Home Value Projection ─────────────────────────────────────────────────────
export function computeHomeProjection({
  currentValue = 0,
  mortgageBalance = 0,
  mortgageRate = 0.04,
  yearsRemaining = 20,
  appreciationRate = 0.03,
  yearsToRetirement = 20,
  planAtRetirement = 'keep',
  newHomePrice = 0,
  sellingCostsPct = 0.06,
} = {}) {
  if (!currentValue) return { valueAtRetirement: 0, mortgageAtRetirement: 0, equity: 0, cashAfterPurchase: 0 }

  const valueAtRetirement = currentValue * Math.pow(1 + appreciationRate, yearsToRetirement)

  // Mortgage amortization to retirement
  let balance = mortgageBalance
  if (balance > 0 && mortgageRate > 0) {
    const monthlyRate = mortgageRate / 12
    const n = yearsRemaining * 12
    const monthlyPayment = balance * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    const paymentMonths = Math.min(yearsToRetirement * 12, n)
    for (let m = 0; m < paymentMonths; m++) {
      const interest = balance * monthlyRate
      const principal = monthlyPayment - interest
      balance = Math.max(0, balance - principal)
    }
  } else {
    balance = Math.max(0, balance - (yearsToRetirement * 5000))  // rough estimate if no rate
  }

  const mortgageAtRetirement = balance
  const grossEquity = valueAtRetirement - mortgageAtRetirement
  const sellingCosts = grossEquity > 0 ? valueAtRetirement * sellingCostsPct : 0
  const netEquity = grossEquity - sellingCosts

  // Proceeds from selling: 'sell_buy' → net equity minus new home purchase price
  //                        'sell_rent' → full net equity (no replacement home)
  const isSelling = planAtRetirement === 'sell_buy' || planAtRetirement === 'sell_rent' || planAtRetirement === 'sell'
  const cashAfterPurchase = isSelling ? Math.max(0, netEquity - (planAtRetirement === 'sell_buy' ? (newHomePrice || 0) : 0)) : 0

  // Value at life expectancy:
  // - selling+buying a new home: new home appreciates for ~25 years of retirement
  // - selling+renting: no home equity at LE
  // - keeping: original home appreciates
  let valueAtLifeExpectancy
  if (planAtRetirement === 'sell_buy' && newHomePrice > 0) {
    valueAtLifeExpectancy = newHomePrice * Math.pow(1 + appreciationRate, 25)
  } else if (planAtRetirement === 'sell_rent' || planAtRetirement === 'sell') {
    valueAtLifeExpectancy = 0
  } else {
    valueAtLifeExpectancy = currentValue * Math.pow(1 + appreciationRate, yearsToRetirement + 25)
  }

  return {
    currentValue,
    valueAtRetirement,
    mortgageAtRetirement,
    grossEquity,
    netEquity,
    cashAfterPurchase,
    valueAtLifeExpectancy,
  }
}

// ── 529 Savings Projection ─────────────────────────────────────────────────────
export function compute529Projection({
  currentBalance = 0,
  monthlyContribution = 0,
  growthRate = 0.07,
  yearsToCollegeStart,
  collegeAnnualCost = 35000,
  collegeInflation = 0.05,
} = {}) {
  if (yearsToCollegeStart === undefined || yearsToCollegeStart < 0) return { balance: 0, projectedCost: 0, coverage: 0, surplus: 0 }

  let balance = currentBalance
  for (let y = 0; y < yearsToCollegeStart; y++) {
    balance = (balance + monthlyContribution * 12) * (1 + growthRate)
  }

  const projectedAnnualCost = collegeAnnualCost * Math.pow(1 + collegeInflation, yearsToCollegeStart)
  const projected4YearCost = projectedAnnualCost * 4
  const coverage = projected4YearCost > 0 ? balance / projected4YearCost : 0
  const surplus = balance - projected4YearCost

  return {
    balance: Math.round(balance),
    projectedAnnualCost: Math.round(projectedAnnualCost),
    projected4YearCost: Math.round(projected4YearCost),
    coverage: Math.round(coverage * 100),  // as percentage
    surplus: Math.round(surplus),
  }
}

// ── Full Portfolio Timeline for Chart 2 ───────────────────────────────────────
export function buildPortfolioTimeline({
  currentTSP = 0,
  currentRoth = 0,
  annualTSPContrib = 0,
  annualRothContrib = 0,
  employerMatchAnnual = 0,
  tspReturn = 0.065,
  rothReturn = 0.08,
  yearsToRetirement,
  currentAge,
  retirementAge,
  lifeExpectancy = 90,
  annualTSPWithdrawal = 0,
  annualRothWithdrawal = 0,
  inflationRate = 0.025,
} = {}) {
  const data = []
  let tsp = currentTSP
  let roth = currentRoth
  const totalYears = lifeExpectancy - currentAge

  for (let y = 0; y <= totalYears; y++) {
    const age = currentAge + y
    const isRetired = age >= retirementAge
    const yearLabel = new Date().getFullYear() + y

    if (!isRetired) {
      // Accumulation phase
      tsp = (tsp + annualTSPContrib + employerMatchAnnual) * (1 + tspReturn)
      roth = (roth + annualRothContrib) * (1 + rothReturn)
    } else {
      // Drawdown phase
      tsp = Math.max(0, tsp * (1 + tspReturn) - annualTSPWithdrawal)
      roth = Math.max(0, roth * (1 + rothReturn) - annualRothWithdrawal)
    }

    data.push({
      year: yearLabel,
      age,
      tsp: Math.round(tsp),
      roth: Math.round(roth),
      total: Math.round(tsp + roth),
      phase: isRetired ? 'drawdown' : 'accumulation',
    })
  }

  return data
}
