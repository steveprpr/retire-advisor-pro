import { useForm } from '../../context/AppContext.jsx'
import { ExpenseField } from '../common/ExpenseField.jsx'
import { EXPENSE_AVERAGES, BUDGET_PRESETS } from '../../utils/expenseCalculations.js'
import { formatCurrency } from '../../utils/formatters.js'

export default function Step6Expenses() {
  const { form, updateField, updateExpense } = useForm()
  const e = form.expenses || {}
  const isInternational = form.retirementLocationType === 'international'
  const isMarried = form.maritalStatus === 'married'

  // Running total
  const totalMonthly = Object.values(e).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0)
  // Subtract non-monthly fields
  const annualFields = ['domesticTrips', 'domesticTripCost', 'internationalTrips', 'internationalTripCost', 'cruiseTrips', 'cruiseCostPerPerson', 'annualFlightsHome', 'expatCPA', 'visaRenewal', 'diningOutFrequency', 'diningOutAvgCost']
  const cleanMonthly = Object.entries(e)
    .filter(([k, v]) => typeof v === 'number' && !annualFields.includes(k))
    .reduce((a, [, v]) => a + v, 0)

  const travelMonthly = (e.domesticTrips || 0) * (e.domesticTripCost || 0) / 12
    + (e.internationalTrips || 0) * (e.internationalTripCost || 0) / 12
    + (e.cruiseTrips || 0) * (e.cruiseCostPerPerson || 0) / 12

  const totalMonthlyFinal = cleanMonthly + travelMonthly

  const applyPreset = (preset) => {
    const p = BUDGET_PRESETS[preset]
    if (!p) return
    updateExpense('mortgageRent', p.housing * 0.55)
    updateExpense('propertyTax', p.housing * 0.10)
    updateExpense('homeInsurance', p.housing * 0.05)
    updateExpense('utilities', p.housing * 0.15)
    updateExpense('internetPhone', p.housing * 0.07)
    updateExpense('groceries', p.food * 0.6)
    updateExpense('diningOut', p.food * 0.3)
    updateExpense('coffeeShops', p.food * 0.1)
    updateExpense('carInsurance', p.transportation * 0.4)
    updateExpense('gas', p.transportation * 0.35)
    updateExpense('vehicleMaintenance', p.transportation * 0.25)
    updateExpense('healthInsurance', p.healthcare * 0.65)
    updateExpense('outOfPocket', p.healthcare * 0.25)
    updateExpense('dental', p.healthcare * 0.1)
    updateExpense('domesticTrips', 2)
    updateExpense('domesticTripCost', (p.travel * 3))
    updateExpense('internationalTrips', 1)
    updateExpense('internationalTripCost', (p.travel * 6))
    updateExpense('streaming', p.entertainment * 0.25)
    updateExpense('hobbies', p.entertainment * 0.5)
    updateExpense('clothing', p.personal * 0.5)
    updateExpense('gifts', p.personal * 0.3)
    updateExpense('miscellaneous', p.other)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Your monthly spending in retirement determines whether your income covers your lifestyle — or falls short. Enter everything in today's dollars; inflation is applied automatically. Use a budget preset to get started quickly, then fine-tune each line.
      </p>

      {/* Running total sticky bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-3 -mx-4 px-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-[#1B3A6B] dark:text-blue-300">
              {formatCurrency(totalMonthlyFinal)}/mo
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
              = {formatCurrency(totalMonthlyFinal * 12)}/yr (today's dollars)
            </span>
          </div>
          <span className="text-xs text-gray-400">All amounts in today's dollars — inflated automatically</span>
        </div>
      </div>

      {/* Preset templates */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quick-fill budget templates:</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(BUDGET_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#2E6DB4] hover:text-[#2E6DB4] transition-colors dark:text-gray-300"
            >
              {preset.emoji} {preset.label} ({formatCurrency(preset.monthlyTarget)}/mo)
            </button>
          ))}
        </div>
      </div>

      {/* Housing */}
      <Section title="🏠 Housing">
        <ExpenseField label="Mortgage / rent payment" fieldKey="mortgageRent" value={e.mortgageRent || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.mortgageOwn} max={5000} />
        <ExpenseField label="Property taxes" fieldKey="propertyTax" value={e.propertyTax || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.propertyTax} max={2000} />
        <ExpenseField label="Home insurance" fieldKey="homeInsurance" value={e.homeInsurance || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.homeInsurance} max={1000} />
        <ExpenseField label="HOA fees" fieldKey="hoaFees" value={e.hoaFees || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.hoaFees} max={1500} />
        <ExpenseField label="Home maintenance & repairs" fieldKey="homeMaintenance" value={e.homeMaintenance || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.homeMaintenance} max={1000} helpText="Rule of thumb: ~1% of home value per year" />
        <ExpenseField label="Utilities (electric, gas, water, trash)" fieldKey="utilities" value={e.utilities || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.utilities} max={1000} />
        <ExpenseField label="Internet + phone" fieldKey="internetPhone" value={e.internetPhone || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.internetPhone} max={500} />
        <ExpenseField label="Security system" fieldKey="security" value={e.security || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.security} max={200} />
      </Section>

      {/* Food */}
      <Section title="🍽️ Food & Dining">
        <ExpenseField label="Groceries" fieldKey="groceries" value={e.groceries || 0} onChange={updateExpense} avgAmount={isMarried ? EXPENSE_AVERAGES.groceriesCouple : EXPENSE_AVERAGES.groceriesSingle} max={1500} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label text-xs">Dining out frequency</label>
            <select className="input-field text-sm" value={e.diningOutFrequency || 4} onChange={ev => updateExpense('diningOutFrequency', parseInt(ev.target.value))}>
              <option value={1}>Rarely (1x/mo)</option>
              <option value={4}>Occasionally (4x/mo)</option>
              <option value={8}>Regularly (8x/mo)</option>
              <option value={12}>Frequently (12x/mo)</option>
              <option value={20}>Very often (20x/mo)</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">Avg cost per occasion ($)</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" className="input-field pl-6 text-sm" value={e.diningOutAvgCost || 65} onChange={ev => updateExpense('diningOutAvgCost', parseInt(ev.target.value))} />
            </div>
          </div>
        </div>
        {(e.diningOutFrequency > 0) && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Estimated dining total: {formatCurrency((e.diningOutFrequency || 4) * (e.diningOutAvgCost || 65))}/mo
          </p>
        )}
        <ExpenseField label="Coffee shops" fieldKey="coffeeShops" value={e.coffeeShops || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.coffeeShops} max={300} />
        <ExpenseField label="Food delivery (DoorDash, etc.)" fieldKey="foodDelivery" value={e.foodDelivery || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.foodDelivery} max={500} />
      </Section>

      {/* Transportation */}
      <Section title="🚗 Transportation">
        <div>
          <label className="label text-sm">Will you need a car in retirement?</label>
          <select className="input-field md:w-80 text-sm" value={e.carNeed || 'yes_one'} onChange={ev => updateExpense('carNeed', ev.target.value)}>
            <option value="yes_both">Yes — 2 cars</option>
            <option value="yes_one">Yes — 1 car</option>
            <option value="no">No — walkable/transit</option>
            <option value="undecided">Undecided</option>
          </select>
        </div>
        {e.carNeed !== 'no' && (
          <>
            <ExpenseField label="Car payment(s)" fieldKey="carPayment" value={e.carPayment || 0} onChange={updateExpense} avgAmount={0} avgLabel="$0 if paid off" max={2000} />
            <ExpenseField label="Car insurance" fieldKey="carInsurance" value={e.carInsurance || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.carInsurance} max={600} />
            <ExpenseField label="Gas / charging" fieldKey="gas" value={e.gas || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.gas} max={500} />
            <ExpenseField label="Vehicle maintenance" fieldKey="vehicleMaintenance" value={e.vehicleMaintenance || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.vehicleMaintenance} max={500} />
            <ExpenseField label="Registration & taxes" fieldKey="registration" value={e.registration || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.registration} max={200} />
          </>
        )}
        <ExpenseField label="Rideshare / taxi" fieldKey="rideshare" value={e.rideshare || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.rideshare} max={400} />
        <ExpenseField label="Public transit" fieldKey="publicTransit" value={e.publicTransit || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.publicTransit} max={400} />
      </Section>

      {/* Healthcare */}
      <Section title="🏥 Healthcare">
        <div>
          <label className="label text-sm">Health insurance type in retirement</label>
          <select className="input-field md:w-80 text-sm" value={e.healthInsuranceType || (form.employmentType?.includes('federal') ? 'fehb' : 'marketplace')} onChange={ev => updateExpense('healthInsuranceType', ev.target.value)}>
            <option value="fehb">FEHB (Federal — retiree)</option>
            <option value="medicare">Medicare (65+)</option>
            <option value="spouse">Through spouse employer</option>
            <option value="marketplace">Marketplace / ACA</option>
            <option value="expat">Private expat insurance</option>
          </select>
        </div>
        <ExpenseField label="Health insurance premium" fieldKey="healthInsurance" value={e.healthInsurance || 0} onChange={updateExpense}
          avgAmount={e.healthInsuranceType === 'medicare' ? EXPENSE_AVERAGES.medicareParts : EXPENSE_AVERAGES.fehbSelfPlus1}
          avgLabel={e.healthInsuranceType === 'medicare' ? '$335 (Medicare)' : '$650 (FEHB self+1)'}
          max={3000} />
        <ExpenseField label="Dental insurance" fieldKey="dental" value={e.dental || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.dentalInsurance} max={200} />
        <ExpenseField label="Vision insurance" fieldKey="vision" value={e.vision || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.visionInsurance} max={100} />
        <ExpenseField label="Out-of-pocket (copays, Rx, etc.)" fieldKey="outOfPocket" value={e.outOfPocket || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.outOfPocket} max={1000} />
        <ExpenseField label="Gym / fitness" fieldKey="gym" value={e.gym || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.gym} max={300} />
        <ExpenseField label="Long-term care insurance" fieldKey="ltcInsurance" value={e.ltcInsurance || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.ltcInsurance} max={1000} helpText="Consider if not covered by VA or federal LTC program" />
      </Section>

      {/* Travel */}
      <Section title="✈️ Travel">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label text-sm">Domestic trips/year</label>
            <input type="number" className="input-field text-sm" value={e.domesticTrips || 0} onChange={ev => updateExpense('domesticTrips', parseInt(ev.target.value) || 0)} min={0} max={12} />
          </div>
          <div>
            <label className="label text-sm">Avg cost/trip ($)</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" className="input-field pl-6 text-sm" value={e.domesticTripCost || 2500} onChange={ev => updateExpense('domesticTripCost', parseInt(ev.target.value) || 0)} />
            </div>
          </div>
          <div>
            <label className="label text-sm">International trips/year</label>
            <input type="number" className="input-field text-sm" value={e.internationalTrips || 0} onChange={ev => updateExpense('internationalTrips', parseInt(ev.target.value) || 0)} min={0} max={8} />
          </div>
          <div>
            <label className="label text-sm">Avg international cost/trip ($)</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" className="input-field pl-6 text-sm" value={e.internationalTripCost || 8000} onChange={ev => updateExpense('internationalTripCost', parseInt(ev.target.value) || 0)} />
            </div>
          </div>
        </div>
        {travelMonthly > 0 && <p className="text-sm text-[#1D9E75]">Travel budget: ~{formatCurrency(travelMonthly)}/mo ({formatCurrency(travelMonthly * 12)}/yr)</p>}
        <ExpenseField label="Snowbird second location (monthly)" fieldKey="snowbirdMonthly" value={e.snowbirdMonthly || 0} onChange={updateExpense} avgAmount={0} avgLabel="varies" max={5000} />
      </Section>

      {/* Entertainment */}
      <Section title="📺 Subscriptions & Entertainment">
        <ExpenseField label="Streaming services" fieldKey="streaming" value={e.streaming || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.streaming} max={300} />
        <ExpenseField label="Sports / events tickets" fieldKey="sportsEvents" value={e.sportsEvents || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.sportsEvents} max={500} />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label className="label mb-0 text-sm">Hobbies</label>
            <input type="text" className="input-field text-sm flex-1" value={e.hobbyLabel || ''} onChange={ev => updateExpense('hobbyLabel', ev.target.value)} placeholder="Golf, fishing, crafts…" />
          </div>
          <ExpenseField label="" fieldKey="hobbies" value={e.hobbies || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.hobbies} max={2000} />
        </div>
        <ExpenseField label="Club memberships" fieldKey="clubMemberships" value={e.clubMemberships || 0} onChange={updateExpense} avgAmount={0} avgLabel="$0 (golf ~$400)" max={2000} />
      </Section>

      {/* Personal */}
      <Section title="👤 Personal & Lifestyle">
        <ExpenseField label="Clothing & personal care" fieldKey="clothing" value={e.clothing || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.clothingPersonalCare} max={1000} />
        <ExpenseField label="Gifts (birthdays, holidays)" fieldKey="gifts" value={e.gifts || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.gifts} max={1000} />
        <ExpenseField label="Charitable donations" fieldKey="charitableDonations" value={e.charitableDonations || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.charitableDonations} max={1000} />
        <div>
          <label className="label text-sm">Pets</label>
          <div className="flex gap-2 mb-2">
            {[{ label: 'Dog ~$150', value: 150 }, { label: 'Cat ~$75', value: 75 }, { label: 'None', value: 0 }].map(opt => (
              <button key={opt.label} type="button" onClick={() => updateExpense('pets', opt.value)}
                className={`px-3 py-1 text-sm rounded-lg border transition-colors ${(e.pets || 0) === opt.value ? 'bg-[#2E6DB4] text-white border-[#2E6DB4]' : 'border-gray-300 dark:border-gray-600 hover:border-[#2E6DB4] text-sm'}`}>
                {opt.label}
              </button>
            ))}
          </div>
          <ExpenseField label="Pet expenses" fieldKey="pets" value={e.pets || 0} onChange={updateExpense} avgAmount={undefined} max={1000} />
        </div>
      </Section>

      {/* Family support */}
      <Section title="👨‍👩‍👧 Family Support">
        <ExpenseField label="Supporting adult children (monthly)" fieldKey="adultChildSupport" value={e.adultChildSupport || 0} onChange={updateExpense} avgAmount={0} max={3000} />
        <ExpenseField label="Grandchildren activities & gifts" fieldKey="grandchildrenActivities" value={e.grandchildrenActivities || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.grandchildrenActivities} max={1000} />
        <ExpenseField label="529 contributions (monthly, per grandchild)" fieldKey="plan529Monthly" value={e.plan529Monthly || 0} onChange={updateExpense} avgAmount={0} max={1000} helpText="See Step 7 for full 529 projection" />
      </Section>

      {/* International expenses */}
      {isInternational && (
        <Section title="🌍 International Living Expenses">
          <ExpenseField label="Local housing (rent/mortgage)" fieldKey="expatHousing" value={e.expatHousing || 0} onChange={updateExpense} avgAmount={800} max={4000} />
          <ExpenseField label="Expat health insurance" fieldKey="expatHealthInsurance" value={e.expatHealthInsurance || 0} onChange={updateExpense} avgAmount={300} max={1000} />
          <ExpenseField label="Language lessons" fieldKey="languageLessons" value={e.languageLessons || 0} onChange={updateExpense} avgAmount={100} helpText="First 1-2 years" max={500} />
          <div>
            <label className="label text-sm">Annual flights home to US ($/yr)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" className="input-field pl-7" value={e.annualFlightsHome || ''} onChange={ev => updateExpense('annualFlightsHome', parseInt(ev.target.value) || 0)} placeholder="1,200" />
            </div>
            <p className="help-text">Avg $800–$2,500 per person depending on country</p>
          </div>
          <div>
            <label className="label text-sm">US expat CPA / tax filing ($/yr)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" className="input-field pl-7" value={e.expatCPA || ''} onChange={ev => updateExpense('expatCPA', parseInt(ev.target.value) || 0)} placeholder="2,000" />
            </div>
          </div>
          <ExpenseField label="Local transportation" fieldKey="localTransportation" value={e.localTransportation || 0} onChange={updateExpense} avgAmount={100} max={500} helpText="Many expat cities don't require a car" />
        </Section>
      )}

      {/* Misc */}
      <Section title="🔧 Miscellaneous">
        <ExpenseField label="Emergency buffer (monthly)" fieldKey="emergencyBuffer" value={e.emergencyBuffer || 0} onChange={updateExpense} avgAmount={0} max={1000} />
        <ExpenseField label="Unexpected / buffer line" fieldKey="unexpectedBuffer" value={e.unexpectedBuffer || 0} onChange={updateExpense} avgAmount={Math.round(totalMonthlyFinal * 0.07)} avgLabel="7% of budget" max={2000} helpText="Recommend 5-10% of total budget" />
        <ExpenseField label="Miscellaneous" fieldKey="miscellaneous" value={e.miscellaneous || 0} onChange={updateExpense} avgAmount={EXPENSE_AVERAGES.miscellaneous} max={1000} />
      </Section>

      {/* Budget summary card */}
      <div className="card border-[#2E6DB4] bg-blue-50 dark:bg-blue-950">
        <h3 className="font-semibold text-[#1B3A6B] dark:text-blue-300 mb-3">Budget Summary</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600 dark:text-gray-400">Monthly (today's dollars)</div>
          <div className="font-semibold text-right">{formatCurrency(totalMonthlyFinal)}</div>
          <div className="text-gray-600 dark:text-gray-400">Annual (today's dollars)</div>
          <div className="font-semibold text-right">{formatCurrency(totalMonthlyFinal * 12)}</div>
          <div className="text-gray-400 dark:text-gray-500">vs. Avg retired couple ($5,400/mo)</div>
          <div className={`text-right text-xs ${totalMonthlyFinal > 5400 ? 'text-amber-600' : 'text-[#1D9E75]'}`}>
            {totalMonthlyFinal > 5400 ? '+' : ''}{formatCurrency(totalMonthlyFinal - 5400)}/mo vs avg
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1">{title}</h3>
      {children}
    </div>
  )
}
