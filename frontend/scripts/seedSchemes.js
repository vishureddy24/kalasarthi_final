const { MongoClient } = require('mongodb')

// MongoDB connection string - update this if needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kalasarthi'

// Comprehensive scheme data for all artist types
const schemes = [
  {
    id: 'scheme-veteran-artist-pension',
    name: 'Financial Assistance to Veteran Artists',
    title: 'Financial Assistance to Veteran Artists',
    description: 'Monthly pension to senior artists above 60 years who have contributed significantly to performing arts but are in indigent circumstances.',
    ministry: 'Ministry of Culture',
    category: 'Performing Arts',
    artistTypes: ['performing', 'dancer', 'musician', 'singer', 'actor', 'theatre artist'],
    eligibility: ['Senior Artists 60+ years', 'Performing Artists', 'Indigent circumstances', 'artisan'],
    benefits: ['Monthly pension Rs. 4,000', 'Medical benefits', 'National recognition'],
    documents: ['Age proof', 'Identity proof', 'Artist certificate', 'Bank account details', 'Income proof'],
    deadline: 'Rolling applications',
    link: 'https://indiaculture.gov.in/financial-assistance-schemes',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'scheme-young-artist-scholarship',
    name: 'Scholarship to Young Artists',
    title: 'Scholarship to Young Artists',
    description: 'Scholarships for young artists (18-25 years) in performing arts to pursue advanced training under renowned experts.',
    ministry: 'Ministry of Culture',
    category: 'Performing Arts',
    artistTypes: ['performing', 'dancer', 'musician', 'singer', 'young artist'],
    eligibility: ['Young Artists 18-25 years', 'Basic training completed', 'Performing arts background', 'artisan'],
    benefits: ['Monthly stipend Rs. 5,000', 'Guru fees covered', 'Material allowance', 'Training support'],
    documents: ['Age proof', 'Training certificates', 'Guru recommendation', 'Bank account details', 'Portfolio'],
    deadline: 'Annual - March 31',
    link: 'https://indiaculture.gov.in/scholarship-schemes',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'scheme-guru-shishya-parampara',
    name: 'Scheme for Guru Shishya Parampara',
    title: 'Scheme for Guru Shishya Parampara',
    description: 'Support for traditional master-disciple training in classical performing arts to preserve ancient traditions.',
    ministry: 'Ministry of Culture',
    category: 'Performing Arts',
    artistTypes: ['performing', 'classical dancer', 'classical musician', 'folk artist'],
    eligibility: ['Gurus (Masters)', 'Disciples (Shishyas)', 'Classical arts practitioners', 'artisan'],
    benefits: ['Honorarium to Guru Rs. 10,000/month', 'Scholarship to Shishya', 'Documentation support', 'Performance opportunities'],
    documents: ['Guru credentials', 'Shishya details', 'Training plan', 'Bank account details'],
    deadline: 'Rolling applications',
    link: 'https://indiaculture.gov.in/schemes',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'scheme-national-handloom',
    name: 'National Handloom Development Programme',
    title: 'National Handloom Development Programme',
    description: 'Comprehensive support for handloom weavers including credit, marketing, and design inputs to enhance productivity and income.',
    ministry: 'Ministry of Textiles',
    category: 'Textile Arts',
    artistTypes: ['textile', 'weaver', 'handloom worker', 'textile artist'],
    eligibility: ['Handloom weavers', 'Weaver cooperative societies', 'Individual weavers', 'artisan'],
    benefits: ['Interest subsidy', 'Access to raw materials', 'Marketing support', 'Design inputs', 'Technology upgrades'],
    documents: ['Weaver ID card', 'Bank account details', 'Loom ownership proof', 'Cooperative membership'],
    deadline: 'Year-round',
    link: 'https://handlooms.nic.in/schemes/',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'scheme-handicrafts-cluster',
    name: 'Comprehensive Handicrafts Cluster Development',
    title: 'Comprehensive Handicrafts Cluster Development',
    description: 'Integrated development of handicraft clusters for sustainable employment and income generation for artisans.',
    ministry: 'Development Commissioner Handicrafts',
    category: 'Handicrafts',
    artistTypes: ['handicraft', 'potter', 'woodworker', 'metalworker', 'jewelry maker'],
    eligibility: ['Handicraft artisans', 'Craft clusters', 'Cooperatives', 'Self-help groups', 'artisan'],
    benefits: ['Common facility center', 'Design development', 'Skill training', 'Marketing support', 'Tool kits'],
    documents: ['Artisan ID card', 'Cluster registration', 'Bank account details', 'Product samples'],
    deadline: 'Project-based',
    link: 'https://handicrafts.nic.in/schemes/',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'scheme-artisan-credit-card',
    name: 'Artisan Credit Card Scheme',
    title: 'Artisan Credit Card Scheme',
    description: 'Credit facility for artisans with relaxed collateral requirements to meet working capital needs.',
    ministry: 'Development Commissioner Handicrafts',
    category: 'Handicrafts',
    artistTypes: ['handicraft', 'artisan', 'craftsman', 'potter', 'weaver'],
    eligibility: ['Registered artisans', 'Individual craftsmen', 'Self-help groups', 'artisan'],
    benefits: ['Credit up to Rs. 2 lakhs', 'Flexible repayment', 'Low interest rates', 'Quick processing'],
    documents: ['Artisan registration', 'Identity proof', 'Bank account details', 'Income proof'],
    deadline: 'Year-round',
    link: 'https://handicrafts.nic.in/artisan-credit-card/',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'scheme-visual-arts-fellowship',
    name: 'Fellowship for Outstanding Artists',
    title: 'Fellowship for Outstanding Artists',
    description: 'Fellowship for mid-career visual artists to create new work and contribute to contemporary art practice.',
    ministry: 'Ministry of Culture',
    category: 'Visual Arts',
    artistTypes: ['visual', 'painter', 'sculptor', 'artist', 'photographer'],
    eligibility: ['Visual Artists', 'Mid-career (35-50 years)', 'Outstanding portfolio', 'artisan'],
    benefits: ['Fellowship Rs. 20,000/month', 'One year duration', 'Exhibition opportunity', 'Material support'],
    documents: ['Portfolio', 'CV', 'Exhibition history', 'Bank account details', 'Reference letters'],
    deadline: 'Annual - September 30',
    link: 'https://indiaculture.gov.in/schemes',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'scheme-young-talented-award',
    name: 'Award for Young Talented Artists',
    title: 'Award for Young Talented Artists',
    description: 'Recognition and award for emerging artists with exceptional talent in visual arts.',
    ministry: 'Ministry of Culture',
    category: 'Visual Arts',
    artistTypes: ['visual', 'young artist', 'painter', 'sculptor', 'digital artist'],
    eligibility: ['Young Artists under 35', 'Exceptional talent', 'Innovative work', 'artisan'],
    benefits: ['Cash award Rs. 50,000', 'Certificate of merit', 'National recognition', 'Exhibition opportunity'],
    documents: ['Portfolio', 'Age proof', 'Artist statement', 'Bank account details'],
    deadline: 'Annual - December 31',
    link: 'https://indiaculture.gov.in/schemes',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'scheme-cultural-function',
    name: 'Cultural Function Grant Scheme',
    title: 'Cultural Function Grant Scheme',
    description: 'Financial assistance for organizing cultural programs, festivals, and events to promote Indian arts.',
    ministry: 'Ministry of Culture',
    category: 'General Arts',
    artistTypes: ['all', 'cultural organizations', 'ngos', 'institutions'],
    eligibility: ['Cultural Organizations', 'NGOs', 'Educational Institutions', 'Artist groups', 'artisan'],
    benefits: ['Grant up to Rs. 5 lakhs', 'Promotional support', 'Venue support', 'Technical assistance'],
    documents: ['Organization registration', 'Event proposal', 'Budget estimate', 'Bank account details'],
    deadline: 'Quarterly applications',
    link: 'https://indiaculture.gov.in/schemes',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'scheme-eshram-benefits',
    name: 'e-Shram Portal Registration Benefits',
    title: 'e-Shram Portal Registration Benefits',
    description: 'Registration for unorganized workers including artisans for social security benefits and government scheme access.',
    ministry: 'Ministry of Labour',
    category: 'General Arts',
    artistTypes: ['all', 'artisan', 'weaver', 'craftsman', 'unorganized worker'],
    eligibility: ['Unorganized Workers', 'Artisans', 'Age 16-59 years', 'artisan'],
    benefits: ['Accident insurance Rs. 2 lakhs', 'Social security benefits', 'Government scheme access', 'Pension benefits'],
    documents: ['Aadhaar card', 'Bank account details', 'Mobile number', 'Occupation details'],
    deadline: 'Year-round registration',
    link: 'https://eshram.gov.in',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'scheme-women-artist-matritva',
    name: 'Matritva Sahyog Yojana for Women Artists',
    title: 'Matritva Sahyog Yojana for Women Artists',
    description: 'Financial support for women artists during pregnancy and early motherhood to continue their artistic practice.',
    ministry: 'Ministry of Culture',
    category: 'Performing Arts',
    artistTypes: ['performing', 'women artist', 'dancer', 'musician', 'actor'],
    eligibility: ['Women Artists', 'Pregnant artists', 'New mothers (up to 1 year)', 'artisan'],
    benefits: ['Financial assistance Rs. 15,000', 'Medical support', 'Childcare allowance', 'Return-to-work support'],
    documents: ['Identity proof', 'Artist certificate', 'Medical certificate', 'Bank account details'],
    deadline: 'Rolling applications',
    link: 'https://indiaculture.gov.in/schemes',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'scheme-tribal-artist-welfare',
    name: 'Tribal Artist Welfare Scheme',
    title: 'Tribal Artist Welfare Scheme',
    description: 'Special welfare scheme for tribal artists to preserve indigenous art forms and provide livelihood support.',
    ministry: 'Ministry of Tribal Affairs',
    category: 'General Arts',
    artistTypes: ['tribal', 'indigenous', 'folk artist', 'traditional artist'],
    eligibility: ['Tribal Artists', 'ST certificate holders', 'Traditional practitioners', 'artisan'],
    benefits: ['Monthly allowance Rs. 3,000', 'Healthcare benefits', 'Education support for children', 'Material assistance'],
    documents: ['ST certificate', 'Artist proof', 'Residence proof', 'Bank account details'],
    deadline: 'Year-round',
    link: 'https://tribal.nic.in/schemes',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

async function seedSchemes() {
  let client
  
  try {
    console.log('Connecting to MongoDB...')
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log('Connected!')
    
    const db = client.db()
    const schemesCollection = db.collection('schemes')
    
    // Clear existing schemes
    console.log('Clearing existing schemes...')
    await schemesCollection.deleteMany({})
    
    // Insert new schemes
    console.log(`Inserting ${schemes.length} schemes...`)
    await schemesCollection.insertMany(schemes)
    
    console.log('✅ Database seeded successfully!')
    console.log('\nSchemes by category:')
    const categories = [...new Set(schemes.map(s => s.category))]
    for (const cat of categories) {
      const count = schemes.filter(s => s.category === cat).length
      console.log(`  - ${cat}: ${count} schemes`)
    }
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log('\nDatabase connection closed.')
    }
  }
}

// Run the seed function
seedSchemes()
