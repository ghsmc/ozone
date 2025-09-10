import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { pineconeService } from './pinecone'
import { openaiService } from './openai'

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

export interface UserProfile {
  id: string
  email: string
  name: string | null
  school: string
  major: string | null
  class_year: number | null
  graduation_month: string | null
  preferences: any
  onboarding_completed: boolean
}

export interface Job {
  id: string
  company: string
  title: string
  location: string | null
  remote_type: string | null
  salary: any | null
  description: string | null
  requirements: string[] | null
  industry: string | null
  company_size: string | null
  apply_url: string | null
  source: string
  lifestyle_data: any | null
  yale_network: any | null
  growth_data: any | null
  embedding: any | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface ScoredJob extends Job {
  scores: {
    semantic: number
    salary: number
    location: number
    industry: number
    yaleNetwork: number
    behavioral: number
  }
  chemistry: number
  reasons: string[]
}

export interface Preferences {
  likedCompanies: string[]
  dislikedCompanies: string[]
  preferredIndustries: string[]
  salaryMin: number
  locationPreference: string[]
  workStyle: string
}

export class MatchingEngine {
  private supabase = supabase

  async getPersonalizedFeed(userId: string): Promise<ScoredJob[]> {
    try {
      const profile = await this.getUserProfile(userId)
      const swipeHistory = await this.getSwipeHistory(userId)
      
      // Learn from user behavior
      const preferences = this.learnUserPreferences(swipeHistory)
      
      // Get semantic matches
      const semanticMatches = await this.findSemanticMatches(profile, preferences)
      
      // Apply business rules and scoring
      const filteredJobs = semanticMatches
        .filter(job => this.passesFilters(job, profile))
        .map(job => this.scoreJob(job, profile, preferences))
        .sort((a, b) => b.chemistry - a.chemistry)
      
      return filteredJobs.slice(0, 20)
    } catch (error) {
      console.error('Error generating personalized feed:', error)
      return []
    }
  }

  private async getUserProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  private async getSwipeHistory(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
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

    if (error) throw error
    return data || []
  }

