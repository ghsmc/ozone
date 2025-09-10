// OpenAI client is now handled by backend API routes
// This service is kept for compatibility but methods are mocked for frontend use

export class OpenAIService {
  async generateEmbedding(text: string): Promise<number[]> {
    // Mock embedding for development - replace with actual API call in production
    console.log('Mock embedding generation for:', text)
    return new Array(1536).fill(0).map(() => Math.random() - 0.5)
  }

  async generateJobEmbedding(job: any): Promise<number[]> {
    const jobText = this.createJobText(job)
    return this.generateEmbedding(jobText)
  }

  async generateUserEmbedding(profile: any, preferences: any): Promise<number[]> {
    const userText = this.createUserText(profile, preferences)
    return this.generateEmbedding(userText)
  }

  private createJobText(job: any): string {
    const parts = []
    
    if (job.title) parts.push(`Title: ${job.title}`)
    if (job.company) parts.push(`Company: ${job.company}`)
    if (job.description) parts.push(`Description: ${job.description}`)
    if (job.industry) parts.push(`Industry: ${job.industry}`)
    if (job.requirements && job.requirements.length > 0) {
      parts.push(`Requirements: ${job.requirements.join(', ')}`)
    }
    if (job.location) parts.push(`Location: ${job.location}`)
    if (job.remote_type) parts.push(`Work Type: ${job.remote_type}`)
    
    return parts.join('. ')
  }

  private createUserText(profile: any, preferences: any): string {
    const parts = []
    
    if (profile.major) parts.push(`Major: ${profile.major}`)
    if (profile.class_year) parts.push(`Graduation Year: ${profile.class_year}`)
    if (preferences.preferredIndustries && preferences.preferredIndustries.length > 0) {
      parts.push(`Interested in: ${preferences.preferredIndustries.join(', ')}`)
    }
    if (preferences.likedCompanies && preferences.likedCompanies.length > 0) {
      parts.push(`Likes companies like: ${preferences.likedCompanies.join(', ')}`)
    }
    if (preferences.workStyle) parts.push(`Prefers: ${preferences.workStyle} work`)
    if (preferences.locationPreference && preferences.locationPreference.length > 0) {
      parts.push(`Location preference: ${preferences.locationPreference.join(', ')}`)
    }
    
    return parts.join('. ')
  }

  async generateDreamAnalysis(dream: string, profile: any): Promise<any> {
    // Mock response for development - replace with actual API call in production
    console.log('Mock dream analysis for:', dream, profile)
    return {
      parsedGoals: ["Build skills in your field", "Make meaningful connections", "Gain practical experience"],
      timeline: "1-2 years",
      requirements: ["Strong academic performance", "Relevant experience", "Network building"],
      difficulty: "Medium",
      estimatedTime: "12-18 months"
    }
  }

  async generateActionSteps(dream: string, profile: any): Promise<any[]> {
    // Mock response for development - replace with actual API call in production
    console.log('Mock action steps for:', dream, profile)
    return [
      {
        step: "Research opportunities in your field",
        timeframe: "1-2 weeks",
        priority: "High",
        resources: ["Career services", "Alumni network", "Online research"]
      }
    ]
  }

  async findRelevantOpportunities(dream: string, profile: any): Promise<any[]> {
    // Mock response for development - replace with actual API call in production
    console.log('Mock relevant opportunities for:', dream, profile)
    return [
      {
        title: "Research Assistant",
        company: "Yale University",
        type: "Internship",
        relevance: 85,
        url: "https://yale.edu",
        description: "Research opportunity in your field of interest"
      }
    ]
  }

  async findYaleConnections(dream: string, profile: any): Promise<any[]> {
    // Mock response for development - replace with actual API call in production
    console.log('Mock Yale connections for:', dream, profile)
    return [
      {
        name: "John Smith",
        role: "Senior Analyst",
        company: "Goldman Sachs",
        year: 2015,
        contact: "john.smith@alumni.yale.edu",
        relevance: "Works in finance and can provide career guidance"
      }
    ]
  }

  async generateOpportunities(userInput: any): Promise<any> {
    // Mock response for development - replace with actual API call in production
    console.log('Mock opportunity generation for:', userInput)
    return {
      student_reflection: {
        who_you_are: "A student exploring opportunities",
        motivations: ["Building skills", "Making connections", "Exploring career paths"],
        skill_themes: ["Research", "Analysis", "Communication"],
        time_of_year_implications: ["Early recruiting season", "Time to network"]
      },
      opportunities: [],
      yale_specific_doors: [],
      weekly_plan: [],
      quality_checks: {
        specific_items_count: 0,
        yale_items_count: 0,
        links_present: false,
        aligned_with_constraints: false
      }
    }
  }
}

export const openaiService = new OpenAIService()
