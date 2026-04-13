// AI Document Parser using OpenAI GPT-4o-mini
// Converts raw OCR text into structured form data
// Migrated from Gemini for better JSON reliability

import { openai, safeParseJSON, DEFAULT_MODEL, TEMPERATURE } from './openai'

export async function parseDocumentWithAI(ocrText, documentType = 'aadhaar') {
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert document parser. Extract structured information from ${documentType} documents. Always return valid JSON.`
        },
        {
          role: 'user',
          content: `Extract structured data from this ${documentType.toUpperCase()} document OCR text.

RAW OCR TEXT:
"""
${ocrText}
"""

TASK:
Extract and return a JSON object with these fields. If a field is not found, use empty string or reasonable default:

{
  "fullName": "Extracted full name (clean up formatting)",
  "dateOfBirth": "DD/MM/YYYY format if found, else empty",
  "gender": "Male/Female/Other if found, else empty",
  "address": "Full address as single string if found, else empty",
  "phoneNumber": "Mobile number if found, else empty",
  "email": "Email if found, else empty",
  "aadhaarNumber": "Last 4 digits only if Aadhaar, masked as XXXX-XXXX-${last4}",
  "documentType": "${documentType}",
  "extractedFields": ["list of fields successfully extracted"],
  "confidence": "high/medium/low based on data clarity"
}

IMPORTANT:
- Return ONLY valid JSON, no markdown, no code blocks
- Clean up extracted names (proper case, remove extra spaces)
- Standardize dates to DD/MM/YYYY format
- Combine multi-line addresses into single string
- Remove any sensitive numbers except last 4 digits
- If OCR text is garbled, return best effort with low confidence`
        }
      ],
      temperature: TEMPERATURE.PRECISE
    })

    const text = response.choices[0].message.content
    const parsedData = safeParseJSON(text, {})

    return {
      ...parsedData,
      rawText: ocrText.substring(0, 500)
    }

  } catch (error) {
    console.error('OpenAI document parsing error:', error)
    return extractFallbackData(ocrText)
  }
}

// Fallback extraction when AI fails
function extractFallbackData(ocrText) {
  const data = {
    fullName: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    phoneNumber: '',
    email: '',
    aadhaarNumber: '',
    documentType: 'unknown',
    extractedFields: [],
    confidence: 'low'
  }

  // Simple regex patterns as fallback
  const nameMatch = ocrText.match(/name[:\s]+([A-Za-z\s]+)/i)
  if (nameMatch) {
    data.fullName = nameMatch[1].trim().replace(/\s+/g, ' ')
    data.extractedFields.push('fullName')
  }

  const dobMatch = ocrText.match(/(?:dob|date of birth)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
  if (dobMatch) {
    data.dateOfBirth = dobMatch[1]
    data.extractedFields.push('dateOfBirth')
  }

  const genderMatch = ocrText.match(/(?:gender|sex)[:\s]+(male|female|other)/i)
  if (genderMatch) {
    data.gender = genderMatch[1].charAt(0).toUpperCase() + genderMatch[1].slice(1).toLowerCase()
    data.extractedFields.push('gender')
  }

  const addressMatch = ocrText.match(/address[:\s]+([\s\S]{20,200}?)(?=\n\n|\n[A-Z]|$)/i)
  if (addressMatch) {
    data.address = addressMatch[1].replace(/\n/g, ', ').trim()
    data.extractedFields.push('address')
  }

  const phoneMatch = ocrText.match(/(?:mobile|phone|contact)[:\s]*(\+?\d[\d\s-]{8,})/i)
  if (phoneMatch) {
    data.phoneNumber = phoneMatch[1].replace(/\s/g, '')
    data.extractedFields.push('phoneNumber')
  }

  const emailMatch = ocrText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/)
  if (emailMatch) {
    data.email = emailMatch[1]
    data.extractedFields.push('email')
  }

  if (data.extractedFields.length >= 3) {
    data.confidence = 'medium'
  }

  return data
}

// Convert extracted document data to form fields
export function mapDocumentToFormFields(docData) {
  return {
    fullName: docData.fullName || '',
    name: docData.fullName || '',
    dateOfBirth: docData.dateOfBirth || '',
    dob: docData.dateOfBirth || '',
    gender: docData.gender || '',
    address: docData.address || '',
    location: docData.address || '',
    phone: docData.phoneNumber || '',
    mobile: docData.phoneNumber || '',
    email: docData.email || '',
    aadhaarNumber: docData.aadhaarNumber || ''
  }
}
