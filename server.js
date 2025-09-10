import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { TrackrScraper } from './scraper/the-trackr-scraper.js';
import { openaiJSON, withTimeout } from './openai.js';

dotenv.config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize SQLite database
const db = new sqlite3.Database('./yale.db');
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

const MILO_SYSTEM_PROMPT = `You are Milo, an AI opportunity scout built by Yale students, for Yale students. Your job is to help a student uncover unconventional, energizing opportunities—internships, part-time work, research, fellowships, study-abroad, alumni projects—that align with their values and curiosities. You must prove what's possible with specific, real options and immediate next steps.

Research & Psychology Principles (baked in):
- Originality over conformity: de-default from consulting/IB/FAANG pipelines; surface non-obvious doors and "create your own slot" options.
- Passion is discovered through doing: recommend small experiments → projects → commitments.
- Hidden potential & character skills: nudge toward growth via challenge, feedback, and craft.
- Givers win long-run: include options that help communities or build ecosystems.
- Deep work over optics: prefer opportunities that build real skill, portfolio artifacts, and relationships.

RESEARCH EMPHASIS: Prioritize research opportunities including:
- Yale research labs and centers (Yale School of Medicine, Yale Center for Research Computing, Yale Institute for Network Science, etc.)
- Undergraduate research fellowships and assistantships
- Summer research programs at Yale and peer institutions
- Research internships at national labs, hospitals, and research institutions
- Faculty research projects and independent study opportunities
- Research grants and funding opportunities for student projects

Output rules (non-negotiable):
- Be specific: At least 5 items must be name-level (company, lab, program, fellowship, professor) + a link (or exact path to find it) + why it fits this student.
- Yale leverage: Always include 3+ Yale-connected leads (centers, labs, professors, alumni orgs, study-abroad the college approves).
- Research focus: At least 2-3 opportunities should be research-related (labs, fellowships, research assistantships).
- Time-of-year awareness: Tailor to current term (application windows, priority timelines, which doors are hot vs. closed).
- Action ladder: For each item, include (a) first touch (who/how to contact), (b) micro-project to propose, (c) apply/interview step.
- Diversity of bets: Balance by scope & risk: quick shadowing / micro-RA → part-time/semester RA → funded summer → bold proposal (grant/fellowship).
- No filler: If you're unsure of a detail, say how to verify it in 1 step (e.g., "Search 'site:[org].org internship'").

Return valid JSON matching the exact schema provided.`;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    student_reflection: {
      type: "object",
      properties: {
        who_you_are: { type: "string" },
        motivations: { type: "array", items: { type: "string" } },
        skill_themes: { type: "array", items: { type: "string" } },
        time_of_year_implications: { type: "array", items: { type: "string" } }
      },
      required: ["who_you_are", "motivations", "skill_themes", "time_of_year_implications"]
    },
    opportunities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          org_name: { type: "string" },
          category: { type: "string", enum: ["internship", "part_time", "research_RA", "fellowship", "study_abroad", "startup_shadow", "self_designed"] },
          why_it_fits: { type: "string" },
          link_or_how_to_find: { type: "string" },
          yale_connection: { type: "string", enum: ["professor", "lab", "center", "alumni", "none"] },
          contact: {
            type: "object",
            properties: {
              name_or_role: { type: "string" },
              email_or_handle: { type: ["string", "null"] },
              how_to_get_introduced: { type: "string" }
            },
            required: ["name_or_role", "email_or_handle", "how_to_get_introduced"]
          },
          action_ladder: {
            type: "object",
            properties: {
              first_touch: { type: "string" },
              micro_project_to_offer: { type: "string" },
              apply_or_interview_step: { type: "string" }
            },
            required: ["first_touch", "micro_project_to_offer", "apply_or_interview_step"]
          },
          timing: {
            type: "object",
            properties: {
              best_apply_window: { type: "string" },
              notes_for_current_term: { type: "string" }
            },
            required: ["best_apply_window", "notes_for_current_term"]
          },
          constraints_fit: { type: "array", items: { type: "string" } }
        },
        required: ["title", "org_name", "category", "why_it_fits", "link_or_how_to_find", "yale_connection", "contact", "action_ladder", "timing", "constraints_fit"]
      },
      minItems: 5
    },
    yale_specific_doors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string", enum: ["center", "lab", "program", "professor", "alumni_network"] },
          link: { type: "string" },
          how_to_engage: { type: "string" },
          exact_next_step: { type: "string" }
        },
        required: ["name", "type", "link", "how_to_engage", "exact_next_step"]
      },
      minItems: 3
    },
    weekly_plan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string" },
          task: { type: "string" }
        },
        required: ["day", "task"]
      }
    },
    quality_checks: {
      type: "object",
      properties: {
        specific_items_count: { type: "number" },
        yale_items_count: { type: "number" },
        links_present: { type: "boolean" },
        aligned_with_constraints: { type: "boolean" }
      },
      required: ["specific_items_count", "yale_items_count", "links_present", "aligned_with_constraints"]
    }
  },
  required: ["student_reflection", "opportunities", "yale_specific_doors", "weekly_plan", "quality_checks"]
};

// ---- JSON Schemas ----
const picksSchema = {
  type: "object",
  properties: {
    top_picks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          company: { type: "string" },
          location: { type: "string" },
          deadline: { type: "string" },
          score: { type: "number" },
          why: { type: "array", items: { type: "string" } },
          links: { 
            type: "array", 
            items: { 
              type: "object", 
              properties: {
                label: { type: "string" }, 
                url: { type: "string" }
              }, 
              required: ["label","url"],
              additionalProperties: false
            } 
          }
        },
        required: ["id","title","company","location","deadline","score","why","links"],
        additionalProperties: false
      },
      minItems: 3, 
      maxItems: 5
    }
  },
  required: ["top_picks"],
  additionalProperties: false
};

const whySchema = {
  type: "object",
  properties: { 
    why_this_works: { 
      type: "array", 
      items: { type: "string" }, 
      minItems: 2, 
      maxItems: 4 
    } 
  },
  required: ["why_this_works"],
  additionalProperties: false
};

const voicesSchema = {
  type: "object",
  properties: { 
    what_people_are_saying: { 
      type: "array", 
      items: { 
        type: "object", 
        properties: {
          source: { type: "string" }, 
          quote: { type: "string" }
        }, 
        required: ["source","quote"],
        additionalProperties: false
      }, 
      minItems: 1, 
      maxItems: 3 
    } 
  },
  required: ["what_people_are_saying"],
  additionalProperties: false
};

