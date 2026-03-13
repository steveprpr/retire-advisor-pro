import { useEffect } from 'react'
import { AppProvider, useUI } from './context/AppContext.jsx'
import { CalculationsProvider } from './context/CalculationsContext.jsx'
import WizardShell from './components/Wizard/WizardShell.jsx'
import Dashboard from './components/Dashboard/Dashboard.jsx'
import ReportView from './components/Report/ReportView.jsx'
import AssumptionsPanel from './components/Assumptions/AssumptionsPanel.jsx'
import CodeGate from './components/AccessGate/CodeGate.jsx'
import IdentityGate from './components/AccessGate/IdentityGate.jsx'

const ACCESS_MODE = import.meta.env.VITE_ACCESS_MODE ?? 'code'
const CODE_HASH = import.meta.env.VITE_ACCESS_CODE_HASH ?? ''

function AppShell() {
  const { ui, dispatch } = useUI()

  const accessGranted = ui.accessGranted
  const wizardComplete = ui.wizardComplete
  const activeTab = ui.activeTab ?? 'dashboard'

  // Apply dark mode class on html element
  useEffect(() => {
    if (ui.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [ui.darkMode])

  const toggleDark = () => dispatch({ type: 'UI/TOGGLE_DARK_MODE' })
  const setTab = (tab) => dispatch({ type: 'UI/SET_TAB', tab })

  // ── Access gate ─────────────────────────────────────────────────────────────
  if (!accessGranted) {
    // Skip gate entirely if no hash configured (dev mode or unconfigured)
    if (ACCESS_MODE === 'none' || (!CODE_HASH && ACCESS_MODE === 'code')) {
      // Auto-grant in development or when not configured
      dispatch({ type: 'UI/SET_ACCESS_GRANTED' })
      return null
    }

    if (ACCESS_MODE === 'identity') {
      return <IdentityGate />
    }

    return <CodeGate />
  }

  // ── Wizard ──────────────────────────────────────────────────────────────────
  if (!wizardComplete) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <AppHeader onToggleDark={toggleDark} darkMode={ui.darkMode} />
        <main>
          <WizardShell />
        </main>
        <PrivacyBanner />
      </div>
    )
  }

  // ── Dashboard / Report ──────────────────────────────────────────────────────
  return (
    <CalculationsProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <AppHeader
          onToggleDark={toggleDark}
          darkMode={ui.darkMode}
          showTabs
          activeTab={activeTab}
          onTabChange={setTab}
          onEditInputs={() => {
            dispatch({ type: 'UI/REOPEN_WIZARD' })
          }}
        />

        <main className="pb-16">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'report' && <ReportView />}
        </main>

        <AssumptionsPanel />
        <PrivacyBanner />
      </div>
    </CalculationsProvider>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
function AppHeader({ onToggleDark, darkMode, showTabs, activeTab, onTabChange, onEditInputs }) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 no-print">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#1B3A6B] rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 13 L8 3 L14 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4.5 9.5 L11.5 9.5" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-bold text-[#1B3A6B] dark:text-blue-300 text-sm hidden sm:block">
            RetireAdvisor Pro
          </span>
        </div>

        {/* Tab navigation */}
        {showTabs && (
          <nav className="flex items-center gap-1">
            <TabBtn active={activeTab === 'dashboard'} onClick={() => onTabChange('dashboard')}>
              Dashboard
            </TabBtn>
            <TabBtn active={activeTab === 'report'} onClick={() => onTabChange('report')}>
              Report
            </TabBtn>
          </nav>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {showTabs && onEditInputs && (
            <button
              type="button"
              onClick={onEditInputs}
              className="btn-ghost text-xs hidden sm:block"
            >
              ← Edit Inputs
            </button>
          )}
          <button
            type="button"
            onClick={onToggleDark}
            className="btn-ghost text-lg"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
        active
          ? 'bg-[#1B3A6B] text-white dark:bg-blue-800'
          : 'text-gray-600 dark:text-gray-400 hover:text-[#1B3A6B] dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ── Privacy Banner ────────────────────────────────────────────────────────────
function PrivacyBanner() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 no-print">
      <div className="privacy-banner py-1 text-center text-xs">
        🔒 Your financial data never leaves your browser session · Not financial advice · For planning purposes only
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
