/**
 * Milo API Service - Server-side OpenAI calls
 * This would typically be a backend API, but for demo purposes we'll use a fallback
 */

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

export interface MiloResponse {
  student_reflection: {
    who_you_are: string;
    motivations: string[];
    skill_themes: string[];
    time_of_year_implications: string[];
  };
  opportunities: Array<{
    title: string;
    org_name: string;
    category: string;
    why_it_fits: string;
    link_or_how_to_find: string;
    yale_connection: string;
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
  }>;
  yale_specific_doors: Array<{
    name: string;
    type: string;
    link: string;
    how_to_engage: string;
    exact_next_step: string;
  }>;
  weekly_plan: Array<{
    day: string;
    task: string;
  }>;
  quality_checks: {
    specific_items_count: number;
    yale_items_count: number;
    links_present: boolean;
    aligned_with_constraints: boolean;
  };
}

export class MiloAPIService {
  async generateOpportunities(profile: StudentProfile): Promise<MiloResponse> {
    // For now, return a high-quality mock response
    // In production, this would call your backend API
    return this.getMockResponse(profile);
  }

  private getMockResponse(profile: StudentProfile): MiloResponse {
    const interests = profile.interests.join(', ');
    const major = profile.major;
    
    return {
      student_reflection: {
        who_you_are: `A ${profile.class_year} ${major} student with interests in ${interests}`,
        motivations: [
          'Exploring career paths in your field of interest',
          'Building practical skills and experience',
          'Making meaningful connections in your industry'
        ],
        skill_themes: profile.skills_and_clubs.length > 0 ? profile.skills_and_clubs : [major, 'Research', 'Analysis'],
        time_of_year_implications: [
          'Early recruiting season - perfect time to network',
          'Time to build relationships and explore opportunities',
          'Great time for informational interviews and applications'
        ]
      },
      opportunities: [
        {
          title: "Research Assistant",
          org_name: "Yale Center for Business and the Environment",
          category: "research_RA",
          why_it_fits: `Perfect for a ${major} student interested in ${interests}. Provides hands-on research experience and connects you with faculty working on cutting-edge projects.`,
          link_or_how_to_find: "https://cbey.yale.edu/",
          yale_connection: "center",
          contact: {
            name_or_role: "Program Coordinator",
            email_or_handle: null,
            how_to_get_introduced: "Email through the center's contact form or attend their events"
          },
          action_ladder: {
            first_touch: "Send email expressing interest in research opportunities",
            micro_project_to_offer: "Offer to help with data analysis or literature review",
            apply_or_interview_step: "Schedule informational interview with faculty"
          },
          timing: {
            best_apply_window: "Fall semester for spring opportunities",
            notes_for_current_term: "Good time to reach out and build relationships"
          },
          constraints_fit: profile.constraints
        },
        {
          title: "Alumni Mentorship Program",
          org_name: "Yale Alumni Association",
          category: "self_designed",
          why_it_fits: `Connect with Yale alumni in your field of interest (${interests}). Great way to explore career paths and get insider advice.`,
          link_or_how_to_find: "https://alumni.yale.edu/",
          yale_connection: "alumni",
          contact: {
            name_or_role: "Alumni Relations",
            email_or_handle: null,
            how_to_get_introduced: "Through Yale Alumni Directory and LinkedIn"
          },
          action_ladder: {
            first_touch: "Search alumni directory for your field of interest",
            micro_project_to_offer: "Offer to help with a project or research",
            apply_or_interview_step: "Request informational interview"
          },
          timing: {
            best_apply_window: "Anytime",
            notes_for_current_term: "Great time to build relationships"
          },
          constraints_fit: profile.constraints
        },
        {
          title: "Startup Internship",
          org_name: "Yale Innovation Labs",
          category: "internship",
          why_it_fits: `Perfect for ${major} students interested in ${interests}. Work with cutting-edge startups and gain entrepreneurial experience.`,
          link_or_how_to_find: "https://innovation.yale.edu/",
          yale_connection: "center",
          contact: {
            name_or_role: "Innovation Labs Coordinator",
            email_or_handle: null,
            how_to_get_introduced: "Attend innovation events and reach out directly"
          },
          action_ladder: {
            first_touch: "Attend innovation labs events and workshops",
            micro_project_to_offer: "Propose a project related to your interests",
            apply_or_interview_step: "Apply for internship program"
          },
          timing: {
            best_apply_window: "Spring semester for summer internships",
            notes_for_current_term: "Start attending events now"
          },
          constraints_fit: profile.constraints
        },
        {
          title: "Study Abroad Research",
          org_name: "Yale Study Abroad",
          category: "study_abroad",
          why_it_fits: `Combine your interest in ${interests} with international experience. Many programs offer research opportunities.`,
          link_or_how_to_find: "https://studyabroad.yale.edu/",
          yale_connection: "center",
          contact: {
            name_or_role: "Study Abroad Advisor",
            email_or_handle: null,
            how_to_get_introduced: "Schedule appointment with study abroad office"
          },
          action_ladder: {
            first_touch: "Schedule appointment with study abroad advisor",
            micro_project_to_offer: "Propose research project for abroad program",
            apply_or_interview_step: "Apply for study abroad program"
          },
          timing: {
            best_apply_window: "Fall semester for next year programs",
            notes_for_current_term: "Perfect time to start planning"
          },
          constraints_fit: profile.constraints
        },
        {
          title: "Fellowship Application",
          org_name: "Yale Office of Fellowship Programs",
          category: "fellowship",
          why_it_fits: `Fellowships can provide funding for research in ${interests}. Great way to pursue your passions with financial support.`,
          link_or_how_to_find: "https://fellowships.yale.edu/",
          yale_connection: "center",
          contact: {
            name_or_role: "Fellowship Advisor",
            email_or_handle: null,
            how_to_get_introduced: "Schedule appointment with fellowship office"
          },
          action_ladder: {
            first_touch: "Schedule appointment with fellowship advisor",
            micro_project_to_offer: "Develop fellowship proposal",
            apply_or_interview_step: "Submit fellowship application"
          },
          timing: {
            best_apply_window: "Varies by fellowship",
            notes_for_current_term: "Start researching opportunities now"
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
        },
        {
          name: "Yale Innovation Labs",
          type: "center",
          link: "https://innovation.yale.edu/",
          how_to_engage: "Attend innovation events and workshops",
          exact_next_step: "Sign up for their newsletter and attend next event"
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
        specific_items_count: 5,
        yale_items_count: 3,
        links_present: true,
        aligned_with_constraints: true
      }
    };
  }
}

export const miloAPIService = new MiloAPIService();
