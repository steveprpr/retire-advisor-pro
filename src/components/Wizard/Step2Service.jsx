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
  const isDivorced = form.maritalStatus === 'divorced'

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

  // Auto-compute service years from SCD (uses month/day when available)
  const autoServiceYears = computeServiceYearsAtRetirement(
    form.scdYear, form.targetRetirementAge || 60, form.birthYear, form.scdMonth, form.scdDay
  )

  if (!isFederal) {
    return <PrivateSectorSection isDivorced={isDivorced} />
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Your service history and salary are the core inputs for your FERS annuity — the pension you'll receive every month for life. The more accurate these numbers are, the more reliable your retirement income estimate will be.
      </p>

      {/* Divorce court order — shown prominently at top when divorced */}
      {isDivorced && <DivorceCourtOrderSection isFederal={true} isDivorced={true} />}

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
          <label className="label">
            Retirement system
            <HelpTooltip content="FERS (hired 1984+): pension + TSP match + Social Security. FERS-RAE (hired Jan 2013+): same as FERS but slightly higher employee contribution. CSRS (hired before 1984): larger pension (up to 80% of High-3), no Social Security. CSRS-Offset: hybrid — CSRS pension partially offset by Social Security you'll receive." className="ml-1" />
          </label>
          <select className="input-field" value={form.retirementSystem} onChange={e => updateField('retirementSystem', e.target.value)}>
            <option value="fers">FERS (hired 1984–2012)</option>
            <option value="fers_rae">FERS-RAE (hired Jan 2013+)</option>
            <option value="csrs">CSRS (hired before 1984)</option>
            <option value="csrs_offset">CSRS-Offset (CSRS with partial SS)</option>
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
                Federal service start date (SCD)
                <HelpTooltip content="Your SCD (Service Computation Date) is the date OPM uses to compute retirement eligibility. It may differ from your hire date due to prior federal service, military buyback, or breaks." className="ml-1" />
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    className="input-field"
                    value={form.scdYear || ''}
                    onChange={e => updateField('scdYear', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Year"
                    min="1960"
                    max={CURRENT_YEAR}
                  />
                  <p className="help-text text-center">Year</p>
                </div>
                <div className="w-20">
                  <select
                    className="input-field"
                    value={form.scdMonth || ''}
                    onChange={e => updateField('scdMonth', e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Mo</option>
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <p className="help-text text-center">Month</p>
                </div>
                <div className="w-16">
                  <input
                    type="number"
                    className="input-field"
                    value={form.scdDay || ''}
                    onChange={e => updateField('scdDay', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Day"
                    min="1"
                    max="31"
                  />
                  <p className="help-text text-center">Day</p>
                </div>
              </div>
              {form.scdYear && (
                <p className="help-text mt-1">
                  {form.scdMonth && form.scdDay
                    ? (() => {
                        const scd = new Date(form.scdYear, form.scdMonth - 1, form.scdDay)
                        const today = new Date()
                        const ms = today - scd
                        const yrs = ms / (1000 * 60 * 60 * 24 * 365.25)
                        const wholeYrs = Math.floor(yrs)
                        const months = Math.floor((yrs - wholeYrs) * 12)
                        return `${wholeYrs} yrs ${months} mo of service to date`
                      })()
                    : `${CURRENT_YEAR - form.scdYear} years of service to date (add month/day for precision)`
                  }
                </p>
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
        <label className="label">
          Military service
          <HelpTooltip content="If you served on active duty before joining a federal civilian agency, you can count those years toward your FERS pension by paying a 'military deposit' — typically 3% of your military basic pay. If the deposit is paid before you retire, those years add to your creditable service. If not paid, they are excluded from your pension calculation." className="ml-1" />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { value: 'none', label: 'No military service' },
            { value: 'no_credit', label: 'Active duty — no FERS credit (deposit not planned)' },
            { value: 'deposit_paid', label: 'Military deposit paid ✓ (years count toward pension)' },
            { value: 'deposit_progress', label: 'Military deposit in progress (will count when paid)' },
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
          helpText="Federal GS (General Schedule) step and grade increases average ~1–2%/yr. Include expected promotions if applicable."
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

      {!isDivorced && <DivorceCourtOrderSection isFederal={true} isDivorced={false} />}
    </div>
  )
}

function PrivateSectorSection({ isDivorced }) {
  const { form, updateField } = useForm()
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Your salary and any employer pension help us estimate your income floor in retirement. Even without a traditional pension, this step captures what you're earning now so projections stay accurate.
      </p>

      {isDivorced && <DivorceCourtOrderSection isFederal={false} isDivorced={true} />}

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

      {!isDivorced && <DivorceCourtOrderSection isFederal={false} isDivorced={false} />}
    </div>
  )
}

// ── Divorce / Court Order Section ────────────────────────────────────────────
function DivorceCourtOrderSection({ isFederal, isDivorced }) {
  const { form, updateField } = useForm()
  const termShort = isFederal ? 'COAP' : 'QDRO'

  // When user selected "divorced" in Step 1, section is always expanded
  const isExpanded = isDivorced || form.hasDivorceCOAP

  return (
    <div className={`p-4 rounded-xl space-y-4 ${isDivorced
      ? 'bg-blue-50 dark:bg-blue-950/40 border border-[#2E6DB4]/30'
      : 'bg-gray-50 dark:bg-gray-900'}`}>
      <div className="flex items-center gap-2">
        <span className="text-base">⚖️</span>
        <h3 className="font-medium text-gray-800 dark:text-gray-200">
          Court-ordered benefit division ({termShort})
        </h3>
        <HelpTooltip
          content={isFederal
            ? "A COAP (Court Order Acceptable for Processing) is OPM's version of a QDRO. A divorce decree may award your former spouse a percentage of your FERS/CSRS annuity and/or a share of your TSP balance. The pension share permanently reduces your monthly take-home annuity."
            : "A QDRO (Qualified Domestic Relations Order) directs a retirement plan administrator to pay a portion of your 401k or pension to a former spouse. The pension portion reduces your monthly benefit; the 401k portion may have been split at divorce (reducing your current balance) or may be split when you retire."}
          className="ml-1"
        />
      </div>

      {!isDivorced && (
        <label className="flex items-center gap-3 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={form.hasDivorceCOAP}
            onChange={e => updateField('hasDivorceCOAP', e.target.checked)}
            className="accent-[#2E6DB4]"
          />
          <span>A {termShort} divides my retirement benefits with a former spouse</span>
        </label>
      )}

      {isDivorced && (
        <p className="text-sm text-[#1B3A6B] dark:text-blue-300">
          Since you're divorced, enter any court-ordered division of your retirement benefits below. Leave pension share at 0 if no pension division was ordered.
        </p>
      )}

      {isExpanded && (
        <div className="space-y-4 ml-0">

          {/* Pension share */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="label">
                Former spouse's share of monthly pension
                <HelpTooltip
                  content="Enter the percentage of your gross monthly pension awarded to your former spouse. Example: if the decree awards your ex 30% of your $3,000/month pension, enter 30 — your take-home becomes $2,100/month."
                  className="ml-1"
                />
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input-field w-24"
                  value={form.divorceAnnuitySharePct || ''}
                  onChange={e => updateField('divorceAnnuitySharePct', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="1"
                />
                <span className="text-sm text-gray-500">% of gross pension</span>
              </div>
            </div>
            {form.divorceAnnuitySharePct > 0 && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                Your pension calculation will be reduced by <strong>{form.divorceAnnuitySharePct}%</strong>. The former spouse's portion does not count as your income.
              </div>
            )}
          </div>

          {/* TSP / 401k split */}
          <div className="space-y-2">
            <label className="label">
              401k / TSP split
              <HelpTooltip
                content="Most QDROs/COAPs are processed at the time of divorce — the account is split and your current balance already reflects your share. If your order will be executed when you retire, enter the percentage and we'll reduce your projected retirement balance."
                className="ml-1"
              />
            </label>
            {[
              { value: 'already_done', label: 'Already divided — my current account balance reflects my share' },
              { value: 'at_retirement', label: 'Will be divided at retirement — specify percentage below' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="divorceTSPDivision"
                  value={opt.value}
                  checked={form.divorceTSPDivision === opt.value}
                  onChange={e => updateField('divorceTSPDivision', e.target.value)}
                  className="accent-[#2E6DB4]"
                />
                {opt.label}
              </label>
            ))}
            {form.divorceTSPDivision === 'at_retirement' && (
              <div className="flex items-center gap-2 ml-6 mt-1">
                <input
                  type="number"
                  className="input-field w-24"
                  value={form.divorceTSPSharePct || ''}
                  onChange={e => updateField('divorceTSPSharePct', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="1"
                />
                <span className="text-sm text-gray-500">% of projected balance goes to former spouse</span>
              </div>
            )}
          </div>

          {/* SS note */}
          <p className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 rounded-lg p-2.5">
            <strong>Social Security note:</strong> A former spouse married to you for 10+ years can claim SS benefits based on your record — but this does not reduce your own SS benefit. No input is needed here for SS.
          </p>
        </div>
      )}
    </div>
  )
}
