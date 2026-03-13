import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useUI, useForm, useAssumptions, useAppState } from '../../context/AppContext.jsx'
import { useCalculations } from '../../context/CalculationsContext.jsx'
import { useReportStream } from '../../hooks/useReportStream.js'
import { formatCurrency } from '../../utils/formatters.js'
import {
  Chart1IncomeWaterfall,
  Chart2PortfolioGrowth,
  Chart3ExpenseBreakdown,
  Chart4IncomeVsExpenses,
  Chart5SSStrategy,
  Chart6WithdrawalStrategy,
  Chart7Legacy,
  Chart8College529,
  Chart9COLComparison,
  Chart10FERSOptions,
} from './ReportCharts.jsx'

// Sections in the report where we interleave charts
const CHART_ANCHORS = {
  '[2] RETIREMENT INCOME':  'chart2income',
  '[3] TAX PICTURE':        null,
  '[4] BUDGET ANALYSIS':    'chart4budget',
  '[5] PORTFOLIO STRATEGY': 'chart5portfolio',
  '[6] LOCATION ANALYSIS':  'chart6location',
  '[7] SPECIAL CONSIDERATIONS': null,
  '[8] LEGACY':             'chart7legacy',
  '[9] ACTION PLAN':        null,
  '[10] DISCLAIMER':        null,
}

