import { formatCurrency, formatPercent } from '../../utils/formatters.js'
import { clsx } from 'clsx'

export function MetricCards({ calculations }) {
  const { income, surplus, taxes, portfolio, fers, ss, tsp, baseValues } = calculations

  const cards = [
    {
      label: 'After-Tax Monthly Income (Phase 2)',
      value: formatCurrency(surplus.afterTaxPhase2 / 12),
      subLabel: 'With Social Security',
      color: 'blue',
      icon: '💰',
    },
    {
      label: 'Monthly Expenses',
      value: formatCurrency(calculations.expenses.totalMonthlyAtRetirement),
      subLabel: "At retirement year (inflation-adj'd)",
      color: 'neutral',
      icon: '📊',
    },
    {
      label: `Monthly ${surplus.phase2SurplusMonthly >= 0 ? 'Surplus' : 'Deficit'}`,
      value: formatCurrency(Math.abs(surplus.phase2SurplusMonthly)),
      subLabel: surplus.phase2SurplusMonthly >= 0 ? 'After taxes & expenses' : '⚠️ Income gap — see report',
      color: surplus.phase2SurplusMonthly >= 0 ? 'green' : 'red',
      icon: surplus.phase2SurplusMonthly >= 0 ? '✅' : '⚠️',
    },
    {
      label: 'Portfolio at Life Expectancy',
      value: formatCurrency(portfolio.totalNetWorthAtLE, { compact: true }),
      subLabel: `Age ${baseValues.lifeExpectancy} (incl. home equity)`,
      color: 'blue',
      icon: '🏛️',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className={clsx('card', {
          'border-[#2E6DB4]': card.color === 'blue',
          'border-[#1D9E75]': card.color === 'green',
          'border-[#E85D04]': card.color === 'red',
          'border-gray-200 dark:border-gray-700': card.color === 'neutral',
        })}>
          <div className="flex items-start justify-between">
            <span className="text-xl">{card.icon}</span>
            <span className={clsx('badge text-xs', {
              'badge-blue': card.color === 'blue',
              'badge-green': card.color === 'green',
              'badge-orange': card.color === 'red',
              'badge-gray': card.color === 'neutral',
            })}>
              {card.color === 'green' ? 'Surplus' : card.color === 'red' ? 'Deficit' : ''}
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-0.5">{card.label}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.subLabel}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function IncomeBreakdownCard({ calculations }) {
  const { income, taxes } = calculations
  const { components } = income

  const streams = [
    { label: 'FERS/Pension', value: components.pensionAnnual, color: '#1B3A6B' },
    { label: 'TSP/401k', value: components.tspAnnual, color: '#2E6DB4' },
    { label: 'Social Security', value: components.ssAnnual, color: '#4A9FDF' },
    { label: 'Roth IRA', value: components.rothAnnual, color: '#1D9E75' },
    { label: 'VA Disability', value: components.vaAnnual, color: '#6B7280' },
    { label: 'Other', value: components.otherAnnual + components.partTimeAnnual, color: '#9CA3AF' },
  ].filter(s => s.value > 0)

  const totalAnnual = streams.reduce((a, s) => a + s.value, 0)

  return (
    <div className="card">
      <h3 className="section-title">Income Breakdown (Phase 2)</h3>
      <div className="space-y-2">
        {streams.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-24 text-xs text-gray-500 dark:text-gray-400 text-right truncate">{s.label}</div>
            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${totalAnnual > 0 ? (s.value / totalAnnual) * 100 : 0}%`, backgroundColor: s.color }}
              />
            </div>
            <div className="w-20 text-xs font-medium text-right">{formatCurrency(s.value / 12)}/mo</div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Effective tax rate</span>
        <span className="font-medium">{formatPercent(taxes.overallEffectiveRate)}</span>
      </div>
    </div>
  )
}

export function PortfolioHealthCard({ calculations }) {
  const { portfolio, tsp, roth } = calculations

  const successPct = portfolio.monteCarloSuccessRate ?? 0  // already 0–100 integer
  const successColor = successPct >= 90 ? '#1D9E75' : successPct >= 75 ? '#E85D04' : '#DC2626'

  return (
    <div className="card">
      <h3 className="section-title">Portfolio Health</h3>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={successColor} strokeWidth="3" strokeDasharray={`${successPct}, 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold" style={{ color: successColor }}>{successPct}%</span>
          </div>
        </div>
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200">Monte Carlo Success Rate</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Portfolio survives to life expectancy</p>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">TSP at retirement</span>
              <span className="font-medium">{formatCurrency(tsp.totalBalance, { compact: true })}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Roth at retirement</span>
              <span className="font-medium">{formatCurrency(roth.balance, { compact: true })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
