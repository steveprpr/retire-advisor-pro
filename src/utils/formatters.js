// Formatting utilities for display values

export function formatCurrency(value, opts = {}) {
  const { compact = false, decimals = 0 } = opts
  if (value == null || isNaN(value)) return '$0'
  if (compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercent(value, decimals = 1) {
  if (value == null || isNaN(value)) return '0%'
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatAge(birthYear) {
  const currentYear = new Date().getFullYear()
  return currentYear - birthYear
}

export function formatNumber(value, decimals = 0) {
  if (value == null || isNaN(value)) return '0'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatYear(value) {
  if (!value) return '—'
  return String(Math.round(value))
}

export function parseCurrency(str) {
  if (!str) return 0
  const cleaned = String(str).replace(/[$,\s]/g, '')
  const val = parseFloat(cleaned)
  return isNaN(val) ? 0 : val
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function inflateAmount(amount, inflationRate, years) {
  return amount * Math.pow(1 + inflationRate, years)
}

export function pvFactor(rate, years) {
  // Present value factor: (1+r)^-n
  return Math.pow(1 + rate, -years)
}

export function fvFactor(rate, years) {
  return Math.pow(1 + rate, years)
}
