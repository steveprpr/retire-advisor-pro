import { useForm } from '../../context/AppContext.jsx'
import { SliderWithInput } from '../common/SliderWithInput.jsx'
import { HelpTooltip, HelpAccordion } from '../common/HelpTooltip.jsx'
import { MoneyInput } from '../common/MoneyInput.jsx'
import { formatCurrency } from '../../utils/formatters.js'

const HOME_PLANS = [
  { value: 'keep_primary', label: 'Keep as primary residence' },
  { value: 'sell_buy', label: 'Sell and buy retirement home' },
  { value: 'sell_rent', label: 'Sell and rent in retirement' },
  { value: 'keep_rent', label: 'Keep and rent out for income' },
  { value: 'reverse', label: 'Reverse mortgage (borrow against equity, age 62+)' },
  { value: 'undecided', label: 'Undecided' },
]

export default function Step4RealEstate() {
  const { form, updateField } = useForm()
  const selling = form.retirementHomePlan === 'sell_buy' || form.retirementHomePlan === 'sell_rent'

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Real estate, Social Security, and other income sources can meaningfully reduce how much you need to draw from savings. Tell us about your home, Social Security strategy, rental income, and other money coming in so your plan reflects your full financial picture.
      </p>

      {/* Primary home */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Primary home</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Current home value ($)</label>
            <MoneyInput value={form.homeValue || 0} onChange={v => updateField('homeValue', v)} placeholder="400,000" />
          </div>
          <div>
            <label className="label">Remaining mortgage balance ($)</label>
            <MoneyInput value={form.mortgageBalance || 0} onChange={v => updateField('mortgageBalance', v)} placeholder="250,000" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SliderWithInput
            label="Mortgage rate"
            value={(form.mortgageRate || 0.04) * 100}
            onChange={v => updateField('mortgageRate', v / 100)}
            min={0}
            max={10}
            step={0.125}
            suffix="%"
          />
          <SliderWithInput
            label="Years remaining on mortgage"
            value={form.mortgageYearsRemaining || 25}
            onChange={v => updateField('mortgageYearsRemaining', v)}
            min={0}
            max={30}
            step={1}
            suffix=" yrs"
          />
          <SliderWithInput
            label="Home appreciation rate"
            value={(form.homeAppreciationRate || 0.03) * 100}
            onChange={v => updateField('homeAppreciationRate', v / 100)}
            min={1}
            max={6}
            step={0.1}
            suffix="%"
            helpText="Historical US avg: ~3%/yr"
            presets={[{ label: '2%', value: 2 }, { label: '3%', value: 3 }, { label: '4%', value: 4 }]}
          />
        </div>

        <div>
          <label className="label">Plan at retirement</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {HOME_PLANS.map(p => (
              <label key={p.value} className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer text-sm transition-colors ${form.retirementHomePlan === p.value ? 'border-[#2E6DB4] bg-blue-50 dark:bg-blue-950' : 'border-gray-200 dark:border-gray-700 hover:border-[#2E6DB4]'}`}>
                <input type="radio" name="retirementHomePlan" value={p.value} checked={form.retirementHomePlan === p.value} onChange={e => updateField('retirementHomePlan', e.target.value)} className="accent-[#2E6DB4]" />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        {selling && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Target retirement home budget ($)</label>
              <MoneyInput value={form.newHomeBudget || 0} onChange={v => updateField('newHomeBudget', v)} placeholder="350,000" />
            </div>
            {form.retirementHomePlan === 'sell_buy' && (
              <div>
                <label className="label">How will you buy?</label>
                <select className="input-field" value={form.retirementHousingType || 'buy_outright'} onChange={e => updateField('retirementHousingType', e.target.value)}>
                  <option value="buy_outright">Buy outright (cash)</option>
                  <option value="buy_mortgage">Buy with small mortgage</option>
                  <option value="rent">Rent long-term</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rental property */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Rental property</h3>
        <div className="flex items-center gap-4">
          <label className="text-sm">Do you own rental property?</label>
          {['Yes', 'No'].map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" name="hasRentalProperty" checked={form.hasRentalProperty === (opt === 'Yes')} onChange={() => updateField('hasRentalProperty', opt === 'Yes')} className="accent-[#2E6DB4]" />
              {opt}
            </label>
          ))}
        </div>
        {form.hasRentalProperty && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'rentalMonthlyGross', label: 'Monthly gross rent ($)', help: 'Total rent collected before any expenses.' },
              { key: 'rentalAnnualExpenses', label: 'Annual expenses ($)', help: 'Include property taxes, insurance, maintenance (~1% of value/yr), property management fees, and vacancy allowance. Net income = gross rent − expenses.' },
              { key: 'rentalMortgageBalance', label: 'Remaining mortgage ($)', help: 'Used to calculate your rental property net worth.' },
              { key: 'rentalPropertyValue', label: 'Property value ($)', help: 'Current market value. Used for legacy/net worth projections.' },
            ].map(f => (
              <div key={f.key}>
                <label className="label">
                  {f.label}
                  {f.help && <HelpTooltip content={f.help} className="ml-1" />}
                </label>
                <MoneyInput value={form[f.key] || 0} onChange={v => updateField(f.key, v)} placeholder="0" />
              </div>
            ))}
            {form.rentalMonthlyGross > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm text-[#1D9E75]">
                  Net rental income: <strong>{formatCurrency(form.rentalMonthlyGross * 12 - (form.rentalAnnualExpenses || 0))}/year</strong>
                  {' '}({formatCurrency((form.rentalMonthlyGross * 12 - (form.rentalAnnualExpenses || 0)) / 12)}/month)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Other income sources */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Other income in retirement</h3>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.hasPartTimeInRetirement} onChange={e => updateField('hasPartTimeInRetirement', e.target.checked)} className="accent-[#2E6DB4]" />
            Part-time work in retirement?
          </label>
          {form.hasPartTimeInRetirement && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
              <div>
                <label className="label">Annual part-time income ($)</label>
                <MoneyInput value={form.partTimeAnnualAmount || 0} onChange={v => updateField('partTimeAnnualAmount', v)} />
              </div>
              <SliderWithInput
                label="For how many years?"
                value={form.partTimeYears || 5}
                onChange={v => updateField('partTimeYears', v)}
                min={1}
                max={20}
                step={1}
                suffix=" yrs"
              />
            </div>
          )}

          {isMarried && (
            <>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.spouseEmployedAtRetirement} onChange={e => updateField('spouseEmployedAtRetirement', e.target.checked)} className="accent-[#2E6DB4]" />
                Spouse still employed at your retirement?
              </label>
              {form.spouseEmployedAtRetirement && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <div>
                    <label className="label">Spouse annual income ($)</label>
                    <MoneyInput value={form.spouseAnnualIncome || 0} onChange={v => updateField('spouseAnnualIncome', v)} />
                  </div>
                  <SliderWithInput
                    label="Years until spouse retires"
                    value={form.spouseYearsUntilRetirement || 5}
                    onChange={v => updateField('spouseYearsUntilRetirement', v)}
                    min={0}
                    max={20}
                    step={1}
                    suffix=" yrs"
                  />
                </div>
              )}
            </>
          )}

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.hasExpectedInheritance} onChange={e => updateField('hasExpectedInheritance', e.target.checked)} className="accent-[#2E6DB4]" />
            Expecting an inheritance?
          </label>
          {form.hasExpectedInheritance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
              <div>
                <label className="label">Estimated amount ($)</label>
                <MoneyInput value={form.inheritanceAmount || 0} onChange={v => updateField('inheritanceAmount', v)} />
              </div>
              <div>
                <label className="label">Approximate year</label>
                <input type="number" className="input-field" value={form.inheritanceYear || ''} onChange={e => updateField('inheritanceYear', parseInt(e.target.value))} placeholder={String(new Date().getFullYear() + 10)} />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="label">
            Other pension or annuity (annual, $)
            <HelpTooltip content="Any other guaranteed income source: a state/local government pension, a private sector defined-benefit pension, an annuity you purchased, a trust distribution, or spousal pension. Enter the annual amount in today's dollars." className="ml-1" />
          </label>
          <div className="md:w-48">
            <MoneyInput value={form.otherPensionAnnuity || 0} onChange={v => updateField('otherPensionAnnuity', v)} placeholder="0" />
          </div>
        </div>

        <HelpAccordion title="What is a reverse mortgage?">
          <p>A <strong>reverse mortgage</strong> (HECM — Home Equity Conversion Mortgage) lets homeowners age 62+ borrow against their home equity without making monthly payments. The loan is repaid when you sell, move out, or pass away.</p>
          <p className="mt-2"><strong>Pros:</strong> Converts illiquid home equity into monthly income or a lump sum. No payments required while you live there.</p>
          <p className="mt-2"><strong>Cons:</strong> Reduces the equity available to heirs. Interest accrues over time, growing the loan balance. Requires the home to remain your primary residence and you must maintain it and pay property taxes/insurance.</p>
          <p className="mt-2">Best suited for retirees who are equity-rich but cash-poor and plan to stay in their home long-term.</p>
        </HelpAccordion>
      </div>

      {/* Social Security */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Social Security</h3>

        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-200 space-y-1">
          <p className="font-medium">How to find your Social Security estimate:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-blue-800 dark:text-blue-300">
            <li>Go to <a href="https://www.ssa.gov/myaccount" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-600">ssa.gov/myaccount</a> and sign in (or create a free account)</li>
            <li>Click <strong>"Estimated Benefits"</strong> in the left menu</li>
            <li>Find the <strong>"Full Retirement Age"</strong> column — enter that amount below</li>
          </ol>
          <p className="text-blue-700 dark:text-blue-400 text-xs">If you leave this blank, we'll estimate it from your salary history — entering your actual SSA figure gives a more accurate plan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Your estimated SS benefit at FRA ($)
              <HelpTooltip content="Enter the 'Full Retirement Age' monthly benefit from your SSA statement at ssa.gov/myaccount. If left blank, we estimate it from your current salary and career history." className="ml-1" />
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" className="input-field pl-7" value={form.ssBenefitAtFRA || ''} onChange={e => updateField('ssBenefitAtFRA', parseFloat(e.target.value) || 0)} placeholder="2,000" />
            </div>
            <p className="help-text">Leave blank to use our built-in estimator</p>
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
    </div>
  )
}
