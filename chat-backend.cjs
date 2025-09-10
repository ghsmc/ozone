 #!/usr/bin/env node

import readline from 'readline';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { Pinecone } from '@pinecone-database/pinecone';

dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone for fast vector similarity search
const pinecone = new Pinecone({
  apiKey: process.env.VITE_PINECONE_API_KEY,
});
const index = pinecone.index(process.env.VITE_PINECONE_INDEX_NAME);

// Initialize Yale Database AI
const YaleDatabaseAI = require('./yale-db-ai.cjs');
const yaleDbAI = new YaleDatabaseAI('./yale.db');

// Initialize Enhanced Yale Database AI
const EnhancedYaleDatabaseAI = require('./yale-db-ai-enhanced.cjs');
const enhancedYaleDbAI = new EnhancedYaleDatabaseAI('./yale.db');

// Initialize SQLite database for Yale alumni (fallback)
const db = new sqlite3.Database('./yale.db');
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// SQL-based Yale alumni search functions
async function findYaleAlumniAtCompaniesSQL(companies, userInput, userProfile) {
  try {
    const results = [];
    
    for (const company of companies) {
      const alumni = await dbAll(`
        SELECT DISTINCT 
          p.name,
          p.position as current_role,
          p.location as current_location,
          p.url as linkedin_url,
          e.field as major,
          e.end_year as graduation_year,
          p.current_company_name as current_company
        FROM people p 
        JOIN educations e ON p.person_id = e.person_id 
        WHERE LOWER(e.title) LIKE '%yale%' 
        AND LOWER(p.current_company_name) LIKE LOWER(?)
        AND p.current_company_name IS NOT NULL
        LIMIT 5
      `, [`%${company}%`]);
      
      if (alumni.length > 0) {
        results.push({
          company: company,
          alumni: alumni.map(alum => ({
            name: alum.name || 'Unknown',
            graduation_year: alum.graduation_year || 'Unknown',
            major: alum.major || 'Unknown',
            current_role: alum.current_role || 'Unknown',
            current_company: alum.current_company || company,
            current_location: alum.current_location || 'Unknown',
            linkedin_url: alum.linkedin_url || '',
            career_trajectory: `${alum.major || 'Unknown'} → ${alum.current_role || 'Unknown'} at ${alum.current_company || company}`,
            similarity_score: 0.8, // Default high score for SQL results
            text_snippet: `${alum.name} | Yale | ${alum.major || 'Unknown'} | ${alum.current_role || 'Unknown'} at ${alum.current_company || company}`
          }))
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('SQL alumni search error:', error);
    return [];
  }
}

async function findSimilarYaleAlumniSQL(userInput, userProfile) {
  try {
    // Create search terms from user input and profile
    const searchTerms = [
      userInput,
      userProfile?.major || '',
      userProfile?.interests || '',
      userProfile?.skills || ''
    ].filter(Boolean).join(' ');
    
    const alumni = await dbAll(`
      SELECT DISTINCT 
        p.name,
        p.position as current_role,
        p.location as current_location,
        p.url as linkedin_url,
        e.field as major,
        e.end_year as graduation_year,
        p.current_company_name as current_company
      FROM people p 
      JOIN educations e ON p.person_id = e.person_id 
      WHERE LOWER(e.title) LIKE '%yale%' 
      AND (
        LOWER(p.position) LIKE LOWER(?) OR
        LOWER(e.field) LIKE LOWER(?) OR
        LOWER(p.current_company_name) LIKE LOWER(?)
      )
      AND p.current_company_name IS NOT NULL
      ORDER BY p.connections DESC
      LIMIT 10
    `, [`%${searchTerms}%`, `%${searchTerms}%`, `%${searchTerms}%`]);
    
    return alumni.map(alum => ({
      name: alum.name || 'Unknown',
      graduation_year: alum.graduation_year || 'Unknown',
      major: alum.major || 'Unknown',
      current_role: alum.current_role || 'Unknown',
      current_company: alum.current_company || 'Unknown',
      current_location: alum.current_location || 'Unknown',
      linkedin_url: alum.linkedin_url || '',
      career_trajectory: `${alum.major || 'Unknown'} → ${alum.current_role || 'Unknown'} at ${alum.current_company || 'Unknown'}`,
      relevance_score: Math.floor(Math.random() * 20) + 50, // Random score 50-70
      text_snippet: `${alum.name} | Yale | ${alum.major || 'Unknown'} | ${alum.current_role || 'Unknown'} at ${alum.current_company || 'Unknown'}`
    }));
  } catch (error) {
    console.error('SQL similar alumni search error:', error);
    return [];
  }
}

// Intelligent Pinecone-based alumni search function (using proven working logic)
async function performIntelligentAlumniSearch(searchQuery, userProfile) {
  try {
    console.log(colorize(`🔍 Performing intelligent search: "${searchQuery}"`, 'yellow'));
    
    // Create embedding using the exact same logic that works in test-pinecone.js
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `${searchQuery} Yale alumni ${userProfile?.major || ''} ${userProfile?.preferred_industries?.join(' ') || userProfile?.interests || ''}`,
      dimensions: 512
    });
    
    const embedding = embeddingResponse.data[0].embedding;
    console.log(colorize('✅ Created embedding, length:', 'green'), embedding.length);
    
    // Search Pinecone using the exact same logic that works
    const searchResponse = await index.query({
      vector: embedding,
      topK: 10,
      includeMetadata: true
    });
    
    console.log(colorize('✅ Pinecone search completed!', 'green'));
    console.log(colorize(`Found ${searchResponse.matches?.length || 0} matches`, 'blue'));
    
    // Process results using the exact same metadata structure that works
    const alumniResults = [];
    if (searchResponse.matches && searchResponse.matches.length > 0) {
      searchResponse.matches.forEach((match, index) => {
        if (match.score > 0.5) { // Lower threshold to get more results
          const metadata = match.metadata;
          alumniResults.push({
            name: metadata?.name || 'Unknown',
            current_role: metadata?.latest_position || metadata?.current_role || 'Position not specified',
            current_company: metadata?.current_company || 'Company not specified',
            current_location: metadata?.city || 'Location not specified',
            linkedin_url: metadata?.linkedin_url || '',
            major: metadata?.yale_major || 'Major not specified',
            graduation_year: metadata?.yale_class || 'Year not specified',
            relevance_score: Math.round(match.score * 100), // Convert to 0-100 scale
            match_reason: `Relevant to: ${searchQuery}`,
            text_snippet: metadata?.text_snippet || ''
          });
        }
      });
    }
    
    // Sort by relevance score and return top results
    alumniResults.sort((a, b) => b.relevance_score - a.relevance_score);
    console.log(colorize(`📊 Returning ${alumniResults.length} alumni results`, 'green'));
    
    return alumniResults.slice(0, 6); // Return top 6 most relevant
    
  } catch (error) {
    console.log(colorize(`⚠️ Intelligent alumni search failed: ${error.message}`, 'red'));
    return [];
  }
}

// Fast Pinecone-based function to find Yale alumni at specific companies
async function findYaleAlumniAtCompanies(companies, userQuery, userProfile) {
  try {
    const alumniResults = [];
    
    for (const company of companies) {
      console.log(colorize(`🔍 Searching for Yale alumni at ${company}...`, 'yellow'));
      
      // Create embedding for company search with correct dimensions
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: `Yale alumni working at ${company} ${userQuery} ${userProfile?.major || ''} ${userProfile?.interests || ''}`,
        dimensions: 512
      });
      
      const embedding = embeddingResponse.data[0].embedding;
      
      // Search Pinecone for similar profiles - no filter since school field doesn't exist
      let searchResponse = await index.query({
        vector: embedding,
        topK: 20,
        includeMetadata: true
      });
      
      // Filter results by company name in metadata and ensure they're Yale alumni
      const companyMatches = searchResponse.matches.filter(match => {
        const currentCompany = match.metadata?.current_company?.toLowerCase() || '';
        const companyLower = company.toLowerCase();
        const isYaleAlumni = match.metadata?.education_1?.toLowerCase().includes('yale') || 
                           match.metadata?.text_snippet?.toLowerCase().includes('yale');
        const companyMatch = currentCompany.includes(companyLower) || 
                           companyLower.includes(currentCompany) ||
                           currentCompany.includes(companyLower.split(' ')[0]) ||
                           (companyLower.includes('deepmind') && currentCompany.includes('deepmind')) ||
                           (companyLower.includes('google') && currentCompany.includes('google'));
        
        return companyMatch && isYaleAlumni;
      });
      
      if (companyMatches.length > 0) {
        alumniResults.push({
          company: company,
          alumni: companyMatches.slice(0, 3).map(match => ({
          name: match.metadata?.name || 'Unknown',
          graduation_year: match.metadata?.yale_class || 'Unknown',
          major: match.metadata?.yale_major || 'Unknown',
          current_role: match.metadata?.latest_position || 'Unknown',
          current_company: match.metadata?.current_company || company,
          current_location: match.metadata?.city || 'Unknown',
          linkedin_url: match.metadata?.linkedin_url || '',
          career_trajectory: `${match.metadata?.yale_major || 'Unknown'} → ${match.metadata?.latest_position || 'Unknown'} at ${match.metadata?.current_company || company}`,
            similarity_score: match.score,
            text_snippet: match.metadata?.text_snippet || ''
        }))
        });
        console.log(colorize(`✅ Found ${companyMatches.length} alumni at ${company}`, 'green'));
      } else {
        console.log(colorize(`⚠️ No alumni found at ${company}`, 'yellow'));
      }
    }
    
    return alumniResults;
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    return [];
  }
}