// ---- Enhanced Tavily search (real info) ----
async function tavilySearch(q, category = null) {
  try {
    if (!process.env.TAVILY_API_KEY) return [];
    
    // Enhanced search queries based on category
    let searchQueries = [q];
    if (category === 'research') {
      searchQueries = [
        q,
        `Yale University research opportunities ${q}`,
        `Yale computer science research labs internships`,
        `Yale undergraduate research programs 2024`
      ];
    } else if (category === 'internship') {
      searchQueries = [
        q,
        `Yale alumni ${q} internships`,
        `Yale students ${q} opportunities`,
        `Yale career services ${q}`
      ];
    }
    
    const allResults = [];
    
    // Search multiple queries in parallel
    const searchPromises = searchQueries.slice(0, 2).map(async (query) => {
      const r = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Tavily-Key": process.env.TAVILY_API_KEY },
        body: JSON.stringify({ 
          query, 
          max_results: 8,
          search_depth: "advanced",
          include_answer: true,
          include_raw_content: true
        })
      });
      if (!r.ok) return [];
      const j = await r.json();
      return (j.results || []).map((x) => ({ 
        source: x.title || "Web Source", 
        quote: x.snippet || x.url || "",
        url: x.url,
        relevance: x.score || 0.5
      }));
    });
    
    const results = await Promise.all(searchPromises);
    const flattened = results.flat();
    
    // Remove duplicates and sort by relevance
    const unique = flattened.filter((item, index, self) => 
      index === self.findIndex(t => t.quote === item.quote)
    );
    
    return unique
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);
      
  } catch (error) {
    console.error("Tavily search error:", error);
    return [];
  }
}

// ---- SSE helpers ----
function sseHeaders(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control"
  });
}

function emit(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  // try to flush if supported
  if (res.flush) res.flush();
}

// API Routes

