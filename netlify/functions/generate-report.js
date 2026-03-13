/**
 * generate-report.js — Netlify Functions v2, SSE streaming
 *
 * POST /api/generate-report
 * Body: { payload: { ...condensed calc numbers }, model?: string }
 *
 * Streams an AI-generated retirement report via Server-Sent Events.
 * Implements a model fallback chain: Claude → DeepSeek R1 → Gemini Pro
 *
 * PRIVACY: request body is never logged. Only model name + timestamp logged.
 */

export const config = { path: '/api/generate-report' }

const RATE_LIMIT_KEY = 'report_count'
const RATE_LIMIT_MAX = 3

const MODEL_CHAIN = [
  'anthropic/claude-sonnet-4-6',
  'deepseek/deepseek-r1',
  'google/gemini-pro-1.5',
]

const SYSTEM_PROMPT = `You are RetireAdvisor Pro, an expert federal/civilian retirement planning assistant. Your analysis is thorough, data-driven, and actionable. You never use generic advice — every insight references the specific numbers provided.

Respond ONLY in the following 10-section format (use these exact headers):

## [1] EXECUTIVE SUMMARY
2-3 paragraph overview of the client's retirement readiness. Lead with the overall assessment (strong/solid/needs attention/at risk), note the biggest strength and biggest risk.

## [2] RETIREMENT INCOME
Detail all income streams: FERS/pension annuity, Social Security strategy chosen, TSP/portfolio withdrawals, VA benefit, rental income, other sources. Calculate total monthly income and replacement ratio.

## [3] TAX PICTURE
Estimate effective tax rate in retirement. Note FERS 95% rule taxable portion, SS taxable threshold (0/50/85% rule), state tax treatment, Roth conversion opportunity windows, and RMD timeline.

## [4] BUDGET ANALYSIS
Compare projected monthly income vs. expenses. Flag surplus or deficit. Note top 3 expense categories. If deficit, quantify the gap and suggest specific remediation steps. Include healthcare cost trajectory.

## [5] PORTFOLIO STRATEGY
Analyze TSP balance, withdrawal strategy (4% rule / dividend / hybrid), portfolio longevity in years, Monte Carlo success rate interpretation, and sequence-of-returns risk. Recommend specific allocation shifts if appropriate.

## [6] LOCATION ANALYSIS
If staying in current state: note state tax treatment, COL index, property tax. If relocating domestically: compare home state vs. target state. If international: analyze COL savings, healthcare, visa path, tax implications, and flight logistics.

## [7] SPECIAL CONSIDERATIONS
Address any of the following that apply (skip sections that don't): VA disability rating optimization, military service credit buyback ROI, FERS vs. CSRS differences, WEP/GPO repeal (Social Security Fairness Act 2025), Backdoor Roth IRA eligibility, Rule of 55 for TSP, 529 superfunding strategy, FERS survivor annuity election trade-off, Puerto Rican heritage / Spain fast-track citizenship.

## [8] LEGACY
Assess net worth at life expectancy. Evaluate 529 projections vs. estimated college costs. Comment on estate planning adequacy. Note legacy priority vs. spending flexibility trade-off.

## [9] ACTION PLAN
Provide 8-12 specific, numbered action items. Each must follow this format:
[PRIORITY: HIGH/MEDIUM/LOW] [TIMELINE: immediate/6 months/1 year/before retirement] Description of specific action.

## [10] DISCLAIMER
Standard disclaimer: This analysis is for educational purposes only and does not constitute financial, tax, or legal advice. Consult a licensed CFP, CPA, or attorney before making retirement decisions. Numbers are estimates based on assumptions that may change.

---
Tone: Professional but accessible. Specific and data-driven. Avoid generic advice. Reference the client's actual numbers throughout. Use plain language where possible but don't shy away from technical terms when they add precision.`

