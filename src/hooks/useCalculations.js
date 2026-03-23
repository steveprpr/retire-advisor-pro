// Central calculation hook — all 48 live calculations
// Organized into memoized groups to avoid unnecessary re-computation.
// Never depends on UI state — only form + assumptions.

import { useMemo } from 'react'
import {
  getMRA, getSSFRA, computeFersPension, computeFersOptions,
  computeAutoHigh3, computeServiceYearsAtRetirement, estimateSSPIA,
} from '../utils/federalCalculations.js'
import { computeRetirementTax, computeRothConversion } from '../utils/taxCalculations.js'
import {
  computeTSPProjection, computeEmployerMatch,
  computeSocialSecurity, computeHomeProjection,
  compute529Projection, runMonteCarlo, buildPortfolioTimeline,
  computeFourPercentRule, computeDividendIncome, computePortfolioDrawdown,
} from '../utils/portfolioProjections.js'
import { computeExpenseTotals, getLocationCOLMultiplier } from '../utils/expenseCalculations.js'
import { getVAMonthlyBenefit } from '../data/vaBenefitTable.js'
import { COUNTRY_COL_DATA } from '../data/countryColData.js'

export function useCalculations(form, assumptions) {
  const currentYear = new Date().getFullYear()

  // ── Derived base values ──────────────────────────────────────────────────
  const baseValues = useMemo(() => {
    // Use exact birth date when month/day available, otherwise fall back to year-only
    let currentAge
    if (form.birthYear && form.birthMonth && form.birthDay) {
      const today = new Date()
      const birthDate = new Date(parseInt(form.birthYear), parseInt(form.birthMonth) - 1, parseInt(form.birthDay))
      currentAge = Math.floor((today - birthDate) / (365.25 * 24 * 3600 * 1000))
    } else {
      currentAge = form.birthYear ? currentYear - parseInt(form.birthYear) : 55
    }
    const retirementAge = form.targetRetirementAge || 60
    const yearsToRetirement = Math.max(0, retirementAge - currentAge)
    const lifeExpectancy = assumptions.lifeExpectancyOverride || form.lifeExpectancy || 90
    const yearsInRetirement = Math.max(0, lifeExpectancy - retirementAge)
    const isFederal = form.employmentType === 'federal' || form.employmentType === 'federal_csrs'
    const isMarried = form.maritalStatus === 'married'
    const filingStatus = isMarried ? 'mfj' : 'single'
    const spouseAge = form.spouseBirthYear ? currentYear - form.spouseBirthYear : null
    return { currentAge, retirementAge, yearsToRetirement, lifeExpectancy, yearsInRetirement, isFederal, isMarried, filingStatus, spouseAge }
  }, [
    form.birthYear, form.birthMonth, form.birthDay,
    form.targetRetirementAge, form.lifeExpectancy,
    form.employmentType, form.maritalStatus, form.spouseBirthYear,
    assumptions.lifeExpectancyOverride,
  ])

  // ── FERS / Pension calculations ──────────────────────────────────────────
  const fers = useMemo(() => {
    if (!baseValues.isFederal) {
      // Private sector pension — apply QDRO reduction if applicable
      const grossMonthly = form.hasPension ? (form.pensionMonthlyAmount || 0) : 0
      const qdroAnnuityPct = (form.hasDivorceCOAP && form.divorceAnnuitySharePct > 0)
        ? Math.min(1, form.divorceAnnuitySharePct / 100) : 0
      const monthlyPension = grossMonthly * (1 - qdroAnnuityPct)
      return {
        mra: 57, mraDisplay: '57',
        netMonthlyAnnuity: monthlyPension,
        netAnnualAnnuity: monthlyPension * 12,
        monthlyAnnuity: monthlyPension,
        grossAnnuity: grossMonthly * 12,
        penaltyRate: 0, penaltyYears: 0,
        isEarlyRetirement: false, hasSRS: false, srsMonthly: 0,
        options: {
          takeNow:    { annual: monthlyPension * 12, monthly: monthlyPension, srsMonthly: 0, note: '' },
          postpone60: { annual: monthlyPension * 12, monthly: monthlyPension, srsMonthly: 0, note: '' },
          postpone62: { annual: monthlyPension * 12, monthly: monthlyPension, srsMonthly: 0, note: '' },
        },
        totalService: 0, isPension: true, high3: 0, serviceYears: 0,
        coapPct: qdroAnnuityPct, coapMonthlyReduction: grossMonthly * qdroAnnuityPct,
      }
    }

    // Auto-compute High-3 unless user has overridden
    const high3 = form.high3Override
      ? (form.high3Salary || 0)
      : computeAutoHigh3(
          form.currentSalary || 0,
          form.salaryGrowthRate || 0.01,
          baseValues.retirementAge,
          baseValues.currentAge,
          form.high3FreezeAge || null,
        )

    // Auto-compute service years from SCD, or project from current years entered manually
    const serviceYears = (form.serviceYearsMode !== 'manual')
      ? (computeServiceYearsAtRetirement(form.scdYear, baseValues.retirementAge, form.birthYear, form.scdMonth, form.scdDay) ?? (form.credibleServiceYears || 0))
      : (form.credibleServiceYears || 0) + Math.max(0, baseValues.retirementAge - baseValues.currentAge)

    // Quick SS@62 estimate for SRS calculation
    const ssAt62 = estimateSSPIA({
      currentSalary: form.currentSalary || 0,
      currentAge: baseValues.currentAge,
      birthYear: form.birthYear,
      careerStartAge: form.careerStartAge || 22,
      salaryGrowthRate: form.salaryGrowthRate || 0.01,
      wepApplies: false,  // SRS ignores WEP
      ssWorkHistory30plus: form.ssWorkHistory30plus || false,
    })

    const result = computeFersPension({
      high3Salary: high3,
      credibleServiceYears: serviceYears,
      retirementAge: baseValues.retirementAge,
      militaryBuybackYears: form.militaryService === 'deposit_paid' ? (form.militaryServiceYears || 0) : 0,
      unusedSickLeaveMonths: 0,
      partTimeProration: 1.0,
      survivorBenefitElection: form.survivorAnnuityElection || 'full',
      retirementSystem: form.retirementSystem || 'fers',
      specialCategory: form.specialCategory || 'standard',
      birthYear: form.birthYear,
      projectedSSAt62Monthly: ssAt62,
    })

    const fersOptions = computeFersOptions(
      { ...result, retirementAge: baseValues.retirementAge },
      baseValues.lifeExpectancy,
    )

    // Apply COAP (court order) pension reduction for divorced employees
    const coapPct = (form.hasDivorceCOAP && form.divorceAnnuitySharePct > 0)
      ? Math.min(1, form.divorceAnnuitySharePct / 100) : 0
    const coapMonthlyReduction = result.netMonthlyAnnuity * coapPct
    const netMonthlyAfterCOAP = result.netMonthlyAnnuity - coapMonthlyReduction

    return {
      ...result,
      fersOptions, isPension: false, high3, serviceYears,
      netMonthlyAnnuity: netMonthlyAfterCOAP,
      netAnnualAnnuity: netMonthlyAfterCOAP * 12,
      coapPct,
      coapMonthlyReduction,
    }
  }, [
    baseValues.isFederal, baseValues.retirementAge, baseValues.lifeExpectancy, baseValues.currentAge,
    form.high3Salary, form.high3Override, form.high3FreezeAge,
    form.currentSalary, form.salaryGrowthRate, form.scdYear,
    form.credibleServiceYears, form.serviceYearsMode, form.militaryService, form.militaryServiceYears,
    form.survivorAnnuityElection, form.retirementSystem, form.specialCategory, form.birthYear,
    form.hasPension, form.pensionMonthlyAmount, form.careerStartAge, form.ssWorkHistory30plus,
    form.hasDivorceCOAP, form.divorceAnnuitySharePct,
  ])

  // ── TSP / 401k projections ───────────────────────────────────────────────
  const tsp = useMemo(() => {
    // Employer match is simplified: always 100% match rate up to the cap % of salary
    const employerMatchAnnual = computeEmployerMatch({
      matchType: 'percentage',
      salary: form.currentSalary || 0,
      matchPct: 1.0,
      matchCapPct: (form.employerMatchCapPct ?? 5) / 100,
      fixedAmount: 0,
    })

    // Fold all additional pre-tax accounts into primary plan projection
    const additionalPlans = form.additionalPlans || []
    const additionalPlansBalance = additionalPlans.reduce((s, p) => s + (p.balance || 0), 0)
    const additionalPlansContrib = additionalPlans.reduce((s, p) => s + (p.contrib || 0), 0)
    const additionalPlansMatch = additionalPlans.reduce((s, p) =>
      s + ((form.currentSalary || 0) * (p.matchPct || 0) / 100), 0)

    const additionalPreTaxBalance = additionalPlansBalance
      + (form.priorEmployer401kBalance || 0)
      + (form.traditionalIRABalance || 0)
      + (form.spouseTraditionalIRABalance || 0)

    const additionalAnnualContrib = additionalPlansContrib
      + (form.traditionalIRAContrib || 0)
      + (form.spouseTraditionalIRAContrib || 0)

    const secondary401kMatchAnnual = additionalPlansMatch

    const projection = computeTSPProjection({
      currentBalance: (form.tspTraditionalBalance || 0) + additionalPreTaxBalance,
      rothBalance: form.tspRothBalance || 0,
      annualContributionTraditional: (form.annualContribTraditional || 0) + additionalAnnualContrib,
      annualContributionRoth: form.annualContribRoth || 0,
      employerMatchAnnual: employerMatchAnnual + secondary401kMatchAnnual,
      returnRate: assumptions.tspReturnRate,
      yearsToRetirement: baseValues.yearsToRetirement,
      inflationRate: assumptions.inflationRate,
    })

    // Withdrawal income at retirement
    const selectedYield = form.dividendETF === 'SCHD' ? assumptions.schdYield
      : form.dividendETF === 'VYM' ? assumptions.vymYield
      : form.dividendETF === 'JEPI' ? assumptions.jepYield
      : (form.customDividendYield || assumptions.schdYield)

    // Apply QDRO reduction if the TSP split happens at retirement (not already done)
    const qdroReductionPct = (form.hasDivorceCOAP && form.divorceTSPDivision === 'at_retirement')
      ? Math.min(1, (form.divorceTSPSharePct || 0) / 100) : 0
    const effectiveTotalBalance = projection.totalBalance * (1 - qdroReductionPct)

    const fourPctIncome = computeFourPercentRule(effectiveTotalBalance, assumptions.safeWithdrawalRate)
    const dividendIncome = computeDividendIncome(effectiveTotalBalance, selectedYield)

    return {
      ...projection,
      employerMatchAnnual,
      fourPctIncome,
      dividendIncome,
      selectedYield,
      totalBalance: effectiveTotalBalance,
      balanceAtRetirement: effectiveTotalBalance,
      annualWithdrawal: form.withdrawalStrategy === 'dividend' ? dividendIncome : fourPctIncome,
      monthlyWithdrawal: (form.withdrawalStrategy === 'dividend' ? dividendIncome : fourPctIncome) / 12,
      qdroReductionPct,
    }
  }, [
    form.tspTraditionalBalance, form.tspRothBalance, form.annualContribTraditional,
    form.annualContribRoth, form.employerMatchCapPct, form.currentSalary,
    form.withdrawalStrategy, form.dividendETF, form.customDividendYield,
    form.hasDivorceCOAP, form.divorceTSPDivision, form.divorceTSPSharePct,
    form.additionalPlans, form.additionalPlanCount, form.priorEmployer401kBalance,
    form.traditionalIRABalance, form.traditionalIRAContrib,
    form.spouseTraditionalIRABalance, form.spouseTraditionalIRAContrib,
    assumptions.tspReturnRate, assumptions.safeWithdrawalRate,
    assumptions.schdYield, assumptions.vymYield, assumptions.jepYield,
    baseValues.yearsToRetirement, assumptions.inflationRate,
  ])

  // ── Roth IRA ─────────────────────────────────────────────────────────────
  const roth = useMemo(() => {
    if (form.hasRothIRA === 'no') return { balance: 0, annualIncome: 0 }
    const projection = computeTSPProjection({
      currentBalance: form.rothIRABalance || 0,
      rothBalance: 0,
      annualContributionTraditional: form.annualRothIRAContrib || 0,
      annualContributionRoth: 0,
      employerMatchAnnual: 0,
      returnRate: assumptions.rothIRAReturnRate,
      yearsToRetirement: baseValues.yearsToRetirement,
    })
    const balance = projection.traditionalBalance
    const fourPctIncome = balance * assumptions.safeWithdrawalRate
    const dividendIncome = balance * (assumptions.schdYield || 0.035)
    const annualIncome = form.rothIRARetirementPlan === 'dividend' ? dividendIncome : fourPctIncome
    return { balance, annualIncome, fourPctIncome, dividendIncome, yearByYear: projection.yearByYear }
  }, [
    form.hasRothIRA, form.rothIRABalance, form.annualRothIRAContrib,
    form.rothIRARetirementPlan, assumptions.rothIRAReturnRate,
    assumptions.safeWithdrawalRate, assumptions.schdYield,
    baseValues.yearsToRetirement,
  ])

  // ── Social Security ───────────────────────────────────────────────────────
  const ss = useMemo(() => {
    // Use AIME estimator when user hasn't provided an SSA statement
    const fraMonthlyBenefit = (form.ssUseEstimator !== false && !(form.ssBenefitAtFRA > 0))
      ? estimateSSPIA({
          currentSalary: form.currentSalary || 0,
          currentAge: baseValues.currentAge,
          birthYear: form.birthYear,
          careerStartAge: form.careerStartAge || 22,
          salaryGrowthRate: form.salaryGrowthRate || 0.01,
          wepApplies: assumptions.wepGpoApplies,
          ssWorkHistory30plus: form.ssWorkHistory30plus || false,
        })
      : (form.ssBenefitAtFRA || 0)

    const result = computeSocialSecurity({
      fraMonthlyBenefit,
      birthYear: form.birthYear,
      claimingAge: form.ssClaimingStrategy === '62' ? 62 : form.ssClaimingStrategy === '70' ? 70 : null,
      spouseFRABenefit: form.spouseSSBenefitAtFRA || 0,
      wepGpoApplies: assumptions.wepGpoApplies,
    })
    return { ...result, fraMonthlyBenefit }
  }, [
    form.ssBenefitAtFRA, form.ssUseEstimator, form.currentSalary, form.careerStartAge,
    form.salaryGrowthRate, form.ssWorkHistory30plus,
    form.birthYear, form.ssClaimingStrategy,
    form.spouseSSBenefitAtFRA, assumptions.wepGpoApplies,
    baseValues.currentAge,
  ])

  // ── VA Benefit ────────────────────────────────────────────────────────────
  const va = useMemo(() => {
    const monthly = getVAMonthlyBenefit(form.vaRating || 0, baseValues.isMarried)
    return { monthly, annual: monthly * 12 }
  }, [form.vaRating, baseValues.isMarried])

  // ── Home equity ───────────────────────────────────────────────────────────
  const home = useMemo(() => {
    return computeHomeProjection({
      currentValue: form.homeValue || 0,
      mortgageBalance: form.mortgageBalance || 0,
      mortgageRate: form.mortgageRate || 0.04,
      yearsRemaining: form.mortgageYearsRemaining || 25,
      appreciationRate: assumptions.homeAppreciationRate,
      yearsToRetirement: baseValues.yearsToRetirement,
      planAtRetirement: form.retirementHomePlan || 'keep',
      newHomePrice: form.newHomeBudget || 0,
      sellingCostsPct: assumptions.homeSellingCostsPct,
    })
  }, [
    form.homeValue, form.mortgageBalance, form.mortgageRate,
    form.mortgageYearsRemaining, form.retirementHomePlan, form.newHomeBudget,
    assumptions.homeAppreciationRate, assumptions.homeSellingCostsPct,
    baseValues.yearsToRetirement,
  ])

  // ── Expense calculations ──────────────────────────────────────────────────
  const expenses = useMemo(() => {
    const colMultiplier = getLocationCOLMultiplier(
      form.retirementLocationType || 'us',
      form.retirementStateCode || form.currentStateCode,
      form.retirementCountryKey || '',
      form.urbanRural || 'suburban',
    )
    const totals = computeExpenseTotals(
      form.expenses || {},
      assumptions.inflationRate,
      baseValues.yearsToRetirement,
      colMultiplier,
    )
    return { ...totals, colMultiplier }
  }, [
    form.expenses, form.retirementLocationType, form.retirementStateCode,
    form.currentStateCode, form.retirementCountryKey, form.urbanRural,
    assumptions.inflationRate, baseValues.yearsToRetirement,
  ])

  // ── Income phases ─────────────────────────────────────────────────────────
  const income = useMemo(() => {
    const pensionAnnual = fers.netAnnualAnnuity || 0
    // FERS Special Retirement Supplement — SS bridge paid from retirement until age 62
    const srsAnnual = fers.hasSRS ? (fers.srsMonthly || 0) * 12 : 0
    const tspAnnual = tsp.annualWithdrawal || 0
    const rothAnnual = roth.annualIncome || 0
    const vaAnnual = va.annual || 0
    const partTimeAnnual = form.hasPartTimeInRetirement ? (form.partTimeAnnualAmount || 0) : 0
    const rentalAnnual = form.hasRentalProperty ? Math.max(0, (form.rentalMonthlyGross || 0) * 12 - (form.rentalAnnualExpenses || 0)) : 0
    const otherAnnual = (form.otherPensionAnnuity || 0) + (form.hasPension && !baseValues.isFederal ? 0 : 0)

    // Phase 1: pre-Social Security (includes SRS bridge for eligible federal employees)
    const phase1Annual = pensionAnnual + srsAnnual + tspAnnual + rothAnnual + vaAnnual + partTimeAnnual + rentalAnnual + otherAnnual
    const phase1Monthly = phase1Annual / 12

    // Phase 2: SRS ends at 62 and real SS begins
    const ssAnnual = ss.selectedAnnual || 0
    const spouseSSAnnual = ss.spousalAnnual || 0
    // Phase 2 removes SRS (replaced by SS) and adds actual SS benefit
    const phase2Annual = (phase1Annual - srsAnnual) + ssAnnual + spouseSSAnnual
    const phase2Monthly = phase2Annual / 12

    // Phase 3: survivor income (simplified — 60% of joint income)
    const phase3Annual = (pensionAnnual * 0.60) + (ssAnnual * (baseValues.isMarried ? 1.0 : 0)) + vaAnnual
    const phase3Monthly = phase3Annual / 12

    return {
      components: { pensionAnnual, srsAnnual, tspAnnual, rothAnnual, vaAnnual, partTimeAnnual, rentalAnnual, otherAnnual, ssAnnual, spouseSSAnnual },
      phase1Annual, phase1Monthly,
      phase2Annual, phase2Monthly,
      phase3Annual, phase3Monthly,
    }
  }, [
    fers.netAnnualAnnuity, fers.hasSRS, fers.srsMonthly,
    tsp.annualWithdrawal, roth.annualIncome,
    va.annual, ss.selectedAnnual, ss.spousalAnnual,
    form.hasPartTimeInRetirement, form.partTimeAnnualAmount,
    form.hasRentalProperty, form.rentalMonthlyGross, form.rentalAnnualExpenses,
    form.otherPensionAnnuity, baseValues.isMarried, baseValues.isFederal,
  ])

  // ── Tax calculations ──────────────────────────────────────────────────────
  const taxes = useMemo(() => {
    return computeRetirementTax({
      annualPension: fers.netAnnualAnnuity || 0,
      annualTSPWithdrawal: tsp.annualWithdrawal || 0,
      annualRothWithdrawal: roth.annualIncome || 0,
      annualSSBenefit: ss.selectedAnnual || 0,
      annualVABenefit: va.annual || 0,
      otherIncome: (form.otherPensionAnnuity || 0) + (form.hasPartTimeInRetirement ? form.partTimeAnnualAmount || 0 : 0),
      filingStatus: baseValues.filingStatus,
      stateCode: form.retirementStateCode || form.currentStateCode || '',
      retirementAge: baseValues.retirementAge,
    })
  }, [
    fers.netAnnualAnnuity, tsp.annualWithdrawal, roth.annualIncome,
    ss.selectedAnnual, va.annual, form.otherPensionAnnuity,
    form.hasPartTimeInRetirement, form.partTimeAnnualAmount,
    baseValues.filingStatus, baseValues.retirementAge,
    form.retirementStateCode, form.currentStateCode,
  ])

  // ── Surplus / Deficit ─────────────────────────────────────────────────────
  const surplus = useMemo(() => {
    const afterTaxPhase1 = income.phase1Annual - (taxes.totalTax * (income.phase1Annual / Math.max(income.phase2Annual, 1)))
    const afterTaxPhase2 = income.phase2Annual - taxes.totalTax
    const annualExpenses = expenses.totalAnnualAtRetirement

    const phase1Surplus = afterTaxPhase1 - annualExpenses
    const phase2Surplus = afterTaxPhase2 - annualExpenses

    // Replacement ratio
    const priorAnnualIncome = form.currentSalary || 100000
    const replacementRatio = priorAnnualIncome > 0 ? afterTaxPhase2 / priorAnnualIncome : 0

    return {
      afterTaxPhase1: Math.round(afterTaxPhase1),
      afterTaxPhase2: Math.round(afterTaxPhase2),
      annualExpenses: Math.round(annualExpenses),
      phase1Surplus: Math.round(phase1Surplus),
      phase2Surplus: Math.round(phase2Surplus),
      phase1SurplusMonthly: Math.round(phase1Surplus / 12),
      phase2SurplusMonthly: Math.round(phase2Surplus / 12),
      replacementRatio: Math.round(replacementRatio * 100),
      budgetCoverageRatio: afterTaxPhase2 > 0 ? Math.round((annualExpenses / afterTaxPhase2) * 100) : 0,
    }
  }, [income.phase1Annual, income.phase2Annual, taxes.totalTax, expenses.totalAnnualAtRetirement, form.currentSalary])

  // ── Roth Conversion Analysis ─────────────────────────────────────────────
  const rothConversion = useMemo(() => {
    return computeRothConversion({
      strategy: form.rothConversionStrategy || 'none',
      ordinaryIncomeInConversionYears: income.phase1Annual - (income.components?.tspAnnual || 0) - (income.components?.rothAnnual || 0),
      traditionalBalance: (tsp.totalBalance || 0) + (roth.balance || 0),
      customAmount: form.rothConversionCustomAmount || 0,
      startAge: form.rothConversionStartAge ?? baseValues.retirementAge,
      endAge: form.rothConversionEndAge ?? 72,
      returnRate: assumptions.tspReturnRate,
      filingStatus: baseValues.filingStatus,
      retirementAge: baseValues.retirementAge,
      lifeExpectancy: baseValues.lifeExpectancy,
    })
  }, [
    form.rothConversionStrategy, form.rothConversionCustomAmount,
    form.rothConversionStartAge, form.rothConversionEndAge,
    income.phase1Annual, income.components,
    tsp.totalBalance, roth.balance,
    assumptions.tspReturnRate, baseValues.filingStatus,
    baseValues.retirementAge, baseValues.lifeExpectancy,
  ])

  // ── Portfolio longevity (Monte Carlo) ────────────────────────────────────
  const portfolio = useMemo(() => {
    const totalPortfolio = tsp.totalBalance + roth.balance + (form.brokerageBalance || 0)
    const annualWithdrawal = tsp.annualWithdrawal + roth.annualIncome

    const monteCarlo = runMonteCarlo({
      startingBalance: totalPortfolio,
      annualWithdrawal,
      meanReturn: assumptions.tspReturnRate,
      returnStdDev: assumptions.stockVolatility,
      inflationRate: assumptions.inflationRate,
      inflationStdDev: assumptions.inflationVolatility,
      years: baseValues.yearsInRetirement,
      runs: assumptions.monteCarloRuns,
    })

    const drawdown = computePortfolioDrawdown({
      startingBalance: tsp.totalBalance,
      annualWithdrawal: tsp.annualWithdrawal,
      returnRate: assumptions.portfolioDrawdownReturn,
      inflationRate: assumptions.inflationRate,
      years: baseValues.yearsInRetirement,
    })

    // Balance at life expectancy
    const tspAtLE = drawdown.finalBalance
    const rothAtLE = roth.balance * Math.pow(1 + assumptions.rothIRAReturnRate - (roth.annualIncome / Math.max(roth.balance, 1)), baseValues.yearsInRetirement)
    const surplusInvested = Math.max(0, surplus.phase2Surplus) * ((Math.pow(1 + assumptions.surplusReinvestmentReturn, baseValues.yearsInRetirement) - 1) / assumptions.surplusReinvestmentReturn)

    const totalNetWorthAtLE = tspAtLE + Math.max(0, rothAtLE) + home.valueAtLifeExpectancy + surplusInvested
    const perChildInheritance = form.numberOfChildren > 0 ? totalNetWorthAtLE / form.numberOfChildren : 0

    // longevityYears = how many years TSP lasts from retirement
    const longevityYears = drawdown.depletionYear != null
      ? Math.max(0, Math.round(drawdown.depletionYear - baseValues.retirementAge))
      : baseValues.yearsInRetirement

    return {
      totalPortfolio,
      monteCarloSuccessRate: Math.round((monteCarlo.successRate || 0) * 100),
      medianFinalBalance: monteCarlo.medianFinalBalance,
      monteCarloYearByYear: monteCarlo.yearByYear,
      tspDrawdown: drawdown.yearByYear,
      tspDepletionYear: drawdown.depletionYear,
      longevityYears,
      tspAtLE,
      rothAtLE: Math.max(0, rothAtLE),
      surplusInvested,
      totalNetWorthAtLE,
      legacyNetWorth: totalNetWorthAtLE,
      perChildInheritance,
    }
  }, [
    tsp.totalBalance, tsp.annualWithdrawal, roth.balance, roth.annualIncome,
    form.brokerageBalance, assumptions.tspReturnRate, assumptions.stockVolatility,
    assumptions.inflationRate, assumptions.inflationVolatility, assumptions.monteCarloRuns,
    assumptions.portfolioDrawdownReturn, assumptions.surplusReinvestmentReturn,
    assumptions.rothIRAReturnRate, baseValues.yearsInRetirement,
    surplus.phase2Surplus, home.valueAtLifeExpectancy, form.numberOfChildren,
  ])

  // ── 529 savings ───────────────────────────────────────────────────────────
  const plan529 = useMemo(() => {
    const ages = (form.grandchildrenAges || '').split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 0)
    if (ages.length === 0) return { grandchildren: [] }

    const grandchildren = ages.map((age, idx) => {
      const yearsToCollege = Math.max(0, 18 - age)
      return compute529Projection({
        currentBalance: 0,
        monthlyContribution: form.plan529ContribPerGrandchild || 0,
        growthRate: assumptions.plan529GrowthRate,
        yearsToCollegeStart: yearsToCollege,
        collegeAnnualCost: 35000,
        collegeInflation: assumptions.collegeInflationRate,
      })
    })

    return { grandchildren, ages }
  }, [
    form.grandchildrenAges, form.plan529ContribPerGrandchild,
    assumptions.plan529GrowthRate, assumptions.collegeInflationRate,
  ])

  // ── Portfolio timeline for Chart 2 ───────────────────────────────────────
  const chartData = useMemo(() => {
    const timeline = buildPortfolioTimeline({
      currentTSP: form.tspTraditionalBalance || 0,
      currentRoth: (form.tspRothBalance || 0) + (form.rothIRABalance || 0),
      annualTSPContrib: form.annualContribTraditional || 0,
      annualRothContrib: (form.annualContribRoth || 0) + (form.annualRothIRAContrib || 0),
      employerMatchAnnual: tsp.employerMatchAnnual,
      tspReturn: assumptions.tspReturnRate,
      rothReturn: assumptions.rothIRAReturnRate,
      yearsToRetirement: baseValues.yearsToRetirement,
      currentAge: baseValues.currentAge,
      retirementAge: baseValues.retirementAge,
      lifeExpectancy: baseValues.lifeExpectancy,
      annualTSPWithdrawal: tsp.annualWithdrawal,
      annualRothWithdrawal: roth.annualIncome,
      inflationRate: assumptions.inflationRate,
    })

    // Build income-vs-expenses year-by-year for Surplus/Deficit mini chart
    const currentYear = new Date().getFullYear()
    const annualIncomePhase2 = income.phase2Annual || 0
    const annualExpenses = expenses.totalAnnualAtRetirement || 0
    const incomeVsExpenses = Array.from({ length: Math.min(30, baseValues.yearsInRetirement) }, (_, i) => {
      const inflated = Math.pow(1 + (assumptions.inflationRate || 0.025), i)
      const yr = currentYear + baseValues.yearsToRetirement + i
      const inc = (annualIncomePhase2 * inflated) / 12
      const exp = (annualExpenses * inflated) / 12
      return { year: yr, income: Math.round(inc), expenses: Math.round(exp), surplus: Math.round(inc - exp) }
    })

    return { portfolioTimeline: timeline, incomeVsExpenses }
  }, [
    form.tspTraditionalBalance, form.tspRothBalance, form.rothIRABalance,
    form.annualContribTraditional, form.annualContribRoth, form.annualRothIRAContrib,
    tsp.employerMatchAnnual, tsp.annualWithdrawal, roth.annualIncome,
    assumptions.tspReturnRate, assumptions.rothIRAReturnRate, assumptions.inflationRate,
    baseValues.yearsToRetirement, baseValues.currentAge, baseValues.retirementAge, baseValues.lifeExpectancy,
    baseValues.yearsInRetirement, income.phase2Annual, expenses.totalAnnualAtRetirement,
  ])

  return {
    baseValues,
    fers,
    tsp,
    roth,
    ss,
    va,
    home,
    expenses,
    income: {
      ...income,
      totalMonthlyRetirementIncome: income.phase2Monthly,
      replacementRatio: surplus.replacementRatio,
    },
    taxes,
    surplus,
    rothConversion,
    portfolio,
    plan529,
    chartData,
  }
}