  private learnUserPreferences(swipeHistory: any[]): Preferences {
    const likedCompanies = new Set<string>()
    const dislikedCompanies = new Set<string>()
    const preferredIndustries = new Set<string>()
    let totalSalary = 0
    let salaryCount = 0
    const locationCounts = new Map<string, number>()
    const workStyleCounts = new Map<string, number>()

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
        
        if (job.remote_type) {
          workStyleCounts.set(job.remote_type, (workStyleCounts.get(job.remote_type) || 0) + 1)
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
        .map(([location]) => location),
      workStyle: Array.from(workStyleCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'any'
    }
  }

  private async findSemanticMatches(profile: UserProfile, preferences: Preferences): Promise<Job[]> {
    try {
      // Create query embedding from user profile using OpenAI
      const queryEmbedding = await openaiService.generateUserEmbedding(profile, preferences)
      
      // Vector search in Pinecone
      const pineconeResults = await pineconeService.searchSimilarJobs(queryEmbedding, 50)
      
      // Get full job details from Supabase
      const jobIds = pineconeResults.map(result => result.id)
      if (jobIds.length === 0) {
        return this.getFallbackJobs(profile, preferences)
      }
      
      const { data: jobs, error: jobsError } = await this.supabase
        .from('jobs')
        .select('*')
        .in('id', jobIds)
        .eq('active', true)
      
      if (jobsError) throw jobsError
      
      // Sort jobs by Pinecone similarity score
      const jobsWithScores = (jobs || []).map(job => {
        const pineconeResult = pineconeResults.find(result => result.id === job.id)
        return {
          ...job,
          similarity: pineconeResult?.score || 0
        }
      }).sort((a, b) => b.similarity - a.similarity)
      
      return jobsWithScores
    } catch (error) {
      console.error('Error in semantic matching:', error)
      // Fallback to basic filtering
      return this.getFallbackJobs(profile, preferences)
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Mock embedding generation - in production, would use OpenAI embeddings API
    // For now, return a random vector of the correct dimension
    const embedding = new Array(1536).fill(0).map(() => Math.random() - 0.5)
    return embedding
  }

  private createUserQueryText(profile: UserProfile, preferences: Preferences): string {
    const parts = []
    
    if (profile.major) parts.push(`Major: ${profile.major}`)
    if (profile.class_year) parts.push(`Graduation year: ${profile.class_year}`)
    if (preferences.preferredIndustries.length > 0) {
      parts.push(`Interested in: ${preferences.preferredIndustries.join(', ')}`)
    }
    if (preferences.likedCompanies.length > 0) {
      parts.push(`Likes companies like: ${preferences.likedCompanies.join(', ')}`)
    }
    if (preferences.workStyle !== 'any') {
      parts.push(`Prefers: ${preferences.workStyle} work`)
    }
    
    return parts.join('. ')
  }

  private async getFallbackJobs(profile: UserProfile, preferences: Preferences): Promise<Job[]> {
    // Fallback when semantic search fails
    const { data, error } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('active', true)
      .limit(50)
    
    if (error) throw error
    return data || []
  }

  private passesFilters(job: Job, profile: UserProfile): boolean {
    // Basic filtering logic
    if (!job.active) return false
    
    // Filter out jobs from disliked companies
    // This would be implemented based on user preferences
    
    return true
  }

  private scoreJob(job: Job, profile: UserProfile, preferences: Preferences): ScoredJob {
    const scores = {
      semantic: 75, // Would be calculated from embedding similarity
      salary: this.scoreSalary(job.salary, preferences.salaryMin),
      location: this.scoreLocation(job.location, preferences.locationPreference),
      industry: this.scoreIndustry(job.industry, preferences.preferredIndustries),
      yaleNetwork: job.yale_network?.totalCount > 0 ? 20 : 0,
      behavioral: this.scoreBehavioral(job, preferences.likedCompanies)
    }
    
    const chemistry = Math.min(95, Math.max(65, 
      scores.semantic * 0.4 +
      scores.salary * 0.2 +
      scores.location * 0.15 +
      scores.industry * 0.15 +
      scores.yaleNetwork * 0.05 +
      scores.behavioral * 0.05
    ))
    
    const reasons = this.generateMatchReasons(job, profile, preferences)
    
    return {
      ...job,
      scores,
      chemistry: Math.round(chemistry),
      reasons
    }
  }

  private scoreSalary(jobSalary: any, userMinSalary: number): number {
    if (!jobSalary?.base) return 50
    
    const jobBase = jobSalary.base
    if (jobBase >= userMinSalary * 1.2) return 100
    if (jobBase >= userMinSalary) return 80
    if (jobBase >= userMinSalary * 0.8) return 60
    return 30
  }

  private scoreLocation(jobLocation: string | null, preferredLocations: string[]): number {
    if (!jobLocation) return 50
    
    if (preferredLocations.length === 0) return 70
    
    const locationLower = jobLocation.toLowerCase()
    const hasMatch = preferredLocations.some(pref => 
      locationLower.includes(pref.toLowerCase())
    )
    
    return hasMatch ? 90 : 40
  }

  private scoreIndustry(jobIndustry: string | null, preferredIndustries: string[]): number {
    if (!jobIndustry) return 50
    
    if (preferredIndustries.length === 0) return 70
    
    return preferredIndustries.includes(jobIndustry) ? 90 : 40
  }

  private scoreBehavioral(job: Job, likedCompanies: string[]): number {
    if (likedCompanies.length === 0) return 50
    
    // Check if company is similar to liked companies
    const companyLower = job.company.toLowerCase()
    const hasSimilar = likedCompanies.some(liked => {
      const likedLower = liked.toLowerCase()
      return companyLower.includes(likedLower) || likedLower.includes(companyLower)
    })
    
    return hasSimilar ? 85 : 50
  }

  private generateMatchReasons(job: Job, profile: UserProfile, preferences: Preferences): string[] {
    const reasons = []
    
    if (job.yale_network?.totalCount > 0) {
      reasons.push(`${job.yale_network.totalCount} Yale alumni work here`)
    }
    
    if (preferences.preferredIndustries.includes(job.industry || '')) {
      reasons.push(`Matches your interest in ${job.industry}`)
    }
    
    if (preferences.likedCompanies.some(company => 
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
}
