import { useForm } from '../../context/AppContext.jsx'
import { HelpTooltip, HelpAccordion } from '../common/HelpTooltip.jsx'
import { SliderWithInput } from '../common/SliderWithInput.jsx'
import { MoneyInput } from '../common/MoneyInput.jsx'
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

const ADDITIONAL_PLAN_TYPES = [
  { value: '401k', label: '401(k)' },
  { value: '403b', label: '403(b)' },
  { value: '457b', label: '457(b)' },
  { value: 'simple_ira', label: 'SIMPLE IRA' },
  { value: 'other', label: 'Other' },
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
  const matchCapPct = form.employerMatchCapPct ?? 5
  const matchAmount = form.currentSalary ? (form.currentSalary * matchCapPct / 100) : 0

  const additionalPlanCount = form.additionalPlanCount || 0
  const additionalPlans = form.additionalPlans || []

  const updateAdditionalPlan = (index, field, value) => {
    const plans = [...(form.additionalPlans || [])]
    while (plans.length <= index) plans.push({ type: '401k', balance: 0, contrib: 0, matchPct: 0 })
    plans[index] = { ...plans[index], [field]: value }
    updateField('additionalPlans', plans)
  }

  const setAdditionalPlanCount = (count) => {
    updateField('additionalPlanCount', count)
    const plans = [...(form.additionalPlans || [])]
    while (plans.length < count) plans.push({ type: '401k', balance: 0, contrib: 0, matchPct: 0 })
    updateField('additionalPlans', plans.slice(0, count))
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Your savings and investments are the engine of your retirement. This step captures everything you're building — employer plans, IRAs, brokerage, HSA, and spouse savings — so we can project your total wealth at retirement and model how long it will last.
      </p>

      {/* ── Primary employer plan ─────────────────────────────────────────── */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-800 dark:text-gray-200">Primary employer plan</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Plan type</label>
            <select className="input-field" value={form.planType} onChange={e => updateField('planType', e.target.value)}>
              {PLAN_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Traditional (pre-tax) balance ($)</label>
            <MoneyInput value={form.tspTraditionalBalance || 0} onChange={v => updateField('tspTraditionalBalance', v)} placeholder="150,000" />
          </div>
          <div>
            <label className="label">Roth balance in this plan ($)</label>
            <MoneyInput value={form.tspRothBalance || 0} onChange={v => updateField('tspRothBalance', v)} placeholder="0" />
          </div>
        </div>
        {(form.tspTraditionalBalance || 0) + (form.tspRothBalance || 0) > 0 && (
          <p className="help-text">Combined balance: <strong>{formatCurrency((form.tspTraditionalBalance || 0) + (form.tspRothBalance || 0))}</strong></p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Your annual Traditional contribution ($)</label>
            <MoneyInput value={form.annualContribTraditional || 0} onChange={v => updateField('annualContribTraditional', v)} placeholder="23,500" />
          </div>
          <div>
            <label className="label">Your annual Roth contribution ($)</label>
            <MoneyInput value={form.annualContribRoth || 0} onChange={v => updateField('annualContribRoth', v)} placeholder="0" />
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          2025 combined limit: <strong>{formatCurrency(maxContrib)}</strong>{isCatchup ? ' (catch-up age 50+)' : ''}
        </div>

        <div>
          <SliderWithInput
            label={
              <span>
                Employer match — % of salary
                <HelpTooltip content="Federal FERS: 5% (1% automatic + up to 4% matching). Private 401k average: ~4–5%. Set to 0 if no match." className="ml-1" />
              </span>
            }
            value={matchCapPct}
            onChange={v => updateField('employerMatchCapPct', v)}
            min={0}
            max={15}
            step={0.5}
            suffix="% of salary"
            presets={
              (form.planType === 'tsp' || form.employmentType === 'federal')
                ? [{ label: 'FERS 5%', value: 5 }, { label: '3%', value: 3 }, { label: 'None', value: 0 }]
                : [{ label: '3%', value: 3 }, { label: '5%', value: 5 }, { label: 'None', value: 0 }]
            }
          />
          {matchAmount > 0 && (
            <p className="text-sm text-[#1D9E75] mt-1">✓ Employer contributes approximately <strong>{formatCurrency(matchAmount)}/year</strong></p>
          )}
          {(form.planType === 'tsp' || form.employmentType === 'federal') && matchCapPct >= 5 && (
            <p className="help-text text-[#1D9E75]">FERS: 1% automatic + up to 4% matching = 5% of salary total</p>
          )}
        </div>
      </div>

      {/* ── Additional employer plans ─────────────────────────────────────── */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <div>
          <h3 className="font-medium text-gray-800 dark:text-gray-200">
            Additional employer-sponsored plans
            <HelpTooltip content="Some employers — including certain federal agencies — offer more than one employer-sponsored retirement plan. For example, a TSP with 5% match plus a supplemental 401(k) with an additional 5% match from the same employer. Enter each additional plan separately." className="ml-1" />
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Same employer, additional plans — not from a different job.
          </p>
        </div>

        <div>
          <label className="label">How many additional employer plans do you have?</label>
          <select
            className="input-field md:w-64"
            value={additionalPlanCount}
            onChange={e => setAdditionalPlanCount(parseInt(e.target.value))}
          >
            <option value={0}>None — I only have one employer plan</option>
            <option value={1}>1 additional plan</option>
            <option value={2}>2 additional plans</option>
            <option value={3}>3 additional plans</option>
          </select>
        </div>

        {Array.from({ length: additionalPlanCount }).map((_, i) => {
          const plan = additionalPlans[i] || { type: '401k', balance: 0, contrib: 0, matchPct: 0 }
          const planMatch = (form.currentSalary || 0) * (plan.matchPct || 0) / 100
          return (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-semibold text-[#1B3A6B] dark:text-blue-300">
                Additional Plan {i + 1}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Plan type</label>
                  <select
                    className="input-field"
                    value={plan.type || '401k'}
                    onChange={e => updateAdditionalPlan(i, 'type', e.target.value)}
                  >
                    {ADDITIONAL_PLAN_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Current balance ($)</label>
                  <MoneyInput value={plan.balance || 0} onChange={v => updateAdditionalPlan(i, 'balance', v)} placeholder="50,000" />
                </div>
                <div>
                  <label className="label">Your annual contribution ($)</label>
                  <MoneyInput value={plan.contrib || 0} onChange={v => updateAdditionalPlan(i, 'contrib', v)} placeholder="10,000" />
                </div>
                <div>
                  <label className="label">
                    Employer match (% of salary)
                    <HelpTooltip content="Enter the match percentage for this specific plan." className="ml-1" />
                  </label>
                  <SliderWithInput
                    value={plan.matchPct || 0}
                    onChange={v => updateAdditionalPlan(i, 'matchPct', v)}
                    min={0}
                    max={15}
                    step={0.5}
                    suffix="%"
                    presets={[{ label: '5%', value: 5 }, { label: '3%', value: 3 }, { label: 'None', value: 0 }]}
                  />
                  {planMatch > 0 && (
                    <p className="text-xs text-[#1D9E75] mt-1">✓ ~{formatCurrency(planMatch)}/year from this plan's match</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {additionalPlanCount > 0 && (() => {
          const totalAdditionalBalance = additionalPlans.slice(0, additionalPlanCount).reduce((s, p) => s + (p.balance || 0), 0)
          const totalAdditionalMatch = additionalPlans.slice(0, additionalPlanCount).reduce((s, p) => s + (form.currentSalary || 0) * (p.matchPct || 0) / 100, 0)
          return (
            <p className="text-sm text-[#1D9E75]">
              ✓ Additional plans total: <strong>{formatCurrency(totalAdditionalBalance)}</strong> balance
              {totalAdditionalMatch > 0 && <> · <strong>{formatCurrency(totalAdditionalMatch)}/yr</strong> combined employer match</>}
            </p>
          )
        })()}
      </div>

      {/* ── Prior employer 401(k)s ────────────────────────────────────────── */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-3">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">
          Prior employer 401(k)s
          <HelpTooltip content="Add up all 401(k), 403(b), or 457 accounts from previous jobs that you haven't rolled over yet. These are growing at your chosen return rate but not receiving new contributions. Consider rolling them into a single IRA for simplicity." className="ml-1" />
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Total balance from previous jobs — no new contributions assumed.
        </p>
        <div className="flex items-start gap-4">
          <div className="flex-1 max-w-xs">
            <MoneyInput value={form.priorEmployer401kBalance || 0} onChange={v => updateField('priorEmployer401kBalance', v)} placeholder="0" />
          </div>
          {(form.priorEmployer401kBalance || 0) > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 pt-2.5">
              Growing at your {((form.tspReturnRate || 0.065) * 100).toFixed(1)}% return rate · no contributions.
            </p>
          )}
        </div>
      </div>

      {/* ── Individual Retirement Accounts (IRAs) ─────────────────────────── */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-5">
        <div>
          <h3 className="font-medium text-gray-800 dark:text-gray-200">Individual Retirement Accounts (IRAs)</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            IRAs are personal accounts separate from your employer plan — you set them up yourself.
          </p>
        </div>

        {/* Traditional IRA */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Traditional IRA
              <HelpTooltip content="A Traditional IRA holds pre-tax money. Contributions may be tax-deductible (subject to income limits if you have a workplace plan). Withdrawals in retirement are taxed as ordinary income. Required Minimum Distributions (RMDs) start at age 73." className="ml-1" />
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Your balance ($)
              </label>
              <MoneyInput value={form.traditionalIRABalance || 0} onChange={v => updateField('traditionalIRABalance', v)} placeholder="0" />
            </div>
            <div>
              <label className="label">
                Your annual contribution ($)
                <span className="badge-blue ml-2">2025 limit: {formatCurrency(LIMITS.traditionalIra || 7000)}</span>
              </label>
              <MoneyInput value={form.traditionalIRAContrib || 0} onChange={v => updateField('traditionalIRAContrib', v)} placeholder="0" />
            </div>
          </div>
          {form.maritalStatus === 'married' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Spouse's balance ($)</label>
                <MoneyInput value={form.spouseTraditionalIRABalance || 0} onChange={v => updateField('spouseTraditionalIRABalance', v)} placeholder="0" />
              </div>
              <div>
                <label className="label">Spouse's annual contribution ($)</label>
                <MoneyInput value={form.spouseTraditionalIRAContrib || 0} onChange={v => updateField('spouseTraditionalIRAContrib', v)} placeholder="0" />
              </div>
            </div>
          )}
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Roth IRA */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Roth IRA
              <HelpTooltip content="A Roth IRA holds after-tax money. Contributions are not tax-deductible, but all growth and withdrawals in retirement are completely tax-free. No RMDs during your lifetime. Income limits apply for direct contributions." className="ml-1" />
            </h4>
          </div>

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
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Your Roth IRA</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <DollarField label="Your current balance ($)" fieldKey="rothIRABalance" form={form} updateField={updateField} />
                      <div>
                        <label className="label">
                          Your annual contribution ($)
                          <span className="badge-blue ml-2">{CURRENT_YEAR} limit: {formatCurrency(LIMITS.rothIra + (isCatchup ? LIMITS.rothCatchup : 0))}</span>
                        </label>
                        <MoneyInput value={form.annualRothIRAContrib || 0} onChange={v => updateField('annualRothIRAContrib', v)} placeholder="7,000" />
                      </div>
                    </div>
                    <BackdoorRothBadge income={form.currentSalary} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Spouse's Roth IRA</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <DollarField label="Spouse's current balance ($)" fieldKey="spouseRothIRABalance" form={form} updateField={updateField} />
                      <div>
                        <label className="label">
                          Spouse's annual contribution ($)
                          <span className="badge-blue ml-2">{CURRENT_YEAR} limit: {formatCurrency(LIMITS.rothIra)}</span>
                        </label>
                        <MoneyInput value={form.annualSpouseRothIRAContrib || 0} onChange={v => updateField('annualSpouseRothIRAContrib', v)} placeholder="7,000" />
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
                      <MoneyInput value={form.annualRothIRAContrib || 0} onChange={v => updateField('annualRothIRAContrib', v)} placeholder="7,000" />
                    </div>
                  </div>
                  <BackdoorRothBadge income={form.currentSalary} />
                </>
              )}
            </>
          )}

          <HelpAccordion title="Traditional IRA vs. Roth IRA — which is better?">
            <p><strong>Traditional IRA:</strong> Tax deduction now, pay taxes in retirement. Best if you expect a lower tax rate in retirement than today.</p>
            <p className="mt-2"><strong>Roth IRA:</strong> No deduction now, tax-free in retirement. Best if you expect rates to rise or want tax-free legacy assets.</p>
            <p className="mt-2"><strong>Both:</strong> 2025 combined contribution limit is $7,000 ($8,000 if age 50+), shared across all your IRAs.</p>
            <p className="mt-2"><strong>Income limits (Roth):</strong> $150K–$165K (single) / $236K–$246K (married) for direct contributions. Above this, use the Backdoor Roth method via a Traditional IRA.</p>
          </HelpAccordion>
        </div>
      </div>

      {/* ── Return rate ────────────────────────────────────────────────────── */}
      <SliderWithInput
        label="Expected annual return (all accounts)"
        value={(form.tspReturnRate || 0.065) * 100}
        onChange={v => updateField('tspReturnRate', v / 100)}
        min={4}
        max={12}
        step={0.1}
        suffix="%"
        helpText="Applied to all retirement accounts above. Historical S&P 500 avg: ~10%. Blended portfolio with bonds: ~6–7%."
        presets={[
          { label: 'Conservative (5%)', value: 5 },
          { label: 'Moderate (6.5%)', value: 6.5 },
          { label: 'Aggressive (9%)', value: 9 },
        ]}
      />

      {/* ── Withdrawal strategy ────────────────────────────────────────────── */}
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

      {/* ── Roth Conversion Strategy ───────────────────────────────────────── */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-800 dark:text-gray-200">
            Roth conversion strategy
            <HelpTooltip content="A Roth conversion moves pre-tax money (TSP traditional, 401k, or traditional IRA) into a Roth account. You pay income tax on the amount converted today, but all future growth and withdrawals become tax-free — and you avoid Required Minimum Distributions (RMDs) starting at age 73." className="ml-1" />
          </h3>
        </div>

        <div>
          <label className="label">Conversion approach</label>
          <select
            className="input-field md:w-96"
            value={form.rothConversionStrategy}
            onChange={e => updateField('rothConversionStrategy', e.target.value)}
          >
            <option value="none">No conversions — leave pre-tax funds as-is</option>
            <option value="fill_12">Fill the 12% bracket each year (tax-efficient)</option>
            <option value="fill_22">Fill the 22% bracket each year (aggressive conversion)</option>
            <option value="custom">Custom — I'll enter an annual amount</option>
          </select>
          <p className="help-text">
            {form.rothConversionStrategy === 'none' && 'Pre-tax funds will be subject to income tax and RMDs starting at age 73.'}
            {form.rothConversionStrategy === 'fill_12' && 'Convert just enough each year to fill the 12% bracket — minimizes tax cost while shrinking your pre-tax balance.'}
            {form.rothConversionStrategy === 'fill_22' && 'Convert more aggressively into the 22% bracket — pays more tax now but eliminates more RMD exposure.'}
            {form.rothConversionStrategy === 'custom' && 'Enter a fixed annual amount to convert regardless of your tax bracket.'}
          </p>
        </div>

        {form.rothConversionStrategy === 'custom' && (
          <div>
            <label className="label">Annual conversion amount ($)</label>
            <div className="md:w-60">
              <MoneyInput
                value={form.rothConversionCustomAmount || 0}
                onChange={v => updateField('rothConversionCustomAmount', v)}
                placeholder="20,000"
              />
            </div>
          </div>
        )}

        {form.rothConversionStrategy !== 'none' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SliderWithInput
              label="Start converting at age"
              value={form.rothConversionStartAge ?? (form.targetRetirementAge || 60)}
              onChange={v => updateField('rothConversionStartAge', v)}
              min={50}
              max={72}
              step={1}
              suffix=" yrs"
              helpText="Usually at or after retirement when income drops and bracket room opens up."
            />
            <SliderWithInput
              label="Stop converting at age"
              value={form.rothConversionEndAge || 72}
              onChange={v => updateField('rothConversionEndAge', v)}
              min={55}
              max={80}
              step={1}
              suffix=" yrs"
              helpText="RMDs begin at 73 — finishing conversions by 72 avoids RMDs increasing your taxable income during the conversion window."
            />
          </div>
        )}

        <HelpAccordion title="When does a Roth conversion make sense?">
          <p>Roth conversions are most valuable during a <strong>low-income window</strong> — typically between retirement and age 62 (when Social Security begins). During this window, your taxable income may be low enough to convert at the 12% bracket.</p>
          <p className="mt-2"><strong>Key factors that favor converting:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
            <li>You expect to be in a higher bracket in the future</li>
            <li>You want to reduce or eliminate RMDs starting at age 73</li>
            <li>You have long time horizon for tax-free growth</li>
            <li>You can pay the conversion tax from outside funds (not the converted amount itself)</li>
          </ul>
          <p className="mt-2"><strong>TSP → Roth IRA:</strong> You must roll your TSP to a traditional IRA first after separation, then convert to Roth. The TSP itself does not support direct Roth conversions.</p>
        </HelpAccordion>
      </div>

      {/* ── Other savings ──────────────────────────────────────────────────── */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-5">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Other savings</h3>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Taxable brokerage account</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DollarField label="Current balance ($)" fieldKey="brokerageBalance" form={form} updateField={updateField} />
            <DollarField label="Annual contribution ($)" fieldKey="annualBrokerageContrib" form={form} updateField={updateField} helpText="Until retirement" />
            <DollarField label="Monthly withdrawal in retirement ($)" fieldKey="monthlyBrokerageWithdrawal" form={form} updateField={updateField} helpText="Drawdown amount" />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Health Savings Account (HSA)
            <HelpTooltip content="Triple tax advantage: contributions are pre-tax, growth is tax-free, and withdrawals for qualified medical expenses are tax-free. After age 65, can be withdrawn for any reason (taxed like traditional IRA)." className="ml-1" />
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DollarField label="Current balance ($)" fieldKey="hsaBalance" form={form} updateField={updateField} />
            <DollarField label="Annual contribution ($)" fieldKey="annualHSAContrib" form={form} updateField={updateField} helpText="2025 limit: $4,300 / $8,550 (family)" />
            <DollarField label="Annual medical spending in retirement ($)" fieldKey="annualHSAMedWithdrawal" form={form} updateField={updateField} helpText="Withdrawn tax-free for healthcare" />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Other savings (CDs, bonds, savings accounts)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DollarField label="Current balance ($)" fieldKey="otherSavings" form={form} updateField={updateField} />
            <DollarField label="Annual contribution ($)" fieldKey="annualOtherSavingsContrib" form={form} updateField={updateField} helpText="Until retirement" />
            <DollarField label="Monthly withdrawal in retirement ($)" fieldKey="monthlyOtherSavingsWithdrawal" form={form} updateField={updateField} helpText="Drawdown amount" />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Cash emergency fund</h4>
          <DollarField label="Balance ($)" fieldKey="cashEmergencyFund" form={form} updateField={updateField} helpText="Kept as a reserve — not included in investment projections" />
        </div>
      </div>

      {/* ── Spouse retirement plan ──────────────────────────────────────────── */}
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
            <SliderWithInput
              label="Employer match — % of salary"
              value={form.spouseEmployerMatchCapPct ?? 5}
              onChange={v => updateField('spouseEmployerMatchCapPct', v)}
              min={0}
              max={15}
              step={0.5}
              suffix="% of salary"
              presets={isFederal ? [{ label: 'FERS 5%', value: 5 }, { label: 'None', value: 0 }] : [{ label: '3%', value: 3 }, { label: '5%', value: 5 }, { label: 'None', value: 0 }]}
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
      <MoneyInput value={form[fieldKey] || 0} onChange={v => updateField(fieldKey, v)} placeholder="0" />
      {helpText && <p className="help-text">{helpText}</p>}
    </div>
  )
}