// User Profile Management
app.post('/api/profiles', async (req, res) => {
  try {
    const { profileData } = req.body;
    
    if (!profileData) {
      return res.status(400).json({ error: 'Profile data is required' });
    }

    // In a real app, you'd save this to a database
    // For now, we'll just return success
    console.log('Profile saved:', profileData);
    
    res.json({ 
      success: true, 
      message: 'Profile saved successfully',
      profileId: profileData.id || crypto.randomUUID()
    });

  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

app.get('/api/profiles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // In a real app, you'd fetch from database
    // For now, return a mock profile
    const mockProfile = {
      id: userId,
      email: 'demo@yale.edu',
      name: 'Demo User',
      school: 'Yale University',
      major: 'Computer Science',
      class_year: new Date().getFullYear(),
      preferences: {
        preferred_locations: ['New York', 'San Francisco'],
        preferred_industries: ['Technology', 'Finance'],
        skills: ['Programming', 'Data Analysis'],
        interests: ['AI', 'Machine Learning']
      }
    };
    
    res.json(mockProfile);

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Job Matching API - Now using real Yale alumni data
app.post('/api/jobs/matched', async (req, res) => {
  try {
    const { userProfile } = req.body;
    
    if (!userProfile) {
      return res.status(400).json({ error: 'User profile is required' });
    }

    // Generate jobs based on real companies where Yale alumni work
    const realJobs = await generateRealJobsFromYaleDB(userProfile);
    
    res.json({ jobs: realJobs });

  } catch (error) {
    console.error('Error generating matched jobs:', error);
    res.status(500).json({ error: 'Failed to generate matched jobs' });
  }
});

// Helper function to generate jobs from real Yale alumni data
async function generateRealJobsFromYaleDB(userProfile) {
  try {
    // Get scraped internships from The Trackr
    let trackrInternships = [];
    try {
      const filepath = path.join(process.cwd(), 'data', 'trackr-internships.json');
      if (fs.existsSync(filepath)) {
        trackrInternships = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        console.log(`Loaded ${trackrInternships.length} internships from The Trackr`);
      }
    } catch (error) {
      console.log('No Trackr internship data found, continuing with Yale alumni data only');
    }

    // Get top companies where Yale alumni work (excluding Yale itself and self-employed)
    const topCompaniesQuery = `
      SELECT 
        company,
        COUNT(*) as alumni_count,
        AVG(connections) as avg_connections,
        COUNT(CASE WHEN connections > 500 THEN 1 END) as high_network_count
      FROM clean_yale_profiles 
      WHERE company IS NOT NULL 
        AND company != '' 
        AND company NOT LIKE '%Yale%'
        AND company NOT LIKE '%Self%'
        AND company NOT LIKE '%Freelance%'
      GROUP BY company 
      HAVING alumni_count >= 5
      ORDER BY alumni_count DESC, avg_connections DESC
      LIMIT 50
    `;

    const companies = await dbAll(topCompaniesQuery);

    // Get common job titles from experiences
    const jobTitlesQuery = `
      SELECT 
        title,
        company,
        COUNT(*) as frequency
      FROM clean_experiences 
      WHERE title IS NOT NULL 
        AND title != ''
        AND company IN (${companies.map(() => '?').join(',')})
      GROUP BY title, company
      HAVING frequency >= 2
      ORDER BY frequency DESC
    `;

    const jobTitles = await dbAll(jobTitlesQuery, companies.map(c => c.company));

    // Create job postings based on real data
    const jobs = [];
    const locations = ['New York, NY', 'San Francisco, CA', 'Boston, MA', 'Seattle, WA', 'Chicago, IL', 'Los Angeles, CA', 'Washington, DC', 'Austin, TX'];
    const workModels = ['Remote', 'Hybrid', 'In-Person'];
    
    // Research institutions (Yale-specific)
    const researchInstitutions = [
      'Yale School of Medicine', 'Yale Center for Research Computing', 
      'Yale Institute for Network Science', 'Yale Center for Engineering Innovation & Design',
      'Yale School of Public Health', 'Yale Center for Business and the Environment',
      'Yale Center for Emotional Intelligence', 'Yale Center for Molecular Discovery'
    ];

    // Generate jobs from real companies
    companies.slice(0, 20).forEach((company, index) => {
      const companyJobTitles = jobTitles.filter(jt => jt.company === company.company);
      let title;
      
      if (companyJobTitles.length > 0) {
        // Get the most common title for this company
        title = companyJobTitles[0].title;
        // Clean up the title if it's the same as company name
        if (title === company.company) {
          title = getDefaultTitleForCompany(company.company);
        }
      } else {
        title = getDefaultTitleForCompany(company.company);
      }

      const isResearch = researchInstitutions.some(inst => company.company.includes(inst));
      
      jobs.push({
        id: index + 1,
        company: company.company,
        title: title,
        location: locations[Math.floor(Math.random() * locations.length)],
        salary: generateSalaryForTitle(title, isResearch),
        workModel: isResearch ? 'In-Person' : workModels[Math.floor(Math.random() * workModels.length)],
        matchScore: Math.floor(Math.random() * 25) + 75, // 75-100% match
        yaleCount: company.alumni_count,
        isResearch: isResearch,
        description: generateJobDescription(company.company, title, isResearch),
        skills: generateSkillsForTitle(title),
        postedDate: getRandomPostedDate(),
        industry: getIndustryForCompany(company.company)
      });
    });

    // Add some research opportunities
    researchInstitutions.slice(0, 5).forEach((institution, index) => {
      const researchTitles = [
        'Research Assistant', 'Undergraduate Research Fellow', 'Lab Technician', 
        'Data Analysis Intern', 'Research Intern', 'Graduate Research Assistant'
      ];
      
      jobs.push({
        id: companies.length + index + 1,
        company: institution,
        title: researchTitles[Math.floor(Math.random() * researchTitles.length)],
        location: 'New Haven, CT',
        salary: generateResearchSalary(),
        workModel: 'In-Person',
        matchScore: Math.floor(Math.random() * 20) + 80, // 80-100% for research
        yaleCount: Math.floor(Math.random() * 20) + 10, // More Yale connections for research
        isResearch: true,
        description: generateResearchDescription(institution),
        skills: ['Research', 'Data Analysis', 'Academic Writing', 'Lab Techniques'],
        postedDate: getRandomPostedDate(),
        industry: 'Research'
      });
    });

    // Add Trackr internships
    trackrInternships.slice(0, 10).forEach((internship, index) => {
      // Find Yale alumni count for this company
      const yaleAlumniCount = companies.find(c => 
        c.company.toLowerCase().includes(internship.company.toLowerCase()) ||
        internship.company.toLowerCase().includes(c.company.toLowerCase())
      )?.alumni_count || Math.floor(Math.random() * 10) + 1;

      jobs.push({
        id: companies.length + researchInstitutions.length + index + 1,
        company: internship.company,
        title: internship.title,
        location: internship.location,
        salary: generateInternshipSalary(),
        workModel: 'In-Person', // Most internships are in-person
        matchScore: Math.floor(Math.random() * 25) + 75, // 75-100% match
        yaleCount: yaleAlumniCount,
        isResearch: false,
        description: internship.description || `Join ${internship.company} as a ${internship.title}. This internship offers hands-on experience in the finance industry with mentorship from experienced professionals.`,
        skills: ['Financial Analysis', 'Excel', 'PowerPoint', 'Communication', 'Teamwork'],
        postedDate: internship.scraped_at ? new Date(internship.scraped_at).toLocaleDateString() : getRandomPostedDate(),
        industry: 'Finance',
        source: 'The Trackr',
        externalUrl: internship.url
      });
    });

    return jobs;

  } catch (error) {
    console.error('Error generating real jobs:', error);
    // Fallback to mock jobs if database query fails
    return generateMockJobs(userProfile);
  }
}

// Helper functions for job generation
function getDefaultTitleForCompany(company) {
  const titleMap = {
    'Google': 'Software Engineer',
    'Apple': 'Product Manager',
    'Microsoft': 'Software Engineer',
    'Meta': 'Data Scientist',
    'Amazon': 'Software Development Engineer',
    'Goldman Sachs': 'Investment Banking Analyst',
    'McKinsey & Company': 'Business Analyst',
    'Boston Consulting Group (BCG)': 'Consultant',
    'JPMorgan Chase': 'Investment Banking Analyst',
    'Morgan Stanley': 'Investment Banking Analyst',
    'Bain & Company': 'Consultant',
    'Deloitte': 'Consultant',
    'PwC': 'Associate',
    'EY': 'Associate',
    'KPMG': 'Associate',
    'Netflix': 'Software Engineer',
    'Tesla': 'Software Engineer',
    'Uber': 'Software Engineer',
    'Airbnb': 'Product Manager',
    'Stripe': 'Software Engineer',
    'Palantir': 'Software Engineer',
    'Snowflake': 'Software Engineer',
    'Databricks': 'Software Engineer',
    'MongoDB': 'Software Engineer',
    'Elastic': 'Software Engineer',
    'Splunk': 'Software Engineer',
    'ServiceNow': 'Software Engineer',
    'Workday': 'Software Engineer',
    'Salesforce': 'Software Engineer',
    'HubSpot': 'Software Engineer',
    'Zendesk': 'Software Engineer',
    'Twilio': 'Software Engineer',
    'Shopify': 'Software Engineer',
    'Square': 'Software Engineer',
    'PayPal': 'Software Engineer',
    'Visa': 'Software Engineer',
    'Mastercard': 'Software Engineer',
    'American Express': 'Software Engineer',
    'Capital One': 'Software Engineer',
    'Chase': 'Software Engineer',
    'Wells Fargo': 'Software Engineer',
    'US Bank': 'Software Engineer',
    'PNC': 'Software Engineer',
    'TD Bank': 'Software Engineer',
    'HSBC': 'Software Engineer',
    'Barclays': 'Software Engineer',
    'Deutsche Bank': 'Software Engineer',
    'Credit Suisse': 'Software Engineer',
    'UBS': 'Software Engineer',
    'BNP Paribas': 'Software Engineer',
    'Standard Chartered': 'Software Engineer',
    'DBS': 'Software Engineer',
    'OCBC': 'Software Engineer',
    'UOB': 'Software Engineer',
    'Commonwealth Bank': 'Software Engineer',
    'ANZ': 'Software Engineer',
    'Westpac': 'Software Engineer',
    'NAB': 'Software Engineer',
    'RBC': 'Software Engineer',
    'TD': 'Software Engineer',
    'BMO': 'Software Engineer',
    'Scotiabank': 'Software Engineer',
    'CIBC': 'Software Engineer'
  };
  
  return titleMap[company] || 'Associate';
}

function generateSalaryForTitle(title, isResearch) {
  const titleLower = title.toLowerCase();
  
  if (isResearch) {
    const baseSalary = Math.floor(Math.random() * 15000) + 35000; // $35k-50k
    return `$${baseSalary.toLocaleString()} - $${(baseSalary + 10000).toLocaleString()}`;
  }
  
  if (titleLower.includes('senior') || titleLower.includes('lead')) {
    const baseSalary = Math.floor(Math.random() * 40000) + 120000; // $120k-160k
    return `$${baseSalary.toLocaleString()} - $${(baseSalary + 40000).toLocaleString()}`;
  } else if (titleLower.includes('director') || titleLower.includes('vp')) {
    const baseSalary = Math.floor(Math.random() * 60000) + 150000; // $150k-210k
    return `$${baseSalary.toLocaleString()} - $${(baseSalary + 60000).toLocaleString()}`;
  } else if (titleLower.includes('analyst') || titleLower.includes('associate')) {
    const baseSalary = Math.floor(Math.random() * 30000) + 80000; // $80k-110k
    return `$${baseSalary.toLocaleString()} - $${(baseSalary + 30000).toLocaleString()}`;
  } else {
    const baseSalary = Math.floor(Math.random() * 40000) + 90000; // $90k-130k
    return `$${baseSalary.toLocaleString()} - $${(baseSalary + 40000).toLocaleString()}`;
  }
}

function generateResearchSalary() {
  const baseSalary = Math.floor(Math.random() * 12000) + 30000; // $30k-42k
  return `$${baseSalary.toLocaleString()} - $${(baseSalary + 8000).toLocaleString()}`;
}

function generateInternshipSalary() {
  // Finance internships typically pay $6k-12k per month or $25k-50k annually
  const baseSalary = Math.floor(Math.random() * 25000) + 25000; // $25k-50k
  return `$${baseSalary.toLocaleString()} - $${(baseSalary + 15000).toLocaleString()}`;
}

function generateJobDescription(company, title, isResearch) {
  if (isResearch) {
    return `Join ${company} as a ${title}. This research position offers hands-on experience in cutting-edge research, mentorship from leading faculty, and the opportunity to contribute to groundbreaking discoveries. Perfect for students interested in graduate school or research careers.`;
  }
  
  const descriptions = [
    `Join ${company} as a ${title} and work on cutting-edge projects that impact millions of users worldwide.`,
    `Be part of ${company}'s innovative team as a ${title}, contributing to transformative solutions in technology and business.`,
    `Work alongside talented professionals at ${company} as a ${title}, building the future of digital innovation.`,
    `Join ${company}'s dynamic team as a ${title}, where you'll tackle complex challenges and drive meaningful impact.`
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function generateResearchDescription(institution) {
  return `Join ${institution} as a research team member. This position offers hands-on experience in cutting-edge research, mentorship from leading faculty, and the opportunity to contribute to groundbreaking discoveries. Perfect for students interested in graduate school or research careers.`;
}

function generateSkillsForTitle(title) {
  const titleLower = title.toLowerCase();
  const skillSets = {
    'software': ['JavaScript', 'Python', 'React', 'Node.js', 'SQL'],
    'data': ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics'],
    'product': ['Product Management', 'User Research', 'Analytics', 'Strategy', 'Design'],
    'finance': ['Financial Modeling', 'Excel', 'PowerPoint', 'Analytics', 'Communication'],
    'consulting': ['Strategy', 'Analytics', 'Communication', 'Problem Solving', 'PowerPoint'],
    'research': ['Research', 'Data Analysis', 'Academic Writing', 'Statistics', 'Critical Thinking']
  };
  
  if (titleLower.includes('software') || titleLower.includes('engineer')) {
    return skillSets.software;
  } else if (titleLower.includes('data') || titleLower.includes('analyst')) {
    return skillSets.data;
  } else if (titleLower.includes('product') || titleLower.includes('manager')) {
    return skillSets.product;
  } else if (titleLower.includes('banking') || titleLower.includes('finance')) {
    return skillSets.finance;
  } else if (titleLower.includes('consultant') || titleLower.includes('consulting')) {
    return skillSets.consulting;
  } else if (titleLower.includes('research')) {
    return skillSets.research;
  }
  
  return ['Communication', 'Problem Solving', 'Analytics', 'Teamwork', 'Leadership'];
}

function getRandomPostedDate() {
  const daysAgo = Math.floor(Math.random() * 30) + 1;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return `${daysAgo} days ago`;
}

function getIndustryForCompany(company) {
  const industryMap = {
    'Google': 'Technology',
    'Apple': 'Technology',
    'Microsoft': 'Technology',
    'Meta': 'Technology',
    'Amazon': 'Technology',
    'Tesla': 'Technology',
    'Goldman Sachs': 'Finance',
    'JPMorgan Chase': 'Finance',
    'Morgan Stanley': 'Finance',
    'McKinsey & Company': 'Consulting',
    'Boston Consulting Group (BCG)': 'Consulting',
    'Bain & Company': 'Consulting'
  };
  
  return industryMap[company] || 'Professional Services';
}

// Fallback function to generate mock jobs including research opportunities
function generateMockJobs(userProfile) {
  // Traditional companies
  const companies = ['Google', 'Apple', 'Microsoft', 'Meta', 'Amazon', 'Tesla', 'Netflix', 'Goldman Sachs', 'McKinsey', 'JPMorgan'];
  
  // Research institutions and labs
  const researchOrgs = [
    'Yale School of Medicine', 'MIT CSAIL', 'Stanford AI Lab', 'Harvard Medical School', 
    'Yale Center for Research Computing', 'Yale Institute for Network Science',
    'Yale Center for Engineering Innovation & Design', 'Yale School of Public Health',
    'Yale Center for Business and the Environment', 'Yale Law School Center for the Study of Corporate Law',
    'Yale Center for Emotional Intelligence', 'Yale Center for the Study of Race, Indigeneity, and Transnational Migration',
    'Yale Center for Collaborative Arts and Media', 'Yale Center for Research on Aging',
    'Yale Center for Molecular Discovery', 'Yale Center for Green Chemistry and Green Engineering',
    'Yale Center for the Study of Representative Institutions', 'Yale Center for the Study of Globalization',
    'Yale Center for the Study of Race, Indigeneity, and Transnational Migration', 'Yale Center for the Study of Representative Institutions'
  ];
  
  const traditionalTitles = ['Software Engineer', 'Data Scientist', 'Product Manager', 'Investment Banking Analyst', 'Consultant', 'Research Scientist'];
  const researchTitles = [
    'Research Assistant', 'Undergraduate Research Fellow', 'Lab Technician', 'Data Analysis Intern',
    'Research Intern', 'Graduate Research Assistant', 'Postdoctoral Researcher', 'Research Coordinator',
    'Clinical Research Assistant', 'Biomedical Research Intern', 'Computational Biology Intern',
    'Psychology Research Assistant', 'Economics Research Fellow', 'Public Health Research Intern',
    'Environmental Research Assistant', 'Policy Research Intern', 'Social Science Research Assistant'
  ];
  
  const locations = ['New Haven, CT', 'New York, NY', 'San Francisco, CA', 'Seattle, WA', 'Boston, MA', 'Chicago, IL', 'Cambridge, MA'];
  const industries = ['Technology', 'Finance', 'Consulting', 'Healthcare', 'Energy', 'Research', 'Academia', 'Biotech'];
  
  const jobs = [];
  
  // Generate mix of traditional and research opportunities
  for (let i = 0; i < 25; i++) {
    const isResearch = Math.random() < 0.4; // 40% research opportunities
    
    let company, title, industry, description, salary, workModel;
    
    if (isResearch) {
      company = researchOrgs[Math.floor(Math.random() * researchOrgs.length)];
      title = researchTitles[Math.floor(Math.random() * researchTitles.length)];
      industry = 'Research';
      workModel = 'In-Person'; // Research is typically in-person
      
      // Research-specific salary ranges (often lower but with academic benefits)
      const baseSalary = Math.floor(Math.random() * 20000) + 30000; // $30k-50k
      salary = `$${baseSalary.toLocaleString()} - $${(baseSalary + 10000).toLocaleString()}`;
      
      description = `Join ${company} as a ${title}. This research position offers hands-on experience in cutting-edge research, mentorship from leading faculty, and the opportunity to contribute to groundbreaking discoveries. Perfect for students interested in graduate school or research careers.`;
    } else {
      company = companies[Math.floor(Math.random() * companies.length)];
      title = traditionalTitles[Math.floor(Math.random() * traditionalTitles.length)];
      industry = industries[Math.floor(Math.random() * (industries.length - 3))]; // Exclude research/academia/biotech
      workModel = Math.random() > 0.5 ? 'Remote' : 'Hybrid';
      
      // Traditional salary ranges
      const baseSalary = Math.floor(Math.random() * 50000) + 80000; // $80k-130k
      salary = `$${baseSalary.toLocaleString()} - $${(baseSalary + 50000).toLocaleString()}`;
      
      description = `Join ${company} as a ${title} and work on cutting-edge projects in ${industry}. This role offers excellent growth opportunities and competitive compensation.`;
    }
    
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    jobs.push({
      id: i + 1,
      company,
      title,
      location,
      salary,
      workModel,
      matchScore: Math.floor(Math.random() * 30) + 70, // 70-100%
      yaleCount: isResearch ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 20) + 1, // Research has more Yale connections
      industry,
      description,
      requirements: isResearch ? 
        ['Relevant coursework', 'Strong analytical skills', 'Research experience preferred', 'Attention to detail'] :
        ['Bachelor\'s degree', '2+ years experience', 'Strong communication skills', 'Problem-solving ability'],
      age: `${Math.floor(Math.random() * 7) + 1} days ago`,
      isResearch: isResearch
    });
  }
  
  return jobs;
}

// Swipe Recording API
app.post('/api/swipes', async (req, res) => {
  try {
    const { userId, jobId, action, timestamp } = req.body;
    
    if (!userId || !jobId || !action) {
      return res.status(400).json({ error: 'userId, jobId, and action are required' });
    }

    // In a real app, you'd save this to a database
    console.log(`Swipe recorded: User ${userId} ${action} job ${jobId} at ${timestamp}`);
    
    res.json({ 
      success: true, 
      message: 'Swipe recorded successfully' 
    });

  } catch (error) {
    console.error('Error recording swipe:', error);
    res.status(500).json({ error: 'Failed to record swipe' });
  }
});

app.post('/api/milo/opportunities', async (req, res) => {
  try {
    const { studentProfile } = req.body;
    
    if (!studentProfile) {
      return res.status(400).json({ error: 'Student profile is required' });
    }

    const userPrompt = `Student Profile:
- Name: ${studentProfile.name}
- Class Year: ${studentProfile.class_year}
- Major: ${studentProfile.major}
- Skills & Clubs: ${studentProfile.skills_and_clubs.join(', ')}
- Interests: ${studentProfile.interests.join(', ')}
- Constraints: ${studentProfile.constraints.join(', ')}
- Current Term: ${studentProfile.current_term}
- Current Date: ${studentProfile.current_date}
- Location: ${studentProfile.location}

Please generate opportunities following the exact JSON schema.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: MILO_SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      top_p: 0.9,
      seed: 42,
      max_tokens: 4000,
      stream: true
    });

    let fullResponse = '';
    for await (const chunk of completion) {
      if (chunk.choices[0]?.delta?.content) {
        fullResponse += chunk.choices[0].delta.content;
      }
    }

    const miloResponse = JSON.parse(fullResponse);
    res.json(miloResponse);

  } catch (error) {
    console.error('Error generating opportunities:', error);
    res.status(500).json({ error: 'Failed to generate opportunities' });
  }
});

app.post('/api/milo/opportunities/stream', async (req, res) => {
  try {
    const { studentProfile } = req.body;
    
    if (!studentProfile) {
      return res.status(400).json({ error: 'Student profile is required' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    res.write(`data: ${JSON.stringify({ type: 'start', message: 'Building SQL query...' })}\n\n`);

    const userPrompt = `Student Profile:
- Name: ${studentProfile.name}
- Class Year: ${studentProfile.class_year}
- Major: ${studentProfile.major}
- Skills & Clubs: ${studentProfile.skills_and_clubs.join(', ')}
- Interests: ${studentProfile.interests.join(', ')}
- Constraints: ${studentProfile.constraints.join(', ')}
- Current Term: ${studentProfile.current_term}
- Current Date: ${studentProfile.current_date}
- Location: ${studentProfile.location}

Please generate opportunities following the exact JSON schema.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: MILO_SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      top_p: 0.9,
      seed: 42,
      max_tokens: 4000,
      stream: true
    });

    let fullResponse = '';
    for await (const chunk of completion) {
      if (chunk.choices[0]?.delta?.content) {
        fullResponse += chunk.choices[0].delta.content;
        res.write(`data: ${JSON.stringify({ type: 'content', content: fullResponse })}\n\n`);
      }
    }

    const miloResponse = JSON.parse(fullResponse);
    res.write(`data: ${JSON.stringify({ type: 'complete', data: miloResponse })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error generating opportunities:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

// Internship Scraping API Endpoints

// Scrape internships from The Trackr
app.post('/api/internships/scrape', async (req, res) => {
  try {
    console.log('Starting internship scraping...');
    const scraper = new TrackrScraper();
    
    await scraper.init();
    const internships = await scraper.scrapeWithFallback();
    await scraper.close();
    
    if (internships.length > 0) {
      // Save to data directory
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const filepath = path.join(dataDir, 'trackr-internships.json');
      fs.writeFileSync(filepath, JSON.stringify(internships, null, 2));
      
      res.json({ 
        success: true, 
        count: internships.length, 
        internships: internships,
        message: `Successfully scraped ${internships.length} internships from The Trackr`
      });
    } else {
      res.json({ 
        success: false, 
        count: 0, 
        message: 'No internships found. The page might be protected or have changed structure.' 
      });
    }
  } catch (error) {
    console.error('Error scraping internships:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to scrape internships',
      details: error.message 
    });
  }
});

// Get scraped internships
app.get('/api/internships', async (req, res) => {
  try {
    const filepath = path.join(process.cwd(), 'data', 'trackr-internships.json');
    
    if (fs.existsSync(filepath)) {
      const internships = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      res.json({ 
        success: true, 
        count: internships.length, 
        internships: internships 
      });
    } else {
      res.json({ 
        success: false, 
        count: 0, 
        message: 'No internship data found. Run /api/internships/scrape first.' 
      });
    }
  } catch (error) {
    console.error('Error reading internships:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to read internship data' 
    });
  }
});

// Yale Alumni API Endpoints

// Get Yale alumni who worked at a specific company
app.post('/api/yale-alumni/company', async (req, res) => {
  try {
    const { company } = req.body;
    
    if (!company) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    // Search for alumni who worked at this company
    const alumniQuery = `
      SELECT DISTINCT 
        p.person_id,
        p.name,
        p.position,
        p.location,
        p.connections,
        p.followers,
        p.avatar,
        p.about,
        p.company as current_company,
        p.position as current_title
      FROM clean_yale_profiles p
      JOIN clean_experiences e ON p.person_id = e.person_id
      WHERE LOWER(e.company) LIKE LOWER(?) 
         OR LOWER(p.company) LIKE LOWER(?)
      ORDER BY p.connections DESC
      LIMIT 10
    `;

    const alumni = await dbAll(alumniQuery, [`%${company}%`, `%${company}%`]);

    // Get detailed experiences for each alumni
    const alumniWithDetails = await Promise.all(
      alumni.map(async (person) => {
        // Get all experiences
        const experiences = await dbAll(`
          SELECT company, title, start_date, end_date, location, description
          FROM clean_experiences 
          WHERE person_id = ?
          ORDER BY 
            CASE WHEN end_date = 'Present' THEN 1 ELSE 0 END DESC,
            end_date DESC
        `, [person.person_id]);

        // Get education
        const education = await dbAll(`
          SELECT title, degree, field, start_year, end_year
          FROM clean_educations 
          WHERE person_id = ? AND LOWER(title) LIKE '%yale%'
        `, [person.person_id]);

        // Determine Yale connection
        let yaleConnection = '';
        if (education.length > 0) {
          const yaleEdu = education[0];
          if (yaleEdu.degree && yaleEdu.end_year) {
            yaleConnection = `Yale ${yaleEdu.degree} '${yaleEdu.end_year.toString().slice(-2)}`;
          } else {
            yaleConnection = 'Yale Alumni';
          }
        }

        return {
          ...person,
          experiences: experiences.map(exp => ({
            ...exp,
            is_current: exp.end_date === 'Present' || exp.end_date === null
          })),
          education,
          yale_connection: yaleConnection
        };
      })
    );

    // Calculate career trajectory statistics
    const careerTrajectories = {
      entry_level: 0,
      mid_level: 0,
      senior_level: 0,
      executive_level: 0
    };

    const commonPaths = [];
    const topLocations = {};

    alumniWithDetails.forEach(alumni => {
      // Categorize by seniority (simple heuristic based on title keywords)
      const title = alumni.current_title?.toLowerCase() || '';
      if (title.includes('senior') || title.includes('lead') || title.includes('principal')) {
        careerTrajectories.senior_level++;
      } else if (title.includes('director') || title.includes('vp') || title.includes('head') || title.includes('chief')) {
        careerTrajectories.executive_level++;
      } else if (title.includes('manager') || title.includes('analyst')) {
        careerTrajectories.mid_level++;
      } else {
        careerTrajectories.entry_level++;
      }

      // Track locations
      if (alumni.location) {
        topLocations[alumni.location] = (topLocations[alumni.location] || 0) + 1;
      }

      // Track common career paths (simplified)
      if (alumni.experiences.length > 1) {
        const path = `${alumni.experiences[1]?.company} → ${alumni.current_company}`;
        if (!commonPaths.includes(path)) {
          commonPaths.push(path);
        }
      }
    });

    const result = {
      company,
      alumni_count: alumniWithDetails.length,
      alumni: alumniWithDetails,
      career_trajectories: careerTrajectories,
      common_paths: commonPaths.slice(0, 5),
      top_locations: Object.entries(topLocations)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([location]) => location)
    };

    res.json(result);

  } catch (error) {
    console.error('Error fetching Yale alumni:', error);
    res.status(500).json({ error: 'Failed to fetch alumni data' });
  }
});

