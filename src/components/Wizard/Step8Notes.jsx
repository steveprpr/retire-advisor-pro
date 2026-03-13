import { useForm } from '../../context/AppContext.jsx'

const RISK_LEVELS = [
  { value: 'very_conservative', label: 'Very Conservative', desc: 'Capital preservation is most important. I prefer stability over growth.' },
  { value: 'conservative', label: 'Conservative', desc: 'Some growth is okay, but I want to minimize risk.' },
  { value: 'moderate', label: 'Moderate', desc: 'Balanced approach — willing to accept some volatility for growth.' },
  { value: 'growth', label: 'Growth-oriented', desc: 'Comfortable with market swings for higher long-term returns.' },
  { value: 'aggressive', label: 'Aggressive', desc: 'Maximum growth potential. I can handle significant short-term losses.' },
]

const CONCERNS = [
  { value: 'running_out', label: '😰 Running out of money' },
  { value: 'healthcare', label: '🏥 Healthcare costs in retirement' },
  { value: 'inflation', label: '📈 Inflation eroding purchasing power' },
  { value: 'market_crash', label: '📉 A major market crash' },
  { value: 'legacy', label: '🏛️ Not leaving enough for my family' },
  { value: 'confident', label: '😊 None — I\'m feeling confident!' },
]

const DETAIL_LEVELS = [
  { value: 'executive', label: 'Executive Summary', desc: 'Key metrics and top 5 action items only (2-3 min read).' },
  { value: 'standard', label: 'Standard Report', desc: 'Full analysis with section-by-section breakdown (10-15 min read).' },
  { value: 'comprehensive', label: 'Comprehensive Deep-Dive', desc: 'Everything — all scenarios, detailed explanations, exhaustive action plan (20-30 min read).' },
]

export default function Step8Notes() {
  const { form, updateField } = useForm()

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        These final preferences tell the AI how to tailor your report — how much risk you can stomach, what keeps you up at night, and any special circumstances that numbers alone can't capture. The more context you share, the more useful the analysis.
      </p>

      {/* Risk tolerance */}
      <div>
        <label className="label text-base">Risk tolerance</label>
        <div className="space-y-2">
          {RISK_LEVELS.map(r => (
            <label key={r.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${form.riskTolerance === r.value ? 'border-[#2E6DB4] bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-700 hover:border-[#2E6DB4]'}`}>
              <input type="radio" name="riskTolerance" value={r.value} checked={form.riskTolerance === r.value} onChange={e => updateField('riskTolerance', e.target.value)} className="accent-[#2E6DB4] mt-0.5" />
              <div>
                <div className="font-medium text-sm">{r.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{r.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Biggest concern */}
      <div>
        <label className="label text-base">Biggest retirement concern</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CONCERNS.map(c => (
            <label key={c.value} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer text-sm transition-colors ${form.biggestConcern === c.value ? 'border-[#2E6DB4] bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-700 hover:border-[#2E6DB4]'}`}>
              <input type="radio" name="biggestConcern" value={c.value} checked={form.biggestConcern === c.value} onChange={e => updateField('biggestConcern', e.target.value)} className="accent-[#2E6DB4]" />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      {/* Report detail level */}
      <div>
        <label className="label text-base">Report detail level</label>
        <div className="space-y-2">
          {DETAIL_LEVELS.map(d => (
            <label key={d.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${form.reportDetailLevel === d.value ? 'border-[#2E6DB4] bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-700 hover:border-[#2E6DB4]'}`}>
              <input type="radio" name="reportDetailLevel" value={d.value} checked={form.reportDetailLevel === d.value} onChange={e => updateField('reportDetailLevel', e.target.value)} className="accent-[#2E6DB4] mt-0.5" />
              <div>
                <div className="font-medium text-sm">{d.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{d.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Special notes */}
      <div>
        <label className="label">Special circumstances or notes</label>
        <textarea
          className="input-field"
          rows={4}
          value={form.specialNotes || ''}
          onChange={e => updateField('specialNotes', e.target.value)}
          placeholder="Tell the AI anything else relevant: 'My spouse has a disability', 'I plan to start a business in retirement', 'I have significant student loans', 'My father has dementia — I may need to support him', 'I want to travel 6 months/year', etc."
        />
        <p className="help-text">This free-text context will be included in your AI report for personalized analysis.</p>
      </div>

      {/* Consent */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-700 rounded-xl">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.consentGiven}
            onChange={e => updateField('consentGiven', e.target.checked)}
            className="accent-[#E85D04] mt-1 flex-shrink-0"
          />
          <span className="text-sm text-amber-800 dark:text-amber-200">
            <strong>I understand</strong> that this tool provides <strong>educational analysis only</strong>, not professional financial advice. I will consult a licensed CFP, tax advisor, and/or attorney before making retirement planning decisions. This analysis is based on the data I provided and uses estimates that may differ from my actual situation.
          </span>
        </label>
      </div>

      {!form.consentGiven && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">
          ☝️ Please check the acknowledgment above to enable report generation.
        </p>
      )}
    </div>
  )
}
