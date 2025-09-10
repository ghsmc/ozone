import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { openaiService } from './openai'
import { pineconeService } from './pinecone'

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

export interface RawJob {
  company: string
  title: string
  location: string
  apply_url: string
}

export interface EnrichedJob {
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
}

export class JobSyncService {
  private supabase = supabase
  
  async syncFromGitHub(): Promise<{ synced: number; errors: any }> {
    try {
      const repos = [
        'SimplifyJobs/Summer2026-Internships',
        'SimplifyJobs/New-Grad-Positions'
      ]
      
      const allJobs: RawJob[] = []
      
      for (const repo of repos) {
        const markdown = await this.fetchMarkdown(repo)
        const jobs = this.parseMarkdownTable(markdown)
        allJobs.push(...jobs)
      }
      
      // Remove duplicates based on company + title + location
      const uniqueJobs = this.removeDuplicates(allJobs)
      
      // Enrich with additional data
      const enrichedJobs = await Promise.all(
        uniqueJobs.map(job => this.enrichJobData(job))
      )
      
      // Batch upsert with conflict resolution
      const { data, error } = await this.supabase
        .from('jobs')
        .upsert(enrichedJobs, {
          onConflict: 'company,title,location',
          ignoreDuplicates: false
        })
        
      return { synced: enrichedJobs.length, errors: error }
    } catch (error) {
      console.error('Job sync error:', error)
      return { synced: 0, errors: error }
    }
  }
  
  private async fetchMarkdown(repo: string): Promise<string> {
    const response = await fetch(`https://raw.githubusercontent.com/${repo}/dev/README.md`)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${repo}: ${response.statusText}`)
    }
    return response.text()
  }
  
  private parseMarkdownTable(markdown: string): RawJob[] {
    const lines = markdown.split('\n')
    const jobs: RawJob[] = []
    
    let inTable = false
    for (const line of lines) {
      // Detect table start
      if (line.includes('|') && line.includes('Company')) {
        inTable = true
        continue
      }
      
      // Skip separator lines
      if (inTable && line.includes('|---')) {
        continue
      }
      
      // Parse table rows
      if (inTable && line.includes('|')) {
        const parts = line.split('|').map(p => p.trim()).filter(p => p)
        
        if (parts.length >= 4) {
          const company = parts[0]
          const title = parts[1]
          const location = parts[2]
          const applyUrl = this.extractUrl(parts[3])
          
          if (company && title && applyUrl) {
            jobs.push({
              company,
              title,
              location,
              apply_url: applyUrl
            })
          }
        }
      }
      
      // Stop at end of table
      if (inTable && !line.includes('|') && line.trim() !== '') {
        inTable = false
      }
    }
    
    return jobs
  }
  
  private extractUrl(text: string): string {
    // Extract URL from markdown link format [text](url)
    const match = text.match(/\[([^\]]+)\]\(([^)]+)\)/)
    return match ? match[2] : text
  }
  
  private removeDuplicates(jobs: RawJob[]): RawJob[] {
    const seen = new Set<string>()
    return jobs.filter(job => {
      const key = `${job.company}|${job.title}|${job.location}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }
  
  private async enrichJobData(rawJob: RawJob): Promise<EnrichedJob> {
    const enrichedJob = {
      id: crypto.randomUUID(),
      company: rawJob.company,
      title: rawJob.title,
      location: rawJob.location || null,
      remote_type: this.determineRemoteType(rawJob.location),
      salary: await this.estimateSalary(rawJob),
      description: null, // Would be populated from job scraping
      requirements: null, // Would be populated from job scraping
      industry: this.categorizeIndustry(rawJob.company),
      company_size: this.determineCompanySize(rawJob.company),
      apply_url: rawJob.apply_url,
      source: 'simplifyjobs',
      lifestyle_data: await this.getLifestyleData(rawJob.company),
      yale_network: await this.getYaleNetwork(rawJob.company),
      growth_data: await this.getGrowthData(rawJob.company),
      embedding: null, // Will be generated and stored in Pinecone
      active: true
    }

    // Generate embedding and store in Pinecone
    try {
      const embedding = await openaiService.generateJobEmbedding(enrichedJob)
      await pineconeService.upsertJobEmbedding(enrichedJob.id, embedding, {
        company: enrichedJob.company,
        title: enrichedJob.title,
        industry: enrichedJob.industry,
        location: enrichedJob.location,
        remote_type: enrichedJob.remote_type
      })
      console.log(`Generated and stored embedding for job: ${enrichedJob.company} - ${enrichedJob.title}`)
    } catch (error) {
      console.error(`Error generating embedding for job ${enrichedJob.id}:`, error)
      // Continue without embedding - job will still be saved
    }

    return enrichedJob
  }
  
