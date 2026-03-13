import { useForm } from '../../context/AppContext.jsx'
import { STATE_LIST } from '../../data/stateTaxData.js'
import { HelpTooltip, HelpAccordion } from '../common/HelpTooltip.jsx'
import { SliderWithInput } from '../common/SliderWithInput.jsx'
import { getMRA } from '../../utils/federalCalculations.js'

const CURRENT_YEAR = new Date().getFullYear()
const BIRTH_YEARS = Array.from({ length: 41 }, (_, i) => 1945 + i)  // 1945–1985
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function exactAge(year, month, day) {
  if (!year) return null
  if (month && day) {
    const today = new Date()
    const bd = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return Math.floor((today - bd) / (365.25 * 24 * 3600 * 1000))
  }
  return CURRENT_YEAR - parseInt(year)
}

const EMPLOYMENT_TYPES = [
  { value: 'federal', label: 'Federal civilian — FERS', desc: 'Federal Employees Retirement System — hired 1984 or later. Includes pension, TSP, and Social Security.' },
  { value: 'federal_csrs', label: 'Federal civilian — CSRS', desc: 'Civil Service Retirement System — typically hired before 1984. Larger pension, no Social Security credit.' },
  { value: 'military', label: 'Military', desc: 'Active duty or Reserve/Guard retirement. May have both military pension and FERS if you joined a federal agency after service.' },
  { value: 'private', label: 'Private sector', desc: '401(k), possible employer pension, and Social Security.' },
  { value: 'selfemployed', label: 'Self-employed', desc: 'SEP-IRA, Solo 401(k), and Self-Employment Social Security (you pay both halves).' },
  { value: 'nonprofit', label: 'Non-profit / 501(c)(3)', desc: 'Often 403(b) plans. Some nonprofits have defined-benefit pensions.' },
  { value: 'state_local', label: 'State / local government', desc: 'State pension system (PERS/STRS/etc.), often with separate Social Security rules.' },
  { value: 'other', label: 'Other', desc: 'Use this for mixed employment histories or non-standard situations.' },
]

const SPECIAL_CATEGORIES = [
  { value: 'standard', label: 'Standard FERS' },
  { value: 'leo', label: 'Law enforcement officer (LEO)' },
  { value: 'firefighter', label: 'Firefighter' },
  { value: 'atc', label: 'Air traffic controller (ATC)' },
  { value: 'special_ops', label: 'Special ops / DSS (Diplomatic Security Service)' },
]

