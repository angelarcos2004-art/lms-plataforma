import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('paideia-theme') === 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '')
    localStorage.setItem('paideia-theme', dark ? 'dark' : 'light')
  }, [dark])

  // Aplicar en el primer render
  useEffect(() => {
    if (localStorage.getItem('paideia-theme') === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  return [dark, () => setDark(d => !d)]
}
