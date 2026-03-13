// VA Disability Compensation rates — 2024 (effective December 1, 2023)
// Source: https://www.va.gov/disability/compensation-rates/
// All amounts in USD/month
// VA benefits are tax-free and excluded from AGI.

export const VA_BENEFIT_TABLE = {
  // Single veteran rates (no dependents)
  0:   0,
  10:  171.23,
  20:  338.49,
  30:  524.31,
  40:  755.28,
  50:  1075.16,
  60:  1361.88,
  70:  1716.28,
  80:  1995.01,
  90:  2241.91,
  100: 3737.85,
}

// With spouse (no children) — additional monthly amounts
export const VA_SPOUSE_ADDITION = {
  30:  57.00,
  40:  76.00,
  50:  86.00,
  60:  102.00,
  70:  118.00,
  80:  134.00,
  90:  150.00,
  100: 172.00,
}

// SMC (Special Monthly Compensation) — not modeled in detail, noted in report
export const VA_SMC_NOTE = 'Special Monthly Compensation (SMC) may apply for certain severe disabilities. Consult VA for your specific situation.'

// COLA rate for VA benefits (typically matches SS COLA)
export const VA_COLA_2024 = 0.032  // 3.2% increase for 2024

export function getVAMonthlyBenefit(rating, hasSpouse = false) {
  const ratingKey = Math.round(rating / 10) * 10  // round to nearest 10
  const base = VA_BENEFIT_TABLE[ratingKey] || 0
  const spouseAdd = (hasSpouse && rating >= 30) ? (VA_SPOUSE_ADDITION[ratingKey] || 0) : 0
  return base + spouseAdd
}

export function getVARatingLabel(rating) {
  if (rating === 0) return 'No service-connected disability'
  if (rating === 100) return '100% (Total) — Tax-free, TRICARE eligible'
  return `${rating}% service-connected`
}

export const VA_RATING_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
