import { useState, useCallback } from 'react'

/**
 * MoneyInput — dollar amount field that shows comma-formatted values when not focused.
 * When focused, shows the raw number so the user can type freely.
 * Uses inputMode="numeric" for mobile keyboard support.
 */
export function MoneyInput({ value, onChange, placeholder, className = '', min, max, disabled }) {
  const [focused, setFocused] = useState(false)
  const [raw, setRaw] = useState('')

  const handleFocus = useCallback(() => {
    setFocused(true)
    setRaw(value != null && value !== 0 ? String(value) : '')
  }, [value])

  const handleBlur = useCallback(() => {
    setFocused(false)
    const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''))
    if (!isNaN(parsed)) {
      const clamped = (min != null && parsed < min) ? min : (max != null && parsed > max) ? max : parsed
      onChange(clamped)
    } else if (raw === '' || raw === '0') {
      onChange(0)
    }
  }, [raw, min, max, onChange])

  const displayValue = focused
    ? raw
    : (value != null && value !== 0 && !isNaN(value))
      ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
      : ''

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">$</span>
      <input
        type="text"
        inputMode="numeric"
        className={`input-field pl-7 ${className}`}
        value={displayValue}
        placeholder={placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={e => setRaw(e.target.value)}
        disabled={disabled}
      />
    </div>
  )
}
