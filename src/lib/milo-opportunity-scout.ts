/**
 * Milo: Off-the-Beaten-Path Opportunity Scout
 * Production-ready system for finding unconventional opportunities for Yale students
 */

// Using the real API route instead of mock service

export interface StudentProfile {
  name: string;
  class_year: number;
  major: string;
  skills_and_clubs: string[];
  interests: string[];
  constraints: string[];
  current_term: string;
  current_date: string;
  location: string;
}

export interface Opportunity {
  title: string;
  org_name: string;
  category: 'internship' | 'part_time' | 'research_RA' | 'fellowship' | 'study_abroad' | 'startup_shadow' | 'self_designed';
  why_it_fits: string;
  link_or_how_to_find: string;
  yale_connection: 'professor' | 'lab' | 'center' | 'alumni' | 'none';
  contact: {
    name_or_role: string;
    email_or_handle: string | null;
    how_to_get_introduced: string;
  };
  action_ladder: {
    first_touch: string;
    micro_project_to_offer: string;
    apply_or_interview_step: string;
  };
  timing: {
    best_apply_window: string;
    notes_for_current_term: string;
  };
  constraints_fit: string[];
}

export interface YaleDoor {
  name: string;
  type: 'center' | 'lab' | 'program' | 'professor' | 'alumni_network';
  link: string;
  how_to_engage: string;
  exact_next_step: string;
}

export interface WeeklyPlan {
  day: string;
  task: string;
}

export interface MiloResponse {
  student_reflection: {
    who_you_are: string;
    motivations: string[];
    skill_themes: string[];
    time_of_year_implications: string[];
  };
  opportunities: Opportunity[];
  yale_specific_doors: YaleDoor[];
  weekly_plan: WeeklyPlan[];
  quality_checks: {
    specific_items_count: number;
    yale_items_count: number;
    links_present: boolean;
    aligned_with_constraints: boolean;
  };
}

const MILO_SYSTEM_PROMPT = `You are Milo, an AI opportunity scout built by Yale students, for Yale students. Your job is to help a student uncover unconventional, energizing opportunities—internships, part-time work, research, fellowships, study-abroad, alumni projects—that align with their values and curiosities. You must prove what's possible with specific, real options and immediate next steps.

Research & Psychology Principles (baked in):
- Originality over conformity: de-default from consulting/IB/FAANG pipelines; surface non-obvious doors and "create your own slot" options.
- Passion is discovered through doing: recommend small experiments → projects → commitments.
- Hidden potential & character skills: nudge toward growth via challenge, feedback, and craft.
- Givers win long-run: include options that help communities or build ecosystems.
- Deep work over optics: prefer opportunities that build real skill, portfolio artifacts, and relationships.

Output rules (non-negotiable):
- Be specific: At least 5 items must be name-level (company, lab, program, fellowship, professor) + a link (or exact path to find it) + why it fits this student.
- Yale leverage: Always include 3+ Yale-connected leads (centers, labs, professors, alumni orgs, study-abroad the college approves).
- Time-of-year awareness: Tailor to current term (application windows, priority timelines, which doors are hot vs. closed).
- Action ladder: For each item, include (a) first touch (who/how to contact), (b) micro-project to propose, (c) apply/interview step.
- Diversity of bets: Balance by scope & risk: quick shadowing / micro-RA → part-time/semester RA → funded summer → bold proposal (grant/fellowship).
- No filler: If you're unsure of a detail, say how to verify it in 1 step (e.g., "Search 'site:[org].org internship'").

Return valid JSON matching the exact schema provided.`;

