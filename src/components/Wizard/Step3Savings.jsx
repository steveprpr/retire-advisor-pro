import { useForm } from '../../context/AppContext.jsx'
import { HelpTooltip, HelpAccordion } from '../common/HelpTooltip.jsx'
import { SliderWithInput } from '../common/SliderWithInput.jsx'
import { BackdoorRothBadge } from '../common/SmartBadge.jsx'
import { formatCurrency } from '../../utils/formatters.js'
import { IRS_LIMITS } from '../../config/defaults.js'

const CURRENT_YEAR = new Date().getFullYear()
const LIMITS = IRS_LIMITS[CURRENT_YEAR] || IRS_LIMITS[2025]

const PLAN_TYPES = [
  { value: 'tsp', label: 'TSP (Federal)' },
  { value: '401k', label: '401(k)' },
  { value: '403b', label: '403(b)' },
  { value: '457b', label: '457(b)' },
  { value: 'simple_ira', label: 'SIMPLE IRA' },
  { value: 'other', label: 'Other' },
]

const MATCH_TYPES = [
  { value: 'percentage', label: 'Percentage of salary' },
  { value: 'dollar', label: 'Fixed dollar amount/year' },
  { value: 'none', label: 'No employer match' },
]

const DIVIDEND_ETFS = [
  { value: 'SCHD', label: 'SCHD — 3.5% yield (Schwab Dividend)', desc: 'Popular, diversified, 10%/yr dividend growth historically' },
  { value: 'VYM', label: 'VYM — 3.0% yield (Vanguard High Dividend)', desc: 'Broad diversification, low expense ratio' },
  { value: 'NOBL', label: 'NOBL — 2.1% yield (Dividend Aristocrats)', desc: 'Only companies with 25+ years of dividend growth' },
  { value: 'JEPI', label: 'JEPI — 7.5% yield (JPMorgan Equity Premium)', desc: 'High yield via options strategy; more complex' },
  { value: 'custom', label: 'Custom yield' },
]

