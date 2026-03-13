import { useCallback } from 'react'
import { clsx } from 'clsx'
import { formatCurrency, parseCurrency } from '../../utils/formatters.js'

export function ExpenseField({
  label,
  fieldKey,
  value,
  onChange,
  avgAmount,
  avgLabel,
  helpText,
  min = 0,
  max = 5000,
  step = 10,
  className,
}) {
  const handleChange = useCallback((e) => {
    const val = parseCurrency(e.target.value)
    onChange(fieldKey, isNaN(val) ? 0 : val)
  }, [fieldKey, onChange])

  const handleUseAvg = useCallback(() => {
    if (avgAmount !== undefined) onChange(fieldKey, avgAmount)
  }, [fieldKey, avgAmount, onChange])

  const sliderPct = max > 0 ? (Math.min(value || 0, max) / max) * 100 : 0

  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm text-gray-700 dark:text-gray-300 flex-1">{label}</label>
        <div className="flex items-center gap-2">
          {avgAmount !== undefined && (
            <span className="text-xs text-gray-400 whitespace-nowrap">
              avg {avgLabel || formatCurrency(avgAmount)}/mo
            </span>
          )}
          {avgAmount !== undefined && (
            <button
              type="button"
              onClick={handleUseAvg}
              className="px-2 py-0.5 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-950 whitespace-nowrap transition-colors"
            >
              Use avg
            </button>
          )}
          <div className="relative w-28">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min={min}
              value={value || 0}
              onChange={handleChange}
              className="w-full pl-5 pr-2 py-1 text-sm text-right border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(value || 0, max)}
        onChange={(e) => onChange(fieldKey, parseInt(e.target.value))}
        className="w-full"
        style={{
          background: `linear-gradient(to right, #2E6DB4 0%, #2E6DB4 ${sliderPct}%, #e5e7eb ${sliderPct}%, #e5e7eb 100%)`
        }}
      />
      {helpText && <p className="help-text">{helpText}</p>}
    </div>
  )
}
