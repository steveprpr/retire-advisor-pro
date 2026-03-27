import { useCalculations } from '../../context/CalculationsContext.jsx'
import { useUI, useForm, useAssumptions } from '../../context/AppContext.jsx'
import { MetricCards, IncomeBreakdownCard, PortfolioHealthCard } from './MetricCards.jsx'
import { PortfolioMiniChart, IncomeMiniChart, SurplusMiniChart } from './MiniCharts.jsx'
import { RetirementAgeComparison } from './RetirementAgeComparison.jsx'
import { formatCurrency } from '../../utils/formatters.js'
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

const COLORS = {
  navy: '#1B3A6B',
  blue: '#2E6DB4',
  sky: '#4A9FDF',
  green: '#1D9E75',
  orange: '#E85D04',
}

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
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

      {/* Title + actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1B3A6B] dark:text-blue-300">Your Retirement Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Live estimates — updates as you change inputs</p>
        </div>
        <div className="flex gap-2 no-print">
          <button type="button" onClick={openAssumptions} className="btn-ghost text-sm">Assumptions</button>
          <button type="button" onClick={goToReport} className="btn-primary text-sm">Full Report →</button>
        </div>
      </div>

      {/* Readiness Score Hero */}
      <ReadinessScore calculations={calc} />

      {/* KPI Metric Cards */}
      <MetricCards calculations={calc} />

      {/* Mini Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Portfolio Trajectory</h3>
          <PortfolioMiniChart chartData={calc.chartData} />
        </div>
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Income Sources</h3>
          <IncomeMiniChart fers={calc.fers} ss={calc.ss} tsp={calc.tsp} va={calc.va} income={calc.income} chartData={calc.chartData} />
        </div>
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Monthly Surplus/Deficit</h3>
          <SurplusMiniChart chartData={calc.chartData} />
        </div>
      </div>

      {/* Income Phase Timeline */}
      <IncomePhaseChart calculations={calc} />

      {/* Income breakdown + Portfolio health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IncomeBreakdownCard calculations={calc} />
        <PortfolioHealthCard calculations={calc} />
      </div>

      {/* Retirement Age Comparison (federal only) */}
      <RetirementAgeComparison
        ssAt62Monthly={calc.ss?.at62Monthly ?? 0}
        ssAtFRAMonthly={calc.ss?.fraMonthly ?? 0}
      />

      {/* Stats Grid */}
      <StatsGrid calculations={calc} />

      {/* Net Worth Over Time */}
      <NetWorthChart calculations={calc} />

      {/* Roth Conversion Highlight */}
      <RothConversionCard rothConversion={calc.rothConversion} />

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
          <button type="button" onClick={goToReport} className="btn-primary whitespace-nowrap flex-shrink-0 no-print">
            Generate Report →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Readiness Score Hero ───────────────────────────────────────────────────────