// Fast Pinecone-based function to find similar Yale alumni based on user profile
async function findSimilarYaleAlumni(userProfile, userQuery) {
  try {
    console.log(colorize(`🔍 Searching for similar Yale alumni based on profile...`, 'yellow'));
    console.log(colorize(`Profile: ${userProfile?.major || 'No major'} | ${userProfile?.interests || 'No interests'}`, 'cyan'));
    
    if (!userProfile || !userProfile.major) {
      console.log(colorize('⚠️ No user profile or major found', 'yellow'));
      return [];
    }

    // Create embedding for user profile search with correct dimensions
    const profileText = `${userProfile.major} ${userProfile.interests || ''} ${userProfile.skills || ''} ${userProfile.location || ''} ${userQuery}`;
    console.log(colorize(`Search query: ${profileText}`, 'cyan'));
    
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: profileText,
      dimensions: 512
    });
    
    const embedding = embeddingResponse.data[0].embedding;
    
    // Search Pinecone for similar profiles - no filter since school field doesn't exist
    const searchResponse = await index.query({
      vector: embedding,
      topK: 15,
      includeMetadata: true
    });
    
    // Filter to only Yale alumni
    const yaleAlumni = searchResponse.matches.filter(match => {
      return match.metadata?.education_1?.toLowerCase().includes('yale') || 
             match.metadata?.text_snippet?.toLowerCase().includes('yale');
    });
    
    console.log(colorize(`✅ Found ${yaleAlumni.length} Yale alumni out of ${searchResponse.matches?.length || 0} total results`, 'green'));
    
    return yaleAlumni.map(match => ({
      name: match.metadata?.name || 'Unknown',
      graduation_year: match.metadata?.yale_class || 'Unknown',
      major: match.metadata?.yale_major || 'Unknown',
      current_role: match.metadata?.latest_position || 'Unknown',
      current_company: match.metadata?.current_company || 'Unknown',
      current_location: match.metadata?.city || 'Unknown',
      linkedin_url: match.metadata?.linkedin_url || '',
      career_trajectory: `${match.metadata?.yale_major || 'Unknown'} → ${match.metadata?.latest_position || 'Unknown'} at ${match.metadata?.current_company || 'Unknown'}`,
      relevance_score: Math.round(match.score * 100),
      text_snippet: match.metadata?.text_snippet || ''
    }));
  } catch (error) {
    console.error('Error finding similar Yale alumni:', error);
    return [];
  }
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// User profile storage
let userProfile = null;

// Onboarding questions
const onboardingQuestions = [
  {
    key: 'name',
    question: 'What\'s your name?',
    type: 'text'
  },
  {
    key: 'class_year',
    question: 'What year are you? (e.g., 2025, 2026, 2027, 2028)',
    type: 'text'
  },
  {
    key: 'major',
    question: 'What\'s your major or intended major?',
    type: 'text'
  },
  {
    key: 'interests',
    question: 'What are your main career interests? (e.g., software engineering, consulting, research, finance)',
    type: 'text'
  },
  {
    key: 'skills',
    question: 'What are your key skills? (e.g., Python, JavaScript, research, leadership)',
    type: 'text'
  },
  {
    key: 'location_preference',
    question: 'Where would you like to work? (e.g., New York, San Francisco, remote, anywhere)',
    type: 'text'
  },
  {
    key: 'constraints',
    question: 'Any constraints? (e.g., paid only, summer only, remote only)',
    type: 'text'
  }
];

async function collectUserInfo() {
  console.log(colorize('\n🎓 Welcome to Milo! Let\'s get to know you better for personalized opportunities.', 'bright'));
  console.log(colorize('📝 This will help me find the perfect opportunities for you!\n', 'cyan'));
  
  const profile = {};
  
  for (let i = 0; i < onboardingQuestions.length; i++) {
    const question = onboardingQuestions[i];
    let answer = '';
    
    // Keep asking until we get a valid answer
    while (!answer.trim()) {
      try {
        answer = await new Promise((resolve) => {
      rl.question(colorize(`${question.question}: `, 'green'), resolve);
    });
        
        if (!answer.trim()) {
          console.log(colorize('Please provide an answer.', 'red'));
        }
      } catch (error) {
        console.log(colorize('Please provide an answer.', 'red'));
        answer = '';
      }
    }
    
    profile[question.key] = answer.trim();
    
    // Generate and stream personalized response
    console.log(colorize('\n🤖 Milo: ', 'green'));
    try {
      const response = await generateOnboardingResponse(question.question, answer.trim(), i + 1, onboardingQuestions.length);
      await streamText(response, '', 20);
      
      // Special welcome message after name
      if (question.key === 'name') {
        console.log(colorize('\n🎯 ', 'cyan'));
        await streamText('I\'m excited to help you discover amazing opportunities!', '', 15);
      }
    } catch (error) {
      console.log(colorize('Got it! Let\'s continue...', 'green'));
    }
  }
  
  // Add timestamp
  profile.onboarded_at = new Date().toISOString();
  
  console.log(colorize('\n✅ Profile created! Here\'s what I know about you:', 'green'));
  console.log(colorize(`👤 Name: ${profile.name}`, 'blue'));
  console.log(colorize(`🎓 Class: ${profile.class_year}`, 'blue'));
  console.log(colorize(`📚 Major: ${profile.major}`, 'blue'));
  console.log(colorize(`🎯 Interests: ${profile.interests}`, 'blue'));
  console.log(colorize(`🛠️ Skills: ${profile.skills}`, 'blue'));
  console.log(colorize(`📍 Location: ${profile.location_preference}`, 'blue'));
  console.log(colorize(`⚡ Constraints: ${profile.constraints}`, 'blue'));
  
  // Final celebration message
  console.log(colorize('\n🎉 ', 'yellow'));
  await streamText(`Perfect! I now know exactly who you are, ${profile.name}. Let's find you some incredible opportunities!`, '', 15);
  console.log(colorize('\n🚀 Ready to discover your next big opportunity? Just ask me anything!', 'bright'));
  
  return profile;
}

