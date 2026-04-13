import axios from 'axios'
import * as cheerio from 'cheerio'

const MINISTRY_URLS = [
  {
    url: 'https://indiaculture.gov.in/financial-assistance-schemes',
    category: 'financial-assistance',
    source: 'Ministry of Culture'
  },
  {
    url: 'https://indiaculture.gov.in/schemes',
    category: 'general',
    source: 'Ministry of Culture'
  },
  {
    url: 'https://indiaculture.gov.in/scholarship-schemes',
    category: 'scholarship',
    source: 'Ministry of Culture'
  }
]

export async function fetchCultureSchemes() {
  const allSchemes = []
  
  for (const { url, category, source } of MINISTRY_URLS) {
    try {
      const { data } = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      const $ = cheerio.load(data)
      const schemes = extractSchemes($, url, category, source)
      allSchemes.push(...schemes)
      
    } catch (err) {
      console.error(`Failed to fetch from ${url}:`, err.message)
    }
  }
  
  return allSchemes
}

function extractSchemes($, sourceUrl, category, source) {
  const schemes = []
  
  // Try different selectors for scheme content
  const selectors = [
    '.scheme-item',
    '.scheme-card',
    '.scheme-box',
    '.content-item',
    '.view-content .views-row',
    '.node-scheme',
    '.field-item',
    'article',
    '.card'
  ]
  
  for (const selector of selectors) {
    $(selector).each((i, el) => {
      const $el = $(el)
      
      // Extract title
      const title = $el.find('h2, h3, h4, .title, .heading').first().text().trim()
      
      // Extract description
      const description = $el.find('p, .description, .summary, .content').first().text().trim()
      
      // Extract link
      let link = $el.find('a').first().attr('href') || ''
      if (link && !link.startsWith('http')) {
        link = `https://indiaculture.gov.in${link}`
      }
      
      // Only add if we have meaningful content
      if (title && title.length > 10 && 
          (isArtistRelated(title) || isArtistRelated(description))) {
        schemes.push({
          id: `moc-${category}-${i}`,
          name: title,
          description: description.substring(0, 500),
          ministry: source,
          category: mapCategory(category),
          eligibility: extractEligibility(title, description),
          benefits: extractBenefits(description),
          documents: ['Identity Proof', 'Address Proof', 'Artist Certificate', 'Bank Details'],
          deadline: extractDeadline(description),
          link: link || sourceUrl,
          sourceUrl,
          isActive: true,
          scrapedAt: new Date().toISOString()
        })
      }
    })
    
    if (schemes.length > 0) break
  }
  
  // Fallback: extract from page headings if no scheme containers found
  if (schemes.length === 0) {
    $('h2, h3').each((i, el) => {
      const title = $(el).text().trim()
      const description = $(el).next('p, div').text().trim()
      
      if (title && isArtistRelated(title)) {
        schemes.push({
          id: `moc-${category}-${i}`,
          name: title,
          description: description.substring(0, 500) || 'Scheme details available on official website',
          ministry: source,
          category: mapCategory(category),
          eligibility: extractEligibility(title, description),
          benefits: extractBenefits(description),
          documents: ['Identity Proof', 'Address Proof', 'Artist Certificate', 'Bank Details'],
          deadline: extractDeadline(description),
          link: sourceUrl,
          sourceUrl,
          isActive: true,
          scrapedAt: new Date().toISOString()
        })
      }
    })
  }
  
  return schemes
}

function isArtistRelated(text) {
  if (!text) return false
  const keywords = [
    'artist', 'artisan', 'craftsman', 'culture', 'heritage', 'scholarship',
    'financial assistance', 'grant', 'fellowship', 'award', 'pension',
    'handicraft', 'handloom', 'weaver', 'potter', 'sculptor', 'painter',
    'musician', 'dancer', 'theatre', 'folk', 'traditional', 'tribal'
  ]
  
  const lowerText = text.toLowerCase()
  return keywords.some(kw => lowerText.includes(kw))
}

function mapCategory(category) {
  const mapping = {
    'financial-assistance': 'Financial Support',
    'scholarship': 'Education & Training',
    'general': 'General Welfare'
  }
  return mapping[category] || 'General Welfare'
}