export default function Step3Savings() {
  const { form, updateField } = useForm()
  const currentAge = form.birthYear ? CURRENT_YEAR - form.birthYear : 55
  const isCatchup = currentAge >= 50
  const maxContrib = LIMITS.tsp + (isCatchup ? LIMITS.catchup : 0)

  // Employer match calculation (live)
  let matchAmount = 0
  if (form.employerMatchType === 'percentage' && form.currentSalary) {
    const capPct = (form.employerMatchCapPct || 5) / 100
    matchAmount = form.currentSalary * capPct * ((form.employerMatchPct || 100) / 100)
  } else if (form.employerMatchType === 'dollar') {
    matchAmount = form.employerMatchFixedAmount || 0
  }

  return (
    <div className="space-y-6">
      {/* Plan type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Retirement savings plan type</label>
          <select className="input-field" value={form.planType} onChange={e => updateField('planType', e.target.value)}>
            {PLAN_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {/* Balances */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Current balances</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Traditional (pre-tax) balance ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" className="input-field pl-7" value={form.tspTraditionalBalance || ''} onChange={e => updateField('tspTraditionalBalance', parseFloat(e.target.value) || 0)} placeholder="150,000" />
            </div>
          </div>
          <div>
            <label className="label">Roth balance ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" className="input-field pl-7" value={form.tspRothBalance || ''} onChange={e => updateField('tspRothBalance', parseFloat(e.target.value) || 0)} placeholder="0" />
            </div>
          </div>
        </div>
        {(form.tspTraditionalBalance || 0) + (form.tspRothBalance || 0) > 0 && (
          <p className="help-text">Combined balance: <strong>{formatCurrency((form.tspTraditionalBalance || 0) + (form.tspRothBalance || 0))}</strong></p>
        )}
      </div>

      {/* Annual contributions */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-800 dark:text-gray-200">Annual contributions</h3>
          <span className="badge-blue">
            {isCatchup ? `2025 limit: ${formatCurrency(maxContrib)} (catch-up)` : `2025 limit: ${formatCurrency(maxContrib)}`}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Your annual Traditional contribution ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" className="input-field pl-7" value={form.annualContribTraditional || ''} onChange={e => updateField('annualContribTraditional', parseFloat(e.target.value) || 0)} placeholder="23,500" />
            </div>
          </div>
          <div>
            <label className="label">Your annual Roth contribution ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" className="input-field pl-7" value={form.annualContribRoth || ''} onChange={e => updateField('annualContribRoth', parseFloat(e.target.value) || 0)} placeholder="0" />
            </div>
          </div>
        </div>

        {/* Employer match */}
        <div>
          <label className="label">
            Employer match type
            <HelpTooltip content="Federal FERS agencies match 5% of salary (1% automatic + 4% matching). Private 401k average match is ~4.3% of salary." className="ml-1" />
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            <select className="input-field md:w-80" value={form.employerMatchType || 'percentage'} onChange={e => updateField('employerMatchType', e.target.value)}>
              {MATCH_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            {(form.planType === 'tsp' || form.employmentType === 'federal') && (
              <button
                type="button"
                className="btn-ghost text-xs whitespace-nowrap"
                onClick={() => {
                  updateField('employerMatchType', 'percentage')
                  updateField('employerMatchPct', 100)
                  updateField('employerMatchCapPct', 5)
                }}
              >
                FERS 5% preset
              </button>
            )}
            <button
              type="button"
              className="btn-ghost text-xs whitespace-nowrap"
              onClick={() => {
                updateField('employerMatchType', 'percentage')
                updateField('employerMatchPct', 100)
                updateField('employerMatchCapPct', 10)
              }}
            >
              10% match preset
            </button>
          </div>
          {form.planType === 'tsp' && form.employerMatchType === 'percentage' && form.employerMatchCapPct >= 5 && (
            <p className="help-text text-[#1D9E75] mt-1">
              ✓ FERS match: 1% automatic + up to 4% matching = <strong>5% of salary</strong> total
            </p>
          )}
        </div>

        {form.employerMatchType === 'percentage' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Employer matches % of your contribution</label>
              <SliderWithInput
                value={form.employerMatchPct || 100}
                onChange={v => updateField('employerMatchPct', v)}
                min={0}
                max={100}
                step={1}
                suffix="% match"
                helpText="100% = dollar-for-dollar"
              />
            </div>
            <div>
              <label className="label">Up to this % of salary</label>
              <SliderWithInput
                value={form.employerMatchCapPct || 5}
                onChange={v => updateField('employerMatchCapPct', v)}
                min={0}
                max={10}
                step={0.5}
                suffix="% of salary"
                presets={[{ label: '3%', value: 3 }, { label: '4%', value: 4 }, { label: '5%', value: 5 }]}
              />
            </div>
          </div>
        )}
        {form.employerMatchType === 'dollar' && (
          <div>
            <label className="label">Annual employer contribution ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" className="input-field pl-7 md:w-48" value={form.employerMatchFixedAmount || ''} onChange={e => updateField('employerMatchFixedAmount', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        )}
        {matchAmount > 0 && (
          <p className="text-sm text-[#1D9E75]">✓ Your employer will contribute approximately <strong>{formatCurrency(matchAmount)}/year</strong></p>
        )}
      </div>

      {/* Return rate */}
      <SliderWithInput
        label="Expected annual return"
        value={(form.tspReturnRate || 0.065) * 100}
        onChange={v => updateField('tspReturnRate', v / 100)}
        min={4}
        max={12}
        step={0.1}
        suffix="%"
        helpText="Historical S&P 500 avg: ~10%. Blended portfolio with bonds: ~6–7%. Adjust for your allocation."
        presets={[
          { label: 'Conservative (5%)', value: 5 },
          { label: 'Moderate (6.5%)', value: 6.5 },
          { label: 'Aggressive (9%)', value: 9 },
        ]}
      />

      {/* Withdrawal strategy */}
      <div>
        <label className="label">Withdrawal strategy at retirement</label>
        <div className="space-y-2">
          {[
            { value: 'fourPct', label: '4% Rule', desc: 'Withdraw 4% of balance annually, adjust for inflation. Preserves principal for legacy.' },
            { value: 'dividend', label: 'Dividend Income Strategy', desc: 'Convert to dividend ETFs for passive income. No shares sold — dividends are paid to you quarterly.' },
            { value: 'hybrid', label: 'Hybrid', desc: '4% rule from TSP/401k PLUS dividend income from a separate Roth IRA.' },
            { value: 'unsure', label: 'Not sure — show me all options in the report', desc: '' },
          ].map(opt => (
            <label key={opt.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${form.withdrawalStrategy === opt.value ? 'border-[#2E6DB4] bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-700 hover:border-[#2E6DB4]'}`}>
              <input type="radio" name="withdrawalStrategy" value={opt.value} checked={form.withdrawalStrategy === opt.value} onChange={e => updateField('withdrawalStrategy', e.target.value)} className="accent-[#2E6DB4] mt-0.5" />
              <div>
                <div className="font-medium text-sm">{opt.label}</div>
                {opt.desc && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</div>}
              </div>
            </label>
          ))}
        </div>

        {form.withdrawalStrategy === 'dividend' && (
          <div className="mt-4 space-y-3">
            <label className="label">Select dividend ETF</label>
            {DIVIDEND_ETFS.map(etf => (
              <label key={etf.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${form.dividendETF === etf.value ? 'border-[#1D9E75] bg-green-50 dark:bg-green-950' : 'border-gray-200 dark:border-gray-700 hover:border-[#1D9E75]'}`}>
                <input type="radio" name="dividendETF" value={etf.value} checked={form.dividendETF === etf.value} onChange={e => updateField('dividendETF', e.target.value)} className="accent-[#1D9E75] mt-0.5" />
                <div>
                  <div className="font-medium text-sm">{etf.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{etf.desc}</div>
                </div>
              </label>
            ))}
            {form.dividendETF === 'custom' && (
              <SliderWithInput
                label="Custom dividend yield"
                value={(form.customDividendYield || 0.035) * 100}
                onChange={v => updateField('customDividendYield', v / 100)}
                min={1}
                max={12}
                step={0.1}
                suffix="%"
              />
            )}
          </div>
        )}
      </div>

      {/* Roth IRA */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Roth IRA</h3>
        <div>
          <label className="label">Do you have a Roth IRA?</label>
          <select className="input-field md:w-80" value={form.hasRothIRA} onChange={e => updateField('hasRothIRA', e.target.value)}>
            <option value="both">Yes — both spouses have one</option>
            <option value="just_me">Yes — just me</option>
            <option value="planning">Planning to start one</option>
            <option value="no">No</option>
          </select>
        </div>

        {form.hasRothIRA !== 'no' && (
          <>
            {form.hasRothIRA === 'both' ? (
              <div className="space-y-3">
                {/* Your Roth */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Your Roth IRA</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DollarField label="Your current balance ($)" fieldKey="rothIRABalance" form={form} updateField={updateField} />
                    <div>
                      <label className="label">
                        Your annual contribution ($)
                        <span className="badge-blue ml-2">{CURRENT_YEAR} limit: {formatCurrency(LIMITS.rothIra + (isCatchup ? LIMITS.rothCatchup : 0))}</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input type="number" className="input-field pl-7" value={form.annualRothIRAContrib || ''} onChange={e => updateField('annualRothIRAContrib', parseFloat(e.target.value) || 0)} placeholder="7,000" />
                      </div>
                    </div>
                  </div>
                  <BackdoorRothBadge income={form.currentSalary} />
                </div>
                {/* Spouse Roth */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Spouse's Roth IRA</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DollarField label="Spouse's current balance ($)" fieldKey="spouseRothIRABalance" form={form} updateField={updateField} />
                    <div>
                      <label className="label">
                        Spouse's annual contribution ($)
                        <span className="badge-blue ml-2">{CURRENT_YEAR} limit: {formatCurrency(LIMITS.rothIra)}</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input type="number" className="input-field pl-7" value={form.annualSpouseRothIRAContrib || ''} onChange={e => updateField('annualSpouseRothIRAContrib', parseFloat(e.target.value) || 0)} placeholder="7,000" />
                      </div>
                    </div>
                  </div>
                  <BackdoorRothBadge income={form.spouseCurrentSalary} />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DollarField label="Current Roth IRA balance ($)" fieldKey="rothIRABalance" form={form} updateField={updateField} />
                  <div>
                    <label className="label">
                      Annual contribution ($)
                      <span className="badge-blue ml-2">{CURRENT_YEAR} limit: {formatCurrency(LIMITS.rothIra + (isCatchup ? LIMITS.rothCatchup : 0))}</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input type="number" className="input-field pl-7" value={form.annualRothIRAContrib || ''} onChange={e => updateField('annualRothIRAContrib', parseFloat(e.target.value) || 0)} placeholder="7,000" />
                    </div>
                  </div>
                </div>
                <BackdoorRothBadge income={form.currentSalary} />
              </>
            )}
          </>
        )}

        <HelpAccordion title="What is a Roth IRA?">
          <p>A <strong>Roth IRA</strong> is a retirement account where you contribute <em>after-tax</em> money. The growth and withdrawals in retirement are <em>completely tax-free</em>. This is the opposite of a Traditional IRA or TSP, where you pay taxes when you withdraw.</p>
          <p className="mt-2">Key benefits: tax-free growth, no Required Minimum Distributions (RMDs), flexible withdrawal rules, excellent estate planning tool.</p>
          <p className="mt-2">Income limit for 2024: $161K (single) / $240K (MFJ) for direct contributions. Above that, the Backdoor Roth method is required.</p>
        </HelpAccordion>
      </div>

      {/* Other savings */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-5">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Other savings</h3>

        {/* Taxable Brokerage */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Taxable brokerage account</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DollarField label="Current balance ($)" fieldKey="brokerageBalance" form={form} updateField={updateField} />
            <DollarField label="Annual contribution ($)" fieldKey="annualBrokerageContrib" form={form} updateField={updateField} helpText="Until retirement" />
            <DollarField label="Monthly withdrawal in retirement ($)" fieldKey="monthlyBrokerageWithdrawal" form={form} updateField={updateField} helpText="Drawdown amount" />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* HSA */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Health Savings Account (HSA)
            <HelpTooltip content="Triple tax advantage: contributions are pre-tax, growth is tax-free, and withdrawals for qualified medical expenses are tax-free. After age 65, can be withdrawn for any reason (taxed like traditional IRA)." className="ml-1" />
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DollarField label="Current balance ($)" fieldKey="hsaBalance" form={form} updateField={updateField} />
            <DollarField label="Annual contribution ($)" fieldKey="annualHSAContrib" form={form} updateField={updateField} helpText={`2025 limit: $4,300 / $8,550 (family)`} />
            <DollarField label="Annual medical spending in retirement ($)" fieldKey="annualHSAMedWithdrawal" form={form} updateField={updateField} helpText="Withdrawn tax-free for healthcare" />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Other savings */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Other savings (CDs, bonds, savings accounts)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DollarField label="Current balance ($)" fieldKey="otherSavings" form={form} updateField={updateField} />
            <DollarField label="Annual contribution ($)" fieldKey="annualOtherSavingsContrib" form={form} updateField={updateField} helpText="Until retirement" />
            <DollarField label="Monthly withdrawal in retirement ($)" fieldKey="monthlyOtherSavingsWithdrawal" form={form} updateField={updateField} helpText="Drawdown amount" />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Cash reserve */}
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Cash emergency fund</h4>
          <DollarField label="Balance ($)" fieldKey="cashEmergencyFund" form={form} updateField={updateField} helpText="Kept as a reserve — not included in investment projections" />
        </div>
      </div>

      {/* Spouse retirement plan */}
      {form.maritalStatus === 'married' && <SpouseRetirementSection />}
    </div>
  )
}

const SPOUSE_EMPLOYMENT_TYPES = [
  { value: 'federal', label: 'Federal civilian (FERS/CSRS)' },
  { value: 'military', label: 'Military' },
  { value: 'private', label: 'Private sector' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'nonprofit', label: 'Non-profit / 501(c)(3)' },
  { value: 'state_local', label: 'State / local government' },
  { value: 'none', label: 'Not working / retired' },
]

function SpouseRetirementSection() {
  const { form, updateField } = useForm()
  const spouseBirthYear = form.spouseBirthYear
  const spouseCurrentAge = spouseBirthYear ? CURRENT_YEAR - parseInt(spouseBirthYear) : null
  const isFederal = form.spouseEmploymentType === 'federal'
  const isPrivate = form.spouseEmploymentType === 'private' || form.spouseEmploymentType === 'state_local' || form.spouseEmploymentType === 'nonprofit'
  const hasPlan = form.spouseEmploymentType && form.spouseEmploymentType !== 'none' && form.spouseEmploymentType !== ''

  const autoSpouseServiceYears = form.spouseSCDYear && spouseBirthYear
    ? Math.max(0, (CURRENT_YEAR + Math.max(0, (form.spouseTargetRetirementAge || 62) - (spouseCurrentAge || 55))) - parseInt(form.spouseSCDYear))
    : null

  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-5">
      <div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Spouse's Retirement Plan</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Include your spouse's retirement savings and income sources for a joint retirement picture.</p>
      </div>

      {/* Employment type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Spouse's employment type</label>
          <select className="input-field" value={form.spouseEmploymentType || ''} onChange={e => updateField('spouseEmploymentType', e.target.value)}>
            <option value="">Select…</option>
            {SPOUSE_EMPLOYMENT_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        {hasPlan && (
          <div>
            <label className="label">Spouse's target retirement age</label>
            <input type="number" className="input-field" value={form.spouseTargetRetirementAge || ''} onChange={e => updateField('spouseTargetRetirementAge', parseInt(e.target.value))} placeholder="62" min="50" max="75" />
            {spouseCurrentAge && <p className="help-text">Currently age {spouseCurrentAge}</p>}
          </div>
        )}
      </div>

      {/* Federal-specific fields */}
      {isFederal && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-[#1B3A6B] dark:text-blue-300">Federal Service Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Retirement system</label>
              <select className="input-field" value={form.spouseRetirementSystem || 'fers'} onChange={e => updateField('spouseRetirementSystem', e.target.value)}>
                <option value="fers">FERS</option>
                <option value="fers_rae">FERS-RAE (hired 2013+)</option>
                <option value="csrs">CSRS</option>
                <option value="csrs_offset">CSRS-Offset</option>
              </select>
            </div>
            <div>
              <label className="label">Current salary ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input type="number" className="input-field pl-7" value={form.spouseCurrentSalary || ''} onChange={e => updateField('spouseCurrentSalary', parseFloat(e.target.value) || 0)} placeholder="90,000" />
              </div>
            </div>
          </div>

          {/* Service years */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Federal service start year (SCD)</label>
              <input type="number" className="input-field" value={form.spouseSCDYear || ''} onChange={e => updateField('spouseSCDYear', parseInt(e.target.value))} placeholder={String(CURRENT_YEAR - 15)} min="1960" max={CURRENT_YEAR} />
              {form.spouseSCDYear && <p className="help-text">{CURRENT_YEAR - form.spouseSCDYear} years of service today</p>}
            </div>
            <div className="flex flex-col justify-center">
              {autoSpouseServiceYears != null ? (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-[#2E6DB4]/30 rounded-lg">
                  <div className="text-2xl font-bold text-[#1B3A6B] dark:text-blue-300">{autoSpouseServiceYears.toFixed(1)} yrs</div>
                  <div className="text-xs text-gray-500 mt-0.5">projected at retirement (age {form.spouseTargetRetirementAge || 62})</div>
                </div>
              ) : (
                <div>
                  <label className="label">Or enter current service years manually</label>
                  <input type="number" className="input-field md:w-32" value={form.spouseCredibleServiceYears || ''} onChange={e => updateField('spouseCredibleServiceYears', parseFloat(e.target.value) || 0)} placeholder="15" min="0" max="42" />
                </div>
              )}
            </div>
          </div>

          {/* High-3 */}
          <div>
            <label className="label">High-3 salary estimate ($)</label>
            {form.spouseHigh3Override ? (
              <>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input type="number" className="input-field pl-7 md:w-56" value={form.spouseHigh3Salary || ''} onChange={e => updateField('spouseHigh3Salary', parseFloat(e.target.value) || 0)} placeholder="85,000" />
                </div>
                <button type="button" className="text-xs text-blue-600 hover:underline mt-1" onClick={() => updateField('spouseHigh3Override', false)}>← Use auto-estimate</button>
              </>
            ) : (
              <>
                <p className="help-text">Auto-estimated from spouse's salary. <button type="button" className="text-blue-600 hover:underline" onClick={() => { updateField('spouseHigh3Override', true); updateField('spouseHigh3Salary', form.spouseCurrentSalary || 0) }}>Override manually</button></p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pension (private/state/nonprofit) */}
      {isPrivate && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pension</h4>
          <div>
            <label className="label">Does your spouse have a pension?</label>
            <div className="flex gap-4">
              {['Yes', 'No'].map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="spouseHasPension" checked={form.spouseHasPension === (opt === 'Yes')} onChange={() => updateField('spouseHasPension', opt === 'Yes')} className="accent-[#2E6DB4]" />
                  {opt}
                </label>
              ))}
            </div>
          </div>
          {form.spouseHasPension && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Monthly pension amount ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input type="number" className="input-field pl-7" value={form.spousePensionMonthlyAmount || ''} onChange={e => updateField('spousePensionMonthlyAmount', parseFloat(e.target.value) || 0)} placeholder="2,000" />
                </div>
              </div>
              <div>
                <label className="label">COLA</label>
                <select className="input-field" value={form.spousePensionCOLA} onChange={e => updateField('spousePensionCOLA', e.target.value)}>
                  <option value="none">No COLA (fixed)</option>
                  <option value="partial">Partial COLA</option>
                  <option value="yes">Full COLA (matches inflation)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spouse TSP / 401k */}
      {hasPlan && form.spouseEmploymentType !== 'none' && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {isFederal ? 'TSP / Retirement Savings' : '401(k) / Retirement Savings'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DollarField label="Current balance ($)" fieldKey="spouseTSPBalance" form={form} updateField={updateField} />
            <DollarField label="Annual contribution ($)" fieldKey="spouseAnnualTSPContrib" form={form} updateField={updateField} helpText="Employee contribution" />
            <div>
              <label className="label">Expected annual return</label>
              <SliderWithInput
                value={(form.spouseTSPReturnRate || 0.065) * 100}
                onChange={v => updateField('spouseTSPReturnRate', v / 100)}
                min={3}
                max={12}
                step={0.1}
                suffix="%"
                presets={[{ label: '5%', value: 5 }, { label: '6.5%', value: 6.5 }, { label: '9%', value: 9 }]}
              />
            </div>
          </div>
          <div>
            <label className="label">Employer match (% of salary cap)</label>
            <SliderWithInput
              value={form.spouseEmployerMatchCapPct || 5}
              onChange={v => updateField('spouseEmployerMatchCapPct', v)}
              min={0}
              max={15}
              step={0.5}
              suffix="% of salary"
              presets={isFederal ? [{ label: 'FERS 5%', value: 5 }] : [{ label: '3%', value: 3 }, { label: '5%', value: 5 }]}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function DollarField({ label, fieldKey, form, updateField, helpText }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
        <input
          type="number"
          className="input-field pl-7"
          value={form[fieldKey] || ''}
          onChange={e => updateField(fieldKey, parseFloat(e.target.value) || 0)}
          placeholder="0"
          min="0"
        />
      </div>
      {helpText && <p className="help-text">{helpText}</p>}
    </div>
  )
}
