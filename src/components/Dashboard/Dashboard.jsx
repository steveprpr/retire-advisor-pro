import { useCalculations } from '../../context/CalculationsContext.jsx'
import { useUI, useForm } from '../../context/AppContext.jsx'
import { MetricCards, IncomeBreakdownCard, PortfolioHealthCard } from './MetricCards.jsx'
import { PortfolioMiniChart, IncomeMiniChart, SurplusMiniChart } from './MiniCharts.jsx'
import { RetirementAgeComparison } from './RetirementAgeComparison.jsx'
import { formatCurrency } from '../../utils/formatters.js'

export default function Dashboard() {
  const calc = useCalculations()
  const { dispatch } = useUI()

  const openAssumptions = () => dispatch({ type: 'UI/TOGGLE_ASSUMPTIONS_PANEL' })
  const goToReport = () => dispatch({ type: 'UI/SET_TAB', tab: 'report' })

  if (!calc) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center text-gray-500">
        Loading calculations…
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1B3A6B] dark:text-blue-300">Your Retirement Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Live estimates — updates as you change inputs
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={openAssumptions} className="btn-ghost text-sm no-print">
            Assumptions
          </button>
          <button type="button" onClick={goToReport} className="btn-primary text-sm no-print">
            Full Report →
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <MetricCards calculations={calc} />

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Portfolio Trajectory
          </h3>
          <PortfolioMiniChart chartData={calc.chartData} />
        </div>
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Income Sources
          </h3>
          <IncomeMiniChart
            fers={calc.fers}
            ss={calc.ss}
            tsp={calc.tsp}
            va={calc.va}
            chartData={calc.chartData}
          />
        </div>
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Monthly Surplus/Deficit
          </h3>
          <SurplusMiniChart chartData={calc.chartData} />
        </div>
      </div>

      {/* Income + Portfolio health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IncomeBreakdownCard calculations={calc} />
        <PortfolioHealthCard calculations={calc} />
      </div>

      {/* Retirement Age Comparison */}
      <RetirementAgeComparison ssAt62Monthly={calc.ss?.at62Monthly ?? 0} ssAtFRAMonthly={calc.ss?.fraMonthly ?? 0} />

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickStat label="FERS Annuity" value={formatCurrency(calc.fers?.netMonthlyAnnuity ?? 0)} sub="monthly net" />
        <QuickStat label="Social Security" value={formatCurrency(calc.ss?.selectedMonthly ?? 0)} sub={`at ${calc.ss?.fra ? `age ${Math.floor(calc.ss.fra)}` : 'FRA'}`} />
        <QuickStat label="Effective Tax Rate" value={`${((calc.taxes?.overallEffectiveRate ?? 0) * 100).toFixed(1)}%`} sub="in retirement" />
        <QuickStat label="Replacement Ratio" value={`${calc.income?.replacementRatio ?? 0}%`} sub="of pre-retirement income" />
        <QuickStat label="TSP at Retirement" value={formatCurrency(calc.tsp?.balanceAtRetirement ?? 0, { compact: true })} sub="projected balance" />
        <QuickStat label="Portfolio Longevity" value={`${calc.portfolio?.longevityYears ?? '?'} yrs`} sub="4% rule estimate" />
        <QuickStat label="Monte Carlo" value={`${calc.portfolio?.monteCarloSuccessRate ?? 0}%`} sub="success rate" />
        <QuickStat label="Legacy Estimate" value={formatCurrency(calc.portfolio?.legacyNetWorth ?? 0, { compact: true })} sub="at life expectancy" />
      </div>

      {/* Legacy Widget */}
      <LegacyWidget legacyNetWorth={calc.portfolio?.legacyNetWorth ?? 0} />

      {/* CTA to report */}
      <div className="card p-4 bg-gradient-to-r from-[#1B3A6B]/5 to-[#2E6DB4]/5 dark:from-[#1B3A6B]/20 dark:to-[#2E6DB4]/20 border-[#2E6DB4]/20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-[#1B3A6B] dark:text-blue-300">Ready for your full AI-powered analysis?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Get a personalized narrative report with income strategy, tax optimization, action plan, and more.
            </p>
          </div>
          <button type="button" onClick={goToReport} className="btn-primary whitespace-nowrap flex-shrink-0">
            Generate Report →
          </button>
        </div>
      </div>
    </div>
  )
}

function LegacyWidget({ legacyNetWorth }) {
  const { form, updateField } = useForm()
  const n = form.numberOfChildren || 0
  const perChild = n > 0 && legacyNetWorth > 0 ? Math.round(legacyNetWorth / n) : 0

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[#1B3A6B] dark:text-blue-300">Legacy &amp; Inheritance</h3>
        <span className="text-xs text-gray-400 dark:text-gray-600">at life expectancy</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#1B3A6B] dark:text-blue-300">
            {formatCurrency(legacyNetWorth, { compact: true })}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">estimated estate value</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => updateField('numberOfChildren', Math.max(0, n - 1))}
              className="w-6 h-6 rounded-full border border-gray-300 text-gray-600 hover:border-[#2E6DB4] hover:text-[#2E6DB4] text-sm flex items-center justify-center"
            >−</button>
            <div className="text-2xl font-bold text-[#1B3A6B] dark:text-blue-300 min-w-[2ch] text-center">{n}</div>
            <button
              type="button"
              onClick={() => updateField('numberOfChildren', n + 1)}
              className="w-6 h-6 rounded-full border border-gray-300 text-gray-600 hover:border-[#2E6DB4] hover:text-[#2E6DB4] text-sm flex items-center justify-center"
            >+</button>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">children / heirs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[#1D9E75] dark:text-green-400">
            {n > 0 ? formatCurrency(perChild, { compact: true }) : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">per child / heir</div>
        </div>
      </div>
      {legacyNetWorth <= 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
          Complete savings and expense steps for an estimate
        </p>
      )}
    </div>
  )
}

function QuickStat({ label, value, sub }) {
  return (
    <div className="card p-3">
      <div className="text-base font-bold text-[#1B3A6B] dark:text-blue-300">{value}</div>
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</div>
      <div className="text-xs text-gray-400 dark:text-gray-500">{sub}</div>
    </div>
  )
}
