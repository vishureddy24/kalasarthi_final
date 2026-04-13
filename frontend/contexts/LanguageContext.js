'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { t as translate } from '@/lib/translations'

const LanguageContext = createContext({})

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en')

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ks_lang')
      if (saved === 'hi' || saved === 'en') {
        setLangState(saved)
      }
    } catch {
      // localStorage unavailable (SSR / private browsing)
    }
  }, [])

  const setLang = useCallback((newLang) => {
    setLangState(newLang)
    try {
      localStorage.setItem('ks_lang', newLang)
    } catch {}
  }, [])

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'hi' : 'en')
  }, [lang, setLang])

  /** Convenience translation function bound to current language */
  const tx = useCallback((key, vars) => translate(lang, key, vars), [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, tx, isHindi: lang === 'hi' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
