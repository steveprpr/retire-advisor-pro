/**
 * quick-insight.js — Netlify Functions v2
 *
 * POST /api/quick-insight
 * Body: { question: string, context: string }
 * Response: { answer: string, model: string }
 *
 * Uses a fast model for tooltip-level explanations and quick Q&A.
 * Rate limited to 20 requests per session (enforced client-side; server logs anomalies).
 *
 * PRIVACY: question is logged only by length, not content.
 */

export const config = { path: '/api/quick-insight' }

const QUICK_MODEL = 'google/gemini-flash-1.5'

const SYSTEM_PROMPT = `You are a retirement planning expert assistant embedded in RetireAdvisor Pro. Answer questions concisely (2-4 sentences max for simple questions, up to 8 sentences for complex ones). Focus on federal employee retirement: FERS, TSP, Social Security, Medicare, and tax optimization. If a number is provided in the context, reference it specifically. Never give generic advice — be precise. If you don't know a specific regulation, say so clearly.`

export default async function handler(req, context) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders() })
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

  const { question, context: userContext } = body
  if (!question || typeof question !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing question' }), {
      status: 400,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }

  // Log only length for privacy
  console.log(`[quick-insight] question_len=${question.length} ts=${new Date().toISOString()}`)

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
  ]

  if (userContext && typeof userContext === 'string' && userContext.length > 0) {
    messages.push({
      role: 'user',
      content: `Context about the client's situation:\n${userContext.slice(0, 800)}\n\nQuestion: ${question}`,
    })
  } else {
    messages.push({ role: 'user', content: question })
  }

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
        model: QUICK_MODEL,
        stream: false,
        max_tokens: 512,
        temperature: 0.2,
        messages,
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      console.log(`[quick-insight] OpenRouter error ${resp.status}`)
      return new Response(
        JSON.stringify({ error: `AI service error: ${resp.status}` }),
        { status: 502, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      )
    }

    const data = await resp.json()
    const answer = data.choices?.[0]?.message?.content ?? 'No response generated.'
    const model = data.model ?? QUICK_MODEL

    return new Response(JSON.stringify({ answer, model }), {
      status: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.log(`[quick-insight] Error: ${err.message}`)
    return new Response(
      JSON.stringify({ error: 'Failed to reach AI service' }),
      { status: 503, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }
}
