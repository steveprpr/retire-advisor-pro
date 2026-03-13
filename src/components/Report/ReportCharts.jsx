// All 10 Recharts charts for the Report view
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, ReferenceLine,
} from 'recharts'
import { formatCurrency, formatPercent } from '../../utils/formatters.js'

// Color palette
const C = {
  navy: '#1B3A6B',
  blue: '#2E6DB4',
  sky: '#4A9FDF',
  green: '#1D9E75',
  orange: '#E85D04',
  gray: '#6B7280',
  lightGray: '#E5E7EB',
  red: '#DC2626',
}

const CHART_COLORS = [C.navy, C.blue, C.sky, C.green, C.orange, C.gray, '#8B5CF6', '#EC4899', '#F59E0B']

const currencyFormatter = (v) => formatCurrency(v, { compact: true })
const tooltipStyle = {
  backgroundColor: 'white',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '12px',
}

// ── Chart 1: Income Waterfall by Phase ───────────────────────────────────────
export function Chart1IncomeWaterfall({ calculations }) {
  const { income, expenses } = calculations
  const { components } = income

  const data = [
    {
      name: 'Phase 1\n(Pre-SS)',
      pension: Math.round(components.pensionAnnual),
      tsp: Math.round(components.tspAnnual),
      roth: Math.round(components.rothAnnual),
      va: Math.round(components.vaAnnual),
      partTime: Math.round(components.partTimeAnnual),
      other: Math.round(components.otherAnnual),
      expenses: Math.round(expenses.totalAnnualAtRetirement),
    },
    {
      name: 'Phase 2\n(SS Added)',
      pension: Math.round(components.pensionAnnual),
      tsp: Math.round(components.tspAnnual),
      roth: Math.round(components.rothAnnual),
      va: Math.round(components.vaAnnual),
      partTime: Math.round(components.partTimeAnnual),
      ss: Math.round(components.ssAnnual),
      spouseSS: Math.round(components.spouseSSAnnual),
      other: Math.round(components.otherAnnual),
      expenses: Math.round(expenses.totalAnnualAtRetirement),
    },
    {
      name: 'Phase 3\n(Survivor)',
      pension: Math.round(income.phase3Annual * 0.6),
      ss: Math.round(income.phase3Annual * 0.3),
      va: Math.round(components.vaAnnual),
      expenses: Math.round(expenses.totalAnnualAtRetirement * 0.85),
    },
  ]

  return (
    <ChartCard title="Income Waterfall by Phase">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} />
          <Legend />
          <Bar dataKey="pension" stackId="income" fill={C.navy} name="Pension" />
          <Bar dataKey="tsp" stackId="income" fill={C.blue} name="TSP/401k" />
          <Bar dataKey="ss" stackId="income" fill={C.sky} name="SS (yours)" />
          <Bar dataKey="spouseSS" stackId="income" fill="#93C5FD" name="SS (spouse)" />
          <Bar dataKey="va" stackId="income" fill={C.green} name="VA" />
          <Bar dataKey="roth" stackId="income" fill="#6EE7B7" name="Roth" />
          <Bar dataKey="partTime" stackId="income" fill={C.orange} name="Part-time" />
          <Bar dataKey="other" stackId="income" fill={C.gray} name="Other" />
          <Bar dataKey="expenses" fill="transparent" stroke={C.orange} strokeWidth={2} name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Chart 2: Portfolio Growth & Drawdown ────────────────────────────────────
export function Chart2PortfolioGrowth({ calculations }) {
  const { chartData, baseValues } = calculations
  const data = chartData?.timeline || []
  const currentYear = new Date().getFullYear()
  const retirementYear = currentYear + baseValues.yearsToRetirement

  return (
    <ChartCard title="Portfolio Growth & Drawdown">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
          <defs>
            <linearGradient id="tspGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={C.blue} stopOpacity={0.3} />
              <stop offset="95%" stopColor={C.blue} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="rothGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
              <stop offset="95%" stopColor={C.green} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
          <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={5} />
          <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} />
          <Legend />
          <ReferenceLine x={retirementYear} stroke={C.orange} strokeDasharray="4 4" label={{ value: 'Retire', position: 'top', fontSize: 10, fill: C.orange }} />
          <Area type="monotone" dataKey="tsp" stackId="1" stroke={C.blue} fill="url(#tspGrad)" name="TSP/401k" />
          <Area type="monotone" dataKey="roth" stackId="2" stroke={C.green} fill="url(#rothGrad)" name="Roth IRA" />
          <Line type="monotone" dataKey="total" stroke={C.navy} strokeWidth={2} dot={false} name="Total Portfolio" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Chart 3: Expense Breakdown (Donut) ────────────────────────────────────────
export function Chart3ExpenseBreakdown({ calculations }) {
  const { expenses } = calculations
  const cats = expenses.categories || {}

  const data = Object.entries(cats)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1'),
      value: Math.round(v),
    }))

  return (
    <ChartCard title="Expense Breakdown">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [formatCurrency(v) + '/mo', '']} contentStyle={tooltipStyle} />
          <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Chart 4: Income vs Expenses Over Time ────────────────────────────────────
