import { useState, useEffect, useRef } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const prevKeyRef = useRef(key)

  // Re-read from localStorage when key changes (e.g., new day)
  useEffect(() => {
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key
      try {
        const item = window.localStorage.getItem(key)
        setStoredValue(item ? JSON.parse(item) : initialValue)
      } catch {
        setStoredValue(initialValue)
      }
    }
  }, [key, initialValue])

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  return [storedValue, setValue]
}
