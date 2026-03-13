import { useEffect, useRef } from 'react'
import { useAssumptions, useUI } from '../../context/AppContext.jsx'
import { SliderWithInput } from '../common/SliderWithInput.jsx'
import { formatPercent } from '../../utils/formatters.js'

export default function AssumptionsPanel() {
  const { assumptions, updateAssumption, resetAssumptions, batchUpdate } = useAssumptions()
  const { ui, dispatch } = useUI()
  const panelRef = useRef(null)

  const close = () => dispatch({ type: 'UI/TOGGLE_ASSUMPTIONS_PANEL' })

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target) && ui.assumptionsPanelOpen) {
        close()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ui.assumptionsPanelOpen])

  const exportAssumptions = () => {
    const blob = new Blob([JSON.stringify(assumptions, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'retire-advisor-assumptions.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!ui.assumptionsPanelOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40 no-print" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto no-print"
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="font-semibold text-[#1B3A6B] dark:text-blue-300">Calculation Assumptions</h2>
          <button type="button" onClick={close} className="btn-ghost text-lg">✕</button>
        </div>

        <div className="p-4 space-y-6">
          {/* Returns */}
          <Section title="Returns & Growth">
            <SliderRow label="TSP/401k blended return" value={assumptions.tspReturnRate * 100} onChange={v => updateAssumption('tspReturnRate', v / 100)} min={3} max={12} step={0.1} suffix="%" />
            <SliderRow label="Roth IRA return" value={assumptions.rothIRAReturnRate * 100} onChange={v => updateAssumption('rothIRAReturnRate', v / 100)} min={3} max={12} step={0.1} suffix="%" />
            <SliderRow label="Portfolio drawdown return" value={assumptions.portfolioDrawdownReturn * 100} onChange={v => updateAssumption('portfolioDrawdownReturn', v / 100)} min={2} max={10} step={0.1} suffix="%" />
            <SliderRow label="Surplus reinvestment return" value={assumptions.surplusReinvestmentReturn * 100} onChange={v => updateAssumption('surplusReinvestmentReturn', v / 100)} min={2} max={10} step={0.1} suffix="%" />
            <SliderRow label="Safe withdrawal rate (4% rule)" value={assumptions.safeWithdrawalRate * 100} onChange={v => updateAssumption('safeWithdrawalRate', v / 100)} min={2} max={6} step={0.1} suffix="%" />
          </Section>

          {/* Inflation */}
          <Section title="Inflation">
            <SliderRow label="General inflation rate" value={assumptions.inflationRate * 100} onChange={v => updateAssumption('inflationRate', v / 100)} min={1.5} max={5} step={0.1} suffix="%" />
            <SliderRow label="Healthcare inflation rate" value={assumptions.healthcareInflationRate * 100} onChange={v => updateAssumption('healthcareInflationRate', v / 100)} min={2} max={8} step={0.1} suffix="%" />
            <SliderRow label="College cost inflation" value={assumptions.collegeInflationRate * 100} onChange={v => updateAssumption('collegeInflationRate', v / 100)} min={2} max={8} step={0.1} suffix="%" />
            <SliderRow label="Home appreciation rate" value={assumptions.homeAppreciationRate * 100} onChange={v => updateAssumption('homeAppreciationRate', v / 100)} min={1} max={6} step={0.1} suffix="%" />
          </Section>

          {/* FERS/CSRS */}
          <Section title="FERS / CSRS">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">FERS COLA is capped by OPM rules (CPI−1% if CPI&gt;3%).</div>
            <SliderRow label="FERS COLA rate assumption" value={assumptions.fersCOLARate * 100} onChange={v => updateAssumption('fersCOLARate', v / 100)} min={0} max={4} step={0.1} suffix="%" />
            <SliderRow label="Early retirement penalty" value={assumptions.fersEarlyPenaltyRate * 100} onChange={v => updateAssumption('fersEarlyPenaltyRate', v / 100)} min={0} max={10} step={0.5} suffix="% per yr under 62" />
            <SliderRow label="Home selling costs" value={assumptions.homeSellingCostsPct * 100} onChange={v => updateAssumption('homeSellingCostsPct', v / 100)} min={2} max={10} step={0.5} suffix="%" />
          </Section>

          {/* Social Security */}
          <Section title="Social Security">
            <SliderRow label="SS COLA rate assumption" value={assumptions.ssCOLARate * 100} onChange={v => updateAssumption('ssCOLARate', v / 100)} min={0} max={5} step={0.1} suffix="%" />
            <SliderRow label="SS benefit at 62 (% of FRA)" value={(1 - assumptions.ssReductionAt62) * 100} onChange={v => updateAssumption('ssReductionAt62', 1 - v / 100)} min={60} max={95} step={1} suffix="%" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">WEP/GPO applies</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={assumptions.wepGpoApplies} onChange={e => updateAssumption('wepGpoApplies', e.target.checked)} />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2E6DB4] dark:bg-gray-700"></div>
              </label>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">WEP/GPO was repealed Jan 2025 (Social Security Fairness Act). Enable only to model pre-2025 scenario.</p>
          </Section>

          {/* Dividend */}
          <Section title="Dividend Strategy">
            <SliderRow label="SCHD yield" value={assumptions.schdYield * 100} onChange={v => updateAssumption('schdYield', v / 100)} min={1} max={8} step={0.1} suffix="%" />
            <SliderRow label="SCHD dividend growth" value={assumptions.schdDividendGrowth * 100} onChange={v => updateAssumption('schdDividendGrowth', v / 100)} min={0} max={15} step={0.5} suffix="%" />
            <SliderRow label="VYM yield" value={assumptions.vymYield * 100} onChange={v => updateAssumption('vymYield', v / 100)} min={1} max={7} step={0.1} suffix="%" />
            <SliderRow label="JEPI yield" value={assumptions.jepYield * 100} onChange={v => updateAssumption('jepYield', v / 100)} min={3} max={12} step={0.1} suffix="%" />
          </Section>

          {/* Monte Carlo */}
          <Section title="Monte Carlo">
            <SliderRow label="Simulation runs" value={assumptions.monteCarloRuns} onChange={v => updateAssumption('monteCarloRuns', v)} min={100} max={1000} step={100} suffix="" />
            <SliderRow label="Portfolio volatility (std dev)" value={assumptions.stockVolatility * 100} onChange={v => updateAssumption('stockVolatility', v / 100)} min={5} max={30} step={1} suffix="%" />
            <SliderRow label="Inflation volatility (std dev)" value={assumptions.inflationVolatility * 100} onChange={v => updateAssumption('inflationVolatility', v / 100)} min={0} max={3} step={0.1} suffix="%" />
          </Section>

          {/* 529 */}
          <Section title="529 / College">
            <SliderRow label="529 growth rate" value={assumptions.plan529GrowthRate * 100} onChange={v => updateAssumption('plan529GrowthRate', v / 100)} min={3} max={10} step={0.1} suffix="%" />
          </Section>
        </div>

        {/* Footer buttons */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex gap-2">
          <button type="button" onClick={resetAssumptions} className="btn-secondary flex-1 text-sm">
            Reset to defaults
          </button>
          <button type="button" onClick={exportAssumptions} className="btn-secondary flex-1 text-sm">
            Export JSON
          </button>
          <button type="button" onClick={close} className="btn-primary flex-1 text-sm">
            Apply
          </button>
        </div>
      </div>
    </>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function SliderRow({ label, value, onChange, min, max, step, suffix }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-gray-600 dark:text-gray-400 flex-1">{label}</label>
      <div className="flex items-center gap-2 w-40">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="text-sm font-mono text-right w-14">
          {Number.isInteger(step) ? Math.round(value) : value.toFixed(1)}{suffix}
        </span>
      </div>
    </div>
  )
}
