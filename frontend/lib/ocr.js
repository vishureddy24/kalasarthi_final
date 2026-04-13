// OCR Utility using Tesseract.js
// Extracts text from uploaded images (Aadhaar, documents, etc.)

import Tesseract from 'tesseract.js'

export async function extractTextFromImage(imageBuffer) {
  try {
    const result = await Tesseract.recognize(
      imageBuffer,
      'eng+hin', // Support both English and Hindi
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${(m.progress * 100).toFixed(1)}%`)
          }
        }
      }
    )

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words
    }
  } catch (error) {
    console.error('OCR extraction error:', error)
    throw new Error('Failed to extract text from image')
  }
}

// Helper to validate if image is suitable for OCR
export function validateImageForOCR(file) {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']

  if (file.size > maxSize) {
    return { valid: false, error: 'Image too large. Max 10MB.' }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Use JPG or PNG.' }
  }

  return { valid: true }
}

// Clean OCR text (remove extra spaces, fix common OCR errors)
export function cleanOCRText(text) {
  return text
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/\n+/g, '\n') // Multiple newlines to single
    .replace(/[|]/g, 'I') // Common OCR error: pipe to I
    .replace(/[0]/g, 'O') // Sometimes 0 is read as O in names
    .trim()
}