// Get career trajectory for a specific person
app.get('/api/yale-alumni/trajectory/:personId', async (req, res) => {
  try {
    const { personId } = req.params;

    const experiences = await dbAll(`
      SELECT company, title, start_date, end_date, location, description
      FROM clean_experiences 
      WHERE person_id = ?
      ORDER BY 
        CASE WHEN end_date = 'Present' THEN 1 ELSE 0 END DESC,
        end_date DESC
    `, [personId]);

    res.json(experiences);

  } catch (error) {
    console.error('Error fetching career trajectory:', error);
    res.status(500).json({ error: 'Failed to fetch career trajectory' });
  }
});

// ChatGPT-powered alumni insights analysis
app.post('/api/alumni-insights/analyze', async (req, res) => {
  try {
    const { alumni_profile } = req.body;

    const prompt = `You are a career advisor helping Yale students network with alumni. Analyze this Yale alumni profile and provide actionable networking insights.

ALUMNI PROFILE:
- Name: ${alumni_profile.name}
- Current Role: ${alumni_profile.current_title} at ${alumni_profile.current_company}
- Location: ${alumni_profile.location}
- LinkedIn Connections: ${alumni_profile.connections}
- Followers: ${alumni_profile.followers}
- Recommendations: ${alumni_profile.recommendations_count}
- Yale Connection: ${alumni_profile.yale_connection}
- Career Experiences: ${alumni_profile.experiences.length} roles
- Education: ${alumni_profile.education.map(edu => `${edu.degree} in ${edu.field}`).join(', ')}
- About: ${alumni_profile.about ? alumni_profile.about.substring(0, 200) + '...' : 'No bio available'}

CAREER TRAJECTORY:
${alumni_profile.experiences.map((exp, idx) => 
  `${idx + 1}. ${exp.title} at ${exp.company} (${exp.start_date} - ${exp.end_date})`
).join('\n')}

Provide a JSON response with these exact fields:
{
  "networking_strategy": "Specific strategy for connecting with this alumni (2-3 sentences)",
  "career_advice": "What career insights to ask for (2-3 sentences)",
  "connection_approach": "How to reach out (1-2 sentences)",
  "key_questions": ["Question 1", "Question 2", "Question 3", "Question 4"],
  "referral_potential": "high|medium|low",
  "value_proposition": "Why this connection is valuable (1 sentence)"
}

Focus on actionable, specific advice that helps Yale students build meaningful professional relationships.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert career advisor specializing in alumni networking for Yale students. Provide specific, actionable advice for building professional relationships."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    // Clean the response to extract JSON
    let responseText = completion.choices[0].message.content;
    
    // Remove markdown formatting if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const insights = JSON.parse(responseText);
    res.json(insights);

  } catch (error) {
    console.error('Error analyzing alumni profile:', error);
    res.status(500).json({ error: 'Failed to analyze alumni profile' });
  }
});

// ChatGPT-powered company insights analysis
app.post('/api/alumni-insights/company', async (req, res) => {
  try {
    const { company, alumni_profiles } = req.body;

    const prompt = `You are a career advisor helping Yale students understand networking opportunities at specific companies. Analyze this company's Yale alumni network.

COMPANY: ${company}
ALUMNI COUNT: ${alumni_profiles.length}

ALUMNI PROFILES:
${alumni_profiles.map((alumni, idx) => 
  `${idx + 1}. ${alumni.name} - ${alumni.current_title} (${alumni.connections} connections, ${alumni.yale_connection})`
).join('\n')}

CAREER PATHS TO ${company.toUpperCase()}:
${alumni_profiles.filter(alumni => alumni.experiences.length > 1)
  .map(alumni => {
    const prevExp = alumni.experiences.find(exp => !exp.is_current);
    return prevExp ? `${prevExp.company} → ${company}` : '';
  })
  .filter(path => path)
  .slice(0, 5)
  .join('\n')}

Provide a JSON response with these exact fields:
{
  "company": "${company}",
  "alumni_count": ${alumni_profiles.length},
  "networking_opportunities": "Summary of networking potential (2-3 sentences)",
  "common_paths": ["Path 1", "Path 2", "Path 3"],
  "hiring_patterns": "What the alumni data reveals about hiring (2-3 sentences)",
  "referral_strategy": "How to approach referrals at this company (2-3 sentences)",
  "key_contacts": ["Name 1", "Name 2", "Name 3"]
}

Focus on actionable insights that help Yale students understand how to break into this company and leverage the alumni network.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert career advisor specializing in company analysis and alumni networking strategies for Yale students. Provide specific, actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Clean the response to extract JSON
    let responseText = completion.choices[0].message.content;
    
    // Remove markdown formatting if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const insights = JSON.parse(responseText);
    res.json(insights);

  } catch (error) {
    console.error('Error analyzing company insights:', error);
    res.status(500).json({ error: 'Failed to analyze company insights' });
  }
});