export function Chart4IncomeVsExpenses({ calculations }) {
  const { baseValues, surplus, expenses, income } = calculations
  const data = []
  const startAge = baseValues.retirementAge
  const endAge = baseValues.lifeExpectancy
  const inflationRate = 0.025

  for (let age = startAge; age <= endAge; age++) {
    const yearsIn = age - startAge
    const inflatedExpenses = expenses.totalAnnualAtRetirement * Math.pow(1 + inflationRate, yearsIn)
    const phase2StartAge = startAge + 2  // approx SS at +2 yrs
    const afterTaxIncome = age < phase2StartAge
      ? surplus.afterTaxPhase1 * Math.pow(1 + 0.02, yearsIn)
      : surplus.afterTaxPhase2 * Math.pow(1 + 0.02, yearsIn)
    data.push({ age, income: Math.round(afterTaxIncome), expenses: Math.round(inflatedExpenses), surplus: Math.round(afterTaxIncome - inflatedExpenses) })
  }

  return (
    <ChartCard title="Income vs Expenses Over Time">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
          <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: 'Age', position: 'insideBottom', offset: -5, fontSize: 11 }} />
          <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} />
          <Legend />
          <Line type="monotone" dataKey="income" stroke={C.green} strokeWidth={2} dot={false} name="After-tax income" />
          <Line type="monotone" dataKey="expenses" stroke={C.orange} strokeWidth={2} dot={false} name="Total expenses" />
          <Line type="monotone" dataKey="surplus" stroke={C.blue} strokeWidth={1} dot={false} strokeDasharray="5 5" name="Surplus/Deficit" />
          <ReferenceLine y={0} stroke={C.gray} strokeDasharray="3 3" />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Chart 5: Social Security Strategy ───────────────────────────────────────
export function Chart5SSStrategy({ calculations }) {
  const { ss, baseValues } = calculations
  if (!ss.fraMonthly && ss.fraMonthly !== 0) return null

  const data = [
    {
      strategy: 'Age 62',
      monthly: Math.round(ss.at62Monthly),
      total80: Math.round(ss.lifetime80?.age62 || 0),
      total90: Math.round(ss.lifetime90?.age62 || 0),
    },
    {
      strategy: `FRA (${ss.fra || 67})`,
      monthly: Math.round(ss.fraMonthly),
      total80: Math.round(ss.lifetime80?.fra || 0),
      total90: Math.round(ss.lifetime90?.fra || 0),
    },
    {
      strategy: 'Age 70',
      monthly: Math.round(ss.at70Monthly),
      total80: Math.round(ss.lifetime80?.age70 || 0),
      total90: Math.round(ss.lifetime90?.age70 || 0),
    },
  ]

  return (
    <ChartCard title="Social Security Strategy Comparison">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
          <XAxis dataKey="strategy" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} />
          <Legend />
          <Bar dataKey="total80" fill={C.sky} name="Lifetime total by 80" />
          <Bar dataKey="total90" fill={C.blue} name="Lifetime total by 90" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        Break-even: Delay from 62→FRA pays off at age {Math.round(ss.breakEvenAge62vsFRA) || '—'} | FRA→70 pays off at age {Math.round(ss.breakEvenAge67vs70) || '—'}
      </div>
    </ChartCard>
  )
}

