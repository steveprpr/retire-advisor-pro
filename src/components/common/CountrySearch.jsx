import { useState, useCallback, useRef, useEffect } from 'react'
import { COUNTRY_LIST, getCountryData } from '../../data/countryColData.js'

export function CountrySearch({ value, onSelect, className }) {
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const filtered = query.length >= 1
    ? COUNTRY_LIST.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : COUNTRY_LIST

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = useCallback((country) => {
    const data = getCountryData(country.key)
    setQuery(country.name)
    setOpen(false)
    onSelect({ key: country.key, name: country.name, data })
  }, [onSelect])

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <input
        type="text"
        className="input-field"
        placeholder="Type country name..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((c) => (
            <li key={c.key}>
              <button
                type="button"
                className="w-full px-3 py-2 text-sm text-left hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={() => handleSelect(c)}
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