// ---- NEW: Live streaming endpoint ----
app.post("/api/stream", async (req, res) => {
  try {
    sseHeaders(res);
    const { userId, message, category, profile } = req.body || {};

    emit(res, "status", { message: "Scoring options…" });

    const deadlineMs = 30000; // Increased timeout for GPT-5 with web search
    const sysPicks = `You are Milo, a Yale-optimized recommender. Use web search to find real, current opportunities at Yale and beyond. Return 3–5 high-signal Top Picks that feel insider-curated, not generic, for an undergraduate audience. Be concrete. Prefer roles/teams with realistic warm paths (alumni, labs, clubs). Only return JSON matching the schema. Do not add commentary.`;
    const sysWhy   = "You explain fit in crisp, evidence-based bullets. No fluff. Yale mentor tone. Focus on why these opportunities work for Yale students specifically.";
    const sysVoices= "Use web search to find real alumni insights and current student experiences. Synthesize short, specific advice lines as if from alumni/reviews. ≤1 sentence per quote. Make it feel authentic and current.";

    // fire everything at once
    const picksCall = withTimeout(
      openaiJSON({
        system: sysPicks,
        user: `Query: ${message}
Profile: ${JSON.stringify(profile || {})}
Category hint: ${category || "any"}

Rules:
- Each pick must include: id, title, company, location, optional deadline, optional score (0–1), 1–3 "why" bullets, and 0–2 links (label, url).
- Prefer picks that a Yale undergrad can act on in 1–2 weeks.
- If specific companies are implied (e.g., Formula One), include one team or supplier with a plausible student path.
- Keep "why" bullets crisp and evidence-based (skills, coursework, alumni proximity).

Return JSON only.`,
        schema: picksSchema,
        temperature: 0.5,
        max_output_tokens: 1600,
        enableWebSearch: true // Enable web search for picks to get real opportunities
      }),
      deadlineMs,
      "picks"
    );

    const whyCall = withTimeout(
      openaiJSON({
        system: sysWhy,
        user: `Query: ${message}\nProfile: ${JSON.stringify(profile || {})}\nReturn 2–4 bullets.`,
        schema: whySchema,
        enableWebSearch: false // No web search needed for why analysis
      }),
      deadlineMs,
      "why"
    );

    const voicesCall = withTimeout(
      openaiJSON({
        system: sysVoices,
        user: `Topic: ${message}\nIf possible, tailor to the organizations/roles implied.`,
        schema: voicesSchema,
        temperature: 0.7,
        enableWebSearch: true // Enable web search for voices to get real alumni insights
      }),
      deadlineMs,
      "voices"
    );

    const searchCall = withTimeout(tavilySearch(message, category), 4000, "search").catch(() => []);

    // shared bundle we'll grow as results land
    const bundle = { query: message };

    // whenever a promise resolves, emit the updated bundle
    const streamUpdate = (key, value) => {
      bundle[key] = value;
      emit(res, "bundle", bundle);
    };

    const tasks = [
      picksCall.then((v) => streamUpdate("top_picks", v.top_picks)).catch((e) => {
        console.error("Picks call failed:", e.message);
        emit(res, "status", { message: "Picks call failed: " + e.message });
      }),
      whyCall.then((v) => streamUpdate("why_this_works", v.why_this_works)).catch((e) => {
        console.error("Why call failed:", e.message);
        emit(res, "status", { message: "Why call failed: " + e.message });
      }),
      voicesCall.then((v) => streamUpdate("what_people_are_saying", v.what_people_are_saying)).catch((e) => {
        console.error("Voices call failed:", e.message);
        emit(res, "status", { message: "Voices call failed: " + e.message });
      }),
      searchCall.then((v) => v?.length && streamUpdate("what_people_are_saying", (bundle.what_people_are_saying || []).concat(v))).catch((e) => {
        console.error("Search call failed:", e.message);
      })
    ];

    await Promise.allSettled(tasks);

    emit(res, "final", { content: "Want me to line up two alumni outreaches and draft your first email?" });
    res.end();
  } catch (e) {
    try { emit(res, "final", { content: "We hit an error composing your bundle. Try again." }); } catch {}
    res.end();
  }
});