function ReadinessScore({ calculations }) {
  const { surplus, portfolio, income, baseValues } = calculations
  const monteCarlo = portfolio?.monteCarloSuccessRate ?? 0

  // Budget surplus score: how well does income cover expenses?
  // 0 = deep deficit, 50 = break-even, 100 = surplus ≥ 100% of expenses
  const monthlyExpenses = (surplus?.annualExpenses ?? 0) / 12
  const phase1SurplusMonthly = surplus?.phase1SurplusMonthly ?? 0
  const budgetScore = monthlyExpenses > 0
    ? Math.min(100, Math.max(0, 50 + (phase1SurplusMonthly / monthlyExpenses) * 50))
    : 50

  // Income coverage vs pre-retirement salary (capped 0–100)
  const replacement = Math.min(100, Math.max(0, income?.replacementRatio ?? 0))

  // Weighted score: 50% portfolio survival + 30% budget surplus + 20% salary replacement
  const score = Math.round(monteCarlo * 0.5 + budgetScore * 0.3 + replacement * 0.2)
  const isGood = score >= 85
  const isOk = score >= 70

  const statusLabel = isGood ? 'On Track' : isOk ? 'Needs Attention' : 'At Risk'
  const statusBg = isGood
    ? 'from-[#1B3A6B] to-[#2E6DB4]'
    : isOk
    ? 'from-[#7B3F00] to-[#2E6DB4]'
    : 'from-[#7F1D1D] to-[#1B3A6B]'
  const statusBadgeBg = isGood ? 'bg-green-400/25 text-green-100' : isOk ? 'bg-orange-400/25 text-orange-100' : 'bg-red-400/25 text-red-100'

  const monthly = (surplus?.afterTaxPhase2 ?? 0) / 12
  const retirementAge = baseValues?.retirementAge ?? 60

  // Actionable tip
  const tip = monteCarlo < 75 && budgetScore >= 70
    ? `Your portfolio has a ${100 - monteCarlo}% chance of running out before life expectancy — consider reducing withdrawals or delaying retirement 1–2 years.`
    : phase1SurplusMonthly < 0
    ? `You have a Phase 1 income gap of ${formatCurrency(Math.abs(phase1SurplusMonthly))}/mo before Social Security. Consider part-time income or delaying retirement.`
    : !isGood && retirementAge < 62
    ? `Retiring at ${retirementAge} may include an early-retirement penalty. Delaying to age 62+ removes the penalty and allows you to claim Social Security without a reduction.`
    : !isGood
    ? `Aim for a portfolio survival rate ≥ 85% and a comfortable monthly surplus to reach "On Track" status.`
    : null

  return (
    <div className={`card p-5 bg-gradient-to-br ${statusBg} text-white overflow-hidden relative`}>
      {/* Ghost number watermark */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center pr-6 opacity-[0.07] pointer-events-none select-none">
        <span className="text-[110px] font-black leading-none">{score}</span>
      </div>

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Score */}
        <div>
          <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest">Retirement Readiness Score</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-5xl font-black tabular-nums">{score}</span>
            <span className="text-blue-300 text-lg mb-1.5">/100</span>
          </div>
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${statusBadgeBg}`}>
            {statusLabel}
          </span>
          {/* Score bar */}
          <div className="mt-3 bg-white/20 rounded-full h-1.5 w-40">
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="text-blue-300 text-xs mt-1.5">
            50% portfolio survival · 30% budget surplus · 20% salary coverage
          </p>
          {tip && (
            <p className="text-yellow-200 text-xs mt-2 max-w-xs leading-snug">
              💡 {tip}
            </p>
          )}
        </div>

        {/* Key metrics */}
        <div className="flex gap-5 sm:gap-8 flex-shrink-0">
          <div className="text-center">
            <p className="text-blue-200 text-xs uppercase tracking-wide">Monthly Income</p>
            <p className="text-white font-bold text-lg mt-0.5">{formatCurrency(monthly)}</p>
            <p className="text-blue-300 text-xs">after-tax (Phase 2)</p>
          </div>
          <div className="text-center">
            <p className="text-blue-200 text-xs uppercase tracking-wide">Budget Surplus</p>
            <p className="text-white font-bold text-lg mt-0.5">{formatCurrency(phase1SurplusMonthly)}/mo</p>
            <p className="text-blue-300 text-xs">Phase 1 · income minus expenses</p>
          </div>
          <div className="text-center">
            <p className="text-blue-200 text-xs uppercase tracking-wide">Portfolio Survival</p>
            <p className="text-white font-bold text-lg mt-0.5">{monteCarlo}%</p>
            <p className="text-blue-300 text-xs">500 Monte Carlo runs · target ≥85%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Income Phase Timeline ──────────────────────────────────────────────────────
function IncomePhaseChart({ calculations }) {
  const { form } = useForm()
  const { assumptions } = useAssumptions()
  const { fers, ss, tsp, roth, va, baseValues } = calculations

  const retirementAge = baseValues?.retirementAge ?? 60
  const lifeExpectancy = baseValues?.lifeExpectancy ?? 90
  const ssClaimAge = form.ssClaimingStrategy === '62' ? 62 : form.ssClaimingStrategy === '70' ? 70 : 67

  const pensionMonthly = fers?.netMonthlyAnnuity ?? 0
  const srsMonthly = fers?.srsMonthly ?? 0
  const hasSRS = fers?.hasSRS ?? false
  const ssMonthly = ss?.selectedMonthly ?? 0
  const spouseSSMonthly = (ss?.spousalAnnual ?? 0) / 12
  const tspMonthly = (tsp?.annualWithdrawal ?? 0) / 12
  const rothMonthly = (roth?.annualIncome ?? 0) / 12
  const vaMonthly = va?.monthly ?? 0

  // COLA rates
  const fersCola = assumptions?.fersCOLARate ?? 0.02
  const ssCola = assumptions?.ssCOLARate ?? 0.025
  const vaCola = assumptions?.vaCOLARate ?? 0.025

  const data = []
  for (let age = retirementAge; age <= lifeExpectancy; age++) {
    // FERS COLA only kicks in at age 62 (OPM rule)
    const fersColarYears = Math.max(0, age - 62)
    const pensionWithCola = pensionMonthly * Math.pow(1 + fersCola, fersColarYears)

    // SS COLA applies from the year claiming begins
    const ssColaYears = age > ssClaimAge ? age - ssClaimAge : 0
    const ssWithCola = ssMonthly * Math.pow(1 + ssCola, ssColaYears)
    const spouseSSWithCola = spouseSSMonthly * Math.pow(1 + ssCola, ssColaYears)

    // VA COLA applies from retirement
    const vaColaYears = age - retirementAge
    const vaWithCola = vaMonthly * Math.pow(1 + vaCola, vaColaYears)

    data.push({
      age,
      Pension: Math.round(pensionWithCola),
      SRS: hasSRS && age < 62 ? Math.round(srsMonthly) : 0,
      'Social Security': age >= ssClaimAge ? Math.round(ssWithCola + spouseSSWithCola) : 0,
      'TSP/Portfolio': Math.round(tspMonthly),
      Roth: Math.round(rothMonthly),
      VA: vaMonthly > 0 ? Math.round(vaWithCola) : 0,
    })
  }

  const allKeys = ['Pension', 'SRS', 'Social Security', 'TSP/Portfolio', 'Roth', 'VA']
  const activeKeys = allKeys.filter(k => data.some(d => d[k] > 0))

  if (!activeKeys.length || data.length < 2) return null

  const colorMap = {
    Pension: COLORS.navy,
    SRS: COLORS.green,
    'Social Security': COLORS.sky,
    'TSP/Portfolio': COLORS.blue,
    Roth: '#059669',
    VA: '#6B7280',
  }

  const phaseLines = []
  if (hasSRS) phaseLines.push({ x: 62, label: 'SRS ends / SS eligible', color: COLORS.green })
  if (ssClaimAge !== 62) phaseLines.push({ x: ssClaimAge, label: `SS starts (${ssClaimAge})`, color: COLORS.sky })

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-semibold text-[#1B3A6B] dark:text-blue-300">Retirement Income by Age</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Monthly income composition across retirement
            {hasSRS && ' · SRS bridge ends at 62'}
            {` · Social Security begins at ${ssClaimAge}`}
          </p>
        </div>
        {hasSRS && (
          <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full whitespace-nowrap">
            SRS active
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="0%">
          <XAxis
            dataKey="age"
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
            interval={Math.max(1, Math.floor(data.length / 8))}
            tickFormatter={v => `${v}`}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
            width={42}
          />
          <Tooltip
            formatter={(v, name) => [formatCurrency(v) + '/mo', name]}
            labelFormatter={l => `Age ${l}`}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E7EB' }}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          {phaseLines.map(pl => (
            <ReferenceLine
              key={pl.x}
              x={pl.x}
              stroke={pl.color}
              strokeDasharray="4 2"
              label={{ value: pl.label, fontSize: 9, fill: pl.color, position: 'insideTopRight' }}
            />
          ))}
          {activeKeys.map(k => (
            <Bar key={k} dataKey={k} stackId="inc" fill={colorMap[k]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Stats Grid ─────────────────────────────────────────────────────────────────
function StatsGrid({ calculations }) {
  const { form } = useForm()
  const { fers, ss, taxes, income, tsp, portfolio, roth } = calculations

  const longevity = portfolio?.longevityYears ?? '?'
  const monteCarlo = portfolio?.monteCarloSuccessRate ?? 0
  const taxRate = (taxes?.overallEffectiveRate ?? 0) * 100

  // SS: combine your benefit + spouse benefit, show actual claiming age
  const ssClaimAge = form.ssClaimingStrategy === '62' ? 62 : form.ssClaimingStrategy === '70' ? 70 : Math.round(ss?.fra ?? 67)
  const spouseSSMonthly = (ss?.spousalAnnual ?? 0) / 12
  const totalSSMonthly = (ss?.selectedMonthly ?? 0) + spouseSSMonthly

  const stats = [
    {
      label: 'FERS / Pension',
      value: formatCurrency(fers?.netMonthlyAnnuity ?? 0),
      sub: 'monthly net (after survivor benefit)',
      icon: '🏛️',
      accent: 'navy',
    },
    {
      label: spouseSSMonthly > 0 ? 'Social Security (you + spouse)' : 'Social Security',
      value: formatCurrency(totalSSMonthly),
      sub: `your benefit claimed at age ${ssClaimAge}${spouseSSMonthly > 0 ? ` · +${formatCurrency(spouseSSMonthly)} spouse` : ''}`,
      icon: '🛡️',
      accent: 'blue',
    },
    {
      label: 'Effective Tax Rate',
      value: `${taxRate.toFixed(1)}%`,
      sub: 'estimated average in retirement',
      icon: '📋',
      accent: taxRate < 15 ? 'green' : taxRate < 25 ? 'orange' : 'red',
    },
    {
      label: 'Income Coverage',
      value: `${income?.replacementRatio ?? 0}%`,
      sub: 'of pre-retirement salary · 80%+ is solid',
      icon: '📈',
      accent: (income?.replacementRatio ?? 0) >= 80 ? 'green' : (income?.replacementRatio ?? 0) >= 65 ? 'orange' : 'red',
    },
    {
      label: 'TSP at Retirement',
      value: formatCurrency(tsp?.balanceAtRetirement ?? 0, { compact: true }),
      sub: 'projected balance',
      icon: '💼',
      accent: 'blue',
    },
    {
      label: 'Portfolio Longevity',
      value: `${longevity} yrs`,
      sub: '4% rule estimate',
      icon: '⏳',
      accent: longevity === '?' ? 'gray' : longevity >= 30 ? 'green' : longevity >= 20 ? 'orange' : 'red',
    },
    {
      label: 'Monte Carlo',
      value: `${monteCarlo}%`,
      sub: 'success rate (500 runs)',
      icon: '🎲',
      accent: monteCarlo >= 90 ? 'green' : monteCarlo >= 75 ? 'orange' : 'red',
    },
    {
      label: 'Legacy Estimate',
      value: formatCurrency(portfolio?.legacyNetWorth ?? 0, { compact: true }),
      sub: 'at life expectancy',
      icon: '🏦',
      accent: 'navy',
    },
  ]

  const accentBorder = {
    navy: 'border-t-[#1B3A6B]',
    blue: 'border-t-[#2E6DB4]',
    green: 'border-t-[#1D9E75]',
    orange: 'border-t-[#E85D04]',
    red: 'border-t-red-500',
    gray: 'border-t-gray-300 dark:border-t-gray-600',
  }
  const accentText = {
    navy: 'text-[#1B3A6B] dark:text-blue-400',
    blue: 'text-[#2E6DB4] dark:text-blue-400',
    green: 'text-[#1D9E75]',
    orange: 'text-[#E85D04]',
    red: 'text-red-600 dark:text-red-400',
    gray: 'text-gray-400',
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className={`card p-3 border-t-2 ${accentBorder[s.accent]}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-base">{s.icon}</span>
          </div>
          <div className={`text-xl font-bold tabular-nums ${accentText[s.accent]}`}>{s.value}</div>
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{s.label}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">{s.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ── Roth Conversion Card ───────────────────────────────────────────────────────
function RothConversionCard({ rothConversion }) {
  if (!rothConversion || !rothConversion.annualConversionAmount || rothConversion.annualConversionAmount <= 0) return null

  const { annualConversionAmount, annualTaxCost, breakEvenAge, netLifetimeBenefit, totalConverted } = rothConversion

  return (
    <div className="card p-4 border-[#1D9E75] bg-emerald-50/50 dark:bg-emerald-950/30">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">♻️</span>
        <h3 className="font-semibold text-[#1D9E75]">Roth Conversion Strategy Active</h3>
        <span className="badge badge-green text-xs ml-auto">Optimizing Tax</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Annual conversion</p>
          <p className="font-bold text-gray-900 dark:text-gray-100 mt-0.5">{formatCurrency(annualConversionAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tax cost / year</p>
          <p className="font-bold text-orange-600 dark:text-orange-400 mt-0.5">{formatCurrency(annualTaxCost)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Break-even age</p>
          <p className="font-bold text-gray-900 dark:text-gray-100 mt-0.5">{breakEvenAge ? `Age ${breakEvenAge}` : '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Net lifetime benefit</p>
          <p className={`font-bold mt-0.5 ${netLifetimeBenefit > 0 ? 'text-[#1D9E75]' : 'text-orange-600'}`}>
            {netLifetimeBenefit > 0 ? '+' : ''}{formatCurrency(netLifetimeBenefit, { compact: true })}
          </p>
        </div>
      </div>
      {totalConverted > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 border-t border-emerald-100 dark:border-emerald-800 pt-2">
          Total projected to convert: {formatCurrency(totalConverted, { compact: true })} · Tax-free growth runs to life expectancy
        </p>
      )}
    </div>
  )
}

// ── Net Worth Over Time ────────────────────────────────────────────────────────
function NetWorthChart({ calculations }) {
  const { tsp, roth, home, portfolio, baseValues, assumptions } = calculations
  const { form } = useForm()

  const currentAge = baseValues?.currentAge ?? 50
  const retirementAge = baseValues?.retirementAge ?? 60
  const lifeExpectancy = baseValues?.lifeExpectancy ?? 90
  const yearsToRetirement = baseValues?.yearsToRetirement ?? 10
  const yearsInRetirement = baseValues?.yearsInRetirement ?? 30

  // Build data: accumulation phase (today → retirement) + drawdown phase (retirement → LE)
  const data = []

  // ── Accumulation phase ──
  const tspYBY = tsp?.yearByYear ?? []
  const homeGrowthRate = assumptions?.homeAppreciationRate ?? 0.03
  const homeNow = home?.currentValue ?? 0
  const mortgageNow = form.mortgageBalance || 0

  for (let y = 0; y < yearsToRetirement; y++) {
    const age = currentAge + y
    const tspVal = tspYBY[y]?.total ?? 0
    const homeVal = homeNow * Math.pow(1 + homeGrowthRate, y)
    // Simple mortgage reduction estimate
    const mortgageVal = Math.max(0, mortgageNow * Math.pow(0.97, y))
    const homeEquity = Math.max(0, homeVal - mortgageVal)
    data.push({
      age,
      label: `Age ${age}`,
      Portfolio: Math.round(tspVal),
      'Home Equity': Math.round(homeEquity),
      Total: Math.round(tspVal + homeEquity),
    })
  }

  // ── Drawdown phase ──
  const tspDrawdown = portfolio?.tspDrawdown ?? []
  const homeAtRetirement = home?.valueAtRetirement ?? 0
  const mortgageAtRetirement = home?.mortgageAtRetirement ?? 0
  const homeEquityAtRetirement = Math.max(0, homeAtRetirement - mortgageAtRetirement)
  const isSelling = ['sell_buy', 'sell_rent'].includes(form.retirementHomePlan)

  for (let y = 0; y < yearsInRetirement; y++) {
    const age = retirementAge + y
    const tspVal = tspDrawdown[y]?.balance ?? 0
    const rothVal = Math.max(0, (roth?.balance ?? 0) * Math.pow(1 + (assumptions?.rothIRAReturnRate ?? 0.07) - ((roth?.annualIncome ?? 0) / Math.max(roth?.balance ?? 1, 1)), y))
    const portfolioVal = Math.max(0, tspVal + rothVal)
    let homeEquity = 0
    if (!isSelling) {
      homeEquity = homeEquityAtRetirement * Math.pow(1 + homeGrowthRate, y)
    } else if (form.retirementHomePlan === 'sell_buy' && (form.newHomeBudget || 0) > 0) {
      homeEquity = (form.newHomeBudget || 0) * Math.pow(1 + homeGrowthRate, y)
    }
    data.push({
      age,
      label: `Age ${age}`,
      Portfolio: Math.round(portfolioVal),
      'Home Equity': Math.round(homeEquity),
      Total: Math.round(portfolioVal + homeEquity),
    })
  }

  if (data.length < 2) return null

  const retirementIdx = data.findIndex(d => d.age === retirementAge)

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-semibold text-[#1B3A6B] dark:text-blue-300">Net Worth Over Time</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Portfolio (TSP + Roth) + home equity · accumulation then drawdown
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="nwPortGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.5} />
              <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="nwHomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.4} />
              <stop offset="95%" stopColor={COLORS.green} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="age"
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
            interval={Math.max(1, Math.floor(data.length / 8))}
            tickFormatter={v => `${v}`}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`}
            width={48}
          />
          <Tooltip
            formatter={(v, name) => [formatCurrency(v, { compact: true }), name]}
            labelFormatter={l => `Age ${l}`}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E7EB' }}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          {retirementIdx > 0 && (
            <ReferenceLine
              x={retirementAge}
              stroke={COLORS.orange}
              strokeDasharray="4 2"
              label={{ value: 'Retire', fontSize: 9, fill: COLORS.orange, position: 'insideTopRight' }}
            />
          )}
          <Area type="monotone" dataKey="Home Equity" stackId="nw" stroke={COLORS.green} fill="url(#nwHomeGrad)" strokeWidth={1.5} dot={false} />
          <Area type="monotone" dataKey="Portfolio" stackId="nw" stroke={COLORS.blue} fill="url(#nwPortGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Legacy Widget ──────────────────────────────────────────────────────────────
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
