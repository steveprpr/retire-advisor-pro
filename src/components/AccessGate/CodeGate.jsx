import { useState } from 'react'
import { useUI } from '../../context/AppContext.jsx'

const CODE_HASH = import.meta.env.VITE_ACCESS_CODE_HASH ?? ''

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function CodeGate() {
  const { dispatch } = useUI()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setChecking(true)
    setError('')

    try {
      const hash = await sha256Hex(code.trim())
      if (hash === CODE_HASH) {
        sessionStorage.setItem('access', 'granted')
        dispatch({ type: 'UI/SET_ACCESS_GRANTED' })
      } else {
        setError('Incorrect access code. Please try again.')
      }
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setChecking(false)
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
          Enter your access code to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            value={code}
            onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
            placeholder="Access code"
            className="input-field text-center text-lg tracking-widest font-mono"
            autoFocus
          />

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={checking || code.length < 4}
            className="btn-primary w-full disabled:opacity-50"
          >
            {checking ? 'Verifying…' : 'Continue →'}
          </button>
        </form>

        <div className="privacy-banner mt-6">
          🔒 Your financial data never leaves your browser session
        </div>
      </div>
    </div>
  )
}
