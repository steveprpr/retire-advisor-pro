import { useCallback, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { useAppState } from '../../context/AppContext.jsx'
import Step1Personal from './Step1Personal.jsx'
import Step2Service from './Step2Service.jsx'
import Step3Savings from './Step3Savings.jsx'
import Step4RealEstate from './Step4RealEstate.jsx'
import Step5Goals from './Step5Goals.jsx'
import Step6Expenses from './Step6Expenses.jsx'
import Step7Legacy from './Step7Legacy.jsx'
import Step8Notes from './Step8Notes.jsx'

const SAVE_VERSION = '1.0'

const STEPS = [
  { id: 'personal',   label: 'Personal',    short: '1', component: Step1Personal },
  { id: 'service',    label: 'Service',     short: '2', component: Step2Service },
  { id: 'savings',    label: 'Savings',     short: '3', component: Step3Savings },
  { id: 'realestate', label: 'Income & Assets', short: '4', component: Step4RealEstate },
  { id: 'goals',      label: 'Goals',       short: '5', component: Step5Goals },
  { id: 'expenses',   label: 'Expenses',    short: '6', component: Step6Expenses },
  { id: 'legacy',     label: 'Legacy',      short: '7', component: Step7Legacy },
  { id: 'notes',      label: 'Notes',       short: '8', component: Step8Notes },
]

export default function WizardShell() {
  const { state, dispatch } = useAppState()
  const { currentStep } = state.ui
  const { form } = state
  const fileInputRef = useRef(null)
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(false)

  const step = STEPS[currentStep]
  const StepComponent = step?.component

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const payload = {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      form: state.form,
      assumptions: state.assumptions,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const dateStr = new Date().toISOString().slice(0, 10)
    a.download = `retire-advisor-${dateStr}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [state.form, state.assumptions])

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImportClick = useCallback(() => {
    setImportError(null)
    setImportSuccess(false)
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''  // reset so the same file can be re-imported

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        if (!parsed.form || typeof parsed.form !== 'object') {
          setImportError('Invalid file: missing form data.')
          return
        }
        dispatch({ type: 'FORM/IMPORT', form: parsed.form, assumptions: parsed.assumptions })
        setImportSuccess(true)
        setTimeout(() => setImportSuccess(false), 3000)
      } catch {
        setImportError('Could not read file. Make sure it is a valid RetireAdvisor export.')
      }
    }
    reader.readAsText(file)
  }, [dispatch])

  const goNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      dispatch({ type: 'UI/SET_STEP', step: currentStep + 1 })
      window.scrollTo(0, 0)
    } else {
      dispatch({ type: 'UI/SET_WIZARD_COMPLETE' })
    }
  }, [currentStep, dispatch])

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      dispatch({ type: 'UI/SET_STEP', step: currentStep - 1 })
      window.scrollTo(0, 0)
    }
  }, [currentStep, dispatch])

  const goToStep = useCallback((idx) => {
    dispatch({ type: 'UI/SET_STEP', step: idx })
    window.scrollTo(0, 0)
  }, [dispatch])

  const isLastStep = currentStep === STEPS.length - 1
  const canFinish = form.consentGiven

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-[#1B3A6B] dark:text-blue-300">
            Step {currentStep + 1} of {STEPS.length}: {step?.label}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
              {Math.round(((currentStep + 1) / STEPS.length) * 100)}% complete
            </span>
            <button
              type="button"
              onClick={handleImportClick}
              className="btn-ghost text-xs px-2 py-1"
              title="Load a previously saved session"
            >
              ↑ Import
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="btn-ghost text-xs px-2 py-1"
              title="Save your answers to a file"
            >
              ↓ Save
            </button>
          </div>
        </div>

        {/* Import feedback */}
        {importSuccess && (
          <div className="mb-3 px-3 py-2 bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 rounded-lg text-sm text-green-700 dark:text-green-300">
            Session loaded successfully. Review your answers and make any updates.
          </div>
        )}
        {importError && (
          <div className="mb-3 px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
            {importError}
          </div>
        )}


        {/* Step dots */}
        <div className="flex gap-1">
          {STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goToStep(idx)}
              className={clsx(
                'flex-1 h-2 rounded-full transition-all',
                idx < currentStep ? 'bg-[#1D9E75]' :
                idx === currentStep ? 'bg-[#2E6DB4]' :
                'bg-gray-200 dark:bg-gray-700'
              )}
              title={s.label}
            />
          ))}
        </div>

        {/* Step labels (desktop) */}
        <div className="hidden sm:flex gap-1 mt-1">
          {STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goToStep(idx)}
              className={clsx(
                'flex-1 text-center text-xs transition-colors truncate',
                idx === currentStep ? 'text-[#2E6DB4] font-medium' :
                idx < currentStep ? 'text-[#1D9E75]' :
                'text-gray-400 dark:text-gray-600'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="card min-h-64">
        {StepComponent && <StepComponent />}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={goBack}
          disabled={currentStep === 0}
          className="btn-secondary disabled:opacity-30"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Save your answers to a file so you can resume later"
          >
            ↓ Save progress
          </button>
          {isLastStep ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canFinish}
              className={clsx(
                'btn-primary px-8',
                !canFinish && 'opacity-50 cursor-not-allowed'
              )}
            >
              View My Dashboard →
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="btn-primary"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
