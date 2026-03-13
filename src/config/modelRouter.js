// OpenRouter Model Configuration
// Edit model IDs here to change which AI powers each feature.
// Pricing as of 2024: https://openrouter.ai/models

export const MODELS = {
  // Ultra-cheap, fast — for tooltips, field hints, quick explanations
  quick: 'google/gemini-flash-1.5',           // $0.075/$0.30 per 1M tokens

  // High quality at low cost — for section summaries, narratives
  narrative: 'deepseek/deepseek-chat',        // $0.14/$0.28 per 1M tokens

  // Primary full report model
  report: 'anthropic/claude-sonnet-4-6',      // $3/$15 per 1M tokens

  // Fallbacks if primary unavailable
  reportFallback: 'deepseek/deepseek-r1',     // $0.55/$2.19 per 1M tokens
  reportFallback2: 'google/gemini-pro-1.5',   // $3.50/$10.50 per 1M tokens
}

// OpenRouter auto-fallback chain for full report generation
// If the first model is unavailable/rate-limited, OR tries next automatically
export const REPORT_MODEL_CHAIN = [
  'anthropic/claude-sonnet-4-6',
  'deepseek/deepseek-r1',
  'google/gemini-pro-1.5',
]

// Estimated cost per call (in USD, approximate)
export const COST_ESTIMATES = {
  fullReport: '$0.04–$0.08',
  quickInsight: '~$0.001',
  perHundredReports: '$5–$8',
}

// Rate limits (enforced in sessionStorage)
export const RATE_LIMITS = {
  fullReport: 3,    // max per session
  quickInsight: 20, // max per session
}
