import { useForm } from '../../context/AppContext.jsx'
import { SliderWithInput } from '../common/SliderWithInput.jsx'
import { HelpTooltip } from '../common/HelpTooltip.jsx'
import { FERSPenaltyBadge, EarlyWithdrawalBadge, RulOf55Badge, MRARangeBadge, SpainCitizenshipBadge } from '../common/SmartBadge.jsx'
import { CountrySearch } from '../common/CountrySearch.jsx'
import { STATE_LIST, getStateDisplayInfo } from '../../data/stateTaxData.js'
import { getMRA } from '../../utils/federalCalculations.js'
import { formatCurrency } from '../../utils/formatters.js'

const CURRENT_YEAR = new Date().getFullYear()

export default function Step5Goals() {
  const { form, updateField } = useForm()
  const isFederal = form.employmentType === 'federal' || form.employmentType === 'federal_csrs'
  const isMarried = form.maritalStatus === 'married'
  const currentAge = form.birthYear ? CURRENT_YEAR - form.birthYear : 55
  const mra = form.birthYear ? getMRA(form.birthYear) : 57
  const retirementAge = form.targetRetirementAge || 60

  const stateInfo = form.retirementStateCode ? getStateDisplayInfo(form.retirementStateCode) : null
  const countryData = form.retirementCountryKey ? null : null

  const showInternational = form.retirementLocationType === 'international' || form.retirementLocationType === 'undecided'
  const showUS = form.retirementLocationType === 'us' || form.retirementLocationType === 'undecided'

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        When and where you retire changes everything — your FERS annuity, Social Security strategy, taxes, and cost of living. This step locks in your retirement vision so the rest of your plan can be built around it.
      </p>

      {/* Target retirement age */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Target retirement age</h3>

        <SliderWithInput
          label="Target retirement age"
          value={retirementAge}
          onChange={v => updateField('targetRetirementAge', v)}
          min={45}
          max={75}
          step={1}
          suffix=" yrs"
          presets={isFederal ? [
            { label: `MRA (${mra})`, value: mra },
            { label: '60', value: 60 },
            { label: '62', value: 62 },
            { label: '65', value: 65 },
          ] : [
            { label: '55', value: 55 },
            { label: '60', value: 60 },
            { label: '62', value: 62 },
            { label: '65', value: 65 },
            { label: '67', value: 67 },
          ]}
        />

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Years to retirement: <strong>{Math.max(0, retirementAge - currentAge)}</strong>
          {retirementAge < 62 && isFederal && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">⚠️ Before age 62 — FERS penalty may apply</span>
          )}
          {retirementAge < 59.5 && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">⚠️ Before 59½ — early TSP/IRA rules apply</span>
          )}
        </div>

        <FERSPenaltyBadge retirementAge={retirementAge} penaltyYears={isFederal ? Math.max(0, 62 - retirementAge) : 0} />
        <EarlyWithdrawalBadge retirementAge={retirementAge} />
        <RulOf55Badge retirementAge={retirementAge} />
        <MRARangeBadge retirementAge={retirementAge} mra={mra} />

        <div>
          <label className="label">How firm is your target?</label>
          <select className="input-field md:w-72" value={form.retirementFlexibility} onChange={e => updateField('retirementFlexibility', e.target.value)}>
            <option value="firm">Firm target</option>
            <option value="plus_minus_2">Flexible ± 1-2 years</option>
            <option value="exploring">Still exploring</option>
          </select>
        </div>

        {isFederal && retirementAge < 62 && (
          <div>
            <label className="label">
              FERS early retirement option
              <HelpTooltip content="If you retire before 62 with MRA+10 eligibility, you can take the annuity now (with a penalty) or postpone it to avoid the penalty." className="ml-1" />
            </label>
            <select className="input-field md:w-96" value={form.fersEarlyOption} onChange={e => updateField('fersEarlyOption', e.target.value)}>
              <option value="take_now">Take annuity at {mra} (with penalty)</option>
              <option value="postpone_60">Postpone to age 60 (no penalty)</option>
              <option value="postpone_62">Postpone to age 62 (1.1% multiplier)</option>
              <option value="see_all">Show me all options in the report</option>
            </select>
          </div>
        )}
      </div>

      {/* Social Security */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Social Security</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Your estimated SS benefit at FRA ($)
              <HelpTooltip content="Find your estimated benefit at ssa.gov/myaccount — look for 'Your Retirement Benefits' table. Use the 'Full Retirement Age' column." className="ml-1" />
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" className="input-field pl-7" value={form.ssBenefitAtFRA || ''} onChange={e => updateField('ssBenefitAtFRA', parseFloat(e.target.value) || 0)} placeholder="2,000" />
            </div>
            <p className="help-text">Find your estimate at <strong>ssa.gov/myaccount</strong></p>
            {form.ssBenefitAtFRA > 0 && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                <div>At 62: ~{formatCurrency(form.ssBenefitAtFRA * 0.75)}/mo</div>
                <div>At FRA: {formatCurrency(form.ssBenefitAtFRA)}/mo</div>
                <div>At 70: ~{formatCurrency(form.ssBenefitAtFRA * 1.24)}/mo</div>
              </div>
            )}
          </div>

          <div>
            <label className="label">SS claiming strategy</label>
            <select className="input-field" value={form.ssClaimingStrategy} onChange={e => updateField('ssClaimingStrategy', e.target.value)}>
              <option value="62">Claim at 62 (earliest — reduced benefit)</option>
              <option value="fra">Claim at FRA (~67 for most)</option>
              <option value="70">Delay to 70 (maximum benefit)</option>
              <option value="unsure">Not sure — show break-even analysis</option>
            </select>
          </div>
        </div>

        {isMarried && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Spouse SS benefit at FRA ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input type="number" className="input-field pl-7" value={form.spouseSSBenefitAtFRA || ''} onChange={e => updateField('spouseSSBenefitAtFRA', parseFloat(e.target.value) || 0)} placeholder="1,500" />
              </div>
            </div>
            <div>
              <label className="label">Spouse claiming strategy</label>
              <select className="input-field" value={form.spouseSSClaimingStrategy} onChange={e => updateField('spouseSSClaimingStrategy', e.target.value)}>
                <option value="62">At 62</option>
                <option value="fra">At FRA</option>
                <option value="70">Delay to 70</option>
                <option value="unsure">Not sure</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Retirement location */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Retirement location</h3>

        <div>
          <label className="label">Where do you plan to retire?</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'us', label: '🇺🇸 United States' },
              { value: 'international', label: '🌍 International' },
              { value: 'undecided', label: '🤔 Undecided — show both' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField('retirementLocationType', opt.value)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${form.retirementLocationType === opt.value ? 'bg-[#2E6DB4] text-white border-[#2E6DB4]' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-[#2E6DB4]'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {showUS && (
          <div className="space-y-4">
            {form.retirementLocationType === 'undecided' && <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">US Option:</h4>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Retirement state</label>
                <select className="input-field" value={form.retirementStateCode} onChange={e => updateField('retirementStateCode', e.target.value)}>
                  <option value="">Select state…</option>
                  {STATE_LIST.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
                {stateInfo && <p className="help-text text-[#2E6DB4]">{stateInfo}</p>}
              </div>
              <div>
                <label className="label">Specific city (optional)</label>
                <input type="text" className="input-field" value={form.retirementCity || ''} onChange={e => updateField('retirementCity', e.target.value)} placeholder="e.g., Sarasota FL, Bozeman MT" />
              </div>
            </div>
            <div>
              <label className="label">Urban / Suburban / Rural</label>
              <div className="flex gap-2">
                {['urban', 'suburban', 'rural'].map(t => (
                  <button key={t} type="button" onClick={() => updateField('urbanRural', t)}
                    className={`px-3 py-1.5 rounded-lg border text-sm capitalize transition-colors ${form.urbanRural === t ? 'bg-[#2E6DB4] text-white border-[#2E6DB4]' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-[#2E6DB4]'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <p className="help-text">Affects cost-of-living multiplier: urban +15%, suburban avg, rural -15%</p>
            </div>
          </div>
        )}

        {showInternational && (
          <div className="space-y-4">
            {form.retirementLocationType === 'undecided' && <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">International Option:</h4>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Country</label>
                <CountrySearch
                  value={form.retirementCountry || ''}
                  onSelect={({ key, name, data }) => {
                    updateField('retirementCountry', name)
                    updateField('retirementCountryKey', key)
                    if (data?.currency) updateField('retirementCountryCurrency', data.currency)
                  }}
                />
              </div>
              <div>
                <label className="label">Specific city (optional)</label>
                <input type="text" className="input-field" value={form.retirementCity || ''} onChange={e => updateField('retirementCity', e.target.value)} placeholder="e.g., Valencia, Lisbon" />
              </div>
            </div>

            {form.retirementCountryKey && (
              <CountryInfoCard countryKey={form.retirementCountryKey} />
            )}

            {!form.retirementCountryKey && form.retirementCountry && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Unknown country — please estimate COL savings vs your current city:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '70% cheaper', value: 0.70 },
                    { label: '50% cheaper', value: 0.50 },
                    { label: '30% cheaper', value: 0.30 },
                    { label: 'About the same', value: 0 },
                    { label: 'More expensive', value: -0.20 },
                  ].map(opt => (
                    <button key={opt.label} type="button" onClick={() => updateField('customCOLSavingsPct', opt.value)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${form.customCOLSavingsPct === opt.value ? 'bg-[#2E6DB4] text-white border-[#2E6DB4]' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-[#2E6DB4]'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Healthcare plan abroad</label>
                <select className="input-field" value={form.healthcarePlanAbroad} onChange={e => updateField('healthcarePlanAbroad', e.target.value)}>
                  <option value="private_expat">Private expat insurance</option>
                  <option value="local_public">Local public system</option>
                  <option value="medical_tourism">Medical tourism + US coverage</option>
                  <option value="undecided">Undecided</option>
                </select>
              </div>
              <div>
                <label className="label">Visa / residency type</label>
                <input type="text" className="input-field" value={form.visaType || ''} onChange={e => updateField('visaType', e.target.value)} placeholder="e.g., NLV, D7, Pensionado" />
              </div>
            </div>

            <SpainCitizenshipBadge
              puertoRicanHeritage={form.puertoRicanHeritage}
              retirementCountryKey={form.retirementCountryKey}
              fersMonthlyAnnuity={0}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function CountryInfoCard({ countryKey }) {
  const { data } = { data: null }
  const countries = {
    spain: { name: 'Spain 🇪🇸', col: '45% cheaper than US avg', visa: 'Non-Lucrative Visa (NLV)', healthcare: 'Excellent public + private', note: 'Spain NHR tax regime ends 2024; Beckham Law may apply first 5 years.' },
    portugal: { name: 'Portugal 🇵🇹', col: '40% cheaper', visa: 'D7 Passive Income Visa', healthcare: 'Good public NHS', note: '10% flat NHR tax on foreign pension for 10 years.' },
    mexico: { name: 'Mexico 🇲🇽', col: '55% cheaper', visa: 'Temporal Residente', healthcare: 'Good private care at 15-30% of US costs', note: 'USD widely accepted. Short flights home.' },
    costaRica: { name: 'Costa Rica 🇨🇷', col: '35% cheaper', visa: 'Pensionado Visa ($1,000/mo income)', healthcare: 'Excellent CAJA public system', note: 'No tax on foreign income.' },
    panama: { name: 'Panama 🇵🇦', col: '30% cheaper', visa: 'Pensionado Visa', healthcare: 'JCI-accredited hospitals', note: 'Uses USD — no currency risk.' },
    thailand: { name: 'Thailand 🇹🇭', col: '65% cheaper', visa: 'LTR Visa or Retirement Visa', healthcare: 'World-class at 30-50% of US costs', note: '' },
    colombia: { name: 'Colombia 🇨🇴', col: '60% cheaper', visa: 'Pensionado Visa', healthcare: 'Good private in major cities', note: '' },
    greece: { name: 'Greece 🇬🇷', col: '40% cheaper', visa: 'Digital Nomad / Non-Dom', healthcare: 'EU public + affordable private', note: '7% flat tax on foreign income for retirees.' },
    italy: { name: 'Italy 🇮🇹', col: '35% cheaper', visa: 'Elective Residency Visa', healthcare: 'SSN universal healthcare', note: '7% flat tax in qualifying southern towns.' },
    belize: { name: 'Belize 🇧🇿', col: '45% cheaper', visa: 'QRP Program', healthcare: 'Basic — recommend private', note: 'English-speaking. USD pegged 2:1.' },
    malaysia: { name: 'Malaysia 🇲🇾', col: '65% cheaper', visa: 'MM2H Visa', healthcare: 'Excellent at 20-40% US costs', note: 'No capital gains tax.' },
    puertoRico: { name: 'Puerto Rico 🇵🇷', col: '20% cheaper', visa: 'US territory — no visa', healthcare: 'Medicare eligible', note: 'Act 60 tax incentives available.' },
  }

  const info = countries[countryKey]
  if (!info) return null

  return (
    <div className="callout-info text-sm space-y-1">
      <div className="font-medium">{info.name}</div>
      <div>💰 COL: {info.col}</div>
      <div>🏥 Healthcare: {info.healthcare}</div>
      <div>📋 Visa: {info.visa}</div>
      {info.note && <div className="text-xs opacity-80">💡 {info.note}</div>}
    </div>
  )
}
