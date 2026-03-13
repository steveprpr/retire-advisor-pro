/**
 * CalculationsContext
 *
 * Runs all 48 calculations once (via useCalculations) and provides the result
 * to Dashboard and Report components via context. This prevents the Wizard from
 * ever subscribing to calculation results, avoiding unnecessary re-renders on
 * every keystroke in the wizard forms.
 *
 * Only mount this provider when wizardComplete === true.
 */

import { createContext, useContext } from 'react'
import { useForm, useAssumptions } from './AppContext.jsx'
import { useCalculations as useCalcHook } from '../hooks/useCalculations.js'

const CalculationsContext = createContext(null)

export function CalculationsProvider({ children }) {
  const { form } = useForm()
  const { assumptions } = useAssumptions()
  const calculations = useCalcHook(form, assumptions)

  return (
    <CalculationsContext.Provider value={calculations}>
      {children}
    </CalculationsContext.Provider>
  )
}

/**
 * useCalculations() — no args required when called inside CalculationsProvider.
 * Components in Dashboard and Report use this.
 */
export function useCalculations() {
  const ctx = useContext(CalculationsContext)
  return ctx
}
