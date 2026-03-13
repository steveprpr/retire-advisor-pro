import { useForm } from '../../context/AppContext.jsx'
import { HelpTooltip, HelpAccordion } from '../common/HelpTooltip.jsx'
import { formatCurrency } from '../../utils/formatters.js'

export default function Step7Legacy() {
  const { form, updateField } = useForm()
  const isFederal = form.employmentType === 'federal' || form.employmentType === 'federal_csrs'

  return (
    <div className="space-y-6">
      {/* Family */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Family</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Number of children</label>
            <input type="number" className="input-field" value={form.numberOfChildren || 0} onChange={e => updateField('numberOfChildren', parseInt(e.target.value) || 0)} min={0} max={20} />
          </div>
          <div>
            <label className="label">
              Number of grandchildren + their ages
              <HelpTooltip content="Enter ages separated by commas. Example: 5, 8, 12. Ages are used to calculate 529 college savings projections." className="ml-1" />
            </label>
            <input type="text" className="input-field" value={form.grandchildrenAges || ''} onChange={e => updateField('grandchildrenAges', e.target.value)} placeholder="e.g., 5, 8, 12" />
            <p className="help-text">Enter ages separated by commas (e.g., 5, 8, 12)</p>
          </div>
        </div>
      </div>

      {/* 529 plan */}
      {form.grandchildrenAges && form.grandchildrenAges.trim().length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
          <h3 className="font-medium text-gray-800 dark:text-gray-200">529 College Savings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Monthly contribution per grandchild ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input type="number" className="input-field pl-7" value={form.plan529ContribPerGrandchild || 0} onChange={e => updateField('plan529ContribPerGrandchild', parseFloat(e.target.value) || 0)} placeholder="0" />
              </div>
              <p className="help-text">Enter 0 to skip 529 projections</p>
            </div>
          </div>

          <div>
            <label className="label">Interested in 529 superfunding?</label>
            <div className="flex gap-3 flex-wrap">
              {[
                { value: 'yes', label: 'Yes, I want to superfund' },
                { value: 'no', label: 'No' },
                { value: 'explain', label: 'Explain it to me' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="plan529Superfund" value={opt.value} checked={form.plan529Superfund === opt.value} onChange={e => updateField('plan529Superfund', e.target.value)} className="accent-[#2E6DB4]" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {(form.plan529Superfund === 'explain' || form.plan529Superfund === 'yes') && (
            <div className="callout-info text-sm">
              <strong>💡 529 Superfunding:</strong> A 529 superfund (or 5-year election) lets you contribute up to 5 years of annual gift tax exclusions at once — <strong>$95,000 per grandchild in 2024</strong> ($190,000 per grandchild if you and your spouse each contribute). You elect to treat it as 5 annual gifts on IRS Form 709. No gift tax. The money starts growing tax-free immediately, maximizing compound growth.
            </div>
          )}
        </div>
      )}

      {/* Legacy goals */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Legacy & inheritance goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Target legacy per child ($)
              <HelpTooltip content="How much do you want to leave each child when you pass? This helps us project whether your portfolio will meet your goal. Set to $0 if you plan to spend everything." className="ml-1" />
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" className="input-field pl-7" value={form.targetLegacyPerChild || 0} onChange={e => updateField('targetLegacyPerChild', parseFloat(e.target.value) || 0)} placeholder="0" />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Legacy priority</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { value: 'primary', label: 'Primary goal — leaving a legacy is paramount' },
              { value: 'secondary', label: 'Important but secondary to my lifestyle' },
              { value: 'nice_to_have', label: 'Nice to have, but not required' },
              { value: 'spend_all', label: 'I plan to spend it all (die with zero)' },
              { value: 'undecided', label: 'Undecided' },
            ].map(opt => (
              <label key={opt.value} className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer text-sm transition-colors ${form.legacyPriority === opt.value ? 'border-[#2E6DB4] bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-700 hover:border-[#2E6DB4]'}`}>
                <input type="radio" name="legacyPriority" value={opt.value} checked={form.legacyPriority === opt.value} onChange={e => updateField('legacyPriority', e.target.value)} className="accent-[#2E6DB4]" />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Survivor annuity (federal) */}
      {isFederal && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
          <h3 className="font-medium text-gray-800 dark:text-gray-200">
            Survivor annuity election
            <HelpTooltip content="If you elect full survivor annuity, your annuity is reduced by 10% while you're alive, but your spouse receives 50% of your annuity after your death. Partial: 5% reduction, 25% survivor benefit. None: no reduction, but spouse receives nothing." className="ml-1" />
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { value: 'full', label: 'Full (50% to spouse) — 10% annuity reduction' },
              { value: 'partial', label: 'Partial (25% to spouse) — 5% annuity reduction' },
              { value: 'none', label: 'None — no reduction, no survivor benefit' },
              { value: 'compare', label: 'Show me all options in the report' },
            ].map(opt => (
              <label key={opt.value} className={`flex items-start gap-2 p-2.5 border rounded-lg cursor-pointer text-sm transition-colors ${form.survivorAnnuityElection === opt.value ? 'border-[#2E6DB4] bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-700 hover:border-[#2E6DB4]'}`}>
                <input type="radio" name="survivorAnnuity" value={opt.value} checked={form.survivorAnnuityElection === opt.value} onChange={e => updateField('survivorAnnuityElection', e.target.value)} className="accent-[#2E6DB4] mt-0.5" />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Estate planning */}
      <div>
        <label className="label">
          Estate planning notes (optional)
          <HelpTooltip content="Share any relevant context: 'I have a living trust', 'Working with an estate attorney', 'Want help with beneficiary designations', etc. This context will be included in your AI report." className="ml-1" />
        </label>
        <textarea
          className="input-field"
          rows={3}
          value={form.estatePlanningNotes || ''}
          onChange={e => updateField('estatePlanningNotes', e.target.value)}
          placeholder="Optional: 'I have a living trust', 'Working with estate attorney', 'Want beneficiary designation advice'..."
        />
      </div>
    </div>
  )
}
