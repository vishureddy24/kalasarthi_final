'use client'

import { useLanguage } from '@/contexts/LanguageContext'

/**
 * LanguageSwitcher — toggle button between English and Hindi.
 * Variants: 'pill' (default) | 'minimal' | 'full'
 */
export default function LanguageSwitcher({ variant = 'pill', className = '' }) {
  const { lang, toggleLang } = useLanguage()
  const isHindi = lang === 'hi'

  if (variant === 'minimal') {
    return (
      <button
        onClick={toggleLang}
        title={isHindi ? 'Switch to English' : 'हिन्दी में बदलें'}
        className={`text-sm font-semibold px-2 py-1 rounded transition-colors hover:bg-primary/10 text-primary ${className}`}
      >
        {isHindi ? 'EN' : 'हि'}
      </button>
    )
  }

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-1 bg-muted rounded-xl p-1 ${className}`}>
        <button
          onClick={() => !isHindi && toggleLang()}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            !isHindi
              ? 'bg-white shadow-sm text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          English
        </button>
        <button
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            isHindi
              ? 'bg-white shadow-sm text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => !isHindi && toggleLang()}
        >
          हिन्दी
        </button>
      </div>
    )
  }

  // pill (default)
  return (
    <button
      onClick={toggleLang}
      title={isHindi ? 'Switch to English' : 'हिन्दी में बदलें'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition-all text-sm font-medium shadow-sm ${className}`}
    >
      <span className="text-base leading-none">{isHindi ? '🇮🇳' : '🌐'}</span>
      <span className="text-foreground">{isHindi ? 'हिन्दी' : 'EN'}</span>
    </button>
  )
}
