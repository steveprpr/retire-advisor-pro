// Auto-triggered contextual warning and info badges
// These appear automatically when certain conditions are met in the form.

import { clsx } from 'clsx'

const BADGE_VARIANTS = {
  warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-200',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-200',
  success: 'bg-green-50 border-green-200 text-[#1D9E75] dark:bg-green-950 dark:border-green-700 dark:text-green-300',
  neutral: 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300',
  flag: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-700 dark:text-red-300',
}

export function SmartBadge({ icon, title, message, variant = 'info', className }) {
  return (
    <div className={clsx('flex items-start gap-3 p-3 rounded-lg border text-sm', BADGE_VARIANTS[variant], className)}>
      {icon && <span className="text-lg flex-shrink-0">{icon}</span>}
      <div>
        {title && <div className="font-medium mb-0.5">{title}</div>}
        <div className="leading-relaxed">{message}</div>
      </div>
    </div>
  )
}

// Pre-configured contextual badges for common scenarios
export function FERSPenaltyBadge({ retirementAge, penaltyYears }) {
  if (retirementAge >= 62 || penaltyYears <= 0) return null
  return (
    <SmartBadge
      icon="⚠️"
      variant="warning"
      title="FERS Early Retirement Penalty"
      message={`Retiring at ${retirementAge} with fewer than 30 years of service triggers a ${penaltyYears * 5}% early retirement penalty (5% per year under age 62). Consider postponing your annuity to age 60 or 62 to eliminate this penalty.`}
    />
  )
}

export function BackdoorRothBadge({ income, threshold = 236000 }) {
  if (!income || income <= threshold) return null
  return (
    <SmartBadge
      icon="💡"
      variant="info"
      title="Backdoor Roth May Be Required"
      message={`Your income ($${income.toLocaleString()}) exceeds the direct Roth IRA contribution limit ($${threshold.toLocaleString()} MFJ). You may need to use the Backdoor Roth strategy: contribute to a Traditional IRA, then convert to Roth. We'll explain this in your report.`}
    />
  )
}

export function EarlyWithdrawalBadge({ retirementAge }) {
  if (!retirementAge || retirementAge >= 59.5) return null
  return (
    <SmartBadge
      icon="⚠️"
      variant="warning"
      title="Early TSP/IRA Withdrawal Rules Apply"
      message={`Retiring before age 59½ means early withdrawal penalties (10%) may apply to TSP and IRA distributions — unless you use Rule of 55, SEPP (72t), or other exceptions. We'll cover your options in the report.`}
    />
  )
}

export function SpainCitizenshipBadge({ puertoRicanHeritage, retirementCountryKey, fersMonthlyAnnuity }) {
  if (puertoRicanHeritage === 'neither' || retirementCountryKey !== 'spain') return null
  const nlvMet = fersMonthlyAnnuity * 12 >= 28800
  return (
    <SmartBadge
      icon="🇪🇸"
      variant="success"
      title="Spain Fast-Track Citizenship"
      message={`As a Puerto Rican (Ibero-American), you qualify for Spanish citizenship after just 2 years of legal residency — vs 10 years for most Americans. This includes an EU passport and full healthcare access. ${nlvMet ? '✓ Your FERS annuity appears to meet the €28,800/yr NLV income requirement.' : 'Note: The NLV requires approximately €28,800/yr in passive income.'}`}
    />
  )
}

export function RulOf55Badge({ retirementAge }) {
  if (!retirementAge || retirementAge < 55 || retirementAge > 59) return null
  return (
    <SmartBadge
      icon="💡"
      variant="info"
      title="Rule of 55 May Apply"
      message="If you leave your employer the year you turn 55 (or older), you can take penalty-free distributions from your 401k/TSP — without waiting until 59½. This does NOT apply to IRAs."
    />
  )
}

export function MRARangeBadge({ retirementAge, mra }) {
  if (!retirementAge || !mra || retirementAge < mra) return null
  if (retirementAge >= 62) return null
  return (
    <SmartBadge
      icon="ℹ️"
      variant="info"
      title={`MRA+10 Retirement (ages ${mra}–61)`}
      message={`You're eligible for MRA+10 retirement: retire at your MRA (${mra}) with 10+ years of service. However, a 5% per year penalty applies for each year you're under 62. You can avoid the penalty by postponing your annuity to age 60 or 62.`}
    />
  )
}
