const { OpenAI } = require('openai');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class YaleDatabaseAI {
  constructor(dbPath = './yale.db') {
    this.dbPath = path.resolve(dbPath);
  }

  /**
   * Convert unstructured query to structured SQL query using OpenAI
   */
  async generateSQLQuery(userQuery, userProfile = {}) {
    const systemPrompt = `You are an expert SQL query generator for a Yale alumni database. 

DATABASE SCHEMA:
- clean_yale_profiles: person_id, name, position, company, location, city, connections, about, educations_details, url
- clean_educations: person_id, title (school name), degree, field, start_year, end_year, description
- clean_experiences: person_id, company, title, start_date, end_date, location, description

USER PROFILE: ${JSON.stringify(userProfile, null, 2)}

TASK: Convert the user's unstructured query into a precise SQL query that finds the most relevant Yale alumni.

QUERY ANALYSIS FRAMEWORK:
1. Extract key search criteria (industry, role, location, company, skills, interests)
2. Identify Yale-specific requirements (must have Yale education)
3. Consider user profile for personalization
4. Generate appropriate JOINs and WHERE clauses
5. Order by relevance (connections, recent graduates, etc.)

EXAMPLES:
- "quant finance" → Look for Yale alumni in finance, trading, investment roles
- "SF startups" → Look for Yale alumni at startups in San Francisco
- "AI research" → Look for Yale alumni in AI, ML, research roles
- "consulting" → Look for Yale alumni at consulting firms

Return ONLY a JSON object with this structure:
{
  "sql": "SELECT p.name, p.position, p.company, p.location, p.connections, p.about, p.url, e.title, e.field, e.end_year FROM clean_yale_profiles p JOIN clean_educations e ON p.person_id = e.person_id WHERE e.title LIKE '%Yale%' AND [your conditions] ORDER BY p.connections DESC LIMIT 15",
  "reasoning": "Explanation of why this query will find relevant alumni",
  "search_focus": "Brief description of what we're looking for"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error generating SQL query:', error);
      // Fallback query
      return {
        sql: `SELECT p.name, p.position, p.company, p.location, p.connections, p.about, p.url, e.title, e.field, e.end_year 
              FROM clean_yale_profiles p 
              JOIN clean_educations e ON p.person_id = e.person_id 
              WHERE e.title LIKE '%Yale%' 
              ORDER BY p.connections DESC 
              LIMIT 15`,
        reasoning: "Fallback query for Yale alumni",
        search_focus: "General Yale alumni search"
      };
    }
  }

  /**
   * Execute SQL query and return results
   */
  async executeQuery(sql) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
      });

      db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error executing query:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
        db.close();
      });
    });
  }

  /**
   * Get additional experiences for alumni
   */
  async getAlumniExperiences(personIds) {
    if (!personIds || personIds.length === 0) return {};
    
    const placeholders = personIds.map(() => '?').join(',');
    const sql = `SELECT person_id, company, title, start_date, end_date, description 
                 FROM clean_experiences 
                 WHERE person_id IN (${placeholders}) 
                 ORDER BY person_id, start_date DESC`;
    
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.all(sql, personIds, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Group experiences by person_id
          const experiencesByPerson = {};
          rows.forEach(row => {
            if (!experiencesByPerson[row.person_id]) {
              experiencesByPerson[row.person_id] = [];
            }
            experiencesByPerson[row.person_id].push({
              company: row.company,
              title: row.title,
              start_date: row.start_date,
              end_date: row.end_date,
              description: row.description
            });
          });
          resolve(experiencesByPerson);
        }
        db.close();
      });
    });
  }

  /**
   * Process raw database results into structured alumni objects
   */
  async processAlumniResults(rawResults, userQuery, userProfile) {
    if (rawResults.length === 0) return [];

    // Get experiences for all alumni
    const personIds = rawResults.map(row => row.person_id || row.name).filter(Boolean);
    const experiences = await this.getAlumniExperiences(personIds);

    const systemPrompt = `You are processing Yale alumni database results to create structured, relevant alumni profiles.

USER QUERY: "${userQuery}"
USER PROFILE: ${JSON.stringify(userProfile, null, 2)}

RAW DATABASE RESULTS: ${JSON.stringify(rawResults, null, 2)}
EXPERIENCES DATA: ${JSON.stringify(experiences, null, 2)}

TASK: Transform each raw result into a structured alumni object with relevance scoring.

For each alumni, calculate a relevance_score (0-100) based on:
1. Query match (industry, role, company, location)
2. User profile alignment (major, interests, career goals)
3. Connection quality (LinkedIn connections, recent activity)
4. Career progression and achievements

Return ONLY a JSON array of alumni objects:
[
  {
    "name": "Full Name",
    "current_role": "Current Job Title",
    "current_company": "Current Company",
    "current_location": "City, State",
    "linkedin_url": "LinkedIn URL",
    "major": "Field of Study",
    "graduation_year": 2020,
    "relevance_score": 85,
    "match_reason": "Strong match because [specific reasons]",
    "text_snippet": "Comprehensive profile text including about, career path, education, etc.",
    "career_trajectory": "Career progression summary"
  }
]`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Process these alumni results" }
        ],
        temperature: 0.3,
        max_tokens: 3000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error processing alumni results:', error);
      return [];
    }
  }

  /**
   * Main method to search for Yale alumni using AI-powered SQL generation
   */
  async searchAlumni(userQuery, userProfile = {}) {
    try {
      console.log('🔍 Generating AI-powered SQL query...');
      
      // Step 1: Generate SQL query using OpenAI
      const { sql, reasoning, search_focus } = await this.generateSQLQuery(userQuery, userProfile);
      
      console.log('📊 Generated SQL:', sql);
      console.log('🧠 Reasoning:', reasoning);
      
      // Step 2: Execute the SQL query
      console.log('⚡ Executing database query...');
      const rawResults = await this.executeQuery(sql);
      
      console.log(`✅ Found ${rawResults.length} raw results`);
      
      // Step 3: Process results with AI for relevance scoring
      console.log('🤖 Processing results with AI...');
      const processedAlumni = await this.processAlumniResults(rawResults, userQuery, userProfile);
      
      console.log(`🎯 Final result: ${processedAlumni.length} relevant alumni`);
      
      return {
        alumni: processedAlumni,
        searchQuery: sql,
        reasoning,
        searchFocus: search_focus
      };
      
    } catch (error) {
      console.error('❌ Error in YaleDatabaseAI search:', error);
      return {
        alumni: [],
        searchQuery: '',
        reasoning: 'Error occurred during search',
        searchFocus: 'Search failed'
      };
    }
  }

  /**
   * Generate multiple search variations for comprehensive results
   */
  async searchAlumniVariations(userQuery, userProfile = {}) {
    try {
      console.log('🔄 Generating search variations...');
      
      const variations = [
        userQuery,
        `${userQuery} Yale alumni`,
        `Yale ${userQuery} professionals`,
        `${userQuery} careers Yale`,
        `Yale graduates ${userQuery}`
      ];

      const allResults = [];
      
      for (const variation of variations) {
        const result = await this.searchAlumni(variation, userProfile);
        allResults.push(...result.alumni);
      }

      // Remove duplicates and sort by relevance
      const uniqueAlumni = allResults.filter((alumni, index, self) => 
        index === self.findIndex(a => a.name === alumni.name)
      );

      uniqueAlumni.sort((a, b) => b.relevance_score - a.relevance_score);

      return {
        alumni: uniqueAlumni.slice(0, 10), // Top 10 results
        totalSearched: variations.length,
        uniqueFound: uniqueAlumni.length
      };
      
    } catch (error) {
      console.error('❌ Error in search variations:', error);
      return { alumni: [], totalSearched: 0, uniqueFound: 0 };
    }
  }
}

module.exports = YaleDatabaseAI;