function getUserContext(userProfile) {
  if (!userProfile) return '';
  
  return `
USER PROFILE:
- Name: ${userProfile.full_name || userProfile.name || 'Student'}
- Class Year: ${userProfile.graduation_year || userProfile.class_year || '2025'}
- Major: ${userProfile.major || 'Not specified'}
- Career Interests: ${userProfile.preferred_industries?.join(', ') || userProfile.interests || 'Not specified'}
- Skills: ${userProfile.skills || 'Not specified'}
- Location Preference: ${userProfile.preferred_locations?.join(', ') || userProfile.location || 'Not specified'}
- GPA: ${userProfile.gpa || 'Not specified'}
- Work Model: ${userProfile.work_model_preference || 'Not specified'}

Use this information to provide highly personalized recommendations. Address the user by name and reference their specific interests, skills, and preferences in your responses.`;
}

// System prompt for Milo
function getSystemPrompt(profile = userProfile) {
  return `You are Milo, a direct opportunity scout for Yale students. Deliver immediate value with specific, actionable opportunities.

${getUserContext(profile)}

CRITICAL: Match opportunities to the user's EXACT level and interests:
- If user is a college student, recommend college-level internships, NOT high school programs
- If user asks about "film in NYC", recommend actual film industry opportunities in NYC
- If user is Class of 2027, recommend opportunities appropriate for their year
- ALWAYS consider the user's major, interests, and location preferences

CORE PRINCIPLE: Direct value over everything. Be concise, specific, and actionable.

OUTPUT FORMAT:
1. **Company/Program Name** - [Direct application link]
   - Company: [Brief description of what they do, size, industry focus]
   - Why it fits: [Specific reason based on user profile]
   - Next step: [Exact action to take]
   - Micro-project: [Concrete project to build/complete]
   - Yale connection: [Specific person/program to contact]

2. **Company/Program Name** - [Direct application link]
   - [Same format...]

REQUIREMENTS:
- 3-5 specific opportunities with real application links
- Include general timing (e.g., "Apply by February 2025") - not specific dates
- Focus on Yale-connected opportunities
- Make micro-projects concrete and completable in 1-2 weeks
- Include brief company information (what they do, size, industry focus)
- Skip fluff - go straight to actionable opportunities

EXAMPLES for college students:
- **NBCUniversal Internship Program** - https://www.nbcunicareers.com/internships
  - Company: NBCUniversal - Major media conglomerate with $40B revenue, owns NBC, Universal Pictures, streaming platforms
  - Why it fits: Perfect for film/media students interested in production, content creation, and entertainment
  - Next step: Apply by February 2025, highlight any film/media experience
  - Micro-project: Create a 2-minute video pitch for a TV show concept
  - Yale connection: Contact Yale Film Society for alumni at NBCUniversal

- **Warner Bros. Discovery Internship** - https://wbd.com/careers/internships/
  - Company: Warner Bros. Discovery - Major entertainment company with $50B revenue, owns HBO, Warner Bros., Discovery
  - Why it fits: Ideal for students interested in film production, content development, and media
  - Next step: Apply by March 2025, prepare portfolio of creative work
  - Micro-project: Write a treatment for a documentary about NYC culture
  - Yale connection: Reach out to Yale alumni in entertainment industry

Be direct, specific, and actionable. Match the user's actual level and interests.`;
}

// Enhanced streaming function
async function streamText(text, prefix = '', delay = 30) {
  process.stdout.write(colorize(prefix, 'cyan'));
  for (const char of text) {
    process.stdout.write(char);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  console.log(); // New line after streaming
}

// Lightning-fast onboarding response generator
async function generateOnboardingResponse(question, answer, step, totalSteps) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Milo's onboarding assistant. Generate a warm, personalized response that makes the user feel heard and excited about their journey.

Context: This is step ${step} of ${totalSteps} in the onboarding process.
Question: "${question}"
User's Answer: "${answer}"

Generate a response that:
- Acknowledges their answer warmly
- Shows you understand them
- Builds excitement about what's coming
- Feels personal and engaging
- Is 1-2 sentences max
- Uses their name if provided

Examples:
- Name: "George" → "Welcome to Milo, George! 🎓 I'm excited to help you discover amazing opportunities."
- Major: "Computer Science" → "Got it! You love building things and solving problems. You're the 10th Computer Science Yalie on Milo this week!"
- Major: "Economics" → "Economics! Perfect for understanding markets and human behavior. You're the 7th Econ Yalie on Milo today!"
- Interests: "AI, Finance" → "Perfect! AI and Finance - that's a powerful combination. I can already see some incredible opportunities for you."
- Interests: "Consulting" → "Consulting! You love solving complex problems and working with people. That's exactly what top firms are looking for."
- Location: "San Francisco" → "San Francisco! The heart of tech innovation. You're in the perfect place for your career journey."
- Location: "New Haven" → "New Haven! Right here at Yale. I know all the best local opportunities and connections."
- Skills: "Python, Data Analysis" → "Python and Data Analysis! Those are hot skills right now. I'm already thinking of some perfect matches for you."
- Graduation: "2025" → "Class of 2025! Perfect timing - you're in the sweet spot for internships and full-time opportunities."

Be warm, personal, and build anticipation. Use emojis and make them feel special.`
        },
        {
          role: "user",
          content: `Question: "${question}"\nAnswer: "${answer}"`
        }
      ],
      temperature: 0.8,
      max_tokens: 100
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating onboarding response:', error);
    return "Got it! Let's continue...";
  }
}

// Animated progress indicator
async function showProgress(message, duration = 2000) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frameIndex = 0;
  
  process.stdout.write(colorize(`\n${message} `, 'yellow'));
  
  const interval = setInterval(() => {
    process.stdout.write(`\r${colorize(message + ' ', 'yellow')}${frames[frameIndex]}`);
    frameIndex = (frameIndex + 1) % frames.length;
  }, 100);
  
  await new Promise(resolve => setTimeout(resolve, duration));
  clearInterval(interval);
  process.stdout.write(`\r${colorize(message + ' ✅', 'green')}\n`);
}

// Streaming version for real-time responses
export async function* getAIResponseStream(userInput, userProfile = null) {
  try {
    console.log(colorize('\n🤖 Milo is thinking...', 'yellow'));
    
    // Start ALL parallel calls simultaneously
    console.log(colorize('\n🚀 Starting ALL parallel calls simultaneously...', 'bright'));
    
    const parallelCalls = {
      // Parallel Call #1: Immediate Response
      immediate: openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are Milo's quick response system. Give a direct, value-focused 1-sentence response that shows immediate understanding and action.

${getUserContext(userProfile)}

Examples:
- "Found 3 direct paths to [field] opportunities, ${userProfile?.name || 'there'} - including Yale connections."
- "I've got specific [company/field] opportunities with application links ready for you."
- "Perfect timing - I'm pulling [query] opportunities with deadlines and contacts."

Keep it under 15 words. Be direct and action-oriented.`
          },
          { role: "user", content: userInput }
        ],
        temperature: 0.8,
        max_tokens: 50
      }),

      // Parallel Call #2: Intent Parsing
      intent: (async () => {
        // Send loading message for intent parsing
        res.write(`data: ${JSON.stringify({
          type: 'message',
          content: '**Understanding user intent semantically ⌄**'
        })}\n\n`);
        
        return openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { 
              role: "system", 
              content: `You are Milo, an AI discovery engine for Yale students to find jobs and internships they love, plus alumni warm intros.

${getUserContext(userProfile)}

Parse the user's intent and return ONLY a JSON object with this structure:
{
  "thinking_message": "Brief explanation of what the user is looking for",
  "search_focus": "What they want to find (jobs, internships, alumni, etc.)",
  "key_terms": ["term1", "term2", "term3"]
}

The user is looking for internships/jobs/opportunities. Be specific about their career goals.`
          },
          { role: "user", content: userInput }
        ],
        temperature: 0.3,
        max_tokens: 200
      });
      })(),

      // Parallel Call #3: Instant Pathways (Companies)
      pathways: openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are Milo's instant company discovery system. Based on the user's query, return 5-6 highly relevant companies with specific relevance scores.

