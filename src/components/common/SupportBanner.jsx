import { useState } from 'react'

const DISMISS_KEY = 'retire_advisor_support_dismissed'

function isDismissed() {
  try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
}

function dismiss() {
  try { sessionStorage.setItem(DISMISS_KEY, '1') } catch {}
}

/**
 * SupportBanner — "keep it free" coffee donation nudge.
 * variant="landing"  → softer intro tone
 * variant="report"   → value-moment tone (shown after report generates)
 */
export function SupportBanner({ variant = 'report' }) {
  const [hidden, setHidden] = useState(isDismissed)

  if (hidden) return null

  const handleDismiss = () => {
    dismiss()
    setHidden(true)
  }

  const copy = variant === 'report'
    ? 'Your report was generated using AI credits that cost real money to run. If this helped you plan your retirement, consider buying me a coffee to keep it free.'
    : 'This tool is free to use, but running AI for every report costs me money. If you find it valuable, a small contribution goes a long way.'

  return (
    <div className="relative flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-xl text-sm">
      {/* Coffee icon */}
      <span className="text-2xl flex-shrink-0 mt-0.5" role="img" aria-label="coffee">☕</span>

      <div className="flex-1 min-w-0">
        <p className="text-amber-900 dark:text-amber-200 leading-snug">
          <strong>This tool is free</strong> — {copy}
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-3">
          {/* PayPal — pre-fills $5, user can change */}
          <a
            href="https://paypal.me/StephenHaselhorst/5"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#0070BA] hover:bg-[#005ea6] text-white font-medium text-sm transition-colors"
          >
            <PayPalIcon />
            PayPal
          </a>

          {/* Venmo — no URL amount support; show suggested label */}
          <a
            href="https://venmo.com/u/Stephen-Haselhorst"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#3D95CE] hover:bg-[#2d7fb8] text-white font-medium text-sm transition-colors"
          >
            <VenmoIcon />
            Venmo
          </a>

          <span className="text-xs text-amber-700 dark:text-amber-400">$5 suggested — any amount appreciated</span>
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors mt-0.5"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}

function PayPalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-white">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
    </svg>
  )
}

function VenmoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-white">
      <path d="M19.014 2c.66 1.094.957 2.219.957 3.641 0 4.537-3.873 10.423-7.018 14.569H6.008L3 3.03l5.699-.537 1.567 12.47c1.461-2.382 3.27-6.133 3.27-8.684 0-1.396-.24-2.348-.6-3.13L19.014 2z" />
    </svg>
  )
}