  private determineRemoteType(location: string): string | null {
    if (!location) return null
    
    const locationLower = location.toLowerCase()
    if (locationLower.includes('remote')) return 'remote'
    if (locationLower.includes('hybrid')) return 'hybrid'
    return 'onsite'
  }
  
  private async estimateSalary(job: RawJob): Promise<any> {
    // Mock salary estimation - in production, would use salary data APIs
    const baseSalary = this.getEstimatedBaseSalary(job.title, job.company)
    return {
      base: baseSalary,
      bonus: Math.round(baseSalary * 0.1),
      total: Math.round(baseSalary * 1.1),
      benefits: ['Health Insurance', '401k', 'PTO']
    }
  }
  
  private getEstimatedBaseSalary(title: string, company: string): number {
    // Simple salary estimation based on title keywords
    const titleLower = title.toLowerCase()
    
    if (titleLower.includes('senior') || titleLower.includes('lead')) {
      return 120000
    } else if (titleLower.includes('staff') || titleLower.includes('principal')) {
      return 150000
    } else if (titleLower.includes('intern')) {
      return 6000 // Monthly
    } else {
      return 90000 // Entry level
    }
  }
  
  private categorizeIndustry(company: string): string {
    // Simple industry categorization
    const companyLower = company.toLowerCase()
    
    if (companyLower.includes('google') || companyLower.includes('meta') || 
        companyLower.includes('apple') || companyLower.includes('microsoft')) {
      return 'Technology'
    } else if (companyLower.includes('goldman') || companyLower.includes('jpmorgan') ||
               companyLower.includes('morgan stanley') || companyLower.includes('blackrock')) {
      return 'Finance'
    } else if (companyLower.includes('mckinsey') || companyLower.includes('bain') ||
               companyLower.includes('bcg') || companyLower.includes('deloitte')) {
      return 'Consulting'
    } else {
      return 'Technology' // Default
    }
  }
  
  private determineCompanySize(company: string): string {
    // Simple company size determination
    const companyLower = company.toLowerCase()
    
    if (companyLower.includes('google') || companyLower.includes('meta') || 
        companyLower.includes('apple') || companyLower.includes('microsoft') ||
        companyLower.includes('amazon') || companyLower.includes('netflix')) {
      return 'Large (10,000+)'
    } else if (companyLower.includes('startup') || companyLower.includes('incubator')) {
      return 'Startup (< 100)'
    } else {
      return 'Medium (100-10,000)'
    }
  }
  
  private async getLifestyleData(company: string): Promise<any> {
    // Mock lifestyle data - in production, would scrape from Glassdoor, company sites
    return {
      officePhotos: [`/companies/${company.toLowerCase().replace(/\s+/g, '-')}/office1.jpg`],
      schedule: [
        { time: "9:00 AM", activity: "Team standup" },
        { time: "10:00 AM", activity: "Deep work" },
        { time: "2:00 PM", activity: "Collaboration time" }
      ],
      cultureQuote: "Great place for growth and learning",
      quotee: "Previous Intern"
    }
  }
  
  private async getYaleNetwork(company: string): Promise<any> {
    // Mock Yale network data - in production, would query LinkedIn, Yale alumni database
    return {
      totalCount: Math.floor(Math.random() * 50) + 5,
      recentHires: [
        { name: "John Doe", year: 2023, role: "Software Engineer" },
        { name: "Jane Smith", year: 2022, role: "Product Manager" }
      ],
      connections: Math.floor(Math.random() * 20) + 1
    }
  }
  
  private async getGrowthData(company: string): Promise<any> {
    // Mock growth data - in production, would analyze career progression data
    return {
      promotionRate: Math.random() * 0.3 + 0.2, // 20-50%
      averageTenure: Math.floor(Math.random() * 3) + 2, // 2-5 years
      careerPaths: [
        "Individual Contributor",
        "Team Lead",
        "Engineering Manager"
      ]
    }
  }
}