${getUserContext(userProfile)}

Return ONLY a JSON array of companies with this structure:
[
  {
    "name": "Company Name",
    "domain": "company.com",
    "relevance": 8,
    "description": "Brief description of why this company is relevant"
  }
]

Use numeric relevance scores 0-10. Focus on companies that match the user's interests and career goals.`
          },
          { role: "user", content: userInput }
        ],
        temperature: 0.3,
        max_tokens: 800
      }),

      // Parallel Call #4: Yale Alumni Search Query Generation
      alumniSearch: openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are Milo's intelligent alumni search query generator. Create a semantic search query to find Yale alumni who would be most relevant for the user's career goals.

${getUserContext(userProfile)}

Based on the user's query, generate a search query that will find Yale alumni who:
1. Work in relevant roles/industries
2. Have similar backgrounds/interests
3. Could provide valuable connections or mentorship

Return ONLY a JSON object with this structure:
{
  "search_query": "semantic search query string",
  "search_focus": "brief explanation of what we're looking for"
}`
          },
          { role: "user", content: userInput }
        ],
        temperature: 0.3,
        max_tokens: 200
      }),

      // Parallel Call #5: Similar Alumni Search Query Generation
      similarAlumniSearch: openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are Milo's similar alumni search query generator. Create a semantic search query to find Yale alumni with similar backgrounds to the user.

${getUserContext(userProfile)}

Generate a search query that will find Yale alumni who:
1. Have similar academic backgrounds (major, interests)
2. Are in similar career stages
3. Could provide mentorship or networking opportunities

Return ONLY a JSON object with this structure:
{
  "search_query": "semantic search query string",
  "search_focus": "brief explanation of what we're looking for"
}`
          },
          { role: "user", content: userInput }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    };

    // Wait for immediate response first and stream it
    console.log(colorize('\n📞 Parallel Call #1: Immediate Response', 'bright'));
    const immediate = await parallelCalls.immediate;
    const immediateText = immediate.choices[0].message.content;
    console.log(colorize(`⚡ Milo: "${immediateText}"`, 'green'));
    
    // Stream the immediate response character by character
    for (let i = 0; i <= immediateText.length; i++) {
      yield {
        type: 'immediate',
        data: immediateText.substring(0, i)
      };
      await new Promise(resolve => setTimeout(resolve, 20)); // 20ms delay between characters
    }

    // Now process all other parallel calls as they complete
    console.log(colorize('\n🚀 Processing remaining parallel calls...', 'bright'));
    
    // Intent Analysis
    console.log(colorize('\n🧠 Parallel Call #2: Intent Parsing', 'bright'));
    const intent = await parallelCalls.intent;
    try {
      const intentData = JSON.parse(intent.choices[0].message.content);
      console.log(colorize(`\n🧠 Thinking: ${intentData.thinking_message}`, 'yellow'));
    } catch (parseError) {
      console.log(colorize('\n🧠 Thinking: Analyzing your request...', 'yellow'));
    }
    
    // Stream intent analysis
    yield {
      type: 'intent',
      data: 'Parsing user intent ⌄'
    };

    // Companies/Pathways
    console.log(colorize('\n🏢 Parallel Call #3: Company Discovery', 'bright'));
    const pathways = await parallelCalls.pathways;
    try {
      const pathwaysData = JSON.parse(pathways.choices[0].message.content);
      console.log(colorize(`✅ Found ${pathwaysData.length} relevant companies`, 'green'));
      yield {
        type: 'pathways',
        data: pathwaysData
      };
    } catch (parseError) {
      console.log(colorize('⚠️ Could not parse company data', 'yellow'));
    }

    // Yale Alumni Search
    console.log(colorize('\n🎓 Parallel Call #4: Yale Alumni at Companies', 'bright'));
    const alumniSearch = await parallelCalls.alumniSearch;
    let yaleAlumniData = [];
    try {
      const searchData = JSON.parse(alumniSearch.choices[0].message.content);
      const searchQuery = searchData.search_query || userInput;
      console.log(colorize(`🎯 Generated search query: "${searchQuery}"`, 'cyan'));
      
      // Perform Enhanced AI-powered database search
      console.log(colorize('🔍 Performing Enhanced AI-powered database search...', 'yellow'));
      
      // Send loading message for search strategies
      res.write(`data: ${JSON.stringify({
        type: 'message',
        content: '**Generating multiple search strategies automatically ⌄**'
      })}\n\n`);
      
      const enhancedResult = await enhancedYaleDbAI.searchAlumni(searchQuery, userProfile);
      yaleAlumniData = enhancedResult.alumni;
      console.log(colorize(`✅ Found ${yaleAlumniData.length} top connections`, 'green'));
      console.log(colorize(`🧠 Used ${enhancedResult.totalSearched} search strategies`, 'blue'));
      
      // Send loading message for ranking
      res.write(`data: ${JSON.stringify({
        type: 'message',
        content: '**Ranking results intelligently across multiple criteria ⌄**'
      })}\n\n`);
      
      if (enhancedResult.insights) {
        console.log(colorize(`💡 Network insights: ${enhancedResult.insights.strategic_advice}`, 'cyan'));
        
        // Send loading message for insights
        res.write(`data: ${JSON.stringify({
          type: 'message',
          content: '**Providing strategic insights about the alumni network ⌄**'
        })}\n\n`);
      }
    } catch (error) {
      console.log(colorize('⚠️ AI database search failed, trying fallback...', 'yellow'));
      console.log(colorize(`Error details: ${error.message}`, 'red'));
      
      // Fallback to Pinecone search
      try {
        const searchData = JSON.parse(alumniSearch.choices[0].message.content);
        const searchQuery = searchData.search_query || userInput;
        yaleAlumniData = await performIntelligentAlumniSearch(searchQuery, userProfile);
        console.log(colorize(`✅ Fallback found ${yaleAlumniData.length} alumni`, 'green'));
      } catch (fallbackError) {
        console.log(colorize('❌ Both AI and fallback searches failed', 'red'));
        yaleAlumniData = [];
      }
    }
    
    yield {
      type: 'alumni',
      data: yaleAlumniData
    };

    // Similar Alumni Search using AI-powered database queries
    console.log(colorize('\n👥 Parallel Call #5: Similar Yale Alumni', 'bright'));
    const similarAlumniSearch = await parallelCalls.similarAlumniSearch;
    let similarAlumniData = [];
    try {
      const searchData = JSON.parse(similarAlumniSearch.choices[0].message.content);
      const searchQuery = searchData.search_query || userInput;
      console.log(colorize(`🎯 Generated similar alumni search query: "${searchQuery}"`, 'cyan'));
      
      // Perform Enhanced AI-powered database search for similar alumni
      console.log(colorize('🔍 Performing Enhanced AI-powered similar alumni search...', 'yellow'));
      const enhancedResult = await enhancedYaleDbAI.searchAlumni(searchQuery, userProfile);
      similarAlumniData = enhancedResult.alumni;
      console.log(colorize(`✅ Found ${similarAlumniData.length} similar alumni`, 'green'));
      console.log(colorize(`🧠 Used ${enhancedResult.totalSearched} search strategies`, 'blue'));
      
      if (enhancedResult.insights) {
        console.log(colorize(`💡 Similar alumni insights: ${enhancedResult.insights.career_trajectories}`, 'cyan'));
      }
    } catch (error) {
      console.log(colorize('⚠️ AI similar alumni search failed, trying fallback...', 'yellow'));
      console.log(colorize(`Error details: ${error.message}`, 'red'));
      
      // Fallback to Pinecone search
      try {
        const searchData = JSON.parse(similarAlumniSearch.choices[0].message.content);
        const searchQuery = searchData.search_query || userInput;
        similarAlumniData = await performIntelligentAlumniSearch(searchQuery, userProfile);
        console.log(colorize(`✅ Fallback found ${similarAlumniData.length} similar alumni`, 'green'));
      } catch (fallbackError) {
        console.log(colorize('❌ Both AI and fallback similar searches failed', 'red'));
        similarAlumniData = [];
      }
    }
    
    yield {
      type: 'similar_alumni',
      data: similarAlumniData
    };
    
    // Parallel Call #2: Intent Parsing
    console.log(colorize('\n🧠 Parallel Call #2: Intent Parsing', 'bright'));
    const intentResponse = openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are Milo, an AI discovery engine for Yale students to find jobs and internships they love, plus alumni warm intros.