export default function ReportView() {
  const { ui, dispatch } = useUI()
  const { form } = useForm()
  const { assumptions } = useAssumptions()
  const { dispatch: appDispatch } = useAppState()
  const calc = useCalculations()
  const { generateReport: generate, remainingReports: remaining } = useReportStream()
  const canGenerate = remaining > 0
  const reportRef = useRef(null)
  const [copied, setCopied] = useState(false)

  const content = ui.reportContent ?? ''
  const isStreaming = ui.reportGenerating ?? false
  const isStale = ui.reportIsStale ?? false
  const modelUsed = ui.reportModelUsed ?? null
  const reportError = ui.reportError ?? null

  const isFederal = form.employmentType === 'federal' || form.employmentType === 'military'
  const isExpat = form.retirementLocationType === 'international'
  const has529 = form.has529Plan && form.grandchildren?.length > 0

  const handleGenerate = () => {
    generate(calc, form)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const handleStartOver = () => {
    appDispatch({ type: 'UI/REOPEN_WIZARD' })
    window.scrollTo(0, 0)
  }

  const handleOpenAssumptions = () => {
    dispatch({ type: 'UI/TOGGLE_ASSUMPTIONS_PANEL' })
  }

  // Scroll to top when report is first generated
  useEffect(() => {
    if (isStreaming && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [isStreaming])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6" ref={reportRef}>
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 -mx-4 px-4 py-3 mb-6 no-print flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-[#1B3A6B] dark:text-blue-300">
            Retirement Report
          </h1>
          {isStale && (
            <span className="stale-banner">
              ⚠ Inputs changed — regenerate for updated analysis
            </span>
          )}
          {isStreaming && (
            <span className="text-sm text-[#2E6DB4] dark:text-blue-400 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#2E6DB4] animate-pulse" />
              Generating…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={handleOpenAssumptions} className="btn-ghost text-sm no-print">
            Edit Assumptions
          </button>
          {content && (
            <>
              <button type="button" onClick={handleCopy} className="btn-ghost text-sm no-print">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <button type="button" onClick={handlePrint} className="btn-secondary text-sm no-print">
                Export PDF
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleStartOver}
            className="btn-ghost text-sm no-print"
          >
            ← Edit Inputs
          </button>
        </div>
      </div>

      {/* Print header (only shows when printing) */}
      <div className="hidden print-only mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A6B]">RetireAdvisor Pro — Retirement Report</h1>
        <p className="text-sm text-gray-500 mt-1">Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Metric summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 no-print">
        <MiniMetric
          label="Monthly Income"
          value={formatCurrency(calc?.income?.totalMonthlyRetirementIncome ?? 0)}
          sub={`${calc?.income?.replacementRatio ?? 0}% replacement`}
          color="blue"
        />
        <MiniMetric
          label="Monthly Expenses"
          value={formatCurrency(calc?.expenses?.totalMonthlyAtRetirement ?? 0)}
          sub={`in retirement dollars`}
          color={
            (calc?.surplus?.phase2SurplusMonthly ?? 0) >= 0 ? 'green' : 'orange'
          }
        />
        <MiniMetric
          label="Portfolio at Retire"
          value={formatCurrency(calc?.tsp?.balanceAtRetirement ?? 0, { compact: true })}
          sub={`${calc?.portfolio?.longevityYears ?? '?'} yr longevity`}
          color="navy"
        />
        <MiniMetric
          label="Monte Carlo"
          value={`${calc?.portfolio?.monteCarloSuccessRate ?? 0}%`}
          sub="success rate"
          color={
            (calc?.portfolio?.monteCarloSuccessRate ?? 0) >= 80 ? 'green' :
            (calc?.portfolio?.monteCarloSuccessRate ?? 0) >= 60 ? 'blue' : 'orange'
          }
        />
      </div>

      {/* Error banner */}
      {reportError && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
          ⚠️ {reportError}
        </div>
      )}

      {/* Generate button — when no content yet */}
      {!content && !isStreaming && (
        <div className="card text-center py-12 no-print">
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-[#1B3A6B] dark:text-blue-300 mb-2">
            Ready to Generate Your Report
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2 max-w-md mx-auto text-sm">
            AI-powered analysis of your retirement plan — income streams, tax picture, portfolio strategy, and a personalized action plan.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
            {remaining} report generation{remaining !== 1 ? 's' : ''} remaining this session
          </p>
          {canGenerate ? (
            <button type="button" onClick={handleGenerate} className="btn-primary px-8 py-3 text-base">
              Generate My Report →
            </button>
          ) : (
            <div className="text-sm text-orange-600 dark:text-orange-400">
              Report limit reached for this session. Refresh to start a new session.
            </div>
          )}
        </div>
      )}

      {/* Streaming placeholder */}
      {isStreaming && !content && (
        <div className="card py-8 text-center">
          <div className="streaming-cursor text-gray-400 text-lg">Analyzing your retirement plan…</div>
        </div>
      )}

      {/* Report content */}
      {content && (
        <div className="space-y-6">
          {/* Interleaved narrative + charts */}
          <ReportContent
            content={content}
            calc={calc}
            form={form}
            isFederal={isFederal}
            isExpat={isExpat}
            has529={has529}
            isStreaming={isStreaming}
          />

          {/* Regenerate button */}
          {!isStreaming && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between no-print">
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {modelUsed && `Generated with ${modelUsed}`}
                {' · '}
                {remaining} report{remaining !== 1 ? 's' : ''} remaining this session
              </div>
              <div className="flex gap-2">
                {canGenerate && (
                  <button type="button" onClick={handleGenerate} className="btn-secondary text-sm">
                    Regenerate
                  </button>
                )}
                <button type="button" onClick={handlePrint} className="btn-primary text-sm">
                  Export PDF
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Report Content — splits markdown by section headers and interleaves charts ─
function ReportContent({ content, calc, form, isFederal, isExpat, has529, isStreaming }) {
  // Split content into sections by ## [N] headers
  const sections = splitIntoSections(content)

  return (
    <div className="space-y-6">
      {sections.map((section, idx) => (
        <div key={idx}>
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-[#1B3A6B] dark:prose-headings:text-blue-300 prose-a:text-[#2E6DB4]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {section.text}
            </ReactMarkdown>
          </div>

          {/* Interleaved charts after specific sections */}
          {section.anchor === 'chart2income' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="card p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Income by Source</h4>
                <Chart1IncomeWaterfall data={calc?.chartData?.incomeWaterfall} />
              </div>
              <div className="card p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Social Security Strategy</h4>
                <Chart5SSStrategy data={calc?.chartData?.ssStrategy} form={form} />
              </div>
            </div>
          )}

          {section.anchor === 'chart4budget' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="card p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Expense Breakdown</h4>
                <Chart3ExpenseBreakdown data={calc?.chartData?.expenseBreakdown} />
              </div>
              <div className="card p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Income vs Expenses Over Time</h4>
                <Chart4IncomeVsExpenses data={calc?.chartData?.incomeVsExpenses} />
              </div>
            </div>
          )}

          {section.anchor === 'chart5portfolio' && (
            <div className="space-y-4 mt-4">
              <div className="card p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Portfolio Growth & Drawdown</h4>
                <Chart2PortfolioGrowth data={calc?.chartData?.portfolioTimeline} form={form} />
              </div>
              <div className="card p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Withdrawal Strategy Comparison</h4>
                <Chart6WithdrawalStrategy data={calc?.chartData?.withdrawalComparison} />
              </div>
            </div>
          )}

          {section.anchor === 'chart6location' && isExpat && (
            <div className="card p-4 mt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Cost of Living Comparison</h4>
              <Chart9COLComparison data={calc?.chartData?.colComparison} form={form} />
            </div>
          )}

          {section.anchor === 'chart6location' && isFederal && (
            <div className="card p-4 mt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">FERS Retirement Options</h4>
              <Chart10FERSOptions data={calc?.chartData?.fersOptions} calc={calc} form={form} />
            </div>
          )}

          {section.anchor === 'chart7legacy' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="card p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Legacy Net Worth</h4>
                <Chart7Legacy data={calc?.chartData?.legacyNetWorth} />
              </div>
              {has529 && (
                <div className="card p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">529 College Savings</h4>
                  <Chart8College529 data={calc?.chartData?.plan529} form={form} />
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Streaming cursor at end */}
      {isStreaming && (
        <span className="streaming-cursor text-[#2E6DB4]" />
      )}
    </div>
  )
}

// Split markdown content into sections by ## headers
function splitIntoSections(content) {
  const lines = content.split('\n')
  const sections = []
  let current = { text: '', anchor: null }

  for (const line of lines) {
    // Detect ## [N] section header
    const match = line.match(/^##\s+\[(\d+)\]\s+(.+)/)
    if (match) {
      if (current.text.trim()) {
        sections.push(current)
      }
      // Determine chart anchor for this section
      const fullHeader = `[${match[1]}] ${match[2].trim()}`
      const anchor = findAnchor(fullHeader)
      current = { text: line + '\n', anchor }
    } else {
      current.text += line + '\n'
    }
  }

  if (current.text.trim()) {
    sections.push(current)
  }

  return sections.length > 0 ? sections : [{ text: content, anchor: null }]
}

function findAnchor(header) {
  for (const [key, anchor] of Object.entries(CHART_ANCHORS)) {
    if (header.includes(key)) return anchor
  }
  return null
}

// ── Mini metric card ──────────────────────────────────────────────────────────
function MiniMetric({ label, value, sub, color }) {
  const borderColor = {
    navy: 'border-[#1B3A6B]',
    blue: 'border-[#2E6DB4]',
    green: 'border-[#1D9E75]',
    orange: 'border-[#E85D04]',
  }[color] ?? 'border-gray-300'

  const textColor = {
    navy: 'text-[#1B3A6B] dark:text-blue-300',
    blue: 'text-[#2E6DB4] dark:text-blue-400',
    green: 'text-[#1D9E75] dark:text-green-400',
    orange: 'text-[#E85D04] dark:text-orange-400',
  }[color] ?? 'text-gray-700'

  return (
    <div className={`card p-3 border-l-4 ${borderColor}`}>
      <div className={`text-lg font-bold ${textColor}`}>{value}</div>
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</div>
      <div className="text-xs text-gray-400 dark:text-gray-500">{sub}</div>
    </div>
  )
}
