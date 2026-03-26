import { useUI } from '../../context/AppContext.jsx'
import { SupportBanner } from '../common/SupportBanner.jsx'

export default function LandingPage() {
  const { dispatch } = useUI()
  const start = () => dispatch({ type: 'UI/DISMISS_LANDING' })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="max-w-4xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#1B3A6B] rounded-xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
                <path d="M2 13 L8 3 L14 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.5 9.5 L11.5 9.5" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-[#1B3A6B] dark:text-blue-300">RetireAdvisor Pro</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 leading-tight mb-4">
            Know exactly where you stand<br className="hidden sm:block" /> before you retire.
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A free, private retirement planning tool built for federal employees, veterans, and private-sector workers — with real numbers, not guesses.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: '🏛️',
              title: 'FERS & CSRS Pension',
              body: 'Calculates your exact annuity using OPM formulas — High-3, service years, special categories, SRS bridge, and survivor benefits.',
            },
            {
              icon: '📊',
              title: 'Full Financial Picture',
              body: 'TSP/401k projections, Social Security timing, Roth conversions, VA benefits, rental income, and home equity — all in one plan.',
            },
            {
              icon: '🤖',
              title: 'AI-Powered Report',
              body: 'Complete your inputs and generate a personalized analysis with an income strategy, tax plan, and prioritized action items.',
            },
          ].map(f => (
            <div key={f.title} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{f.body}</p>
            </div>
          ))}
        </div>

        {/* What to expect */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">What to expect</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { step: '1', label: '8-step wizard', desc: 'Enter your personal profile, service history, savings, expenses, and goals. Takes about 10–15 minutes.' },
              { step: '2', label: 'Live dashboard', desc: 'See your retirement income, portfolio health, tax rate, and legacy estimate update in real time as you type.' },
              { step: '3', label: 'AI report', desc: 'Generate a narrative analysis covering income strategy, tax optimization, and a prioritized action plan.' },
              { step: '4', label: 'Refine & export', desc: 'Adjust assumptions, explore retirement age scenarios, and export a PDF to share with your financial advisor.' },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#1B3A6B] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support banner */}
        <div className="mb-6">
          <SupportBanner variant="landing" />
        </div>

        {/* CTA + privacy */}
        <div className="text-center space-y-3">
          <button
            type="button"
            onClick={start}
            className="btn-primary text-base px-8 py-3"
          >
            Get Started →
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-600">
            🔒 Your financial data never leaves your browser · Not financial advice · For planning purposes only
          </p>
        </div>

      </div>
    </div>
  )
}
