// Hardcoded fallback schemes for instant loading
// Toggle USE_API to switch between hardcoded and real API

export const USE_API = false // Set to true when government API is ready

export const HARDCODED_SCHEMES = [
  {
    id: "pm-vishwakarma",
    title: "PM Vishwakarma Yojana",
    category: "Handicrafts",
    state: "All India",
    ministry: "Ministry of MSME",
    description: "Financial assistance and skill training for traditional artisans including carpenters, goldsmiths, potters, and weavers.",
    benefits: "₹15,000 toolkit + ₹1 lakh loan at 5% interest",
    eligibility: ["artisan", "weaver", "carpenter", "goldsmith", "potter"],
    documents: ["Aadhaar Card", "Artisan Certificate", "Bank Account", "Passport Photo"],
    applyLink: "https://pmvishwakarma.gov.in",
    isActive: true,
    deadline: "2024-12-31",
    icon: "🔨"
  },
  {
    id: "mudra-loan",
    title: "MUDRA Loan (Shishu/Kishor/Tarun)",
    category: "General Support",
    state: "All India",
    ministry: "Ministry of Finance",
    description: "Loans for small businesses and artisans to expand their craft business without collateral.",
    benefits: "Up to ₹10 lakh based on stage - Shishu (₹50K), Kishor (₹5L), Tarun (₹10L)",
    eligibility: ["artisan", "small-business", "startup"],
    documents: ["Business Plan", "Identity Proof", "Address Proof", "Bank Statement"],
    applyLink: "https://mudra.org.in",
    isActive: true,
    deadline: "Ongoing",
    icon: "💰"
  },
  {
    id: "sfurti",
    title: "SFURTI - Traditional Industries",
    category: "Handicrafts",
    state: "All India",
    ministry: "Ministry of MSME",
    description: "Scheme of Fund for Regeneration of Traditional Industries - cluster-based development.",
    benefits: "₹25-50 lakhs for cluster development, common facility centers",
    eligibility: ["cluster", "artisan-group", "cooperative"],
    documents: ["Cluster Details", "Artisan List", "Project Report", "Land Documents"],
    applyLink: "https://sfurti.msme.gov.in",
    isActive: true,
    deadline: "Quarterly",
    icon: "🏭"
  },
  {
    id: "ahidu",
    title: "Ambedkar Hastshilp Vikas Yojana",
    category: "Handicrafts",
    state: "All India",
    ministry: "Development Commissioner (Handicrafts)",
    description: "Skill development and design upgradation for handicraft artisans from SC/ST communities.",
    benefits: "Free training + toolkit worth ₹10,000 + market linkage support",
    eligibility: ["sc", "st", "artisan", "handicraft"],
    documents: ["Caste Certificate", "Artisan ID", "Aadhaar", "Bank Account"],
    applyLink: "https://handicrafts.nic.in",
    isActive: true,
    deadline: "2024-12-31",
    icon: "🎨"
  },
  {
    id: "handloom-weavers",
    title: "National Handloom Development Program",
    category: "Textile Arts",
    state: "All India",
    ministry: "Ministry of Textiles",
    description: "Comprehensive support for handloom weavers including yarn subsidy, equipment upgrade, and marketing.",
    benefits: "50% subsidy on yarn, new loom subsidy up to ₹1.5 lakh",
    eligibility: ["weaver", "handloom", "textile-artisan"],
    documents: ["Weaver Identity Card", "Handloom Certificate", "Bank Account"],
    applyLink: "https://handlooms.nic.in",
    isActive: true,
    deadline: "Ongoing",
    icon: "🧵"
  },
  {
    id: "odop",
    title: "One District One Product (ODOP)",
    category: "Regional",
    state: "State Specific",
    ministry: "Ministry of Commerce",
    description: "Promote traditional crafts of specific districts through branding, marketing, and GI tagging.",
    benefits: "GI registration support, marketing assistance, e-commerce onboarding",
    eligibility: ["artisan", "cluster", "district-specific"],
    documents: ["Product Samples", "District Administration Letter", "Artisan Certificate"],
    applyLink: "https://odop.gov.in",
    isActive: true,
    deadline: "Annual",
    icon: "🏷️"
  },
  {
    id: "design-tech",
    title: "Design & Technology Upgradation",
    category: "Innovation",
    state: "All India",
    ministry: "Development Commissioner (Handicrafts)",
    description: "Financial assistance for design development, technology upgradation, and innovation in crafts.",
    benefits: "75% of project cost up to ₹50 lakhs",
    eligibility: ["artisan", "exporter", "designer"],
    documents: ["Project Proposal", "Financial Statements", "Design Portfolio"],
    applyLink: "https://handicrafts.nic.in",
    isActive: true,
    deadline: "Quarterly",
    icon: "💡"
  },
  {
    id: "marketing-support",
    title: "Marketing Support & Services",
    category: "Marketing",
    state: "All India",
    ministry: "Development Commissioner (Handicrafts)",
    description: "Support for domestic and international exhibitions, buyer-seller meets, and e-commerce.",
    benefits: "Space rent subsidy + freight subsidy + catalog support",
    eligibility: ["exporter", "artisan", "cluster"],
    documents: ["Export History", "Product Catalog", "IEC Code"],
    applyLink: "https://handicrafts.nic.in",
    isActive: true,
    deadline: "Event-based",
    icon: "📢"
  }
]

// Categories for filtering
export const SCHEME_CATEGORIES = [
  { id: 'all', label: 'All Schemes', icon: '🔍' },
  { id: 'Handicrafts', label: 'Handicrafts', icon: '🏺' },
  { id: 'Textile Arts', label: 'Textile Arts', icon: '🧵' },
  { id: 'General Support', label: 'General Support', icon: '🤝' },
  { id: 'Regional', label: 'Regional', icon: '📍' },
  { id: 'Innovation', label: 'Innovation', icon: '💡' },
  { id: 'Marketing', label: 'Marketing', icon: '📢' }
]

// States list
export const STATES = [
  'All India', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
]
