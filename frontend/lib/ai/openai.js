import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Helper to clean JSON responses from markdown code blocks
export function cleanJSON(text) {
  return text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim()
}

// Safe JSON parser with fallback
export function safeParseJSON(text, fallback = {}) {
  try {
    const cleaned = cleanJSON(text)
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('JSON parse error:', error)
    console.log('Raw text:', text)
    return fallback
  }
}

// Default model for all operations
export const DEFAULT_MODEL = 'gpt-4o-mini'

// Temperature settings for different use cases
export const TEMPERATURE = {
  PRECISE: 0,      // For structured data extraction
  BALANCED: 0.3,   // For recommendations
  CREATIVE: 0.7,   // For creative content
}
