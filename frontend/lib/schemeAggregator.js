import axios from 'axios'
import * as cheerio from 'cheerio'

// Comprehensive multi-source scheme aggregator for all artist types
export class SchemeAggregator {
  constructor() {
    this.sources = [
      {
        name: 'Ministry of Culture',
        urls: [
          'https://indiaculture.gov.in/financial-assistance-schemes',
          'https://indiaculture.gov.in/scholarship-schemes',
          'https://indiaculture.gov.in/schemes'
        ],
        category: 'cultural'
      },
      {
        name: 'Development Commissioner Handicrafts',
        urls: [
          'https://handicrafts.nic.in/schemes/',
          'https://handicrafts.nic.in/artisan-credit-card/'
        ],
        category: 'handicraft'
      },
      {
        name: 'Ministry of Textiles',
        urls: [
          'https://texmin.nic.in/schemes/',
          'https://handlooms.nic.in/schemes/'
        ],
        category: 'textile'
      }
    ]
  }

  async aggregateAll() {
    const allSchemes = []
    
    for (const source of this.sources) {
      try {
        const schemes = await this.scrapeSource(source)
        allSchemes.push(...schemes)
      } catch (err) {
        console.error(`Failed to scrape ${source.name}:`, err.message)
      }
    }
    
    // Add comprehensive fallback schemes if scraping yields little
    if (allSchemes.length < 5) {
      allSchemes.push(...this.getComprehensiveFallbackSchemes())
    }
    
    // Normalize all schemes
    return allSchemes.map(scheme => this.normalizeScheme(scheme))
  }

