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
        body: JSON.stringify(payload),
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
            if (parsed.error) {
              dispatch({ type: 'UI/SET_REPORT_ERROR', error: parsed.error })
              return
            }
            if (parsed.model) {
              dispatch({ type: 'UI/SET_REPORT_MODEL', model: parsed.model })
            }
            if (parsed.content) {
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
  const { fers, tsp, roth, ss, va, home, expenses, income, taxes, surplus, portfolio, plan529, baseValues } = calc

  return {
    // Key context (no PII)
    employmentType: form.employmentType,
    retirementSystem: form.retirementSystem,
    specialCategory: form.specialCategory,
    retirementAge: baseValues.retirementAge,
    currentAge: baseValues.currentAge,
    lifeExpectancy: baseValues.lifeExpectancy,
    yearsInRetirement: baseValues.yearsInRetirement,
    maritalStatus: form.maritalStatus,
    retirementLocationType: form.retirementLocationType,
    retirementStateCode: form.retirementStateCode,
    retirementCountry: form.retirementCountry,
    withdrawalStrategy: form.withdrawalStrategy,
    riskTolerance: form.riskTolerance,
    biggestConcern: form.biggestConcern,
    reportDetailLevel: form.reportDetailLevel,
    specialNotes: form.specialNotes,

    // Key numbers
    monthlyPension: Math.round(fers.netMonthlyAnnuity),
    pensionEarlyPenaltyPct: Math.round((fers.penaltyRate || 0) * 100),
    tspBalanceAtRetirement: Math.round(tsp.totalBalance),
    tspMonthlyWithdrawal: Math.round(tsp.annualWithdrawal / 12),
    rothBalanceAtRetirement: Math.round(roth.balance),
    ssMonthlySelected: Math.round(ss.selectedMonthly),
    ssClaimingAge: form.ssClaimingStrategy,
    ssFRA: ss.fra,
    vaMonthlyBenefit: Math.round(va.monthly),
    monthlyExpenses: Math.round(expenses.totalMonthlyAtRetirement),
    afterTaxMonthlyIncomePhase2: Math.round(surplus.afterTaxPhase2 / 12),
    monthlySurplusPhase2: Math.round(surplus.phase2SurplusMonthly),
    effectiveTaxRate: Math.round(taxes.overallEffectiveRate * 100),
    replacementRatio: surplus.replacementRatio,
    monteCarloSuccessRate: portfolio.monteCarloSuccessRate,  // already 0-100 integer
    portfolioDepletionYear: portfolio.tspDepletionYear,
    totalNetWorthAtLE: Math.round(portfolio.totalNetWorthAtLE),
    perChildInheritance: Math.round(portfolio.perChildInheritance),
    homeEquityAtRetirement: Math.round(home.netEquity),
    colMultiplier: Math.round(expenses.colMultiplier * 100),

    // Flags for special considerations
    flags: {
      isEarlyRetirement: fers.isEarlyRetirement,
      hasFERSPenalty: (fers.penaltyRate || 0) > 0,
      hasMilitaryDeposit: form.militaryService === 'deposit_progress',
      hasVABenefit: va.monthly > 0,
      isPuertoRican: form.puertoRicanHeritage !== 'neither',
      retiresToSpain: form.retirementCountryKey === 'spain',
      backdoorRothNeeded: (form.currentSalary || 0) > 236000,
      has529: (form.grandchildrenAges || '').trim().length > 0,
      hasSurvivorAnnuity: form.survivorAnnuityElection !== 'none',
    },
  }
}
