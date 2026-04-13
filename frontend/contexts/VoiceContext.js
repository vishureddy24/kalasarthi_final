'use client'

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

const VoiceContext = createContext({})

// Command patterns for EN and HI
const COMMANDS = {
  en: [
    { pattern: /\b(go to |open |show )?(dashboard|home)\b/i, action: 'navigate', target: '/dashboard', message: 'Navigating to Dashboard' },
    { pattern: /\b(go to |open |show )?marketplace\b/i, action: 'navigate', target: '/dashboard/marketplace', message: 'Opening Marketplace' },
    { pattern: /\b(go to |open |show )?(my )?products?\b/i, action: 'navigate', target: '/dashboard/products', message: 'Opening My Products' },
    { pattern: /\b(add|new|create) product\b/i, action: 'navigate', target: '/dashboard/add-product', message: 'Opening Add Product' },
    { pattern: /\b(go to |open |show )?ai( tools?)?\b/i, action: 'navigate', target: '/dashboard/ai-tools', message: 'Opening AI Tools' },
    { pattern: /\b(go to |open |show )?map\b/i, action: 'navigate', target: '/dashboard/map', message: 'Opening Artisan Map' },
    { pattern: /\b(go to |open |show )?(scheme|government)\b/i, action: 'navigate', target: '/dashboard/schemes', message: 'Opening Government Schemes' },
    { pattern: /\b(go to |open |show )?(khata|ledger|account)\b/i, action: 'navigate', target: '/dashboard/khata', message: 'Opening Digital Khata' },
    { pattern: /\b(go to |open |show )?order\b/i, action: 'navigate', target: '/dashboard/orders', message: 'Opening Orders' },
    { pattern: /\bsearch (for |about )?(.+)/i, action: 'search', messagePrefix: 'Searching for' },
    { pattern: /\b(fill|auto fill) form\b/i, action: 'fillForm', message: 'Auto filling form' },
    { pattern: /\b(submit|apply)\b/i, action: 'submit', message: 'Submitting form' },
    { pattern: /\b(close|cancel|go back)\b/i, action: 'close', message: 'Closing' },
    { pattern: /\b(suggest|recommend|best scheme)\b/i, action: 'recommend', message: 'Getting AI recommendations' },
    { pattern: /\bhelp\b/i, action: 'help', message: 'Available commands: dashboard, schemes, khata, products, add product, AI tools, map, fill form, submit, cancel, suggest' },
  ],
  hi: [
    { pattern: /\b(डैशबोर्ड|होम)\b/, action: 'navigate', target: '/dashboard', message: 'डैशबोर्ड पर जा रहे हैं' },
    { pattern: /\b(बाज़ार|मार्केटप्लेस)\b/, action: 'navigate', target: '/dashboard/marketplace', message: 'बाज़ार खोल रहे हैं' },
    { pattern: /\b(मेरे उत्पाद|उत्पाद)\b/, action: 'navigate', target: '/dashboard/products', message: 'उत्पाद खोल रहे हैं' },
    { pattern: /\b(उत्पाद जोड़ें|नया उत्पाद)\b/, action: 'navigate', target: '/dashboard/add-product', message: 'उत्पाद जोड़ना खोल रहे हैं' },
    { pattern: /\b(AI उपकरण|एआई)\b/, action: 'navigate', target: '/dashboard/ai-tools', message: 'AI उपकरण खोल रहे हैं' },
    { pattern: /\b(मानचित्र|नक्शा)\b/, action: 'navigate', target: '/dashboard/map', message: 'मानचित्र खोल रहे हैं' },
    { pattern: /\b(योजना|स्कीम|सरकारी)\b/, action: 'navigate', target: '/dashboard/schemes', message: 'सरकारी योजनाएं खोल रहे हैं' },
    { pattern: /\b(खाता|लेजर)\b/, action: 'navigate', target: '/dashboard/khata', message: 'डिजिटल खाता खोल रहे हैं' },
    { pattern: /\b(खोजें|खोजो) (.+)/, action: 'search', messagePrefix: 'खोज रहे हैं' },
    { pattern: /\b(फॉर्म भरें|ऑटो फिल)\b/, action: 'fillForm', message: 'फॉर्म ऑटो फिल हो रहा है' },
    { pattern: /\b(सबमिट|आवेदन)\b/, action: 'submit', message: 'फॉर्म सबमिट हो रहा है' },
    { pattern: /\b(बंद करें|कैंसिल)\b/, action: 'close', message: 'बंद कर रहे हैं' },
    { pattern: /\b(सुझाव|सर्वश्रेष्ठ)\b/, action: 'recommend', message: 'AI सुझाव ला रहे हैं' },
    { pattern: /\b(मदद|सहायता)\b/, action: 'help', message: 'उपलब्ध कमांड: डैशबोर्ड, बाज़ार, उत्पाद, उत्पाद जोड़ें, AI उपकरण, मानचित्र, योजना, खाता, फॉर्म भरें, सबमिट, सुझाव' },
  ],
}