function buildUserMessage(payload) {
  const p = payload

  const lines = [
    `RETIREMENT PROFILE SUMMARY`,
    `Employment: ${p.employmentType ?? 'unknown'} | Retirement system: ${p.retirementSystem ?? 'FERS'}`,
    `Birth year: ${p.birthYear ?? 'unknown'} | Target retirement age: ${p.retirementAge ?? 'unknown'}`,
    `Years to retirement: ${p.yearsToRetirement ?? 'unknown'} | Life expectancy: ${p.lifeExpectancy ?? 85}`,
    `Marital status: ${p.maritalStatus ?? 'unknown'} | Filing status: ${p.filingStatus ?? 'unknown'}`,
    ``,
    `INCOME AT RETIREMENT (monthly)`,
    `FERS annuity (net of survivor reduction): $${p.fersMonthly ?? 0}`,
    `Social Security (${p.ssStrategy ?? 'FRA'}): $${p.ssMonthly ?? 0}`,
    `TSP/portfolio withdrawal: $${p.tspMonthly ?? 0}`,
    `VA benefit: $${p.vaMonthly ?? 0}`,
    `Rental income: $${p.rentalMonthly ?? 0}`,
    `Other income: $${p.otherMonthly ?? 0}`,
    `TOTAL monthly income: $${p.totalMonthlyIncome ?? 0}`,
    ``,
    `EXPENSES (monthly in retirement dollars)`,
    `Total monthly expenses: $${p.totalMonthlyExpenses ?? 0}`,
    `Monthly surplus/deficit: $${p.monthlySurplus ?? 0}`,
    `Income replacement ratio: ${p.replacementRatio ?? 0}%`,
    ``,
    `PORTFOLIO`,
    `TSP balance at retirement: $${p.tspBalanceAtRetirement ?? 0}`,
    `Roth IRA balance at retirement: $${p.rothBalanceAtRetirement ?? 0}`,
    `Total investable assets: $${p.totalInvestableAssets ?? 0}`,
    `Withdrawal strategy: ${p.withdrawalStrategy ?? '4% rule'}`,
    `4% rule annual withdrawal: $${p.fourPctWithdrawal ?? 0}`,
    `Portfolio longevity: ${p.portfolioLongevityYears ?? 'unknown'} years`,
    `Monte Carlo success rate: ${p.monteCarloSuccessRate ?? 'unknown'}%`,
    ``,
    `TAXES`,
    `Effective tax rate in retirement: ${p.effectiveTaxRate ?? 0}%`,
    `Federal tax: $${p.annualFederalTax ?? 0}/yr | State: ${p.stateCode ?? 'unknown'}`,
    `SS taxable portion: ${p.ssTaxablePortion ?? 0}%`,
    ``,
    `REAL ESTATE & LEGACY`,
    `Home equity at retirement: $${p.homeEquityAtRetirement ?? 0}`,
    `Net worth at life expectancy: $${p.legacyNetWorth ?? 0}`,
    `Legacy priority: ${p.legacyPriority ?? 'moderate'}`,
    ``,
    `LOCATION`,
    `Current state: ${p.stateCode ?? 'unknown'}`,
    `Retirement location: ${p.retirementLocation ?? 'stay in state'}`,
    p.countryKey ? `Expat country: ${p.countryName ?? p.countryKey} | COL savings: ${p.colSavingsPct ?? 0}%` : '',
    ``,
    `SPECIAL FLAGS`,
    `VA disability rating: ${p.vaRating ?? 0}%`,
    `Military buyback: ${p.militaryBuyback ? 'Yes' : 'No'}`,
    `WEP/GPO applies: ${p.wepGpoApplies ? 'Yes (pre-2025 scenario)' : 'No'}`,
    `Puerto Rican heritage: ${p.puertoRicanHeritage ? 'Yes' : 'No'}`,
    `Has 529 plan: ${p.has529 ? 'Yes' : 'No'}`,
    p.has529 ? `529 balance at college: $${p.plan529Balance ?? 0} | Covers ${p.collegeCoverageYears ?? 0} yrs` : '',
    ``,
    `SPECIFIC CONCERNS`,
    p.specificConcerns ?? 'None provided.',
    ``,
    `REPORT DETAIL LEVEL`,
    `User requested: ${p.reportDetailLevel ?? 'detailed'}`,
  ].filter(l => l !== null && l !== undefined)

  return lines.join('\n')
}

export default async function handler(req, context) {
  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders(),
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders() })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'OpenRouter API key not configured' }),
      { status: 503, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }

  const { payload } = body
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Missing payload' }), {
      status: 400,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }

  // Note: request body NOT logged for privacy
  console.log(`[generate-report] model=fallback-chain ts=${new Date().toISOString()}`)

  const userMessage = buildUserMessage(payload)

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (s) => new TextEncoder().encode(s)

      const sendEvent = (data) => {
        controller.enqueue(encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      let succeeded = false
      let lastError = null

      for (const model of MODEL_CHAIN) {
        try {
          const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.VITE_SITE_URL ?? 'https://retire-advisor.netlify.app',
              'X-Title': 'RetireAdvisor Pro',
            },
            body: JSON.stringify({
              models: [model],
              stream: true,
              max_tokens: 4096,
              temperature: 0.3,
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userMessage },
              ],
            }),
          })

          if (!resp.ok) {
            lastError = `Model ${model} returned ${resp.status}`
            console.log(`[generate-report] ${lastError}, trying next model`)
            continue
          }

          // Emit model attribution first
          sendEvent({ type: 'model', model })

          const reader = resp.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const raw = line.slice(6).trim()
              if (raw === '[DONE]') continue
              // Skip OpenRouter processing comments
              if (raw.startsWith(':')) continue

              let parsed
              try {
                parsed = JSON.parse(raw)
              } catch {
                continue
              }

              const delta = parsed?.choices?.[0]?.delta?.content
              if (delta) {
                sendEvent({ type: 'chunk', content: delta })
              }
            }
          }

          sendEvent({ type: 'done' })
          succeeded = true
          break
        } catch (err) {
          lastError = err.message
          console.log(`[generate-report] Error with ${model}: ${err.message}`)
        }
      }

      if (!succeeded) {
        sendEvent({ type: 'error', message: lastError ?? 'All models failed' })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }
}