Analyze the user's intent - they are a Yale student looking for career opportunities (internships, jobs, research positions, etc.) and alumni connections.

${getUserContext(userProfile)}

Provide a 1-2 sentence analysis of what specific career opportunities and connections they're seeking.`
        },
        { role: "user", content: userInput }
      ],
      temperature: 0.3,
      max_tokens: 100
    });

    const intentResult = await intentResponse;
    const intentText = intentResult.choices[0].message.content;
    console.log(colorize('\n🧠 Thinking: ' + intentText, 'cyan'));
    
    // Stream the intent response character by character
    for (let i = 0; i <= intentText.length; i++) {
      yield {
        type: 'intent',
        data: intentText.substring(0, i)
      };
      await new Promise(resolve => setTimeout(resolve, 15)); // 15ms delay between characters
    }
    
    // Parallel Call #3: Instant Pathways
    console.log(colorize('\n🚀 Parallel Call #3: Instant Pathways', 'bright'));
    const pathwaysResponse = openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are Milo, an AI discovery engine for Yale students.  
Convert the student's query into a short list of 3–6 **specific companies** that fit.  

Rules:
- Each company must have: **name**, **specific team** (the exact, specific team name - not broad categories like "Engineering" or "Research", but precise teams like "Autonomous Vehicle Perception Team" or "Quantitative Trading Algorithms Team"), **domain** (URL).  
- No filler, no extra commentary.  
- Output valid JSON only, following the schema.  
- Prefer companies with Yale alumni or realistic student entry points, but keep output clean. 

${getUserContext(userProfile)}

Return ONLY a JSON object with this exact structure:
{
  "companies": [
    {
      "name": "Company Name",
      "team": "Exact specific team name (e.g., 'Autonomous Vehicle Perception Team', 'Quantitative Trading Algorithms Team')",
      "domain": "company.com",
      "relevance": 8.5
    }
  ]
}

CRITICAL: Return ONLY valid JSON. No explanations, no markdown, no additional text. Just the JSON object.`
        },
        { role: "user", content: userInput }
      ],
      temperature: 0.4,
      max_tokens: 800
    });

    const pathwaysResult = await pathwaysResponse;
    console.log(colorize('\n🚀 Instant Results: Company Logos & Roles:', 'green'));
    try {
      const pathwaysData = JSON.parse(pathwaysResult.choices[0].message.content);
    } catch (e) {
      console.log(colorize('⚠️  Could not parse instant pathways', 'yellow'));
    }
    yield {
      type: 'pathways',
      data: pathwaysResult.choices[0].message.content
    };
    
    // Stop here - only return companies to consider
    yield {
      type: 'complete',
      data: 'Companies to consider completed'
    };
    
    return; // Exit early to avoid other parallel calls
    
    // Parallel Call #4: Yale Alumni at Companies
    console.log(colorize('\n🎓 Parallel Call #4: Yale Alumni at Companies', 'bright'));
    const alumniResponse = openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `Find Yale alumni working at companies mentioned in the user's query.

${getUserContext(userProfile)}

Return a JSON array of alumni with their details.`
        },
        { role: "user", content: userInput }
      ],
      temperature: 0.3,
      max_tokens: 600
    });

    const alumni = await alumniResponse;
    try {
      const alumniData = JSON.parse(alumni.choices[0].message.content);
      console.log(colorize(`✅ Found ${alumniData.length} Yale alumni at mentioned companies`, 'green'));
    } catch (e) {
      console.log(colorize('⚠️  Could not parse pathways for alumni search, skipping...', 'yellow'));
    }
    
    // Parallel Call #5: Similar Yale Alumni
    console.log(colorize('\n🎯 Parallel Call #5: Similar Yale Alumni', 'bright'));
    console.log(colorize('🔍 Searching for similar Yale alumni based on profile...', 'cyan'));
    
    const similarAlumni = await findSimilarYaleAlumni(userInput, userProfile);
    console.log(colorize(`✅ Similar alumni search completed`, 'green'));
    console.log(colorize('💾 Similar Alumni Raw Data:', 'blue'));
    console.log(JSON.stringify(similarAlumni, null, 2));
    yield {
      type: 'similar_alumni',
      data: similarAlumni
    };
    
    // Parallel Call #6: Career Pathways
    console.log(colorize('\n🗺️ Parallel Call #6: Long-Term Career Pathways', 'bright'));
    const careerPathwaysResponse = openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a strategic career advisor providing long-term pathway analysis. 

${getUserContext(userProfile)}

CRITICAL: Use the user's specific profile information (age, year, major, interests) to provide personalized career analysis.

Analyze the user's current position and provide a strategic overview of career trajectories. Focus on:

1. **Starting Points**: Best entry-level opportunities for their specific age/stage/major
2. **5-Year Trajectory**: Where each path typically leads for someone with their background
3. **10-Year Vision**: Senior roles and leadership positions relevant to their field
4. **Industry Evolution**: How their specific field is changing
5. **Skill Development**: Key competencies to build over time for their career path

Format as structured analysis with clear progression paths. Be strategic and forward-thinking.`
        },
        { role: "user", content: userInput }
      ],
      temperature: 0.4,
      max_tokens: 800
    });
    
    const careerPathways = await careerPathwaysResponse;
    console.log(colorize('✅ Career pathways analysis initiated', 'green'));
    yield {
      type: 'career_pathways',
      data: careerPathways.choices[0].message.content
    };
    
    // Parallel Call #7: Structured Job Data
    console.log(colorize('\n📋 Parallel Call #7: Structured Job Data', 'bright'));
    const structuredResponse = openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are a data extraction AI. Extract specific opportunities from the user's query and return them as structured JSON data that can populate job cards.

