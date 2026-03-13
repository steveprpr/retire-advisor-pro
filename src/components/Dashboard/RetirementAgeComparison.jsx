import { useMemo } from 'react'
import { useForm } from '../../context/AppContext.jsx'
import {
  getMRA,
  computeFersPension,
  computeAutoHigh3,
  computeServiceYearsAtRetirement,
} from '../../utils/federalCalculations.js'
import { formatCurrency } from '../../utils/formatters.js'

const CURRENT_YEAR = new Date().getFullYear()
const CANDIDATE_AGES = [57, 58, 59, 60, 62, 65, 67]

// Approximate SS benefit if claimed at a given age (assumes FRA = 67 for born 1960+)
function ssAtAge(age, fraMonthly) {
  if (!fraMonthly || age < 62) return 0
  if (age >= 70) return Math.round(fraMonthly * 1.24)
  const factorByAge = { 62: 0.70, 63: 0.75, 64: 0.80, 65: 0.867, 66: 0.933, 67: 1.0, 68: 1.08, 69: 1.16 }
  return Math.round(fraMonthly * (factorByAge[age] ?? 1.0))
}

export function RetirementAgeComparison({ ssAt62Monthly = 0, ssAtFRAMonthly = 0 }) {
  const fraMonthly = ssAtFRAMonthly || (ssAt62Monthly ? Math.round(ssAt62Monthly / 0.70) : 0)
  const { form, updateField } = useForm()

  const isFederal = form.employmentType === 'federal' || form.employmentType === 'federal_csrs'
  const isCSRS = form.retirementSystem === 'csrs' || form.retirementSystem === 'csrs_offset'

  const mra = getMRA(form.birthYear || 1970)
  const mraRounded = Math.ceil(mra * 12) / 12  // keep fractional for display
  const currentAge = form.birthYear ? CURRENT_YEAR - parseInt(form.birthYear) : 55

  const ages = useMemo(() => {
    const mraFloor = Math.floor(mra)
    // Include MRA-floor, then the standard candidate ages
    const set = new Set([mraFloor, ...CANDIDATE_AGES])
    return [...set].filter(a => a >= mraFloor && a <= 70).sort((a, b) => a - b)
  }, [mra])

  const scenarios = useMemo(() => {
    return ages.map(age => {
      // Determine service years at this retirement age
      let serviceYears
      if (form.serviceYearsMode !== 'manual' && form.scdYear) {
        serviceYears = computeServiceYearsAtRetirement(form.scdYear, age, form.birthYear) ?? (form.credibleServiceYears ?? 20)
      } else {
        // Manual: user entered current years — project forward to this retirement age
        serviceYears = (form.credibleServiceYears ?? 20) + Math.max(0, age - currentAge)
      }

      // High-3 at this retirement age
      const high3 = form.high3Override
        ? (form.high3Salary || 0)
        : computeAutoHigh3(
            form.currentSalary || 0,
            form.salaryGrowthRate || 0.01,
            age,
            currentAge,
            form.high3FreezeAge || null,
          )

      const militaryYears = form.militaryService === 'deposit_paid' ? (form.militaryServiceYears || 0) : 0

      const result = computeFersPension({
        high3Salary: high3,
        credibleServiceYears: serviceYears,
        retirementAge: age,
        militaryBuybackYears: militaryYears,
        unusedSickLeaveMonths: form.unusedSickLeaveMonths || 0,
        survivorBenefitElection: form.survivorAnnuityElection || 'full',
        retirementSystem: form.retirementSystem || 'fers',
        specialCategory: form.specialCategory || 'standard',
        birthYear: form.birthYear,
        projectedSSAt62Monthly: ssAt62Monthly,
      })

      const ssMonthly = ssAtAge(age, fraMonthly)
      const totalMonthly = (result.netMonthlyAnnuity || 0) + (result.hasSRS ? (result.srsMonthly || 0) : ssMonthly)

      return {
        age,
        serviceYears: typeof serviceYears === 'number' ? serviceYears.toFixed(1) : '--',
        netMonthly: result.netMonthlyAnnuity || 0,
        srsMonthly: result.srsMonthly || 0,
        ssMonthly,
        totalMonthly,
        penaltyRate: result.penaltyRate || 0,
        hasSRS: result.hasSRS,
        isCurrentTarget: age === (form.targetRetirementAge || 60),
      }
    })
  }, [ages, form, currentAge, fraMonthly])

  if (!isFederal) return null

  const maxTotal = Math.max(...scenarios.map(s => s.totalMonthly), 1)

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[#1B3A6B] dark:text-blue-300">Retirement Age Comparison</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            FERS + SRS (before 62) · FERS + Social Security (62+) · all at time of retirement
          </p>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-600">MRA = {Math.floor(mra)}{mra % 1 > 0 ? `y ${Math.round((mra % 1) * 12)}mo` : ''}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left pb-2 font-medium">Retire at</th>
              <th className="text-right pb-2 font-medium">Service</th>
              <th className="text-right pb-2 font-medium">FERS/mo</th>
              {!isCSRS && <th className="text-right pb-2 font-medium">SRS / SS</th>}
              <th className="text-right pb-2 font-medium">Total/mo</th>
              <th className="text-left pb-2 pl-3 font-medium w-40">Bar</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map(s => (
              <tr
                key={s.age}
                className={`border-b border-gray-100 dark:border-gray-800 transition-colors ${
                  s.isCurrentTarget
                    ? 'bg-blue-50 dark:bg-blue-950/40'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                }`}
              >
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateField('targetRetirementAge', s.age)}
                      className={`font-semibold text-sm transition-colors ${
                        s.isCurrentTarget
                          ? 'text-[#2E6DB4]'
                          : 'text-gray-700 dark:text-gray-300 hover:text-[#2E6DB4]'
                      }`}
                    >
                      Age {s.age}
                    </button>
                    {s.isCurrentTarget && (
                      <span className="text-xs bg-[#2E6DB4] text-white px-1.5 py-0.5 rounded-full">selected</span>
                    )}
                    {s.penaltyRate > 0 && (
                      <span className="text-xs text-orange-600 dark:text-orange-400">
                        -{(s.penaltyRate * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 text-right text-gray-600 dark:text-gray-400">{s.serviceYears} yrs</td>
                <td className="py-2 text-right font-medium text-gray-800 dark:text-gray-200">
                  {formatCurrency(s.netMonthly)}
                </td>
                {!isCSRS && (
                  <td className="py-2 text-right">
                    {s.hasSRS ? (
                      <span className="text-green-700 dark:text-green-400" title="Special Retirement Supplement (SS bridge)">
                        {formatCurrency(s.srsMonthly)}
                        <span className="text-xs text-gray-400 ml-0.5">SRS</span>
                      </span>
                    ) : s.ssMonthly > 0 ? (
                      <span className="text-blue-600 dark:text-blue-400" title="Social Security (if claimed at this age)">
                        {formatCurrency(s.ssMonthly)}
                        <span className="text-xs text-gray-400 ml-0.5">SS</span>
                      </span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </td>
                )}
                <td className="py-2 text-right font-bold text-[#1B3A6B] dark:text-blue-300">
                  {formatCurrency(s.totalMonthly)}
                </td>
                <td className="py-2 pl-3">
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden w-36">
                    <div
                      className={`h-full rounded-full transition-all ${s.isCurrentTarget ? 'bg-[#2E6DB4]' : 'bg-[#4A9FDF]'}`}
                      style={{ width: `${(s.totalMonthly / maxTotal) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-600">
        Click any age row to update your target retirement age. SRS = SS bridge paid by OPM until age 62. SS shown for 62+ assumes you claim at that age. TSP/savings income not included.
      </p>
    </div>
  )
}
