'use client'

import { useVoice } from '@/contexts/VoiceContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Mic, MicOff, Volume2 } from 'lucide-react'
import { useState } from 'react'

/**
 * VoiceButton — floating/inline voice activation button.
 * Props:
 *   variant: 'floating' (default) | 'inline' | 'compact'
 *   showTranscript: boolean
 */
export default function VoiceButton({ variant = 'floating', showTranscript = true, className = '' }) {
  const { isListening, transcript, response, isSupported, error, toggleListening } = useVoice()
  const { tx } = useLanguage()
  const [showTip, setShowTip] = useState(false)

  if (!isSupported) {
    return variant === 'floating' ? (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <div className="bg-card border border-border rounded-2xl shadow-lg px-4 py-2 text-xs text-muted-foreground">
          {tx('voiceNotSupported')}
        </div>
      </div>
    ) : null
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleListening}
        title={isListening ? tx('voiceStop') : tx('voiceStart')}
        className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
          isListening
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
        } ${className}`}
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <button
          onClick={toggleListening}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
            isListening
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              <span className="flex items-center gap-1">
                {tx('voiceListening')}
                <span className="flex gap-0.5 ml-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-0.5 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </span>
              </span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              {tx('voiceStart')}
            </>
          )}
        </button>
        {showTranscript && (
          <>
            {transcript && (
              <div className="text-sm text-foreground bg-muted rounded-lg px-3 py-2">
                <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-0.5">
                  {tx('voiceListening')}
                </span>
                "{transcript}"
              </div>
            )}
            {response && (
              <div className="flex items-start gap-2 text-sm text-foreground bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                <Volume2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                {response}
              </div>
            )}
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </>
        )}
      </div>
    )
  }

  // floating (default)
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 ${className}`}>
      {/* Tip card */}
      {showTip && !isListening && (
        <div className="bg-card border border-border rounded-2xl shadow-xl p-4 max-w-xs animate-fade-in">
          <p className="text-xs font-semibold text-foreground mb-1">{tx('voiceCommands')}</p>
          <p className="text-xs text-muted-foreground">{tx('voiceTip')}</p>
        </div>
      )}

      {/* Transcript / response popup */}
      {isListening && transcript && (
        <div className="bg-card border border-border rounded-2xl shadow-xl px-4 py-3 max-w-xs animate-fade-in">
          <p className="text-xs text-primary font-semibold mb-1">{tx('voiceListening')}</p>
          <p className="text-sm text-foreground">"{transcript}"</p>
        </div>
      )}
      {response && !isListening && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl shadow-xl px-4 py-3 max-w-xs animate-fade-in flex items-start gap-2">
          <Volume2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-foreground">{response}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Main button */}
      <div className="flex items-center gap-2">
        {!isListening && (
          <button
            onClick={() => setShowTip(v => !v)}
            className="text-xs text-muted-foreground bg-card border border-border rounded-full px-3 py-1.5 hover:bg-muted transition-colors shadow"
          >
            {tx('voiceCommands')}
          </button>
        )}
        <button
          onClick={toggleListening}
          title={isListening ? tx('voiceStop') : tx('voiceStart')}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            isListening
              ? 'bg-red-500 text-white scale-110 shadow-red-500/50'
              : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:scale-105'
          }`}
        >
          {/* Pulse rings when listening */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
              <span className="absolute inset-[-6px] rounded-full border-2 border-red-300 animate-pulse opacity-50" />
            </>
          )}
          {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
      </div>
    </div>
  )
}