${getUserContext(userProfile)}

Return a JSON array of opportunities with this exact structure:
[
  {
    "companyLogo": "https://logo.clearbit.com/google.com",
    "companyName": "Google",
    "jobTitle": "Software Engineering Intern",
    "description": "Build products that impact billions of users. Work on real projects with mentorship from senior engineers.",
    "location": "Mountain View, CA",
    "salary": "$8,000/month",
    "postedDate": "2024-01-15",
    "skills": ["Python", "JavaScript", "React", "Algorithms"],
    "metrics": {
      "trajectory": 95,
      "valuation": "$1.8T",
      "funding": "N/A",
      "lastRaised": "N/A",
      "age": "25 years",
      "employees": "150,000",
      "openJobs": 25
    },
    "badges": {
      "unicorn": true,
      "trueUpRemote200": true
    },
    "type": "job",
    "applicationLink": "https://careers.google.com/students/",
    "deadline": "Apply by February 2025",
    "microProject": "Build a small web app using React and Python that demonstrates your coding skills. Include a demo link in your application.",
    "yaleConnection": "Connect with Yale CS alumni at Google via LinkedIn before applying"
  }
]

IMPORTANT: 
- Use real companies and real application links
- Include specific micro-projects that relate to the role
- Reference Yale connections when possible
- Use general timing for deadlines (e.g., "Apply by February 2025" not specific dates)
- If no specific opportunities are found, return an empty array []
- Make micro-projects concrete and actionable`
        },
        { role: "user", content: userInput }
      ],
      temperature: 0.3,
      max_tokens: 1200
    });
    
    const structured = await structuredResponse;
    console.log(colorize('✅ Structured job data generated', 'green'));
    yield {
      type: 'structured',
      data: structured.choices[0].message.content
    };
    
    // Parallel Call #8: Pinecone Search
    console.log(colorize('\n📞 Parallel Call #8: Pinecone Alumni Search', 'bright'));
    const pineconeResults = await findSimilarYaleAlumni(userInput, userProfile);
    console.log(colorize(`✅ Pinecone alumni search completed - Found ${pineconeResults.length} Yale alumni`, 'green'));
    console.log(colorize('💾 Pinecone Search Raw Data:', 'blue'));
    console.log(JSON.stringify(pineconeResults, null, 2));
    yield {
      type: 'pinecone_search',
      data: pineconeResults
    };
    
    // Parallel Call #9: AI Insights
    console.log(colorize('\n🧠 Generating AI Alumni Insights...', 'bright'));
    const aiInsightsResponse = openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `Generate comprehensive insights and recommendations based on the user's query and profile.

${getUserContext(userProfile)}

Provide detailed analysis including:
- Specific opportunities with application links
- Micro-projects to demonstrate skills
- Yale connections and networking opportunities
- Strategic advice for their career path

Format as a comprehensive response with clear sections and actionable advice.`
        },
        { role: "user", content: userInput }
      ],
      temperature: 0.6,
      max_tokens: 1000
    });
    
    const aiInsights = await aiInsightsResponse;
    const aiInsightsText = aiInsights.choices[0].message.content;
    console.log(colorize('\n🎓 Milo\'s Detailed Response:', 'green'));
    console.log(aiInsightsText);
    
    // Stream the AI insights response character by character
    for (let i = 0; i <= aiInsightsText.length; i++) {
      yield {
        type: 'ai_insights',
        data: aiInsightsText.substring(0, i)
      };
      await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay between characters
    }
    
    // Sixth parallel call - Intelligent Yale Alumni Search
    console.log(colorize('\n🎓 Parallel Call #4: Yale Alumni at Companies', 'bright'));
    let yaleAlumniDataNonStream = [];
    try {
      // Generate intelligent search query based on user intent and companies
      const alumniSearchResponse = openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are Milo's intelligent alumni search query generator. Create a semantic search query to find Yale alumni who would be most relevant for the user's career goals.

${getUserContext(userProfile)}

Based on the user's query and the companies mentioned, generate a search query that will find Yale alumni who:
1. Work in relevant roles/industries
2. Have similar backgrounds/interests
3. Could provide valuable connections or mentorship

Return ONLY a JSON object with this structure:
{
  "search_query": "semantic search query string",
  "search_focus": "brief explanation of what we're looking for"
}`
          },
          { role: "user", content: userInput }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const alumniSearch = await alumniSearchResponse;
      let searchQuery = userInput;
      let searchFocus = "Yale alumni in relevant roles";
      
      try {
        const searchData = JSON.parse(alumniSearch.choices[0].message.content);
        searchQuery = searchData.search_query || userInput;
        searchFocus = searchData.search_focus || "Yale alumni in relevant roles";
        console.log(colorize(`🎯 Generated search query: "${searchQuery}"`, 'cyan'));
        console.log(colorize(`🎯 Search focus: ${searchFocus}`, 'cyan'));
      } catch (parseError) {
        console.log(colorize('⚠️ Could not parse search query, using fallback', 'yellow'));
      }

      // Perform intelligent Pinecone search
      console.log(colorize('🔍 Performing intelligent Pinecone search...', 'yellow'));
      yaleAlumniData = await performIntelligentAlumniSearch(searchQuery, userProfile);
      
      console.log(colorize('✅ Intelligent Yale alumni search completed', 'green'));
      console.log(colorize(`📊 Found ${yaleAlumniData.length} relevant alumni`, 'blue'));
      
    } catch (error) {
      console.log(colorize('⚠️ Intelligent alumni search failed, skipping...', 'yellow'));
      console.log(colorize(`Error details: ${error.message}`, 'red'));
      yaleAlumniData = [];
    }
    
    // Yield alumni data
    yield {
      type: 'alumni',
      data: yaleAlumniData
    };
    
    // Seventh parallel call - Fast Pinecone search for similar Yale alumni with SQL fallback
    console.log(colorize('\n🎯 Parallel Call #5: Similar Yale Alumni', 'bright'));
    let similarAlumniStream = [];
    try {
      console.log(colorize('🔍 Searching for similar Yale alumni based on profile...', 'cyan'));
      
      if (!userProfile) {
        console.log(colorize('⚠️ No user profile found', 'yellow'));
        similarAlumniStream = [];
      } else {
        // Use the proven working Pinecone logic
        try {
          const profileText = `${userProfile.major || ''} ${userProfile.preferred_industries?.join(' ') || userProfile.interests || ''} ${userProfile.skills || ''}`;
          const searchQuery = `${userInput} ${profileText} Yale alumni similar background`;
          console.log(colorize(`🔍 Similar alumni search query: "${searchQuery}"`, 'cyan'));
          console.log(colorize(`Profile: ${userProfile.major || 'No major'} | ${userProfile.preferred_industries?.join(', ') || 'No interests'}`, 'blue'));
          
          // Create embedding using the exact same logic that works
          const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: searchQuery,
            dimensions: 512
          });
          
          const embedding = embeddingResponse.data[0].embedding;
          console.log(colorize('✅ Created embedding for similar alumni search', 'green'));
          
          // Search Pinecone using the exact same logic that works
          const searchResponse = await index.query({
            vector: embedding,
            topK: 8,
            includeMetadata: true
          });
          
          console.log(colorize('✅ Pinecone similar alumni search completed!', 'green'));
          console.log(colorize(`Found ${searchResponse.matches?.length || 0} matches`, 'blue'));
          
          // Process results using the exact same metadata structure that works
          if (searchResponse.matches && searchResponse.matches.length > 0) {
            searchResponse.matches.forEach((match, index) => {
              if (match.score > 0.4) { // Lower threshold for similar alumni
                const metadata = match.metadata;
                similarAlumniStream.push({
                  name: metadata?.name || 'Unknown',
                  current_role: metadata?.latest_position || metadata?.current_role || 'Position not specified',
                  current_company: metadata?.current_company || 'Company not specified',
                  current_location: metadata?.city || 'Location not specified',
                  linkedin_url: metadata?.linkedin_url || '',
                  major: metadata?.yale_major || 'Major not specified',
                  graduation_year: metadata?.yale_class || 'Year not specified',
                  relevance_score: Math.round(match.score * 100),
                  match_reason: `Similar background: ${metadata?.yale_major || 'Yale alumni'}`,
                  text_snippet: metadata?.text_snippet || ''
                });
              }
            });
          }
          
          console.log(colorize(`✅ Found ${similarAlumniStream.length} similar Yale alumni`, 'green'));
        } catch (pineconeError) {
          console.log(colorize('⚠️ Pinecone search failed, trying SQL fallback...', 'yellow'));
          similarAlumniStream = await findSimilarYaleAlumniSQL(userInput, userProfile);
          console.log(colorize(`✅ SQL fallback found ${similarAlumniStream.length} similar alumni`, 'green'));
        }
      }
      
      console.log(colorize('✅ Similar alumni search completed', 'green'));
      console.log(colorize('💾 Similar Alumni Raw Data:', 'blue'));
      console.log(JSON.stringify(similarAlumniStream, null, 2));
    } catch (error) {
      console.log(colorize('⚠️ Similar alumni query failed, skipping...', 'yellow'));
      console.log(colorize(`Error details: ${error.message}`, 'red'));
      similarAlumniStream = [];
    }
    
    // Yield similar alumni data
    yield {
      type: 'similar_alumni',
      data: similarAlumniStream
    };

    // Final completion
    yield {
      type: 'complete',
      data: 'All parallel calls completed successfully'
    };
    
  } catch (error) {
    console.error('Streaming error:', error);
    yield {
      type: 'error',
      data: error.message
    };
  }
}

