import { useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { formatCurrency } from '../../utils/formatters.js'

const COLORS = {
  navy: '#1B3A6B',
  blue: '#2E6DB4',
  sky: '#4A9FDF',
  green: '#1D9E75',
  orange: '#E85D04',
}

// ── Portfolio Growth Mini Chart ──────────────────────────────────────────────
export function PortfolioMiniChart({ chartData }) {
  const data = chartData?.portfolioTimeline ?? []
  if (!data.length) return <ChartPlaceholder label="Portfolio growth" />

  // Show accumulation + 10 drawdown years
  const retirementIdx = data.findIndex(d => d.phase === 'drawdown')
  const sliced = data.slice(0, retirementIdx >= 0 ? retirementIdx + 11 : data.length)

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={sliced} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="miniPortGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="year"
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 9, fill: '#9CA3AF' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`}
          width={38}
        />
        <Tooltip
          formatter={(v) => formatCurrency(v, { compact: true })}
          labelFormatter={(l) => `Year ${l}`}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #E5E7EB' }}
        />
        {retirementIdx >= 0 && (
          <ReferenceLine
            x={data[retirementIdx]?.year}
            stroke={COLORS.green}
            strokeDasharray="3 3"
            label={{ value: 'Retire', fill: COLORS.green, fontSize: 9, position: 'insideTopRight' }}
          />
        )}
        <Area
          type="monotone"
          dataKey="total"
          stroke={COLORS.blue}
          fill="url(#miniPortGrad)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Income Breakdown Mini Chart ──────────────────────────────────────────────
export function IncomeMiniChart({ fers, ss, tsp, va, income, chartData }) {
  const data = useMemo(() => {
    if (chartData?.incomeWaterfall?.length) {
      // Use first retirement-phase data point
      const point = chartData.incomeWaterfall.find(d => d.phase === 'early') ?? chartData.incomeWaterfall[0]
      if (point) {
        return [
          { label: 'FERS/Pension', value: point.fers ?? 0, color: COLORS.navy },
          { label: 'SRS Bridge',   value: point.srs ?? 0,  color: '#059669' },
          { label: 'Social Sec.',  value: point.ss ?? 0,   color: COLORS.blue },
          { label: 'Spouse SS',    value: point.spouseSS ?? 0, color: '#60A5FA' },
          { label: 'TSP/Portfolio',value: point.tsp ?? 0,  color: COLORS.sky },
          { label: 'VA Benefit',   value: point.va ?? 0,   color: COLORS.green },
        ].filter(d => d.value > 0)
      }
    }
    // Fallback to raw calc values
    const srsMonthly = fers?.hasSRS ? (fers?.srsMonthly ?? 0) : 0
    const spouseSSMonthly = (ss?.spousalAnnual ?? 0) / 12
    return [
      { label: 'FERS/Pension', value: fers?.monthlyAnnuity ?? 0,             color: COLORS.navy },
      { label: 'SRS Bridge',   value: srsMonthly,                             color: '#059669' },
      { label: 'Social Sec.',  value: ss?.selectedMonthly ?? 0,               color: COLORS.blue },
      { label: 'Spouse SS',    value: spouseSSMonthly,                        color: '#60A5FA' },
      { label: 'TSP/Portfolio',value: (tsp?.annualWithdrawal ?? 0) / 12,      color: COLORS.sky },
      { label: 'VA Benefit',   value: va?.monthly ?? 0,                       color: COLORS.green },
    ].filter(d => d.value > 0)
  }, [fers, ss, tsp, va, income, chartData])

  if (!data.length) return <ChartPlaceholder label="Income sources" />

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 10, fill: '#6B7280' }}
          tickLine={false}
          axisLine={false}
          width={70}
        />
        <Tooltip
          formatter={(v) => formatCurrency(v)}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #E5E7EB' }}
        />
        <Bar dataKey="value" radius={[0, 3, 3, 0]} label={{ position: 'right', fontSize: 10, formatter: v => formatCurrency(v, { compact: true }) }}>
          {data.map((entry, i) => (
            <rect key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Surplus / Deficit Trend Chart ────────────────────────────────────────────
export function SurplusMiniChart({ chartData }) {
  const data = chartData?.incomeVsExpenses ?? []
  if (!data.length) return <ChartPlaceholder label="Surplus trend" />

  const trimmed = data.slice(0, 20)

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={trimmed} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="surplusGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.35} />
            <stop offset="95%" stopColor={COLORS.green} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="deficitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.35} />
            <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="year"
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis hide />
        <Tooltip
          formatter={(v) => formatCurrency(v, { compact: true })}
          labelFormatter={(l) => `Year ${l}`}
          contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #E5E7EB' }}
        />
        <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="surplus"
          stroke={COLORS.green}
          fill="url(#surplusGrad)"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Placeholder ──────────────────────────────────────────────────────────────
function ChartPlaceholder({ label }) {
  return (
    <div className="flex items-center justify-center h-[120px] text-xs text-gray-400 dark:text-gray-600">
      {label} — complete wizard to see chart
    </div>
  )
}
