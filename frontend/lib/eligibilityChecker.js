/**
 * Check if a user is eligible for a specific scheme
 * @param {Object} scheme - The scheme object
 * @param {Object} userProfile - User's profile data
 * @returns {Object} - { eligible: boolean, reason: string, criteria: array }
 */
export function checkEligibility(scheme, userProfile) {
  const criteria = []
  let eligible = true
  const reasons = []

  // Default user profile if not provided
  const user = {
    age: userProfile?.age || null,
    state: userProfile?.state || userProfile?.location || null,
    category: userProfile?.category || userProfile?.role || 'artisan',
    income: userProfile?.income || userProfile?.annualTurnover || null,
    yearsInBusiness: userProfile?.yearsInBusiness || null,
    gender: userProfile?.gender || null,
    caste: userProfile?.caste || null,
    ...userProfile
  }

  const schemeName = (scheme.name || scheme.title || '').toLowerCase()
  const schemeDesc = (scheme.description || '').toLowerCase()
  const eligibilityText = Array.isArray(scheme.eligibility) 
    ? scheme.eligibility.join(' ').toLowerCase()
    : (scheme.eligibility || '').toLowerCase()

  // Check 1: Age criteria
  if (schemeName.includes('veteran') || schemeName.includes('senior') || 
      eligibilityText.includes('senior') || eligibilityText.includes('veteran') ||
      schemeName.includes('pension')) {
    criteria.push('Age: 60+ years (Senior/Veteran)')
    if (user.age !== null && user.age < 60) {
      eligible = false
      reasons.push('This scheme is for senior artists (60+ years)')
    }
  }

  if (schemeName.includes('young') || schemeName.includes('scholarship') || 
      schemeName.includes('student') || schemeName.includes('youth')) {
    criteria.push('Age: 18-30 years (Young/Student)')
    if (user.age !== null && (user.age < 18 || user.age > 30)) {
      eligible = false
      reasons.push('This scheme is for young artists (18-30 years)')
    }
  }

  // Check 2: Category/Role matching
  if (scheme.eligibility && Array.isArray(scheme.eligibility)) {
    const userRole = user.category.toLowerCase()
    const isEligibleRole = scheme.eligibility.some(e => 
      e.toLowerCase() === userRole || 
      e.toLowerCase() === 'all' ||
      e.toLowerCase().includes(userRole)
    )
    
    if (!isEligibleRole && scheme.eligibility.length > 0) {
      // Not a strict failure, just informational
      criteria.push(`Category: ${scheme.eligibility.join(', ')}`)
    }
  }

  // Check 3: State/Location matching
  if (scheme.state && scheme.state !== '') {
    criteria.push(`State: ${scheme.state}`)
    if (user.state && !scheme.state.toLowerCase().includes(user.state.toLowerCase()) &&
        !user.state.toLowerCase().includes(scheme.state.toLowerCase())) {
      // Warning only, not strict
      reasons.push(`Note: This scheme is primarily for ${scheme.state}`)
    }
  }

  // Check 4: SC/ST/OBC criteria
  if (eligibilityText.includes('sc') || eligibilityText.includes('st') || 
      schemeName.includes('sc/st') || eligibilityText.includes('obc')) {
    criteria.push('Reserved for SC/ST/OBC categories')
    if (user.caste) {
      const userCaste = user.caste.toLowerCase()
      if (!eligibilityText.includes(userCaste)) {
        eligible = false
        reasons.push('This scheme requires SC/ST/OBC category')
      }
    }
  }

  // Check 5: Women-specific schemes
  if (schemeName.includes('women') || schemeName.includes('matritva') ||
      eligibilityText.includes('woman') || eligibilityText.includes('female')) {
    criteria.push('Gender: Women only')
    if (user.gender && user.gender.toLowerCase() !== 'female') {
      eligible = false
      reasons.push('This scheme is for women artists only')
    }
  }

  // Check 6: Income criteria (for means-tested schemes)
  if (schemeName.includes('bpl') || schemeName.includes('poor') ||
      schemeName.includes('low income') || schemeName.includes('financial assistance')) {
    criteria.push('Income: Below poverty line / Low income')
    if (user.income && user.income > 300000) {
      reasons.push('This scheme is primarily for low-income artists')
    }
  }

  // Check 7: Experience/Business years
  if (eligibilityText.includes('year') && eligibilityText.includes('experience')) {
    const yearMatch = eligibilityText.match(/(\d+)\+?\s*years?/)
    if (yearMatch && user.yearsInBusiness) {
      const requiredYears = parseInt(yearMatch[1])
      criteria.push(`Experience: ${requiredYears}+ years`)
      if (user.yearsInBusiness < requiredYears) {
        eligible = false
        reasons.push(`This scheme requires ${requiredYears}+ years of experience`)
      }
    }
  }

  // Check 8: Institution/Group vs Individual
  if (schemeName.includes('institution') || schemeName.includes('organization') ||
      schemeName.includes('group') || eligibilityText.includes('ngo')) {
    criteria.push('For: Cultural Institutions/Organizations/Groups')
    if (user.category === 'individual' || user.category === 'artisan') {
      reasons.push('This scheme is for institutions/groups, not individuals')
    }
  }

  return {
    eligible,
    reason: reasons.length > 0 ? reasons.join('. ') : 'You appear to meet the basic eligibility criteria',
    criteria: criteria.length > 0 ? criteria : ['Open to all artists'],
    confidence: reasons.length === 0 ? 'high' : (eligible ? 'medium' : 'low')
  }
}

/**
 * Get all eligible schemes for a user
 * @param {Array} schemes - All available schemes
 * @param {Object} userProfile - User's profile
 * @returns {Array} - Eligible schemes with eligibility info
 */
export function getEligibleSchemes(schemes, userProfile) {
  return schemes.map(scheme => ({
    ...scheme,
    eligibilityCheck: checkEligibility(scheme, userProfile)
  })).filter(s => s.eligibilityCheck.eligible)
}

/**
 * Count eligible schemes
 * @param {Array} schemes - All schemes
 * @param {Object} userProfile - User profile
 * @returns {Object} - Count and list
 */
export function countEligibleSchemes(schemes, userProfile) {
  const eligible = getEligibleSchemes(schemes, userProfile)
  return {
    count: eligible.length,
    schemes: eligible,
    percentage: Math.round((eligible.length / schemes.length) * 100)
  }
}
