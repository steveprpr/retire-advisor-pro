import { useState, useCallback } from 'react'
import { clsx } from 'clsx'
import { formatNumber, parseCurrency } from '../../utils/formatters.js'

export function SliderWithInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  prefix = '',
  suffix = '',
  formatFn,
  presets,
  helpText,
  className,
}) {
  const [inputFocused, setInputFocused] = useState(false)
  const [rawInput, setRawInput] = useState('')

  const displayValue = formatFn ? formatFn(value) : `${prefix}${formatNumber(value)}${suffix}`

  const handleSliderChange = useCallback((e) => {
    onChange(parseFloat(e.target.value))
  }, [onChange])

  const handleInputFocus = useCallback(() => {
    setInputFocused(true)
    setRawInput(String(value))
  }, [value])

  const handleInputBlur = useCallback(() => {
    setInputFocused(false)
    const parsed = parseFloat(rawInput.replace(/[^0-9.-]/g, ''))
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)))
    }
  }, [rawInput, min, max, onChange])

  const handleInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') e.target.blur()
  }, [])

  const sliderPct = max > min ? ((value - min) / (max - min)) * 100 : 0

  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="label mb-0">{label}</label>
          <input
            type="text"
            className="w-28 px-2 py-1 text-sm text-right border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={inputFocused ? rawInput : displayValue}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onChange={(e) => setRawInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #2E6DB4 0%, #2E6DB4 ${sliderPct}%, #e5e7eb ${sliderPct}%, #e5e7eb 100%)`
          }}
        />
        {presets && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange(preset.value)}
                className={clsx(
                  'px-2 py-0.5 text-xs rounded-full border transition-colors',
                  value === preset.value
                    ? 'bg-[#2E6DB4] text-white border-[#2E6DB4]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#2E6DB4] hover:text-[#2E6DB4] dark:bg-gray-800 dark:text-gray-400'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {helpText && <p className="help-text">{helpText}</p>}
    </div>
  )
}
