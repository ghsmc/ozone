import { YaleAlumni } from './yaleAlumniService';

export interface AlumniInsight {
  networking_strategy: string;
  career_advice: string;
  connection_approach: string;
  key_questions: string[];
  referral_potential: 'high' | 'medium' | 'low';
  value_proposition: string;
}

export interface CompanyInsight {
  company: string;
  alumni_count: number;
  networking_opportunities: string;
  common_paths: string[];
  hiring_patterns: string;
  referral_strategy: string;
  key_contacts: string[];
}

class AlumniInsightsService {
  private baseUrl = 'http://localhost:3001';

  /**
   * Get AI-powered insights for a specific alumni profile
   */
  async getAlumniInsights(alumni: YaleAlumni): Promise<AlumniInsight> {
    try {
      const response = await fetch(`${this.baseUrl}/api/alumni-insights/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alumni_profile: {
            name: alumni.name,
            current_title: alumni.current_title,
            current_company: alumni.current_company,
            location: alumni.location,
            connections: alumni.connections,
            followers: alumni.followers,
            recommendations_count: alumni.recommendations_count,
            yale_connection: alumni.yale_connection,
            experiences: alumni.experiences,
            education: alumni.education,
            about: alumni.about
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get alumni insights: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting alumni insights:', error);
      // Return fallback insights based on profile data
      return this.generateFallbackInsights(alumni);
    }
  }

  /**
   * Get company-level insights and networking strategy
   */
  async getCompanyInsights(companyName: string, alumniList: YaleAlumni[]): Promise<CompanyInsight> {
    try {
      const response = await fetch(`${this.baseUrl}/api/alumni-insights/company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: companyName,
          alumni_profiles: alumniList.map(alumni => ({
            name: alumni.name,
            current_title: alumni.current_title,
            connections: alumni.connections,
            yale_connection: alumni.yale_connection,
            experiences: alumni.experiences,
            location: alumni.location
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get company insights: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting company insights:', error);
      return this.generateFallbackCompanyInsights(companyName, alumniList);
    }
  }

  /**
   * Generate fallback insights when AI service is unavailable
   */
  private generateFallbackInsights(alumni: YaleAlumni): AlumniInsight {
    const isHighNetwork = alumni.connections >= 500;
    const isCurrentEmployee = alumni.experiences.some(exp => exp.is_current);
    const isExperienced = alumni.experiences.length > 3;

    let networking_strategy = '';
    let career_advice = '';
    let connection_approach = '';
    let referral_potential: 'high' | 'medium' | 'low' = 'medium';

    if (isHighNetwork && isCurrentEmployee) {
      networking_strategy = 'This is a high-value connection - current employee with extensive network. Perfect for referrals and company insights.';
      career_advice = 'Ask about current hiring trends, team structure, and what makes candidates stand out at this company.';
      connection_approach = 'Send a personalized LinkedIn message mentioning your Yale connection and specific interest in their role/company.';
      referral_potential = 'high';
    } else if (isCurrentEmployee) {
      networking_strategy = 'Current employee - ideal for informational interviews and understanding company culture.';
      career_advice = 'Ask about day-to-day responsibilities, company growth, and career development opportunities.';
      connection_approach = 'Request a 15-minute informational interview to learn about their career journey.';
      referral_potential = 'high';
    } else if (isHighNetwork) {
      networking_strategy = 'High-influence alumni with extensive network - great for introductions to other Yale grads.';
      career_advice = 'Ask about industry trends and connections to other alumni at target companies.';
      connection_approach = 'Mention your Yale connection and ask for introductions to other alumni in your field.';
      referral_potential = 'medium';
    } else if (isExperienced) {
      networking_strategy = 'Experienced alumni with diverse career background - valuable for career guidance.';
      career_advice = 'Ask about career progression, industry insights, and lessons learned from their journey.';
      connection_approach = 'Request career advice and insights about transitioning into their industry.';
      referral_potential = 'medium';
    } else {
      networking_strategy = 'Recent graduate - great for understanding current hiring process and company culture.';
      career_advice = 'Ask about their recent job search experience and what helped them land their role.';
      connection_approach = 'Connect as a fellow Yale student/alumni and ask about their career journey.';
      referral_potential = 'low';
    }

    return {
      networking_strategy,
      career_advice,
      connection_approach,
      key_questions: [
        'How did you transition from Yale to your current role?',
        'What advice would you give to a current Yale student interested in this field?',
        'What skills or experiences were most valuable in your career?',
        'How can I best prepare for roles at companies like yours?'
      ],
      referral_potential,
      value_proposition: `Yale ${alumni.yale_connection} with ${alumni.connections} connections and ${alumni.experiences.length} career experiences`
    };
  }

  /**
   * Generate fallback company insights
   */
  private generateFallbackCompanyInsights(companyName: string, alumniList: YaleAlumni[]): CompanyInsight {
    const currentEmployees = alumniList.filter(alumni => 
      alumni.experiences.some(exp => exp.is_current && exp.company === companyName)
    );
    const highNetworkAlumni = alumniList.filter(alumni => alumni.connections >= 500);
    const recentGrads = alumniList.filter(alumni => 
      alumni.yale_connection.includes('20') && 
      parseInt(alumni.yale_connection.slice(-2)) >= 20
    );

    const commonPaths = alumniList
      .filter(alumni => alumni.experiences.length > 1)
      .map(alumni => {
        const prevExp = alumni.experiences.find(exp => !exp.is_current);
        return prevExp ? `${prevExp.company} → ${companyName}` : '';
      })
      .filter(path => path)
      .slice(0, 3);

    return {
      company: companyName,
      alumni_count: alumniList.length,
      networking_opportunities: `${currentEmployees.length} current employees, ${highNetworkAlumni.length} high-network alumni, ${recentGrads.length} recent graduates`,
      common_paths: commonPaths,
      hiring_patterns: `Yale alumni density: ${alumniList.length} total, with strong representation in ${alumniList[0]?.current_title || 'various roles'}`,
      referral_strategy: currentEmployees.length > 0 
        ? 'Focus on current employees for referrals and company insights'
        : 'Connect with recent graduates for hiring process insights',
      key_contacts: alumniList
        .sort((a, b) => b.connections - a.connections)
        .slice(0, 3)
        .map(alumni => alumni.name)
    };
  }
}

export const alumniInsightsService = new AlumniInsightsService();

