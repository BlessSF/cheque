import { useEffect, useState } from 'react'

/** useState that persists to localStorage (silently falls back to memory if blocked). */
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return typeof initial === 'function' ? initial() : initial
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
  }, [key, value])
  return [value, setValue]
}
