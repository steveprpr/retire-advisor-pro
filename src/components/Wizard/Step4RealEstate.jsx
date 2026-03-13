import { useForm } from '../../context/AppContext.jsx'
import { SliderWithInput } from '../common/SliderWithInput.jsx'
import { HelpTooltip } from '../common/HelpTooltip.jsx'
import { VA_RATING_OPTIONS, getVAMonthlyBenefit, getVARatingLabel } from '../../data/vaBenefitTable.js'
import { formatCurrency } from '../../utils/formatters.js'

const HOME_PLANS = [
  { value: 'keep_primary', label: 'Keep as primary residence' },
  { value: 'sell_buy', label: 'Sell and buy retirement home' },
  { value: 'sell_rent', label: 'Sell and rent in retirement' },
  { value: 'keep_rent', label: 'Keep and rent out for income' },
  { value: 'reverse', label: 'Reverse mortgage' },
  { value: 'undecided', label: 'Undecided' },
]

export default function Step4RealEstate() {
  const { form, updateField } = useForm()
  const isMarried = form.maritalStatus === 'married'
  const vaMonthly = getVAMonthlyBenefit(form.vaRating || 0, isMarried)
  const selling = form.retirementHomePlan === 'sell_buy' || form.retirementHomePlan === 'sell_rent'

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Real estate and other income sources can meaningfully reduce how much you need to draw from savings. Tell us about your home, any rental income, VA disability benefits, and other money coming in so your plan reflects your full financial picture.
      </p>

      {/* Primary home */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Primary home</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Current home value ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" className="input-field pl-7" value={form.homeValue || ''} onChange={e => updateField('homeValue', parseFloat(e.target.value) || 0)} placeholder="400,000" />
            </div>
          </div>
          <div>
            <label className="label">Remaining mortgage balance ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" className="input-field pl-7" value={form.mortgageBalance || ''} onChange={e => updateField('mortgageBalance', parseFloat(e.target.value) || 0)} placeholder="250,000" />
            </div>
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
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input type="number" className="input-field pl-7" value={form.newHomeBudget || ''} onChange={e => updateField('newHomeBudget', parseFloat(e.target.value) || 0)} placeholder="350,000" />
              </div>
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
              { key: 'rentalMonthlyGross', label: 'Monthly gross rent ($)' },
              { key: 'rentalAnnualExpenses', label: 'Annual expenses ($)' },
              { key: 'rentalMortgageBalance', label: 'Remaining mortgage ($)' },
              { key: 'rentalPropertyValue', label: 'Property value ($)' },
            ].map(f => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input type="number" className="input-field pl-7" value={form[f.key] || ''} onChange={e => updateField(f.key, parseFloat(e.target.value) || 0)} placeholder="0" />
                </div>
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

      {/* VA disability */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-4">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">VA disability</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Current VA disability rating
              <HelpTooltip content="VA disability compensation is 100% tax-free and excluded from income calculations. It also typically receives COLA increases each year." className="ml-1" />
            </label>
            <select className="input-field" value={form.vaRating || 0} onChange={e => updateField('vaRating', parseInt(e.target.value))}>
              {VA_RATING_OPTIONS.map(r => (
                <option key={r} value={r}>{r}%{r === 0 ? ' (no disability)' : ''}</option>
              ))}
            </select>
            {form.vaRating > 0 && (
              <p className="help-text text-[#1D9E75]">{getVARatingLabel(form.vaRating)} — 2024 rate: ~{formatCurrency(vaMonthly)}/mo (tax-free)</p>
            )}
          </div>
          <div>
            <label className="label">Pursuing VA rating upgrade?</label>
            <select className="input-field" value={form.vaPursuingUpgrade || 'no'} onChange={e => updateField('vaPursuingUpgrade', e.target.value)}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
              <option value="in_process">In process</option>
            </select>
          </div>
        </div>
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input type="number" className="input-field pl-7" value={form.partTimeAnnualAmount || ''} onChange={e => updateField('partTimeAnnualAmount', parseFloat(e.target.value) || 0)} />
                </div>
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
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input type="number" className="input-field pl-7" value={form.spouseAnnualIncome || ''} onChange={e => updateField('spouseAnnualIncome', parseFloat(e.target.value) || 0)} />
                    </div>
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input type="number" className="input-field pl-7" value={form.inheritanceAmount || ''} onChange={e => updateField('inheritanceAmount', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div>
                <label className="label">Approximate year</label>
                <input type="number" className="input-field" value={form.inheritanceYear || ''} onChange={e => updateField('inheritanceYear', parseInt(e.target.value))} placeholder={String(new Date().getFullYear() + 10)} />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="label">Other pension or annuity (annual, $)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input type="number" className="input-field pl-7 md:w-48" value={form.otherPensionAnnuity || ''} onChange={e => updateField('otherPensionAnnuity', parseFloat(e.target.value) || 0)} placeholder="0" />
          </div>
        </div>
      </div>
    </div>
  )
}