// ===== HELPER FUNCTIONS =====

function generateMockSearchResults(query, searchType) {
  const baseResults = [
    {
      type: 'career',
      title: 'Software Engineering Internship',
      company: 'Google',
      location: 'Mountain View, CA',
      description: 'Join our team to build products that impact billions of users worldwide.',
      relevance: 95,
      url: 'https://careers.google.com/jobs/results/',
      metadata: {
        companyLogo: 'https://logo.clearbit.com/google.com',
        salary: '$8,000/month',
        duration: '12 weeks',
        applicationDeadline: '2024-02-15'
      }
    },
    {
      type: 'alumni',
      title: 'John Smith',
      company: 'Meta',
      role: 'Senior Software Engineer',
      location: 'Menlo Park, CA',
      description: 'Yale CS graduate working on AI infrastructure at Meta.',
      relevance: 88,
      metadata: {
        person_id: 'alum_001',
        full_name: 'John Smith',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        graduation_year: 2018,
        major: 'Computer Science',
        current_company: 'Meta',
        current_role: 'Senior Software Engineer'
      }
    },
    {
      type: 'research',
      title: 'AI Research Assistant',
      company: 'Yale Computer Science Department',
      location: 'New Haven, CT',
      description: 'Work with Professor Johnson on machine learning research projects.',
      relevance: 92,
      url: 'https://cpsc.yale.edu/research',
      metadata: {
        professor: 'Dr. Sarah Johnson',
        department: 'Computer Science',
        funding: 'Available',
        duration: 'Academic Year'
      }
    }
  ];

  // Filter results based on search type
  if (searchType === 'career') {
    return baseResults.filter(r => r.type === 'career');
  } else if (searchType === 'alumni') {
    return baseResults.filter(r => r.type === 'alumni');
  } else if (searchType === 'research') {
    return baseResults.filter(r => r.type === 'research');
  }

  return baseResults;
}