function extractEligibility(title, description) {
  const text = `${title} ${description}`.toLowerCase()
  
  if (text.includes('veteran') || text.includes('senior') || text.includes('elder')) {
    return ['Senior Artists', 'Veteran Artists', 'Elderly Artists']
  }
  if (text.includes('young') || text.includes('student') || text.includes('scholarship')) {
    return ['Young Artists', 'Students', 'Aspiring Artists']
  }
  if (text.includes('group') || text.includes('institution') || text.includes('organization')) {
    return ['Cultural Organizations', 'Art Groups', 'Institutions']
  }
  
  return ['Individual Artists', 'Artisans', 'Craftsmen']
}

function extractBenefits(description) {
  const benefits = []
  const text = description.toLowerCase()
  
  // Try to extract monetary amounts
  const moneyMatch = text.match(/(Rs\.?\s*[\d,]+|INR\s*[\d,]+|[\d,]+\s*rupees?)/gi)
  if (moneyMatch) {
    benefits.push(`Financial assistance: ${moneyMatch[0]}`)
  }
  
  if (text.includes('scholarship')) benefits.push('Monthly scholarship stipend')
  if (text.includes('pension')) benefits.push('Monthly pension')
  if (text.includes('grant')) benefits.push('One-time grant')
  if (text.includes('award')) benefits.push('Recognition and award money')
  if (text.includes('training')) benefits.push('Training and skill development')
  if (text.includes('exhibition')) benefits.push('Exhibition opportunities')
  if (text.includes('material')) benefits.push('Material support')
  
  if (benefits.length === 0) {
    benefits.push('Financial assistance for artists')
  }
  
  return benefits
}

function extractDeadline(description) {
  const text = description.toLowerCase()
  
  // Look for date patterns
  const dateMatch = text.match(/(before|by|until|deadline).*?(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4})/i)
  if (dateMatch) {
    return dateMatch[0]
  }
  
  if (text.includes('year round') || text.includes('ongoing')) {
    return 'Open year-round'
  }
  
  return 'Check official website for deadlines'
}

// Fallback schemes if scraping fails
export function getFallbackSchemes() {
  return [
    {
      id: 'moc-veteran-artists-1',
      name: 'Financial Assistance to Veteran Artists',
      description: 'Monthly financial assistance to senior artists who have contributed significantly to cultural fields but are in indigent circumstances.',
      ministry: 'Ministry of Culture',
      category: 'Financial Support',
      eligibility: ['Senior Artists', 'Veteran Artists', 'Above 60 years'],
      benefits: ['Monthly pension of Rs. 4,000', 'Medical assistance', 'Recognition'],
      documents: ['Age Proof', 'Artist Certificate', 'Income Certificate', 'Bank Details', 'Work Portfolio'],
      deadline: 'Open year-round',
      link: 'https://indiaculture.gov.in/financial-assistance-schemes',
      isActive: true
    },
    {
      id: 'moc-young-artists-1',
      name: 'Scholarship to Young Artists',
      description: 'Scholarships for young artists to pursue advanced training in cultural fields under renowned experts.',
      ministry: 'Ministry of Culture',
      category: 'Education & Training',
      eligibility: ['Young Artists', 'Age 18-25', 'Basic Training Completed'],
      benefits: ['Rs. 5,000 per month', 'Guru fees covered', 'Material allowance'],
      documents: ['Age Proof', 'Training Certificates', 'Guru Recommendation', 'Work Samples', 'Bank Details'],
      deadline: 'Annual - Check website',
      link: 'https://indiaculture.gov.in/scholarship-schemes',
      isActive: true
    },
    {
      id: 'moc-culture-function-1',
      name: 'Cultural Function Grant Scheme',
      description: 'Financial assistance for organizing cultural events, festivals, and programs promoting Indian culture.',
      ministry: 'Ministry of Culture',
      category: 'General Welfare',
      eligibility: ['Cultural Organizations', 'NGOs', 'Art Groups'],
      benefits: ['Project-based funding', 'Up to Rs. 5 lakhs', 'Promotional support'],
      documents: ['Organization Registration', 'Project Proposal', 'Budget Plan', 'Previous Work Proof', 'Bank Details'],
      deadline: 'Quarterly applications',
      link: 'https://indiaculture.gov.in/schemes',
      isActive: true
    }
  ]
}
