import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface RawJob {
  company: string
  title: string
  location: string
  apply_url: string
}

interface EnrichedJob {
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

serve(async (req) => {
  try {
    // Fetch SimplifyJobs data
    const internshipsRes = await fetch('https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md')
    const newGradRes = await fetch('https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/README.md')
    
    if (!internshipsRes.ok || !newGradRes.ok) {
      throw new Error('Failed to fetch job data from GitHub')
    }
    
    const internshipsMd = await internshipsRes.text()
    const newGradMd = await newGradRes.text()
    
    // Parse markdown tables
    const jobs = parseSimplifyJobs(internshipsMd + newGradMd)
    
    // Enrich with company data
    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => ({
        ...job,
        id: crypto.randomUUID(),
        lifestyle_data: await enrichLifestyle(job.company),
        yale_network: await getYaleNetwork(job.company),
        growth_data: await getGrowthData(job.company, job.title),
        embedding: await generateEmbedding(job.description || `${job.company} ${job.title}`)
      }))
    )
    
    // Batch upsert to database
    const { data, error } = await supabase
      .from('jobs')
      .upsert(enrichedJobs, { 
        onConflict: 'company,title,location',
        ignoreDuplicates: false 
      })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ 
      synced: enrichedJobs.length, 
      status: 'success',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Sync error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      status: 'error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

function parseSimplifyJobs(markdown: string): RawJob[] {
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
        const applyUrl = extractUrl(parts[3])
        
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

function extractUrl(text: string): string {
  // Extract URL from markdown link format [text](url)
  const match = text.match(/\[([^\]]+)\]\(([^)]+)\)/)
  return match ? match[2] : text
}

async function enrichLifestyle(company: string): Promise<any> {
  // Mock enrichment - in production, scrape from Glassdoor, company sites
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

async function getYaleNetwork(company: string): Promise<any> {
  // Mock Yale network data - in production, query LinkedIn, Yale alumni database
  return {
    totalCount: Math.floor(Math.random() * 50) + 5,
    recentHires: [
      { name: "John Doe", year: 2023, role: "Software Engineer" },
      { name: "Jane Smith", year: 2022, role: "Product Manager" }
    ],
    connections: Math.floor(Math.random() * 20) + 1
  }
}

async function getGrowthData(company: string, title: string): Promise<any> {
  // Mock growth data - in production, analyze career progression data
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

async function generateEmbedding(text: string): Promise<number[]> {
  // Mock embedding generation - in production, would use OpenAI embeddings API
  // For now, return a random vector of the correct dimension
  const embedding = new Array(1536).fill(0).map(() => Math.random() - 0.5)
  return embedding
}
