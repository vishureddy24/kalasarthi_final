// AI Auto-Fill for Scheme Application Forms
// Uses OpenAI GPT-4o-mini to pre-fill form fields based on user profile and scheme details
// Migrated from Gemini for better JSON reliability

import { openai, safeParseJSON, DEFAULT_MODEL, TEMPERATURE } from './openai'

export async function autoFillSchemeForm(profile, scheme) {
  try {
    // Prepare user context
    const userContext = {
      name: profile?.displayName || profile?.name || 'Artisan',
      role: profile?.role || 'artisan',
      location: profile?.location || 'India',
      category: profile?.category || profile?.craftType || 'Handicrafts',
      yearsInBusiness: profile?.yearsInBusiness || profile?.experience || '2-3 years',
      businessSize: profile?.businessSize || 'Small Scale',
      annualTurnover: profile?.annualTurnover || '₹1-5 Lakhs',
      employees: profile?.employees || '1-5 workers',
      email: profile?.email || '',
      phone: profile?.phone || '',
      bio: profile?.bio || ''
    }

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant helping Indian artisans fill government scheme application forms. Always return valid JSON.'
        },
        {
          role: 'user',
          content: `USER PROFILE:
- Name: ${userContext.name}
- Role: ${userContext.role}
- Craft/Category: ${userContext.category}
- Location: ${userContext.location}
- Years in Business: ${userContext.yearsInBusiness}
- Business Size: ${userContext.businessSize}
- Annual Turnover: ${userContext.annualTurnover}
- Employees: ${userContext.employees}
- Bio/Description: ${userContext.bio}

SCHEME DETAILS:
- Name: ${scheme?.name || 'Government Scheme'}
- Ministry: ${scheme?.ministry || 'Ministry of MSME'}
- Description: ${scheme?.description || 'Financial assistance for artisans'}
- Benefits: ${scheme?.benefits || 'Financial support and resources'}
- Eligibility: ${Array.isArray(scheme?.eligibility) ? scheme.eligibility.join(', ') : scheme?.eligibility || 'Artisans'}

TASK:
Generate realistic, personalized form data for this scheme application. The data should be:
1. Consistent with the user's profile
2. Relevant to the specific scheme
3. Professional and complete
4. Realistic for an Indian artisan

Return ONLY a valid JSON object with these exact fields (no markdown, no code blocks):
{
  "businessName": "Realistic business name based on craft",
  "yearsInBusiness": "Number or range",
  "annualTurnover": "Amount in INR",
  "employees": "Number of workers",
  "description": "Detailed business description (3-4 sentences)",
  "reasonForApplying": "Why this scheme is important (2-3 sentences)",
  "howSchemeHelps": "Expected benefits from this scheme (2-3 sentences)"
}

IMPORTANT:
- Return ONLY the JSON object, nothing else
- Do not wrap in markdown code blocks
- Ensure valid JSON format with double quotes
- Make content realistic and professional
- Write in English but context should be Indian artisan`
        }
      ],
      temperature: TEMPERATURE.BALANCED
    })

    const text = response.choices[0].message.content
    const formData = safeParseJSON(text, {})

    // Validate and ensure all fields exist
    return {
      businessName: formData.businessName || `${userContext.name}'s ${userContext.category} Works`,
      yearsInBusiness: formData.yearsInBusiness || userContext.yearsInBusiness,
      annualTurnover: formData.annualTurnover || userContext.annualTurnover,
      employees: formData.employees || userContext.employees,
      description: formData.description || `Traditional ${userContext.category.toLowerCase()} business in ${userContext.location}.`,
      reasonForApplying: formData.reasonForApplying || `To grow my business with ${scheme?.name || 'this scheme'}.`,
      howSchemeHelps: formData.howSchemeHelps || `Will help with ${scheme?.benefits || 'financial support'}.`
    }

  } catch (error) {
    console.error('OpenAI auto-fill error:', error)
    // Return fallback data
    return {
      businessName: `${profile?.displayName || 'My'} Handicrafts`,
      yearsInBusiness: profile?.yearsInBusiness || '2-3 years',
      annualTurnover: profile?.annualTurnover || '₹2-4 Lakhs',
      employees: profile?.employees || '1-3 workers',
      description: `Traditional handicraft business specializing in handmade products using traditional techniques.`,
      reasonForApplying: `To expand business operations and reach more customers.`,
      howSchemeHelps: `Will provide necessary financial support and resources.`
    }
  }
}

// Helper function to validate if auto-fill data is complete
export function validateAutoFillData(data) {
  const required = ['businessName', 'yearsInBusiness', 'annualTurnover', 'employees', 'description', 'reasonForApplying']
  const missing = required.filter(field => !data[field] || data[field].trim() === '')
  
  return {
    isValid: missing.length === 0,
    missing,
    filled: required.filter(field => data[field] && data[field].trim() !== '')
  }
}
