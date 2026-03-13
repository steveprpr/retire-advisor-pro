import { useForm } from '../../context/AppContext.jsx'
import { HelpTooltip, HelpAccordion } from '../common/HelpTooltip.jsx'
import { SliderWithInput } from '../common/SliderWithInput.jsx'
import { formatCurrency } from '../../utils/formatters.js'
import { computeAutoHigh3, computeServiceYearsAtRetirement, getMRADisplay } from '../../utils/federalCalculations.js'

const CURRENT_YEAR = new Date().getFullYear()
const AGENCIES = ['FDIC', 'DOD', 'DHS', 'VA', 'HHS', 'Treasury', 'State Dept', 'USPS', 'Army', 'Navy', 'Air Force', 'NASA', 'FBI', 'CBP', 'IRS', 'SSA', 'OPM', 'USMC', 'Coast Guard', 'Other']

export default function Step2Service() {
  const { form, updateField } = useForm()
  const isFederal = form.employmentType === 'federal' || form.employmentType === 'federal_csrs'
  const isCSRS = form.employmentType === 'federal_csrs' || form.retirementSystem === 'csrs'

  const currentAge = form.birthYear ? CURRENT_YEAR - form.birthYear : 55
  const mraDisplay = getMRADisplay(form.birthYear)

  // Auto-compute High-3 from salary + growth (unless user has overridden)
  const autoHigh3 = computeAutoHigh3(
    form.currentSalary || 0,
    form.salaryGrowthRate || 0.01,
    form.targetRetirementAge || 60,
    currentAge,
    form.high3FreezeAge || null,
  )

  // Auto-compute service years from SCD
  const autoServiceYears = computeServiceYearsAtRetirement(form.scdYear, form.targetRetirementAge || 60, form.birthYear)

  if (!isFederal) {
    return <PrivateSectorSection />
  }

  return (
    <div className="space-y-6">
      {/* Agency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Current agency</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g., FDIC, DOD, HHS"
            value={form.agency}
            onChange={e => updateField('agency', e.target.value)}
            list="agency-list"
          />
          <datalist id="agency-list">
            {AGENCIES.map(a => <option key={a} value={a} />)}
          </datalist>
        </div>

        <div>
          <label className="label">Retirement system</label>
          <select className="input-field" value={form.retirementSystem} onChange={e => updateField('retirementSystem', e.target.value)}>
            <option value="fers">FERS</option>
            <option value="fers_rae">FERS-RAE (hired 2013+)</option>
            <option value="csrs">CSRS</option>
            <option value="csrs_offset">CSRS-Offset</option>
          </select>
          {form.birthYear && !isCSRS && (
            <p className="help-text">Your MRA (Minimum Retirement Age): <strong>{mraDisplay}</strong></p>
          )}
        </div>
      </div>

      {/* Service years — two options */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-800 dark:text-gray-200">
            Creditable Service Years
            <HelpTooltip content="Include all civilian FERS/CSRS service. Military buyback adds years separately below. Unused sick leave adds fractional years at retirement." className="ml-1" />
          </h3>
        </div>

        {/* Option toggle */}
        <div className="flex gap-2">
          {[
            { key: 'startYear', label: 'Calculate from start year' },
            { key: 'manual', label: 'Enter years manually' },
          ].map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => updateField('serviceYearsMode', opt.key)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                (form.serviceYearsMode || 'startYear') === opt.key
                  ? 'bg-[#2E6DB4] text-white border-[#2E6DB4]'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-[#2E6DB4] dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {(form.serviceYearsMode || 'startYear') === 'startYear' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Federal service start year (SCD)
                <HelpTooltip content="Your SCD (Service Computation Date) is the date OPM uses to compute retirement eligibility. It may differ from your hire date due to prior federal service, military buyback, or breaks." className="ml-1" />
              </label>
              <input
                type="number"
                className="input-field"
                value={form.scdYear || ''}
                onChange={e => updateField('scdYear', parseInt(e.target.value))}
                placeholder={String(CURRENT_YEAR - 20)}
                min="1960"
                max={CURRENT_YEAR}
              />
              {form.scdYear && (
                <p className="help-text">{CURRENT_YEAR - form.scdYear} years of service to date</p>
              )}
            </div>
            <div className="flex flex-col justify-center">
              {autoServiceYears != null ? (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-[#2E6DB4]/30 rounded-lg">
                  <div className="text-2xl font-bold text-[#1B3A6B] dark:text-blue-300">{autoServiceYears.toFixed(1)} yrs</div>
                  <div className="text-xs text-gray-500 mt-0.5">projected at retirement (age {form.targetRetirementAge || 60})</div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-600">Enter start year to auto-calculate</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <SliderWithInput
              label="Current creditable service years (as of today)"
              value={form.credibleServiceYears}
              onChange={v => updateField('credibleServiceYears', v)}
              min={1}
              max={42}
              step={0.5}
              suffix=" yrs"
              presets={[{ label: '10 yrs', value: 10 }, { label: '15 yrs', value: 15 }, { label: '20 yrs', value: 20 }, { label: '25 yrs', value: 25 }, { label: '30 yrs', value: 30 }]}
            />
            <p className="help-text mt-1">
              Enter how many years you have <strong>right now</strong> — the tool will add your remaining years to retirement automatically.
              {form.targetRetirementAge && form.birthYear && (() => {
                const yearsLeft = Math.max(0, form.targetRetirementAge - (CURRENT_YEAR - form.birthYear))
                const projected = (form.credibleServiceYears || 0) + yearsLeft
                return yearsLeft > 0
                  ? ` At your target retirement age (${form.targetRetirementAge}), that will be ~${projected.toFixed(1)} years.`
                  : null
              })()}
            </p>
          </div>
        )}
      </div>

      {/* Military service */}
      <div>
        <label className="label">Military service</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { value: 'none', label: 'No military service' },
            { value: 'no_credit', label: 'Active duty — no FERS credit' },
            { value: 'deposit_paid', label: 'Military deposit paid ✓' },
            { value: 'deposit_progress', label: 'Military deposit in progress' },
          ].map(opt => (
            <label key={opt.value} className="flex items-center gap-2 p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-[#2E6DB4] transition-colors text-sm">
              <input type="radio" name="militaryService" value={opt.value} checked={form.militaryService === opt.value} onChange={e => updateField('militaryService', e.target.value)} className="accent-[#2E6DB4]" />
              {opt.label}
            </label>
          ))}
        </div>
        {form.militaryService !== 'none' && (
          <div className="mt-3">
            <SliderWithInput
              label="Military service years"
              value={form.militaryServiceYears || 0}
              onChange={v => updateField('militaryServiceYears', v)}
              min={0}
              max={30}
              step={1}
              suffix=" yrs"
              presets={[{ label: '4 yrs', value: 4 }, { label: '8 yrs', value: 8 }, { label: '20 yrs', value: 20 }]}
            />
            {form.militaryService === 'deposit_progress' && (
              <p className="help-text text-amber-600 dark:text-amber-400">
                ⚠️ Military deposit must be paid before retirement to receive FERS credit. Unpaid deposits forfeit those service years from your annuity calculation.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Salary */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Salary</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Current salary ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" className="input-field pl-7" value={form.currentSalary || ''} onChange={e => updateField('currentSalary', parseFloat(e.target.value))} placeholder="100,000" />
            </div>
          </div>
          <div>
            <label className="label">
              High-3 salary estimate ($)
              <HelpTooltip content="Your annuity is based on the average of your highest 3 consecutive years of base salary. Auto-estimated from your current salary and growth rate." className="ml-1" />
            </label>
            {form.high3Override ? (
              <>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input type="number" className="input-field pl-7" value={form.high3Salary || ''} onChange={e => updateField('high3Salary', parseFloat(e.target.value))} placeholder="95,000" />
                </div>
                <button type="button" onClick={() => updateField('high3Override', false)} className="text-xs text-blue-600 hover:underline mt-1">
                  ← Use auto-estimate instead
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-950 border border-[#2E6DB4]/30 rounded-lg">
                  <span className="text-[#1B3A6B] dark:text-blue-300 font-semibold">{formatCurrency(autoHigh3)}</span>
                  <span className="text-xs text-gray-500">auto-estimated at retirement</span>
                </div>
                <button type="button" onClick={() => { updateField('high3Override', true); updateField('high3Salary', Math.round(autoHigh3)) }} className="text-xs text-blue-600 hover:underline mt-1">
                  Override manually
                </button>
              </>
            )}
          </div>
        </div>

        <SliderWithInput
          label="Expected annual salary growth"
          value={(form.salaryGrowthRate || 0.01) * 100}
          onChange={v => updateField('salaryGrowthRate', v / 100)}
          min={0}
          max={5}
          step={0.1}
          suffix="%"
          helpText="Average federal GS step/grade increase is ~1–2%/yr."
          presets={[{ label: '0.5%', value: 0.5 }, { label: '1%', value: 1 }, { label: '2%', value: 2 }, { label: '3%', value: 3 }]}
        />

        <div>
          <label className="label">
            Age when High-3 will freeze (optional)
            <HelpTooltip content="Some federal employees intentionally take a lower-paying job near retirement — for example, stepping down from a GS-14 supervisor role to a GS-12 individual contributor, or moving to part-time. Once your salary drops, your High-3 stops growing. Enter the age when you expect that to happen so your annuity estimate stays accurate." className="ml-1" />
          </label>
          <input
            type="number"
            className="input-field md:w-32"
            value={form.high3FreezeAge || ''}
            onChange={e => updateField('high3FreezeAge', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Optional"
            min={currentAge}
            max={70}
          />
          {!form.high3FreezeAge && (
            <p className="help-text">Leave blank if you plan to stay in your current role until retirement.</p>
          )}
          {form.high3FreezeAge && (
            <p className="help-text text-amber-600 dark:text-amber-400">
              Your High-3 will be calculated from salary growth up to age {form.high3FreezeAge}, then frozen — reflecting the salary drop when you step down.
            </p>
          )}
        </div>
      </div>

      <HelpAccordion title="What is High-3 and how is it calculated?">
        <p>Your FERS annuity is calculated based on your <strong>average salary over the highest 3 consecutive years</strong> of your federal career. This is typically your last 3 years if you've been getting regular pay increases.</p>
        <p className="mt-2">Formula: <strong>High-3 × creditable service years × 1.0% (or 1.1% if retiring at 62+ with 20+ years)</strong></p>
        <p className="mt-2">Example: $95,000 High-3 × 25 years × 1.1% = <strong>$26,125/year ($2,177/month)</strong></p>
      </HelpAccordion>
    </div>
  )
}

function PrivateSectorSection() {
  const { form, updateField } = useForm()
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Current employer (optional)</label>
          <input type="text" className="input-field" value={form.privateEmployer || ''} onChange={e => updateField('privateEmployer', e.target.value)} placeholder="Company name" />
        </div>
        <div>
          <label className="label">Current salary ($)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input type="number" className="input-field pl-7" value={form.currentSalary || ''} onChange={e => updateField('currentSalary', parseFloat(e.target.value))} placeholder="100,000" />
          </div>
        </div>
      </div>
      <SliderWithInput
        label="Expected annual salary growth"
        value={(form.privateSalaryGrowthRate || 0.03) * 100}
        onChange={v => updateField('privateSalaryGrowthRate', v / 100)}
        min={0}
        max={8}
        step={0.1}
        suffix="%"
        presets={[{ label: '1%', value: 1 }, { label: '3%', value: 3 }, { label: '5%', value: 5 }]}
      />
      <div>
        <label className="label">Do you have a pension?</label>
        <div className="flex gap-4">
          {['Yes', 'No'].map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" name="hasPension" checked={form.hasPension === (opt === 'Yes')} onChange={() => updateField('hasPension', opt === 'Yes')} className="accent-[#2E6DB4]" />
              {opt}
            </label>
          ))}
        </div>
        {form.hasPension && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Monthly pension amount ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input type="number" className="input-field pl-7" value={form.pensionMonthlyAmount || ''} onChange={e => updateField('pensionMonthlyAmount', parseFloat(e.target.value))} placeholder="2,000" />
              </div>
            </div>
            <div>
              <label className="label">Cost-of-living adjustment (COLA)</label>
              <select className="input-field" value={form.pensionCOLA} onChange={e => updateField('pensionCOLA', e.target.value)}>
                <option value="none">No COLA (fixed amount)</option>
                <option value="partial">Partial COLA</option>
                <option value="yes">Full COLA (matches inflation)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