async function main() {
  console.log(colorize('🎓 Welcome to Milo - Your AI Opportunity Scout!', 'bright'));
  
  // Check if user wants to onboard
  const shouldOnboard = await new Promise((resolve) => {
    rl.question(colorize('🆕 First time here? Let\'s set up your profile for personalized recommendations! (y/n): ', 'green'), (answer) => {
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
  
  if (shouldOnboard) {
    userProfile = await collectUserInfo();
  } else {
    console.log(colorize('👋 Welcome back! Using your existing profile.', 'cyan'));
  }
  
  console.log(colorize('\n💡 Ask me about internships, research, alumni connections, or your career dreams!', 'cyan'));
  console.log(colorize('📝 Type "quit" or "exit" to leave, "help" for examples, "profile" to see your info', 'blue'));
  console.log(colorize('='.repeat(60), 'cyan'));

  const askQuestion = () => {
    try {
    rl.question(colorize('\n🎯 You: ', 'green'), async (input) => {
      const query = input.trim();

      switch (query.toLowerCase()) {
        case 'quit':
        case 'exit':
          console.log(colorize('\n👋 Thanks for using Milo! Good luck with your opportunities!', 'green'));
          rl.close();
          return;

        case 'help':
          console.log(colorize('\n💡 Example queries:', 'yellow'));
          console.log('  "I want to become a software engineer at Google"');
          console.log('  "Find me AI research opportunities at Yale"');
          console.log('  "Connect me with Yale alumni at Meta"');
          console.log('  "Summer internships in consulting"');
          console.log('  "I\'m interested in environmental science careers"');
          console.log(colorize('\n📝 Commands:', 'yellow'));
          console.log('  profile - View your profile information');
          console.log('  help - Show this help');
          console.log('  quit/exit - Exit the chat');
          break;

        case 'profile':
          if (userProfile) {
            console.log(colorize('\n👤 Your Profile:', 'green'));
            console.log(colorize(`👤 Name: ${userProfile.name}`, 'blue'));
            console.log(colorize(`🎓 Class: ${userProfile.class_year}`, 'blue'));
            console.log(colorize(`📚 Major: ${userProfile.major}`, 'blue'));
            console.log(colorize(`🎯 Interests: ${userProfile.interests}`, 'blue'));
            console.log(colorize(`🛠️ Skills: ${userProfile.skills}`, 'blue'));
            console.log(colorize(`📍 Location: ${userProfile.location_preference}`, 'blue'));
            console.log(colorize(`⚡ Constraints: ${userProfile.constraints}`, 'blue'));
            console.log(colorize(`📅 Onboarded: ${userProfile.onboarded_at}`, 'blue'));
          } else {
            console.log(colorize('❌ No profile found. Run the onboarding process first.', 'red'));
          }
          break;

        case '':
          // Empty input, just continue
          break;

        default:
          if (query) {
            const response = await getAIResponse(query);
            
            // The immediate response is already shown during getAIResponse()
            // Now show the detailed conversational response with streaming
            console.log(colorize('\n🎓 Milo\'s Detailed Response:', 'blue'));
            await streamText(response.conversational, '', 20);
            
            // Display structured job card data if available
            if (response.structured && response.structured.length > 0) {
              console.log(colorize('\n📋 Structured Opportunities:', 'yellow'));
              response.structured.forEach((job, index) => {
                console.log(colorize(`\n${index + 1}. ${job.jobTitle} at ${job.companyName}`, 'green'));
                console.log(`   📍 ${job.location}`);
                console.log(`   💰 ${job.salary || 'Salary not specified'}`);
                console.log(`   🏢 ${job.metrics?.employees || 'N/A'} employees`);
                console.log(`   📈 Trajectory: ${job.metrics?.trajectory || 'N/A'}/100`);
                console.log(`   🛠️  Skills: ${Array.isArray(job.skills) ? job.skills.join(', ') : 'N/A'}`);
                console.log(`   📝 ${job.description}`);
                
                if (job.applicationLink) {
                  console.log(colorize(`   🔗 Apply: ${job.applicationLink}`, 'blue'));
                }
                if (job.deadline) {
                  console.log(colorize(`   ⏰ Deadline: ${job.deadline}`, 'red'));
                }
                if (job.microProject) {
                  console.log(colorize(`   🎯 Micro-project: ${job.microProject}`, 'yellow'));
                }
                if (job.yaleConnection) {
                  console.log(colorize(`   🎓 Yale Connection: ${job.yaleConnection}`, 'cyan'));
                }
                
                if (job.badges?.unicorn) {
                  console.log(colorize('   🦄 Unicorn Company', 'magenta'));
                }
                if (job.badges?.trueUpRemote200) {
                  console.log(colorize('   🌍 Remote-friendly', 'cyan'));
                }
              });
              
              console.log(colorize('\n💾 JSON Data (for frontend integration):', 'blue'));
              console.log(JSON.stringify(response.structured, null, 2));
            } else {
              console.log(colorize('\n💾 No structured opportunities found for this query.', 'yellow'));
            }
            
            // Display Yale alumni data if found
            if (response.yaleAlumni && response.yaleAlumni.length > 0) {
              console.log(colorize('\n🎓 Yale Alumni at These Companies:', 'green'));
              response.yaleAlumni.forEach(companyData => {
                console.log(colorize(`\n📍 ${companyData.company}:`, 'cyan'));
                companyData.alumni.forEach((alum, index) => {
                  console.log(colorize(`\n${index + 1}. ${alum.name}`, 'yellow'));
                  console.log(`   🎓 Class of ${alum.graduation_year} - ${alum.major}`);
                  console.log(`   💼 ${alum.current_role} at ${companyData.company}`);
                  console.log(`   📍 ${alum.current_location}`);
                  if (alum.career_trajectory) {
                    console.log(`   📈 Trajectory: ${alum.career_trajectory}`);
                  }
                  if (alum.skills) {
                    console.log(`   🛠️ Skills: ${alum.skills}`);
                  }
                  if (alum.linkedin_url) {
                    console.log(colorize(`   🔗 LinkedIn: ${alum.linkedin_url}`, 'blue'));
                  }
                  if (alum.email) {
                    console.log(colorize(`   📧 Email: ${alum.email}`, 'blue'));
                  }
                });
              });
              
              console.log(colorize('\n💾 Yale Alumni JSON Data:', 'blue'));
              console.log(JSON.stringify(response.yaleAlumni, null, 2));
            } else {
              console.log(colorize('\n🎓 No Yale alumni found at mentioned companies in database.', 'yellow'));
            }
            
            // Display similar Yale alumni trajectories
            if (response.similarAlumni && response.similarAlumni.length > 0) {
              console.log(colorize('\n🎯 Trajectories to Consider - Similar Yale Alumni:', 'green'));
              console.log(colorize('Find people like you to contact and get career insights from:', 'cyan'));
              
              response.similarAlumni.forEach((alum, index) => {
                console.log(colorize(`\n${index + 1}. ${alum.name}`, 'yellow'));
                console.log(`   🎓 Class of ${alum.graduation_year} - ${alum.major}`);
                console.log(`   💼 ${alum.current_role} at ${alum.current_company}`);
                console.log(`   📍 ${alum.current_location}`);
                if (alum.career_trajectory) {
                  console.log(`   📈 Career Path: ${alum.career_trajectory}`);
                }
                if (alum.industry) {
                  console.log(`   🏢 Industry: ${alum.industry}`);
                }
                if (alum.skills) {
                  console.log(`   🛠️ Skills: ${alum.skills}`);
                }
                if (alum.linkedin_url) {
                  console.log(colorize(`   🔗 LinkedIn: ${alum.linkedin_url}`, 'blue'));
                }
                if (alum.email) {
                  console.log(colorize(`   📧 Email: ${alum.email}`, 'blue'));
                }
                console.log(colorize(`   ⭐ Relevance Score: ${alum.relevance_score}/3`, 'magenta'));
              });
              
              console.log(colorize('\n💾 Similar Alumni JSON Data:', 'blue'));
              console.log(JSON.stringify(response.similarAlumni, null, 2));
            } else {
              console.log(colorize('\n🎯 No similar Yale alumni found based on your profile.', 'yellow'));
            }
            
            // Display long-term career pathways analysis
            if (response.careerPathways) {
              console.log(colorize('\n🗺️ Long-Term Career Pathways Analysis:', 'green'));
              console.log(colorize('Strategic overview of where your career can lead:', 'cyan'));
              console.log(colorize('\n' + '='.repeat(60), 'cyan'));
              await streamText(response.careerPathways, '🎯 ', 20);
              console.log(colorize('\n' + '='.repeat(60), 'cyan'));
              
              // Show raw career pathways data
              console.log(colorize('\n💾 Career Pathways Raw Data:', 'blue'));
              console.log(response.careerPathways);
            } else {
              console.log(colorize('\n🗺️ No career pathways analysis available.', 'yellow'));
              console.log(colorize('\n💾 Raw Career Pathways Response:', 'blue'));
              console.log(JSON.stringify(response.careerPathways, null, 2));
            }
            
            // Display Pinecone search results
            if (response.pineconeSearch && response.pineconeSearch.length > 0) {
              console.log(colorize('\n🔍 Relevant Yale Alumni Found:', 'green'));
              console.log(colorize('Alumni with similar interests and backgrounds:', 'cyan'));
              console.log(colorize('\n' + '='.repeat(60), 'cyan'));
              
              response.pineconeSearch.forEach((alumni, index) => {
                console.log(colorize(`\n${index + 1}. ${alumni.name} (Class of ${alumni.graduation_year})`, 'bright'));
                console.log(colorize(`   🎓 Major: ${alumni.major}`, 'yellow'));
                console.log(colorize(`   💼 Current Role: ${alumni.current_role}`, 'cyan'));
                console.log(colorize(`   🏢 Company: ${alumni.current_company}`, 'magenta'));
                console.log(colorize(`   📍 Location: ${alumni.current_location}`, 'green'));
                console.log(colorize(`   🔗 LinkedIn: ${alumni.linkedin_url}`, 'blue'));
                console.log(colorize(`   📊 Relevance: ${alumni.relevance_score}% match`, 'yellow'));
                if (alumni.text_snippet) {
                  console.log(colorize(`   📝 About: ${alumni.text_snippet.substring(0, 150)}...`, 'white'));
                }
                console.log(colorize('   ' + '-'.repeat(50), 'gray'));
              });
              
              console.log(colorize('\n' + '='.repeat(60), 'cyan'));
              
              // Show raw Pinecone data
              console.log(colorize('\n💾 Pinecone Search JSON Data:', 'blue'));
              console.log(JSON.stringify(response.pineconeSearch, null, 2));
            } else {
              console.log(colorize('\n🔍 No relevant Yale alumni found in Pinecone search.', 'yellow'));
              console.log(colorize('\n💾 Raw Pinecone Response:', 'blue'));
              console.log(JSON.stringify(response.pineconeSearch, null, 2));
            }
            
            // Display AI-powered alumni insights
            if (response.aiInsights) {
              console.log(colorize('\n🧠 AI-Powered Alumni Insights & Action Plan:', 'green'));
              console.log(colorize('Personalized recommendations based on Yale alumni data:', 'cyan'));
              console.log(colorize('\n' + '='.repeat(60), 'cyan'));
              await streamText(response.aiInsights, '🎯 ', 20);
              console.log(colorize('\n' + '='.repeat(60), 'cyan'));
            }
            
            // Enhanced completion with celebration
            console.log(colorize('\n' + '='.repeat(60), 'cyan'));
            await streamText('✅ All 10 parallel results complete! Ready for your next query.', '🎯 ', 15);
            console.log(colorize('💡 Next: Ask about specific companies, research areas, or career paths.', 'magenta'));
          }
      }

      askQuestion();
    });
    } catch (error) {
      if (error.code === 'ERR_USE_AFTER_CLOSE') {
        console.log(colorize('\n👋 Thanks for using Milo! Good luck with your opportunities!', 'green'));
        process.exit(0);
      } else {
        console.error(colorize(`❌ Error: ${error.message}`, 'red'));
        process.exit(1);
      }
    }
  };

  askQuestion();
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(colorize('\n\n👋 Thanks for using Milo! Good luck with your opportunities!', 'green'));
  rl.close();
  process.exit(0);
});

// Start the chat
main().catch(console.error);
