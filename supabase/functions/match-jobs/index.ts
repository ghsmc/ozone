import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  try {
    const { userId, preferences } = await req.json()
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Get user profile and swipe history
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    const { data: swipeHistory, error: swipeError } = await supabase
      .from('user_swipes')
      .select(`
        *,
        jobs (
          company,
          industry,
          salary,
          location,
          remote_type
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (swipeError) throw swipeError

    // Learn from user behavior
    const learnedPreferences = learnUserPreferences(swipeHistory || [])
    
    // Create user preference embedding
    const userDescription = createUserProfileText(profile, learnedPreferences)
    const userEmbedding = await generateEmbedding(userDescription)
    
    // Vector similarity search
    const { data: similarJobs, error: vectorError } = await supabase.rpc('match_jobs', {
      query_embedding: userEmbedding,
      match_threshold: 0.7,
      match_count: 50
    })

    if (vectorError) throw vectorError

    // Get full job details
    const jobIds = similarJobs.map((match: any) => match.id)
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .in('id', jobIds)
      .eq('active', true)

    if (jobsError) throw jobsError

    // Apply business logic scoring
    const scoredJobs = (jobs || []).map(job => ({
      ...job,
      chemistry: calculateChemistryScore(job, profile, learnedPreferences),
      reasons: generateMatchReasons(job, profile, learnedPreferences)
    }))

    // Sort by chemistry score
    scoredJobs.sort((a, b) => b.chemistry - a.chemistry)

    return new Response(JSON.stringify({
      success: true,
      jobs: scoredJobs.slice(0, 20),
      count: scoredJobs.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Matching error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

function learnUserPreferences(swipeHistory: any[]): any {
  const likedCompanies = new Set<string>()
  const dislikedCompanies = new Set<string>()
  const preferredIndustries = new Set<string>()
  let totalSalary = 0
  let salaryCount = 0
  const locationCounts = new Map<string, number>()

  swipeHistory.forEach(swipe => {
    const job = swipe.jobs
    if (!job) return

    if (swipe.action === 'like' || swipe.action === 'apply') {
      likedCompanies.add(job.company)
      if (job.industry) preferredIndustries.add(job.industry)
      
      if (job.salary?.base) {
        totalSalary += job.salary.base
        salaryCount++
      }
      
      if (job.location) {
        locationCounts.set(job.location, (locationCounts.get(job.location) || 0) + 1)
      }
    } else if (swipe.action === 'pass') {
      dislikedCompanies.add(job.company)
    }
  })

  return {
    likedCompanies: Array.from(likedCompanies),
    dislikedCompanies: Array.from(dislikedCompanies),
    preferredIndustries: Array.from(preferredIndustries),
    salaryMin: salaryCount > 0 ? Math.round(totalSalary / salaryCount * 0.8) : 60000,
    locationPreference: Array.from(locationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([location]) => location)
  }
}

function createUserProfileText(profile: any, preferences: any): string {
  const parts = []
  
  if (profile.major) parts.push(`Major: ${profile.major}`)
  if (profile.class_year) parts.push(`Graduation year: ${profile.class_year}`)
  if (preferences.preferredIndustries.length > 0) {
    parts.push(`Interested in: ${preferences.preferredIndustries.join(', ')}`)
  }
  if (preferences.likedCompanies.length > 0) {
    parts.push(`Likes companies like: ${preferences.likedCompanies.join(', ')}`)
  }
  
  return parts.join('. ')
}

async function generateEmbedding(text: string): Promise<number[]> {
  // Mock embedding generation - in production, would use OpenAI embeddings API
  const embedding = new Array(1536).fill(0).map(() => Math.random() - 0.5)
  return embedding
}

function calculateChemistryScore(job: any, profile: any, preferences: any): number {
  let score = 50 // Base score
  
  // Yale network bonus
  if (job.yale_network?.totalCount > 0) {
    score += 20
  }
  
  // Industry match
  if (preferences.preferredIndustries.includes(job.industry)) {
    score += 15
  }
  
  // Company preference
  if (preferences.likedCompanies.some((company: string) => 
    job.company.toLowerCase().includes(company.toLowerCase())
  )) {
    score += 15
  }
  
  // Salary match
  if (job.salary?.base && job.salary.base >= preferences.salaryMin) {
    score += 10
  }
  
  // Location preference
  if (preferences.locationPreference.some((location: string) =>
    job.location?.toLowerCase().includes(location.toLowerCase())
  )) {
    score += 10
  }
  
  return Math.min(95, Math.max(65, score))
}

function generateMatchReasons(job: any, profile: any, preferences: any): string[] {
  const reasons = []
  
  if (job.yale_network?.totalCount > 0) {
    reasons.push(`${job.yale_network.totalCount} Yale alumni work here`)
  }
  
  if (preferences.preferredIndustries.includes(job.industry)) {
    reasons.push(`Matches your interest in ${job.industry}`)
  }
  
  if (preferences.likedCompanies.some((company: string) => 
    job.company.toLowerCase().includes(company.toLowerCase())
  )) {
    reasons.push(`Similar to companies you've liked`)
  }
  
  if (job.salary?.base && job.salary.base >= preferences.salaryMin) {
    reasons.push(`Meets your salary expectations`)
  }
  
  if (reasons.length === 0) {
    reasons.push('Great opportunity for growth')
  }
  
  return reasons.slice(0, 3)
}
