// AI Scheme Recommender using OpenAI GPT-4o-mini
// This utility recommends schemes based on user profile and available schemes
// Migrated from Gemini for better JSON reliability and reasoning

import { openai, safeParseJSON, DEFAULT_MODEL, TEMPERATURE } from './openai'

export async function recommendSchemes(profile, schemes) {
  try {
    // Filter schemes by eligibility first (reduce tokens and improve relevance)
    const role = profile?.role || 'artisan'
    const eligibleSchemes = schemes.filter(s => {
      if (!s.eligibility || s.eligibility.length === 0) return true
      if (Array.isArray(s.eligibility)) {
        return s.eligibility.includes(role) || s.eligibility.includes('all')
      }
      return true
    })

    // Prepare user context
    const userContext = {
      role: profile?.role || 'artisan',
      displayName: profile?.displayName || 'Artisan',
      location: profile?.location || 'India',
      category: profile?.category || profile?.craftType || 'Handicrafts',
      yearsInBusiness: profile?.yearsInBusiness || 'Not specified',
      businessSize: profile?.businessSize || 'Small',
      annualTurnover: profile?.annualTurnover || 'Not specified'
    }

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert advisor for Indian government schemes helping artisans find the best welfare schemes. Always return valid JSON.'
        },
        {
          role: 'user',
          content: `USER PROFILE:
- Name: ${userContext.displayName}
- Role: ${userContext.role}
- Craft/Category: ${userContext.category}
- Location: ${userContext.location}
- Years in Business: ${userContext.yearsInBusiness}
- Business Size: ${userContext.businessSize}
- Annual Turnover: ${userContext.annualTurnover}

AVAILABLE SCHEMES (${eligibleSchemes.length} schemes):
${JSON.stringify(eligibleSchemes.map(s => ({
  id: s.id,
  name: s.name,
  ministry: s.ministry,
  description: s.description,
  benefits: s.benefits,
  eligibility: s.eligibility,
  documents: s.documents
})), null, 2)}

TASK:
Analyze the user's profile and recommend the TOP 3 most suitable schemes. For each recommendation:
1. Consider eligibility match
2. Consider relevance to their craft/business
3. Consider benefit value vs their profile
4. Provide a personalized reason WHY this scheme fits them

Return ONLY a valid JSON array in this exact format (no markdown, no code blocks):
[
  {
    "schemeId": "id from the scheme",
    "name": "Scheme Name",
    "reason": "Personalized explanation of why this fits the user (2-3 sentences)",
    "matchScore": 95,
    "keyBenefit": "Main benefit they'll get"
  }
]

IMPORTANT: 
- Return ONLY the JSON array, nothing else
- Do not wrap in markdown code blocks
- Ensure valid JSON format
- Include schemeId from the input schemes
- matchScore should be 70-100 based on fit`
        }
      ],
      temperature: TEMPERATURE.BALANCED
    })

    const text = response.choices[0].message.content
    const recommendations = safeParseJSON(text, [])

    // Validate and enhance recommendations with full scheme data
    return recommendations.map(rec => {
      const fullScheme = schemes.find(s => s.id === rec.schemeId || s.name === rec.name)
      return {
        ...rec,
        schemeId: rec.schemeId || fullScheme?.id,
        scheme: fullScheme || null,
        matchScore: Math.min(100, Math.max(70, rec.matchScore || 85))
      }
    }).filter(r => r.scheme !== null).slice(0, 3)

  } catch (error) {
    console.error('OpenAI scheme recommender error:', error)
    // Return fallback recommendations
    return schemes.slice(0, 3).map((s, i) => ({
      schemeId: s.id,
      name: s.name,
      reason: `Popular scheme for ${profile?.role || 'artisan'}s providing ${s.benefits || 'government support'}.`,
      matchScore: 80 - (i * 5),
      keyBenefit: s.benefits || 'Financial assistance',
      scheme: s
    }))
  }
}