  async scrapeSource(source) {
    const schemes = []
    
    for (const url of source.urls) {
      try {
        const { data } = await axios.get(url, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        const $ = cheerio.load(data)
        const pageSchemes = this.extractSchemesFromPage($, url, source)
        schemes.push(...pageSchemes)
        
      } catch (err) {
        console.error(`Failed to fetch ${url}:`, err.message)
      }
    }
    
    return schemes
  }

  extractSchemesFromPage($, sourceUrl, source) {
    const schemes = []
    
    // Try multiple selector patterns
    const selectors = [
      '.scheme-item',
      '.scheme-card',
      '.views-row',
      '.node-scheme',
      'article',
      '.card',
      '.content-item',
      '.field-item'
    ]
    
    for (const selector of selectors) {
      $(selector).each((i, el) => {
        const $el = $(el)
        
        const title = $el.find('h2, h3, h4, .title, .heading, .field-name-title').first().text().trim()
        const description = $el.find('p, .description, .summary, .field-name-body').first().text().trim()
        let link = $el.find('a').first().attr('href') || ''
        
        if (link && !link.startsWith('http')) {
          const baseUrl = new URL(sourceUrl).origin
          link = `${baseUrl}${link}`
        }
        
        if (title && title.length > 5) {
          schemes.push({
            title,
            description: description.substring(0, 500),
            source: source.name,
            sourceUrl,
            link: link || sourceUrl,
            rawCategory: source.category
          })
        }
      })
      
      if (schemes.length > 0) break
    }
    
    // Fallback: extract from headings
    if (schemes.length === 0) {
      $('h2, h3').each((i, el) => {
        const title = $(el).text().trim()
        const description = $(el).next('p, div').text().trim()
        
        if (title && this.isArtistRelated(title)) {
          schemes.push({
            title,
            description: description.substring(0, 500) || `${source.name} scheme for artists`,
            source: source.name,
            sourceUrl,
            link: sourceUrl,
            rawCategory: source.category
          })
        }
      })
    }
    
    return schemes
  }

  normalizeScheme(raw) {
    const title = raw.title || raw.name || 'Untitled Scheme'
    const description = raw.description || raw.desc || 'Government support scheme'
    
    // Auto-detect category
    const category = this.detectCategory(title, description, raw.rawCategory)
    
    // Auto-detect artist types
    const artistTypes = this.detectArtistTypes(title, description)
    
    // Extract eligibility
    const eligibility = this.extractEligibility(title, description, raw.eligibility)
    
    // Extract benefits
    const benefits = this.extractBenefits(description, raw.benefits)
    
    return {
      id: raw.id || this.generateId(title),
      name: title,
      title: title,
      description,
      ministry: raw.source || raw.ministry || 'Government of India',
      category,
      artistTypes,
      eligibility: Array.isArray(eligibility) ? eligibility : [eligibility],
      benefits: Array.isArray(benefits) ? benefits : [benefits],
      documents: raw.documents || this.getDefaultDocuments(),
      deadline: raw.deadline || 'Check official website',
      link: raw.link || raw.sourceUrl || '#',
      sourceUrl: raw.sourceUrl || raw.link,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  detectCategory(title, description, rawCategory) {
    const text = `${title} ${description}`.toLowerCase()
    
    // Priority order for category detection
    if (text.includes('weaver') || text.includes('weaving') || text.includes('textile') ||
        text.includes('handloom') || text.includes('silk') || text.includes('cotton') ||
        rawCategory === 'textile') {
      return 'Textile Arts'
    }
    
    if (text.includes('handicraft') || text.includes('pottery') || text.includes('woodwork') ||
        text.includes('metalwork') || text.includes('jewelry') || text.includes('bamboo') ||
        text.includes('cane') || text.includes('craft') || rawCategory === 'handicraft') {
      return 'Handicrafts'
    }
    
    if (text.includes('dance') || text.includes('music') || text.includes('theatre') ||
        text.includes('drama') || text.includes('folk') || text.includes('classical') ||
        text.includes('performing')) {
      return 'Performing Arts'
    }
    
    if (text.includes('paint') || text.includes('sculpture') || text.includes('visual') ||
        text.includes('art ') || text.includes('artist')) {
      return 'Visual Arts'
    }
    
    return 'General Arts'
  }

  detectArtistTypes(title, description) {
    const text = `${title} ${description}`.toLowerCase()
    const types = []
    
    const mappings = {
      'performing': ['dancer', 'musician', 'singer', 'actor', 'theatre artist', 'folk artist'],
      'visual': ['painter', 'sculptor', 'artist', 'photographer'],
      'textile': ['weaver', 'textile artist', 'handloom worker', 'dyer'],
      'handicraft': ['potter', 'woodworker', 'metalworker', 'jewelry maker', 'bamboo worker'],
      'literary': ['writer', 'poet', 'author'],
      'digital': ['digital artist', 'animator', 'game designer']
    }
    
    for (const [category, keywords] of Object.entries(mappings)) {
      if (keywords.some(kw => text.includes(kw))) {
        types.push(category)
      }
    }
    
    return types.length > 0 ? types : ['all']
  }

  extractEligibility(title, description, rawEligibility) {
    const text = `${title} ${description}`.toLowerCase()
    
    if (rawEligibility && Array.isArray(rawEligibility)) {
      return rawEligibility
    }
    
    const eligibility = []
    
    // Age-based
    if (text.includes('veteran') || text.includes('senior') || text.includes('pension')) {
      eligibility.push('Senior Artists (60+ years)')
    }
    if (text.includes('young') || text.includes('youth') || text.includes('scholarship')) {
      eligibility.push('Young Artists (18-30 years)')
    }
    if (text.includes('student')) {
      eligibility.push('Art Students')
    }
    
    // Category-based
    if (text.includes('sc/st') || text.includes('scheduled caste')) {
      eligibility.push('SC/ST Artists')
    }
    if (text.includes('obc')) {
      eligibility.push('OBC Artists')
    }
    if (text.includes('women') || text.includes('woman')) {
      eligibility.push('Women Artists')
    }
    
    // Organization-based
    if (text.includes('institution') || text.includes('organization') || text.includes('group')) {
      eligibility.push('Cultural Organizations')
    } else {
      eligibility.push('Individual Artists')
    }
    
    return eligibility.length > 0 ? eligibility : ['All Artists']
  }

  extractBenefits(description, rawBenefits) {
    if (rawBenefits && Array.isArray(rawBenefits)) {
      return rawBenefits
    }
    
    const text = (description || '').toLowerCase()
    const benefits = []
    
    // Extract monetary values
    const moneyMatch = text.match(/(rs\.?\s*[\d,]+|inr\s*[\d,]+|[\d,]+\s*(rupees?|lakhs?|crores?))/gi)
    if (moneyMatch) {
      benefits.push(`Financial support: ${moneyMatch[0]}`)
    }
    
    if (text.includes('scholarship')) benefits.push('Monthly scholarship/stipend')
    if (text.includes('pension')) benefits.push('Monthly pension')
    if (text.includes('grant')) benefits.push('One-time grant')
    if (text.includes('award')) benefits.push('Recognition and award')
    if (text.includes('training')) benefits.push('Training and skill development')
    if (text.includes('exhibition')) benefits.push('Exhibition/showcase opportunities')
    if (text.includes('marketing')) benefits.push('Marketing and promotion support')
    if (text.includes('material')) benefits.push('Material/tool support')
    if (text.includes('insurance')) benefits.push('Insurance coverage')
    if (text.includes('credit')) benefits.push('Credit/loan facility')
    
    return benefits.length > 0 ? benefits : ['Financial assistance for artists']
  }

  isArtistRelated(text) {
    const keywords = [
      'artist', 'artisan', 'craftsman', 'weaver', 'culture', 'heritage',
      'scholarship', 'financial assistance', 'grant', 'pension', 'award',
      'handicraft', 'handloom', 'textile', 'performing', 'visual',
      'music', 'dance', 'theatre', 'folk', 'traditional', 'tribal'
    ]
    return keywords.some(kw => text.toLowerCase().includes(kw))
  }

  generateId(title) {
    return 'scheme-' + title.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50) + '-' + Date.now().toString(36)
  }

  getDefaultDocuments() {
    return [
      'Identity Proof (Aadhaar/PAN)',
      'Address Proof',
      'Artist Certificate/Portfolio',
      'Income Certificate (if applicable)',
      'Bank Account Details',
      'Passport Size Photographs'
    ]
  }

  getComprehensiveFallbackSchemes() {
    return [
      // Performing Arts
      {
        title: 'Financial Assistance to Veteran Artists',
        description: 'Monthly pension to senior artists above 60 years who have contributed significantly to performing arts but are in indigent circumstances.',
        source: 'Ministry of Culture',
        rawCategory: 'cultural',
        eligibility: ['Senior Artists 60+', 'Performing Artists', 'Indigent Artists'],
        benefits: ['Monthly pension Rs. 4,000', 'Medical benefits', 'Recognition']
      },
      {
        title: 'Scholarship to Young Artists',
        description: 'Scholarships for young artists (18-25 years) in performing arts to pursue advanced training under renowned experts.',
        source: 'Ministry of Culture',
        rawCategory: 'cultural',
        eligibility: ['Young Artists 18-25', 'Performing Artists', 'Basic Training Completed'],
        benefits: ['Monthly stipend Rs. 5,000', 'Guru fees', 'Material allowance']
      },
      {
        title: 'Scheme for Guru Shishya Parampara',
        description: 'Support for traditional master-disciple training in classical performing arts.',
        source: 'Ministry of Culture',
        rawCategory: 'cultural',
        eligibility: ['Gurus (Masters)', 'Disciples (Shishyas)', 'Classical Arts'],
        benefits: ['Honorarium to Guru', 'Scholarship to Shishya', 'Documentation support']
      },
      
      // Textile Arts
      {
        title: 'National Handloom Development Programme',
        description: 'Comprehensive support for handloom weavers including credit, marketing, and design inputs.',
        source: 'Ministry of Textiles',
        rawCategory: 'textile',
        eligibility: ['Handloom Weavers', 'Weaver Cooperative Societies', 'Individual Weavers'],
        benefits: ['Interest subsidy', 'Access to raw materials', 'Marketing support', 'Design inputs']
      },
      {
        title: 'Comprehensive Handicrafts Cluster Development Scheme',
        description: 'Integrated development of handicraft clusters for sustainable employment and income.',
        source: 'Development Commissioner Handicrafts',
        rawCategory: 'handicraft',
        eligibility: ['Handicraft Artisans', 'Craft Clusters', 'Cooperatives'],
        benefits: ['Common facility center', 'Design development', 'Skill training', 'Marketing support']
      },
      {
        title: 'Artisan Credit Card Scheme',
        description: 'Credit facility for artisans with relaxed collateral requirements.',
        source: 'Development Commissioner Handicrafts',
        rawCategory: 'handicraft',
        eligibility: ['Registered Artisans', 'Individual Craftsmen', 'Self-help Groups'],
        benefits: ['Credit up to Rs. 2 lakhs', 'Flexible repayment', 'Low interest rates']
      },
      
      // Visual Arts
      {
        title: 'Fellowship for Outstanding Artists',
        description: 'Fellowship for mid-career visual artists to create new work.',
        source: 'Ministry of Culture',
        rawCategory: 'cultural',
        eligibility: ['Visual Artists', 'Mid-career (35-50 years)', 'Outstanding Portfolio'],
        benefits: ['Fellowship Rs. 20,000/month', 'One year duration', 'Exhibition opportunity']
      },
      {
        title: 'Award for Young Talented Artists',
        description: 'Recognition and award for emerging artists with exceptional talent.',
        source: 'Ministry of Culture',
        rawCategory: 'cultural',
        eligibility: ['Young Artists under 35', 'Exceptional Talent', 'Innovative Work'],
        benefits: ['Cash award Rs. 50,000', 'Certificate', 'National recognition']
      },
      
      // General Support
      {
        title: 'Cultural Function Grant Scheme',
        description: 'Financial assistance for organizing cultural programs and festivals.',
        source: 'Ministry of Culture',
        rawCategory: 'cultural',
        eligibility: ['Cultural Organizations', 'NGOs', 'Educational Institutions'],
        benefits: ['Grant up to Rs. 5 lakhs', 'Promotional support', 'Venue support']
      },
      {
        title: 'e-Shram Portal Registration Benefits',
        description: 'Registration for unorganized workers including artisans for social security benefits.',
        source: 'Ministry of Labour',
        rawCategory: 'general',
        eligibility: ['Unorganized Workers', 'Artisans', 'Age 16-59'],
        benefits: ['Accident insurance', 'Social security benefits', 'Government scheme access']
      }
    ]
  }
}

// Export singleton instance
export const schemeAggregator = new SchemeAggregator()

// Convenience function
export async function aggregateAllSchemes() {
  return schemeAggregator.aggregateAll()
}
