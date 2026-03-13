import { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'

export function HelpTooltip({ content, className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <span ref={ref} className={clsx('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-bold flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
        aria-label="Help"
      >
        ?
      </button>
      {open && (
        <div className="absolute z-50 w-64 p-3 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 left-6 top-0">
          {content}
        </div>
      )}
    </span>
  )
}

export function HelpAccordion({ title, children, className }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={clsx('border border-gray-200 dark:border-gray-700 rounded-lg', className)}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span>💡 {title}</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
          {children}
        </div>
      )}
    </div>
  )
}