// ── Chart 6: Withdrawal Strategy Comparison ─────────────────────────────────
export function Chart6WithdrawalStrategy({ calculations }) {
  const { tsp, portfolio, baseValues } = calculations

  const data = [
    {
      strategy: '4% Rule',
      annualIncome: Math.round(tsp.fourPctIncome),
      portfolioAtLE: Math.round(portfolio.tspAtLE),
    },
    {
      strategy: 'Dividend (SCHD)',
      annualIncome: Math.round(tsp.dividendIncome),
      portfolioAtLE: Math.round(tsp.totalBalance * 1.02),  // price growth
    },
  ]

  return (
    <ChartCard title="Withdrawal Strategy Comparison">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
          <XAxis dataKey="strategy" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} />
          <Legend />
          <Bar dataKey="annualIncome" fill={C.green} name="Annual income at retirement" />
          <Bar dataKey="portfolioAtLE" fill={C.navy} name="Portfolio at life expectancy" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Chart 7: Legacy / Net Worth at Life Expectancy ───────────────────────────
export function Chart7Legacy({ calculations }) {
  const { portfolio, home } = calculations

  const data = [{
    name: `Age ${calculations.baseValues.lifeExpectancy}`,
    tsp: Math.round(Math.max(0, portfolio.tspAtLE)),
    roth: Math.round(Math.max(0, portfolio.rothAtLE)),
    homeEquity: Math.round(Math.max(0, home.valueAtLifeExpectancy * 0.6)),  // net of mortgage
    surplus: Math.round(Math.max(0, portfolio.surplusInvested)),
  }]

  const total = data[0] ? data[0].tsp + data[0].roth + data[0].homeEquity + data[0].surplus : 0

  return (
    <ChartCard title="Legacy / Net Worth at Life Expectancy">
      <div className="text-center mb-2">
        <span className="text-2xl font-bold text-[#1B3A6B] dark:text-blue-300">{formatCurrency(total, { compact: true })}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">total est. net worth</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} />
          <Legend />
          <Bar dataKey="tsp" stackId="a" fill={C.navy} name="TSP/401k" />
          <Bar dataKey="roth" stackId="a" fill={C.green} name="Roth IRA" />
          <Bar dataKey="homeEquity" stackId="a" fill={C.sky} name="Home equity" />
          <Bar dataKey="surplus" stackId="a" fill={C.orange} name="Surplus invested" />
        </BarChart>
      </ResponsiveContainer>
      {portfolio.perChildInheritance > 0 && (
        <p className="text-center text-sm text-[#1D9E75] mt-2">
          Per-child inheritance estimate: <strong>{formatCurrency(portfolio.perChildInheritance, { compact: true })}</strong>
        </p>
      )}
    </ChartCard>
  )
}

// ── Chart 8: 529 College Savings ─────────────────────────────────────────────
export function Chart8College529({ calculations }) {
  const { plan529 } = calculations
  if (!plan529?.grandchildren?.length) return null

  const colors = [C.blue, C.green, C.orange, C.sky, C.navy]

  // Build timeline data
  const currentYear = new Date().getFullYear()
  const maxYears = 20
  const data = []
  for (let y = 0; y <= maxYears; y++) {
    const row = { year: currentYear + y }
    plan529.grandchildren.forEach((gc, i) => {
      const age = (plan529.ages[i] || 0) + y
      row[`child${i + 1}`] = age < 18 ? Math.round((gc.balance || 0) * Math.pow(0.95, Math.max(0, 18 - age))) : 0
    })
    data.push(row)
  }

  return (
    <ChartCard title="529 College Savings Projection">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
          <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={4} />
          <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} />
          <Legend />
          {plan529.grandchildren.map((_, i) => (
            <Line key={i} type="monotone" dataKey={`child${i + 1}`} stroke={colors[i]} strokeWidth={2} dot={false} name={`Grandchild ${i + 1} (age ${plan529.ages[i]})`} />
          ))}
          <ReferenceLine y={plan529.grandchildren[0]?.projected4YearCost || 0} stroke={C.orange} strokeDasharray="4 4" label={{ value: '4yr cost', fontSize: 10, fill: C.orange }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Chart 9: COL Comparison (Expat) ─────────────────────────────────────────
export function Chart9COLComparison({ calculations, countryName }) {
  const { expenses } = calculations
  if (!countryName) return null

  const cats = expenses.categories || {}
  const colMultiplier = expenses.colMultiplier || 1.0

  const data = Object.entries(cats)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      category: k.charAt(0).toUpperCase() + k.slice(1),
      US: Math.round(v / colMultiplier),
      [countryName]: Math.round(v),
      savings: Math.round(v / colMultiplier - v),
    }))
    .filter(d => d.savings > 0)
    .slice(0, 8)

  if (data.length === 0) return null

  return (
    <ChartCard title={`Cost of Living: US vs ${countryName}`}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 80, left: 80, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} horizontal={false} />
          <XAxis type="number" tickFormatter={currencyFormatter} tick={{ fontSize: 10 }} />
          <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={70} />
          <Tooltip formatter={(v) => formatCurrency(v) + '/mo'} contentStyle={tooltipStyle} />
          <Legend />
          <Bar dataKey="US" fill={C.blue} name="US (current state)" />
          <Bar dataKey={countryName} fill={C.green} name={countryName} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Chart 10: FERS Options Comparison ────────────────────────────────────────
export function Chart10FERSOptions({ calculations }) {
  const { fers } = calculations
  if (!fers?.fersOptions) return null

  const opts = fers.fersOptions
  const data = [
    { option: 'Take Now', annual: Math.round(opts.takeNow?.annual || 0), monthly: Math.round(opts.takeNow?.monthly || 0), total90: Math.round(opts.takeNow?.totalLE || 0) },
    { option: 'Postpone 60', annual: Math.round(opts.postpone60?.annual || 0), monthly: Math.round(opts.postpone60?.monthly || 0), total90: Math.round(opts.postpone60?.totalLE || 0) },
    { option: 'Postpone 62', annual: Math.round(opts.postpone62?.annual || 0), monthly: Math.round(opts.postpone62?.monthly || 0), total90: Math.round(opts.postpone62?.totalLE || 0) },
  ]

  return (
    <ChartCard title="FERS Retirement Options Comparison">
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium text-xs">Option</th>
              <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium text-xs">Annual</th>
              <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium text-xs">Monthly</th>
              <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium text-xs">Lifetime Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={r.option} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 font-medium">{r.option}</td>
                <td className="text-right py-2">{formatCurrency(r.annual)}</td>
                <td className="text-right py-2">{formatCurrency(r.monthly)}</td>
                <td className="text-right py-2">{formatCurrency(r.total90, { compact: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
          <XAxis dataKey="option" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={tooltipStyle} />
          <Bar dataKey="annual" fill={C.blue} name="Annual benefit" />
          <Bar dataKey="total90" fill={C.navy} name="Lifetime total (est.)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── Shared chart wrapper ──────────────────────────────────────────────────────
function ChartCard({ title, children }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-[#1B3A6B] dark:text-blue-300 mb-3 text-sm">{title}</h3>
      {children}
    </div>
  )
}