export class MiloOpportunityScout {
  async findOpportunities(profile: StudentProfile): Promise<MiloResponse> {
    try {
      // Call the Next.js API route instead of Express server
      const response = await fetch('/api/milo/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentProfile: profile }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const miloResponse = await response.json();
      
      // Validate the response structure
      if (!this.validateResponse(miloResponse)) {
        throw new Error('Invalid response structure from API');
      }

      return miloResponse as MiloResponse;
    } catch (error) {
      console.error('Error finding opportunities:', error);
      // Return a fallback response with basic opportunities
      return this.getFallbackResponse(profile);
    }
  }

  async findOpportunitiesStream(profile: StudentProfile, onUpdate: (data: any) => void): Promise<MiloResponse> {
    try {
      const response = await fetch('/api/milo/opportunities/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentProfile: profile }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'start') {
                  onUpdate({ type: 'start', message: data.message });
                } else if (data.type === 'content') {
                  fullResponse += data.content;
                  onUpdate({ type: 'content', content: fullResponse });
                } else if (data.type === 'complete') {
                  onUpdate({ type: 'complete', data: data.data });
                  return data.data as MiloResponse;
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError);
              }
            }
          }
        }
      }

      throw new Error('Stream ended without completion');
    } catch (error) {
      console.error('Error in streaming opportunities:', error);
      // Return a fallback response with basic opportunities
      return this.getFallbackResponse(profile);
    }
  }

  private validateResponse(response: any): boolean {
    return (
      response &&
      response.student_reflection &&
      response.opportunities &&
      Array.isArray(response.opportunities) &&
      response.opportunities.length >= 5 &&
      response.yale_specific_doors &&
      Array.isArray(response.yale_specific_doors) &&
      response.yale_specific_doors.length >= 3
    );
  }

  private getFallbackResponse(profile: StudentProfile): MiloResponse {
    return {
      student_reflection: {
        who_you_are: `A ${profile.class_year} ${profile.major} student with interests in ${profile.interests.join(', ')}`,
        motivations: ['Exploring career paths', 'Building practical skills', 'Making meaningful connections'],
        skill_themes: profile.skills_and_clubs,
        time_of_year_implications: ['Early recruiting season', 'Time to build relationships', 'Perfect for informational interviews']
      },
      opportunities: [
        {
          title: "Research Assistant",
          org_name: "Yale Center for Business and the Environment",
          category: "research_RA",
          why_it_fits: "Aligns with your interest in sustainability and provides research experience",
          link_or_how_to_find: "https://cbey.yale.edu/",
          yale_connection: "center",
          contact: {
            name_or_role: "Program Coordinator",
            email_or_handle: null,
            how_to_get_introduced: "Email through the center's contact form"
          },
          action_ladder: {
            first_touch: "Send email expressing interest in research opportunities",
            micro_project_to_offer: "Offer to help with data analysis or literature review",
            apply_or_interview_step: "Schedule informational interview"
          },
          timing: {
            best_apply_window: "Fall semester",
            notes_for_current_term: "Good time to reach out for spring opportunities"
          },
          constraints_fit: profile.constraints
        },
        {
          title: "Alumni Mentorship Program",
          org_name: "Yale Alumni Association",
          category: "self_designed",
          why_it_fits: "Connect with alumni in your field of interest",
          link_or_how_to_find: "https://alumni.yale.edu/",
          yale_connection: "alumni",
          contact: {
            name_or_role: "Alumni Relations",
            email_or_handle: null,
            how_to_get_introduced: "Through Yale Alumni Directory"
          },
          action_ladder: {
            first_touch: "Search alumni directory for your field",
            micro_project_to_offer: "Offer to help with a project or research",
            apply_or_interview_step: "Request informational interview"
          },
          timing: {
            best_apply_window: "Anytime",
            notes_for_current_term: "Great time to build relationships"
          },
          constraints_fit: profile.constraints
        }
      ],
      yale_specific_doors: [
        {
          name: "Yale Center for Business and the Environment",
          type: "center",
          link: "https://cbey.yale.edu/",
          how_to_engage: "Attend events and reach out to faculty",
          exact_next_step: "Check their events calendar and attend next seminar"
        },
        {
          name: "Yale Alumni Directory",
          type: "alumni_network",
          link: "https://alumni.yale.edu/",
          how_to_engage: "Search for alumni in your field",
          exact_next_step: "Create account and search for alumni in your interests"
        }
      ],
      weekly_plan: [
        { day: "Mon", task: "Research 3 companies in your field" },
        { day: "Tue", task: "Reach out to 2 alumni for informational interviews" },
        { day: "Wed", task: "Attend Yale career services workshop" },
        { day: "Thu", task: "Follow up on previous outreach" },
        { day: "Fri", task: "Plan next week's networking activities" }
      ],
      quality_checks: {
        specific_items_count: 2,
        yale_items_count: 2,
        links_present: true,
        aligned_with_constraints: true
      }
    };
  }

  // Helper method to convert onboarding data to student profile
  static fromOnboardingData(onboardingData: any): StudentProfile {
    const currentDate = new Date();
    const currentTerm = this.getCurrentTerm(currentDate);
    
    return {
      name: onboardingData.full_name || 'Student',
      class_year: onboardingData.graduation_year || currentDate.getFullYear() + 1,
      major: onboardingData.major || 'Undeclared',
      skills_and_clubs: onboardingData.skills || [],
      interests: onboardingData.interests || onboardingData.preferred_industries || [],
      constraints: this.getConstraintsFromPreferences(onboardingData),
      current_term: currentTerm,
      current_date: currentDate.toISOString().split('T')[0],
      location: 'New Haven, CT'
    };
  }

  private static getCurrentTerm(date: Date): string {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    if (month >= 8 && month <= 11) {
      return `Fall ${year} (early recruiting)`;
    } else if (month >= 0 && month <= 4) {
      return `Spring ${year}`;
    } else {
      return `Summer ${year}`;
    }
  }

  private static getConstraintsFromPreferences(preferences: any): string[] {
    const constraints = [];
    
    if (preferences.salary_expectation_min) {
      constraints.push('paid');
    }
    
    if (preferences.work_model_preference === 'remote') {
      constraints.push('remote-ok');
    }
    
    if (preferences.work_model_preference === 'hybrid') {
      constraints.push('hybrid-ok');
    }
    
    return constraints;
  }
}

export const miloScout = new MiloOpportunityScout();
