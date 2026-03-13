// OpenRouter SSE streaming hook for report generation

import { useCallback } from 'react'
import { useAppState } from '../context/AppContext.jsx'
import { RATE_LIMITS } from '../config/modelRouter.js'

const RATE_LIMIT_KEY = 'retire_advisor_report_count'
const QUICK_LIMIT_KEY = 'retire_advisor_quick_count'

function getRateCount(key) {
  try { return parseInt(sessionStorage.getItem(key) || '0') } catch { return 0 }
}

function incrementRateCount(key) {
  try { sessionStorage.setItem(key, String(getRateCount(key) + 1)) } catch {}
}

export function useReportStream() {
  const { state, dispatch } = useAppState()

  const generateReport = useCallback(async (calculations, formSummary) => {
    // Rate limit check
    const count = getRateCount(RATE_LIMIT_KEY)
    if (count >= RATE_LIMITS.fullReport) {
      dispatch({ type: 'UI/SET_REPORT_ERROR', error: `Report generation limit reached (${RATE_LIMITS.fullReport} per session). Refresh the page to reset.` })
      return
    }

    dispatch({ type: 'UI/SET_REPORT_GENERATING', value: true })
    dispatch({ type: 'UI/CLEAR_REPORT' })

    // Build a condensed payload (not all 48 numbers — just the key ones)
    const payload = buildReportPayload(calculations, formSummary)

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      })

      if (!response.ok) {
        const err = await response.text().catch(() => 'Unknown error')
        dispatch({ type: 'UI/SET_REPORT_ERROR', error: `Request failed: ${response.status} — ${err}` })
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6).trim()
          if (data === '[DONE]') {
            dispatch({ type: 'UI/SET_REPORT_GENERATING', value: false })
            incrementRateCount(RATE_LIMIT_KEY)
            return
          }
          // Skip SSE comment lines (OpenRouter keepalive)
          if (data.startsWith(':')) continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'error' || parsed.error) {
              dispatch({ type: 'UI/SET_REPORT_ERROR', error: parsed.message || parsed.error })
              return
            }
            if (parsed.type === 'done') {
              dispatch({ type: 'UI/SET_REPORT_GENERATING', value: false })
              incrementRateCount(RATE_LIMIT_KEY)
              return
            }
            if (parsed.type === 'model' && parsed.model) {
              dispatch({ type: 'UI/SET_REPORT_MODEL', model: parsed.model })
            }
            if (parsed.type === 'chunk' && parsed.content) {
              dispatch({ type: 'UI/APPEND_REPORT_CONTENT', content: parsed.content })
            }
          } catch {
            // Silently skip malformed chunks
          }
        }
      }

      dispatch({ type: 'UI/SET_REPORT_GENERATING', value: false })
      incrementRateCount(RATE_LIMIT_KEY)
    } catch (err) {
      dispatch({ type: 'UI/SET_REPORT_ERROR', error: err.message || 'Network error. Please try again.' })
    }
  }, [dispatch])

  const remainingReports = RATE_LIMITS.fullReport - getRateCount(RATE_LIMIT_KEY)

  return {
    generateReport,
    isGenerating: state.ui.reportGenerating,
    reportContent: state.ui.reportContent,
    reportError: state.ui.reportError,
    modelUsed: state.ui.reportModelUsed,
    remainingReports,
  }
}

// ── Quick Insight (tooltips, summaries) ───────────────────────────────────────
export function useQuickInsight() {
  const callback = useCallback(async (question, context = '') => {
    const count = getRateCount(QUICK_LIMIT_KEY)
    if (count >= RATE_LIMITS.quickInsight) return 'Quick insight limit reached for this session.'

    try {
      const response = await fetch('/api/quick-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context }),
      })
      if (!response.ok) return 'Unable to load insight at this time.'
      const data = await response.json()
      incrementRateCount(QUICK_LIMIT_KEY)
      return data.content || ''
    } catch {
      return 'Unable to load insight at this time.'
    }
  }, [])

  return { askQuestion: callback }
}

