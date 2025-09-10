import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { OpenAI } from 'https://esm.sh/openai@4'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

serve(async (req) => {
  try {
    const { dream, userId } = await req.json()
    
    if (!dream || !userId) {
      return new Response(JSON.stringify({ 
        error: 'Dream text and user ID are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Get user profile for context
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    // Parallel LLM calls for comprehensive planning
    const [actionSteps, opportunities, connections] = await Promise.all([
      generateActionSteps(dream, profile),
      findRelevantOpportunities(dream, profile), 
      findYaleConnections(dream, profile)
    ])

    // Save dream and analysis
    const analysis = analyzeDream(dream)
    const { error: saveError } = await supabase
      .from('user_dreams')
      .insert({
        user_id: userId,
        dream_text: dream,
        analysis: analysis,
        action_plan: { actionSteps, opportunities, connections },
        status: 'active'
      })

    if (saveError) {
      console.error('Error saving dream:', saveError)
    }

    return new Response(JSON.stringify({
      success: true,
      actionSteps,
      opportunities, 
      connections,
      analysis
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Dream processing error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function generateActionSteps(dream: string, profile: any): Promise<any[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `You are a career advisor for Yale students. Generate 5-7 specific, actionable next steps for achieving this career goal. Consider the student's major (${profile.major}) and graduation year (${profile.class_year}). Focus on immediate actions they can take this week. Return as JSON array with objects containing: step, timeframe, priority, resources.`
      }, {
        role: "user", 
        content: dream
      }],
      temperature: 0.7
    })

    const content = completion.choices[0].message.content
    return JSON.parse(content || '[]')
  } catch (error) {
    console.error('Error generating action steps:', error)
    // Fallback to mock data
    return [
      {
        step: "Research companies in your target industry",
        timeframe: "This week",
        priority: "High",
        resources: ["LinkedIn", "Company websites", "Glassdoor"]
      },
      {
        step: "Update your resume and LinkedIn profile",
        timeframe: "Next 2 weeks",
        priority: "High",
        resources: ["Yale Career Services", "Resume templates", "LinkedIn guides"]
      }
    ]
  }
}

async function findRelevantOpportunities(dream: string, profile: any): Promise<any[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `You are a career advisor. Find 4-6 relevant opportunities (jobs, internships, programs, courses) for this career goal. Consider the student's major (${profile.major}) and graduation year (${profile.class_year}). Return as JSON array with objects containing: title, company, type, relevance, url, description.`
      }, {
        role: "user",
        content: dream
      }],
      temperature: 0.7
    })

    const content = completion.choices[0].message.content
    return JSON.parse(content || '[]')
  } catch (error) {
    console.error('Error finding opportunities:', error)
    // Fallback to mock data
    return [
      {
        title: "Software Engineering Intern",
        company: "Google",
        type: "Internship",
        relevance: 95,
        url: "https://careers.google.com/jobs/results/",
        description: "Build products that impact billions of users worldwide"
      }
    ]
  }
}

async function findYaleConnections(dream: string, profile: any): Promise<any[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `You are a Yale alumni network advisor. Find 3-4 Yale alumni who could help with this career goal. Consider the student's major (${profile.major}). Return as JSON array with objects containing: name, role, company, year, contact, relevance.`
      }, {
        role: "user",
        content: dream
      }],
      temperature: 0.7
    })

    const content = completion.choices[0].message.content
    return JSON.parse(content || '[]')
  } catch (error) {
    console.error('Error finding connections:', error)
    // Fallback to mock data
    return [
      {
        name: "Sarah Johnson",
        role: "Senior Software Engineer",
        company: "Google",
        year: 2018,
        contact: "sarah.johnson@alumni.yale.edu",
        relevance: "Works in your target company and role"
      }
    ]
  }
}

function analyzeDream(dream: string): any {
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
    difficulty: 'Medium',
    estimatedTime: '3-4 years'
  }
}