export function VoiceProvider({ children }) {
  const { lang } = useLanguage()
  const router = useRouter()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)
  const synthRef = useRef(null)

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setIsSupported(supported)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }
  }, [])

  const speak = useCallback((text) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    utt.rate = 0.95
    utt.pitch = 1
    synthRef.current.speak(utt)
  }, [lang])

  const processCommand = useCallback((text) => {
    const commands = COMMANDS[lang] || COMMANDS.en
    for (const cmd of commands) {
      const match = text.match(cmd.pattern)
      if (match) {
        if (cmd.action === 'navigate') {
          setResponse(cmd.message)
          speak(cmd.message)
          setTimeout(() => router.push(cmd.target), 600)
          return cmd.message
        }
        if (cmd.action === 'search') {
          const keyword = match[2] || match[1] || ''
          const msg = `${cmd.messagePrefix} ${keyword}`
          setResponse(msg)
          speak(msg)
          // Emit a custom event that marketplace page can listen to
          window.dispatchEvent(new CustomEvent('ks-voice-search', { detail: { keyword } }))
          return msg
        }
        if (cmd.action === 'fillForm') {
          setResponse(cmd.message)
          speak(cmd.message)
          window.dispatchEvent(new CustomEvent('voice-fill-form'))
          return cmd.message
        }
        if (cmd.action === 'submit') {
          setResponse(cmd.message)
          speak(cmd.message)
          window.dispatchEvent(new CustomEvent('voice-submit-form'))
          return cmd.message
        }
        if (cmd.action === 'close') {
          setResponse(cmd.message)
          speak(cmd.message)
          window.dispatchEvent(new CustomEvent('voice-close-modal'))
          return cmd.message
        }
        if (cmd.action === 'recommend') {
          setResponse(cmd.message)
          speak(cmd.message)
          window.dispatchEvent(new CustomEvent('voice-get-recommendations'))
          return cmd.message
        }
        if (cmd.action === 'help') {
          setResponse(cmd.message)
          speak(cmd.message)
          return cmd.message
        }
      }
    }
    const defaultMsg = lang === 'hi' ? `आपने कहा: ${text}` : `I heard: "${text}". Say "help" for commands.`
    setResponse(defaultMsg)
    return defaultMsg
  }, [lang, router, speak])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError(lang === 'hi' ? 'इस ब्राउज़र में वॉइस समर्थित नहीं है' : 'Voice recognition not supported')
      return
    }
    setError('')
    setTranscript('')
    setResponse('')

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = (e) => {
      setIsListening(false)
      if (e.error !== 'no-speech') {
        setError(lang === 'hi' ? 'वॉइस पहचान त्रुटि' : 'Voice recognition error. Please try again.')
      }
    }
    recognition.onresult = (e) => {
      const interim = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('')
      setTranscript(interim)
      if (e.results[e.results.length - 1].isFinal) {
        processCommand(interim.toLowerCase())
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isSupported, lang, processCommand])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) stopListening()
    else startListening()
  }, [isListening, startListening, stopListening])

  return (
    <VoiceContext.Provider value={{
      isListening,
      transcript,
      response,
      isSupported,
      error,
      startListening,
      stopListening,
      toggleListening,
      speak,
    }}>
      {children}
    </VoiceContext.Provider>
  )
}

export const useVoice = () => useContext(VoiceContext)