export default function Step1Personal() {
  const { form, updateField } = useForm()
  const isFederal = form.employmentType === 'federal' || form.employmentType === 'federal_csrs'
  const isMarried = form.maritalStatus === 'married'

  const currentAge = exactAge(form.birthYear, form.birthMonth, form.birthDay)
  const mra = form.birthYear ? getMRA(form.birthYear) : 57
  const retirementAge = form.targetRetirementAge || 60
  const yearsOfRetirement = form.lifeExpectancy - retirementAge

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        These basics drive every calculation in your plan — your age determines your Minimum Retirement Age (MRA) and Social Security timeline, your state affects taxes, and your employment type unlocks the right benefit formulas.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date of Birth */}
        <div>
          <label className="label">
            Your date of birth
            <HelpTooltip
              content="Year is required. Month and day are optional but improve precision for MRA, SS Full Retirement Age, and service year calculations."
              className="ml-1"
            />
          </label>
          <div className="flex gap-2">
            <div className="w-20">
              <select
                className="input-field"
                value={form.birthMonth || ''}
                onChange={e => updateField('birthMonth', e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Mo</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <p className="help-text text-center">Month</p>
            </div>
            <div className="w-16">
              <input
                type="number"
                className="input-field"
                value={form.birthDay || ''}
                onChange={e => updateField('birthDay', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Day"
                min="1"
                max="31"
              />
              <p className="help-text text-center">Day</p>
            </div>
            <div className="flex-1">
              <select
                className="input-field"
                value={form.birthYear || ''}
                onChange={e => updateField('birthYear', e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Year…</option>
                {BIRTH_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <p className="help-text text-center">Year</p>
            </div>
          </div>
          {currentAge != null && (
            <p className="help-text mt-1">
              Current age: {currentAge}
              {!(form.birthMonth && form.birthDay) && ' (add month/day for precision)'}
            </p>
          )}
        </div>

        {/* Marital Status */}
        <div>
          <label className="label">
            Marital status
            <HelpTooltip content="Affects your tax filing status (Married Filing Jointly vs. single), Social Security spousal benefit eligibility (up to 50% of your spouse's benefit), and survivor annuity calculations." className="ml-1" />
          </label>
          <select
            className="input-field"
            value={form.maritalStatus}
            onChange={e => updateField('maritalStatus', e.target.value)}
          >
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
        </div>

        {/* Spouse date of birth (if married) */}
        {isMarried && (
          <div>
            <label className="label">
              Spouse date of birth
              <HelpTooltip content="Used to calculate your spouse's MRA, Social Security Full Retirement Age, and survivor benefit projections." className="ml-1" />
            </label>
            <div className="flex gap-2">
              <div className="w-20">
                <select
                  className="input-field"
                  value={form.spouseBirthMonth || ''}
                  onChange={e => updateField('spouseBirthMonth', e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Mo</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <p className="help-text text-center">Month</p>
              </div>
              <div className="w-16">
                <input
                  type="number"
                  className="input-field"
                  value={form.spouseBirthDay || ''}
                  onChange={e => updateField('spouseBirthDay', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Day"
                  min="1"
                  max="31"
                />
                <p className="help-text text-center">Day</p>
              </div>
              <div className="flex-1">
                <select
                  className="input-field"
                  value={form.spouseBirthYear || ''}
                  onChange={e => updateField('spouseBirthYear', e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Year…</option>
                  {BIRTH_YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <p className="help-text text-center">Year</p>
              </div>
            </div>
            {form.spouseBirthYear && (
              <p className="help-text mt-1">
                Spouse age: {exactAge(form.spouseBirthYear, form.spouseBirthMonth, form.spouseBirthDay)}
              </p>
            )}
          </div>
        )}

        {/* Current state */}
        <div>
          <label className="label">
            Current state of residence
            <HelpTooltip content="Your state determines income tax on pension and Social Security income, and is used as your cost-of-living baseline. You can change your retirement state in Step 5." className="ml-1" />
          </label>
          <select
            className="input-field"
            value={form.currentStateCode}
            onChange={e => updateField('currentStateCode', e.target.value)}
          >
            <option value="">Select state…</option>
            {STATE_LIST.map(s => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employment type */}
      <div>
        <label className="label">
          Employment type
          <HelpTooltip content="This determines which retirement formulas apply. Federal FERS/CSRS employees get a pension calculated from salary and service years. Private sector employees rely on 401(k) and Social Security. Select the type that matches your primary career." className="ml-1" />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EMPLOYMENT_TYPES.map(opt => (
            <label key={opt.value} className="flex items-start gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-[#2E6DB4] transition-colors">
              <input
                type="radio"
                name="employmentType"
                value={opt.value}
                checked={form.employmentType === opt.value}
                onChange={e => updateField('employmentType', e.target.value)}
                className="accent-[#2E6DB4] mt-0.5"
              />
              <div>
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Special category (federal only) */}
      {isFederal && (
        <div>
          <label className="label">
            Federal retirement category
            <HelpTooltip content="Law enforcement officers (LEO), firefighters, and air traffic controllers (ATC) have enhanced FERS benefits: a 1.7% multiplier for the first 20 years of service (vs. 1.0% standard), and mandatory retirement ages. DSS = Diplomatic Security Service, which also qualifies." className="ml-1" />
          </label>
          <select
            className="input-field"
            value={form.specialCategory}
            onChange={e => updateField('specialCategory', e.target.value)}
          >
            {SPECIAL_CATEGORIES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {form.specialCategory !== 'standard' && (
            <p className="help-text text-[#2E6DB4]">Enhanced FERS: 1.7% multiplier × first 20 years + 1.0% × remaining years.</p>
          )}
        </div>
      )}

      {/* Life expectancy sliders */}
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Planning horizon</h3>

        <SliderWithInput
          label="Your life expectancy"
          value={form.lifeExpectancy}
          onChange={v => updateField('lifeExpectancy', v)}
          min={70}
          max={100}
          step={1}
          suffix=" yrs"
          helpText={`SSA average: 84 (men), 87 (women). Planning to 90–95 provides a safety buffer. Your plan will cover ${yearsOfRetirement} years of retirement (age ${retirementAge} to ${form.lifeExpectancy}).`}
        />

        {isMarried && (
          <SliderWithInput
            label="Spouse's life expectancy"
            value={form.spouseLifeExpectancy || 92}
            onChange={v => updateField('spouseLifeExpectancy', v)}
            min={70}
            max={100}
            step={1}
            suffix=" yrs"
            helpText="SSA average for women is 87. Planning to 92–95 ensures survivor income lasts."
          />
        )}

        {isFederal && form.birthYear && (
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
            <div>
              <strong>MRA (Minimum Retirement Age):</strong> Age {mra} — earliest you can retire with full FERS benefits
            </div>
            <div>
              <strong>SS earliest:</strong> Age 62 — earliest Social Security claim (reduced benefit) |{' '}
              <strong>Medicare:</strong> Age 65 |{' '}
              <strong>SS Full Retirement Age (FRA):</strong> Age 67
            </div>
          </div>
        )}
      </div>

      <HelpAccordion title="FERS vs CSRS — what's the difference?">
        <p><strong>FERS (Federal Employees Retirement System)</strong> — covers federal employees hired on or after Jan 1, 1984. It's a three-part system: (1) a modest pension, (2) TSP (the federal 401k with employer match), and (3) Social Security. Most current federal employees are FERS.</p>
        <p className="mt-2"><strong>CSRS (Civil Service Retirement System)</strong> — covers employees hired before 1984 who did not switch to FERS. It has a much larger pension formula (up to 80% of High-3) but <em>no Social Security</em> and no employer TSP match.</p>
        <p className="mt-2"><strong>FERS-RAE</strong> — "Revised Annuity Employees." Applies to employees hired on or after Jan 1, 2013. Identical to standard FERS except employee contributions are slightly higher.</p>
      </HelpAccordion>
    </div>
  )
}
