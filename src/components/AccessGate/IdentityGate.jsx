import { useEffect, useState } from 'react'
import { useUI } from '../../context/AppContext.jsx'

// Netlify Identity widget — loaded from CDN or npm
let netlifyIdentity = null
if (typeof window !== 'undefined') {
  import('netlify-identity-widget').then(mod => {
    netlifyIdentity = mod.default
    netlifyIdentity.init({ logo: false })
  })
}

export default function IdentityGate() {
  const { dispatch } = useUI()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!netlifyIdentity) return

    const handleLogin = (user) => {
      if (user) {
        sessionStorage.setItem('access', 'granted')
        dispatch({ type: 'UI/SET_ACCESS_GRANTED' })
        netlifyIdentity.close()
      }
    }

    netlifyIdentity.on('login', handleLogin)
    netlifyIdentity.on('error', (err) => {
      setError(err?.message ?? 'Authentication error')
      setLoading(false)
    })

    // Check if already logged in
    const currentUser = netlifyIdentity.currentUser()
    if (currentUser) {
      handleLogin(currentUser)
    }

    return () => {
      netlifyIdentity.off('login', handleLogin)
    }
  }, [dispatch])

  const handleOpen = () => {
    setLoading(true)
    setError('')
    if (netlifyIdentity) {
      netlifyIdentity.open()
      setLoading(false)
    } else {
      setError('Authentication service not available. Please refresh and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="card w-full max-w-sm p-8 text-center">
        {/* Logo mark */}
        <div className="w-14 h-14 bg-[#1B3A6B] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M4 22 L14 6 L24 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 16 L20 16" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 className="text-xl font-bold text-[#1B3A6B] dark:text-blue-300 mb-1">
          RetireAdvisor Pro
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Sign in with your email to access your retirement planning tool
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleOpen}
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Sign In / Sign Up →'}
        </button>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          We send a magic link to your email — no password required
        </p>

        <div className="privacy-banner mt-6">
          🔒 Your financial data never leaves your browser session
        </div>
      </div>
    </div>
  )
}