// ── Build condensed payload for AI report ────────────────────────────────────
function buildReportPayload(calc, form) {
  const { fers, tsp, roth, ss, va, home, expenses, income, taxes, surplus, portfolio, baseValues } = calc

  const totalInvestable = (tsp?.totalBalance ?? 0) + (roth?.balance ?? 0)
  const yearsToRetirement = Math.max(0, (baseValues?.retirementAge ?? 60) - (baseValues?.currentAge ?? 55))
  const colSavingsPct = expenses?.colMultiplier ? Math.round((1 - expenses.colMultiplier) * 100) : 0

  return {
    // Demographics
    employmentType: form.employmentType,
    retirementSystem: form.retirementSystem,
    specialCategory: form.specialCategory,
    birthYear: form.birthYear,
    retirementAge: baseValues?.retirementAge ?? 60,
    currentAge: baseValues?.currentAge ?? 55,
    yearsToRetirement,
    lifeExpectancy: baseValues?.lifeExpectancy ?? 85,
    maritalStatus: form.maritalStatus,
    filingStatus: form.maritalStatus === 'married' ? 'MFJ' : 'single',

    // Monthly income (names match server's buildUserMessage)
    fersMonthly: Math.round(fers?.netMonthlyAnnuity ?? 0),
    srsMonthly: Math.round(fers?.srsMonthly ?? 0),
    hasSRS: fers?.hasSRS ?? false,
    ssStrategy: form.ssClaimingStrategy ?? 'fra',
    ssMonthly: Math.round(ss?.selectedMonthly ?? 0),
    tspMonthly: Math.round((tsp?.annualWithdrawal ?? 0) / 12),
    vaMonthly: Math.round(va?.monthly ?? 0),
    rentalMonthly: Math.round(income?.rentalMonthlyNet ?? 0),
    otherMonthly: Math.round(income?.otherMonthlyIncome ?? 0),
    totalMonthlyIncome: Math.round(income?.totalMonthlyRetirementIncome ?? 0),

    // Expenses
    totalMonthlyExpenses: Math.round(expenses?.totalMonthlyAtRetirement ?? 0),
    monthlySurplus: Math.round(surplus?.phase2SurplusMonthly ?? 0),
    replacementRatio: surplus?.replacementRatio ?? 0,

    // Portfolio
    tspBalanceAtRetirement: Math.round(tsp?.totalBalance ?? 0),
    rothBalanceAtRetirement: Math.round(roth?.balance ?? 0),
    totalInvestableAssets: Math.round(totalInvestable),
    withdrawalStrategy: form.withdrawalStrategy ?? '4% rule',
    fourPctWithdrawal: Math.round(totalInvestable * 0.04 / 12),
    portfolioLongevityYears: portfolio?.longevityYears ?? 0,
    monteCarloSuccessRate: portfolio?.monteCarloSuccessRate ?? 0,

    // Taxes
    effectiveTaxRate: Math.round((taxes?.overallEffectiveRate ?? 0) * 100),
    annualFederalTax: Math.round((taxes?.federalTax ?? 0)),
    stateCode: form.retirementStateCode ?? form.currentStateCode ?? 'unknown',
    ssTaxablePortion: Math.round((taxes?.ssTaxablePortion ?? 0) * 100),

    // Real estate & legacy
    homeEquityAtRetirement: Math.round(home?.netEquity ?? 0),
    legacyNetWorth: Math.round(portfolio?.totalNetWorthAtLE ?? 0),
    legacyPriority: form.legacyPriority ?? 'undecided',

    // Location
    retirementLocation: form.retirementLocationType === 'international'
      ? `International — ${form.retirementCountry ?? 'unknown'}`
      : `US — ${form.retirementStateCode ?? 'unknown'}`,
    countryKey: form.retirementCountryKey ?? null,
    countryName: form.retirementCountry ?? null,
    colSavingsPct,

    // Special flags
    vaRating: form.vaRating ?? 0,
    militaryBuyback: form.militaryService === 'deposit_progress' || form.militaryService === 'deposit_paid',
    wepGpoApplies: false,
    puertoRicanHeritage: false,
    has529: (form.grandchildrenAges || '').trim().length > 0,
    plan529Balance: 0,
    collegeCoverageYears: 0,

    // Report preferences
    specificConcerns: [form.biggestConcern, form.specialNotes].filter(Boolean).join(' | ') || 'None provided.',
    reportDetailLevel: form.reportDetailLevel ?? 'standard',
    riskTolerance: form.riskTolerance ?? 'moderate',
  }
}
