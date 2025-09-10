import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { openaiService } from './openai'
import OpenAI from 'openai'

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

export interface DreamAnalysis {
  parsedGoals: string[]
  timeline: string
  requirements: string[]
  difficulty: 'Easy' | 'Medium' | 'Hard'
  estimatedTime: string
}

export interface ActionStep {
  step: string
  timeframe: string
  priority: 'High' | 'Medium' | 'Low'
  resources: string[]
}

export interface Opportunity {
  title: string
  company: string
  type: 'Job' | 'Internship' | 'Program' | 'Course'
  relevance: number
  url: string
  description: string
}

export interface YaleConnection {
  name: string
  role: string
  company: string
  year: number
  contact: string
  relevance: string
}

export interface DreamPlan {
  actionSteps: ActionStep[]
  opportunities: Opportunity[]
  connections: YaleConnection[]
}

export interface SearchResult {
  type: 'career' | 'alumni' | 'research' | 'opportunity' | 'company' | 'program' | 'course' | 'event' | 'general'
  title: string
  description: string
  relevance: number
  url?: string
  metadata: any
}

export interface UniversalSearchResponse {
  query: string
  searchType: string
  results: SearchResult[]
  suggestions: string[]
  relatedSearches: string[]
  totalResults: number
}

export class DreamEngine {
  private supabase = supabase
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  async universalSearch(query: string, userId: string): Promise<UniversalSearchResponse> {
    try {
      // Get user profile for context
      const profile = await this.getUserProfile(userId)
      
      // Analyze the query to determine search type and intent
      const searchAnalysis = await this.analyzeSearchQuery(query, profile)
      
      // Perform parallel searches across different data sources
      const [careerResults, alumniResults, researchResults, opportunityResults] = await Promise.all([
        this.searchCareers(query, profile),
        this.searchAlumni(query, profile),
        this.searchResearch(query, profile),
        this.searchOpportunities(query, profile)
      ])

      // Combine and rank results
      const allResults = [...careerResults, ...alumniResults, ...researchResults, ...opportunityResults]
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 20) // Top 20 results

      // Generate suggestions and related searches
      const suggestions = await this.generateSuggestions(query, profile)
      const relatedSearches = await this.generateRelatedSearches(query, profile)

      // Save search for analytics and personalization
      await this.saveSearch(userId, query, searchAnalysis, allResults)

      return {
        query,
        searchType: searchAnalysis.type,
        results: allResults,
        suggestions,
        relatedSearches,
        totalResults: allResults.length
      }
    } catch (error) {
      console.error('Error in universal search:', error)
      throw error
    }
  }

  async processDream(dream: string, userId: string): Promise<DreamPlan> {
    try {
      // Get user profile for context
      const profile = await this.getUserProfile(userId)
      
      // Parallel LLM calls for comprehensive planning using OpenAI
      const [analysis, actionSteps, opportunities, connections] = await Promise.all([
        openaiService.generateDreamAnalysis(dream, profile),
        openaiService.generateActionSteps(dream, profile),
        openaiService.findRelevantOpportunities(dream, profile), 
        openaiService.findYaleConnections(dream, profile)
      ])

      // Save dream and analysis
      await this.saveDream(userId, dream, analysis, { actionSteps, opportunities, connections })

      return { actionSteps, opportunities, connections }
    } catch (error) {
      console.error('Error processing dream:', error)
      throw error
    }
  }

  private async getUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  private async generateActionSteps(dream: string, profile: any): Promise<ActionStep[]> {
    // Mock action steps generation - in production, would use OpenAI GPT-4
    const steps = [
      {
        step: "Research companies in your target industry",
        timeframe: "This week",
        priority: "High" as const,
        resources: ["LinkedIn", "Company websites", "Glassdoor"]
      },
      {
        step: "Update your resume and LinkedIn profile",
        timeframe: "Next 2 weeks",
        priority: "High" as const,
        resources: ["Yale Career Services", "Resume templates", "LinkedIn guides"]
      },
      {
        step: "Network with Yale alumni in your field",
        timeframe: "Next month",
        priority: "Medium" as const,
        resources: ["Yale Alumni Directory", "LinkedIn", "Career fairs"]
      },
      {
        step: "Apply to relevant internships/jobs",
        timeframe: "Ongoing",
        priority: "High" as const,
        resources: ["MILO platform", "Company career pages", "Job boards"]
      },
      {
        step: "Develop relevant skills through courses",
        timeframe: "Next 3 months",
        priority: "Medium" as const,
        resources: ["Coursera", "edX", "Yale courses"]
      }
    ]

    return steps
  }

  private async findRelevantOpportunities(dream: string, profile: any): Promise<Opportunity[]> {
    // Mock opportunities - in production, would query job database and external APIs
    const opportunities = [
      {
        title: "Software Engineering Intern",
        company: "Google",
        type: "Internship" as const,
        relevance: 95,
        url: "https://careers.google.com/jobs/results/",
        description: "Build products that impact billions of users worldwide"
      },
      {
        title: "Product Management Intern",
        company: "Meta",
        type: "Internship" as const,
        relevance: 88,
        url: "https://www.metacareers.com/",
        description: "Shape the future of social connection and virtual reality"
      },
      {
        title: "Yale Summer Session: Data Science",
        company: "Yale University",
        type: "Course" as const,
        relevance: 75,
        url: "https://summer.yale.edu/",
        description: "Intensive data science program for career preparation"
      },
      {
        title: "Yale Alumni Mentorship Program",
        company: "Yale Alumni Association",
        type: "Program" as const,
        relevance: 80,
        url: "https://alumni.yale.edu/",
        description: "Connect with successful Yale alumni in your field"
      }
    ]

    return opportunities
  }

  private async findYaleConnections(dream: string, profile: any): Promise<YaleConnection[]> {
    // Mock Yale connections - in production, would query alumni database
    const connections = [
      {
        name: "Sarah Johnson",
        role: "Senior Software Engineer",
        company: "Google",
        year: 2018,
        contact: "sarah.johnson@alumni.yale.edu",
        relevance: "Works in your target company and role"
      },
      {
        name: "Michael Chen",
        role: "Product Manager",
        company: "Meta",
        year: 2019,
        contact: "michael.chen@alumni.yale.edu",
        relevance: "Same major, similar career path"
      },
      {
        name: "Emily Rodriguez",
        role: "Engineering Manager",
        company: "Microsoft",
        year: 2017,
        contact: "emily.rodriguez@alumni.yale.edu",
        relevance: "Yale Computer Science alumna, hiring manager"
      }
    ]

    return connections
  }

  private analyzeDream(dream: string): DreamAnalysis {
    // Mock dream analysis - in production, would use OpenAI to parse goals
    const words = dream.toLowerCase().split(' ')
    
    const parsedGoals = []
    if (words.includes('engineer') || words.includes('engineering')) {
      parsedGoals.push('Become a software engineer')
    }
    if (words.includes('manager') || words.includes('lead')) {
      parsedGoals.push('Develop leadership skills')
    }
    if (words.includes('startup') || words.includes('entrepreneur')) {
      parsedGoals.push('Work in startup environment')
    }
    if (words.includes('ai') || words.includes('machine learning')) {
      parsedGoals.push('Work with AI/ML technologies')
    }

    return {
      parsedGoals: parsedGoals.length > 0 ? parsedGoals : ['Build a successful career'],
      timeline: '2-5 years',
      requirements: ['Technical skills', 'Networking', 'Experience'],
      difficulty: 'Medium' as const,
      estimatedTime: '3-4 years'
    }
  }

  private async saveDream(userId: string, dream: string, analysis: DreamAnalysis, actionPlan: DreamPlan) {
    const { error } = await this.supabase
      .from('user_dreams')
      .insert({
        user_id: userId,
        dream_text: dream,
        analysis: analysis,
        action_plan: actionPlan,
        status: 'active'
      })

    if (error) {
      console.error('Error saving dream:', error)
    }
  }

  async getUserDreams(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('user_dreams')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async updateDreamStatus(dreamId: string, status: string) {
    const { error } = await this.supabase
      .from('user_dreams')
      .update({ status })
      .eq('id', dreamId)

    if (error) throw error
  }

  // Universal Search Methods
  private async analyzeSearchQuery(query: string, profile: any): Promise<any> {
    const prompt = `Analyze this search query from a Yale student: "${query}"
    
    Determine:
    1. Primary search type (career, alumni, research, opportunity, company, program, course, event, general)
    2. Intent (find jobs, connect with people, learn about programs, etc.)
    3. Key entities (companies, people, skills, locations, etc.)
    4. Urgency level (immediate, planning, exploratory)
    
    Return JSON with: type, intent, entities, urgency, confidence
    `

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })

      return JSON.parse(response.choices[0].message.content || '{}')
    } catch (error) {
      console.error('Error analyzing search query:', error)
      return { type: 'general', intent: 'explore', entities: [], urgency: 'exploratory', confidence: 0.5 }
    }
  }

  private async searchCareers(query: string, profile: any): Promise<SearchResult[]> {
    // Search job database, career services, etc.
    const results: SearchResult[] = []
    
    // Mock career search - in production, would query job databases
    if (query.toLowerCase().includes('engineer') || query.toLowerCase().includes('software')) {
      results.push({
        type: 'career',
        title: 'Software Engineering Opportunities',
        description: 'Find software engineering internships and full-time positions at top tech companies',
        relevance: 90,
        url: '/careers/software-engineering',
        metadata: { category: 'tech', level: 'entry' }
      })
    }

    if (query.toLowerCase().includes('consulting') || query.toLowerCase().includes('mckinsey')) {
      results.push({
        type: 'career',
        title: 'Management Consulting Careers',
        description: 'Explore consulting opportunities at McKinsey, BCG, Bain, and other top firms',
        relevance: 85,
        url: '/careers/consulting',
        metadata: { category: 'consulting', level: 'entry' }
      })
    }

    return results
  }

  private async searchAlumni(query: string, profile: any): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    
    // Mock alumni search - in production, would query alumni database
    if (query.toLowerCase().includes('alumni') || query.toLowerCase().includes('yale')) {
      results.push({
        type: 'alumni',
        title: 'Yale Alumni Network',
        description: 'Connect with Yale alumni in your field of interest',
        relevance: 80,
        url: '/alumni/search',
        metadata: { network: 'yale', total: 150000 }
      })
    }

    if (query.toLowerCase().includes('google') || query.toLowerCase().includes('tech')) {
      results.push({
        type: 'alumni',
        title: 'Yale Alumni at Google',
        description: 'Find Yale graduates working at Google and other tech companies',
        relevance: 75,
        url: '/alumni/companies/google',
        metadata: { company: 'google', count: 250 }
      })
    }

    return results
  }

  private async searchResearch(query: string, profile: any): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    
    // Mock research search - in production, would query research databases
    if (query.toLowerCase().includes('research') || query.toLowerCase().includes('lab')) {
      results.push({
        type: 'research',
        title: 'Yale Research Opportunities',
        description: 'Find research assistant positions and lab opportunities at Yale',
        relevance: 85,
        url: '/research/opportunities',
        metadata: { institution: 'yale', type: 'assistant' }
      })
    }

    if (query.toLowerCase().includes('ai') || query.toLowerCase().includes('machine learning')) {
      results.push({
        type: 'research',
        title: 'AI/ML Research Labs',
        description: 'Explore artificial intelligence and machine learning research opportunities',
        relevance: 80,
        url: '/research/ai-ml',
        metadata: { field: 'ai', type: 'lab' }
      })
    }

    return results
  }

  private async searchOpportunities(query: string, profile: any): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    
    // Mock opportunities search - in production, would query opportunity databases
    if (query.toLowerCase().includes('internship') || query.toLowerCase().includes('summer')) {
      results.push({
        type: 'opportunity',
        title: 'Summer Internships',
        description: 'Discover summer internship opportunities across various industries',
        relevance: 90,
        url: '/opportunities/internships',
        metadata: { season: 'summer', type: 'internship' }
      })
    }

    if (query.toLowerCase().includes('fellowship') || query.toLowerCase().includes('scholarship')) {
      results.push({
        type: 'opportunity',
        title: 'Fellowships & Scholarships',
        description: 'Find funding opportunities and prestigious fellowships for Yale students',
        relevance: 85,
        url: '/opportunities/fellowships',
        metadata: { type: 'funding', level: 'undergraduate' }
      })
    }

    return results
  }

  private async generateSuggestions(query: string, profile: any): Promise<string[]> {
    // Generate contextual suggestions based on the query and user profile
    const suggestions = [
      `${query} at Yale`,
      `${query} internships`,
      `${query} alumni network`,
      `${query} research opportunities`,
      `How to get into ${query}`,
      `${query} career paths`
    ]

    return suggestions.slice(0, 5)
  }

  private async generateRelatedSearches(query: string, profile: any): Promise<string[]> {
    // Generate related search terms
    const related = [
      `Yale ${query}`,
      `${query} for students`,
      `${query} opportunities`,
      `${query} networking`,
      `${query} preparation`
    ]

    return related.slice(0, 4)
  }

  private async saveSearch(userId: string, query: string, analysis: any, results: SearchResult[]) {
    try {
      const { error } = await this.supabase
        .from('search_history')
        .insert({
          user_id: userId,
          query,
          search_type: analysis.type,
          results_count: results.length,
          analysis,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving search:', error)
      }
    } catch (error) {
      console.error('Error saving search history:', error)
    }
  }
}