// ===== NEW API ENDPOINTS =====

// Universal Search API
app.post('/api/search/universal', async (req, res) => {
  try {
    const { query, userId } = req.body;
    
    if (!query || !userId) {
      return res.status(400).json({ error: 'Query and userId are required' });
    }

    console.log('🔍 Universal search request:', query);

    // Simple analysis without OpenAI for now
    const analysis = {
      searchType: query.toLowerCase().includes('alumni') ? 'alumni' : 
                  query.toLowerCase().includes('research') ? 'research' :
                  query.toLowerCase().includes('internship') || query.toLowerCase().includes('job') ? 'career' : 'general',
      intent: 'explore',
      keywords: query.split(' ').filter(word => word.length > 2),
      filters: {}
    };

    // Generate mock search results based on query type
    const mockResults = generateMockSearchResults(query, analysis.searchType);

    res.json({
      success: true,
      query: query,
      analysis: analysis,
      results: mockResults,
      total: mockResults.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in universal search:', error);
    res.status(500).json({ success: false, error: 'Failed to process search query' });
  }
});

// Dream Processing API
app.post('/api/dreams/process', async (req, res) => {
  try {
    const { dream, userId } = req.body;
    
    if (!dream || !userId) {
      return res.status(400).json({ error: 'Dream and userId are required' });
    }

    console.log('💭 Dream processing request:', dream);

    // Simple dream processing without OpenAI for now
    const dreamPlan = {
      actionSteps: [
        { step: "Research relevant opportunities", timeframe: "1-2 weeks", priority: "High" },
        { step: "Build relevant skills", timeframe: "2-3 months", priority: "High" },
        { step: "Network with alumni", timeframe: "Ongoing", priority: "Medium" },
        { step: "Apply to opportunities", timeframe: "3-6 months", priority: "High" }
      ],
      opportunities: [
        { title: "Software Engineering Internship", company: "Google", type: "Internship", relevance: 95 },
        { title: "AI Research Assistant", company: "Yale CS Department", type: "Research", relevance: 88 }
      ],
      connections: [
        { name: "John Smith", role: "Senior Engineer", company: "Meta", year: 2018, contact: "john@meta.com", relevance: "High" }
      ],
      timeline: "6-12 months"
    };
    
    res.json({
      success: true,
      dream: dream,
      ...dreamPlan,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing dream:', error);
    res.status(500).json({ success: false, error: 'Failed to process dream' });
  }
});

// Unified Streaming AI API - handles all inputs (search, dreams, etc.)
app.post('/api/search/stream', async (req, res) => {
  try {
    const { query, userId } = req.body;
    
    if (!query || !userId) {
      return res.status(400).json({ error: 'Query and userId are required' });
    }

    console.log('🤖 Unified AI streaming request:', query);

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial response
    res.write(`data: ${JSON.stringify({ 
      type: 'start', 
      message: 'Analyzing your search...',
      timestamp: Date.now()
    })}\n\n`);

    // Simple analysis without OpenAI for now
    const analysis = {
      searchType: query.toLowerCase().includes('alumni') ? 'alumni' : 
                  query.toLowerCase().includes('research') ? 'research' :
                  query.toLowerCase().includes('internship') || query.toLowerCase().includes('job') ? 'career' : 'general',
      intent: 'explore'
    };
    
    // Send analysis results
    res.write(`data: ${JSON.stringify({ 
      type: 'analysis', 
      data: analysis,
      timestamp: Date.now()
    })}\n\n`);

    // Simulate parallel searches
    const searchTypes = ['career', 'alumni', 'research', 'opportunity', 'company'];
    
    for (const type of searchTypes) {
      res.write(`data: ${JSON.stringify({ 
        type: 'search_start', 
        category: type,
        message: `Searching ${type}...`,
        timestamp: Date.now()
      })}\n\n`);

      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Generate mock results
      const mockResults = generateMockSearchResults(query, type);

      res.write(`data: ${JSON.stringify({ 
        type: 'search_results', 
        category: type,
        results: mockResults,
        timestamp: Date.now()
      })}\n\n`);
    }

    // Send completion
    res.write(`data: ${JSON.stringify({ 
      type: 'complete', 
      message: 'Search completed!',
      timestamp: Date.now()
    })}\n\n`);

    res.end();
  } catch (error) {
    console.error('Error in streaming search:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      error: 'Search failed. Please try again.',
      timestamp: Date.now()
    })}\n\n`);
    res.end();
  }
});

// Chat-backend integration endpoint
app.post('/api/chat-backend/search', async (req, res) => {
  try {
    const { query, userProfile } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('🎯 Chat-backend search request:', { query, userProfile: userProfile?.name || 'No profile' });

    // Import the chat-backend functionality
    const { getAIResponse } = await import('./chat-backend.js');
    
    // Call the chat-backend AI response function
    const response = await getAIResponse(query, userProfile);
    
    console.log('✅ Chat-backend response generated');
    
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('❌ Chat-backend search error:', error);
    res.status(500).json({ 
      error: 'Failed to process search request',
      details: error.message 
    });
  }
});

// Streaming chat-backend endpoint with Server-Sent Events
app.post('/api/chat-backend/stream', async (req, res) => {
  try {
    const { query, userProfile } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('🎯 Streaming chat-backend request:', { query, userProfile: userProfile?.name || 'No profile' });

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Import the streaming function
    const { getAIResponseStream } = await import('./chat-backend.js');
    
    // Stream responses as they come in
    for await (const chunk of getAIResponseStream(query, userProfile)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    
    // Send completion signal
    res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
    res.end();
    
  } catch (error) {
    console.error('❌ Streaming chat-backend error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`);
    res.end();
  }
});

// Onboarding endpoint for chat interface
app.post('/api/chat-backend/onboarding', async (req, res) => {
  try {
    const { question, answer, step, totalSteps } = req.body;
    
    // Import the onboarding response generator from chat-backend.js
    const { generateOnboardingResponse } = await import('./chat-backend.js');
    
    const response = await generateOnboardingResponse(question, answer, step, totalSteps);
    
    res.json({ 
      success: true, 
      response: response 
    });
  } catch (error) {
    console.error('Onboarding endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.listen(port, () => {
  console.log(`Milo backend server running on http://localhost:${port}`);
});
