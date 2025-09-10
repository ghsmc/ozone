import { Job } from './jobService';

export interface YaleAlumni {
  person_id: string;
  name: string;
  position: string;
  location: string;
  connections: number;
  followers: number;
  avatar?: string;
  about?: string;
  current_company: string;
  current_title: string;
  experiences: AlumniExperience[];
  education: AlumniEducation[];
  yale_connection: string; // e.g., "Yale '15", "Yale Law '18"
}

export interface AlumniExperience {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  location?: string;
  description?: string;
  is_current: boolean;
}

export interface AlumniEducation {
  title: string; // e.g., "Yale University"
  degree: string;
  field: string;
  start_year: number;
  end_year: number;
}

export interface CompanyAlumniData {
  company: string;
  alumni_count: number;
  alumni: YaleAlumni[];
  career_trajectories: {
    entry_level: number;
    mid_level: number;
    senior_level: number;
    executive_level: number;
  };
  common_paths: string[];
  top_locations: string[];
}

class YaleAlumniService {
  private baseUrl = 'http://localhost:3001'; // Backend API URL

  /**
   * Get Yale alumni who worked at a specific company
   */
  async getCompanyAlumni(companyName: string): Promise<CompanyAlumniData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/yale-alumni/company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ company: companyName }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch alumni data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Yale alumni data:', error);
      // Return mock data as fallback
      return this.getMockAlumniData(companyName);
    }
  }

  /**
   * Get alumni data for multiple companies (for job cards)
   */
  async getAlumniForJobs(jobs: Job[]): Promise<Map<string, CompanyAlumniData>> {
    const alumniMap = new Map<string, CompanyAlumniData>();
    
    // Process jobs in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      const promises = batch.map(async (job) => {
        const alumniData = await this.getCompanyAlumni(job.company);
        alumniMap.set(job.company, alumniData);
      });
      
      await Promise.all(promises);
    }
    
    return alumniMap;
  }

  /**
   * Get career trajectory insights for a specific alumni
   */
  async getCareerTrajectory(personId: string): Promise<AlumniExperience[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/yale-alumni/trajectory/${personId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch career trajectory: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching career trajectory:', error);
      return [];
    }
  }

  /**
   * Mock data for development/fallback
   */
  private getMockAlumniData(companyName: string): CompanyAlumniData {
    const mockAlumni: YaleAlumni[] = [
      {
        person_id: 'mock-1',
        name: 'Sarah Chen',
        position: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        connections: 500,
        followers: 1200,
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        about: 'Yale CS grad passionate about building scalable systems and mentoring junior developers.',
        current_company: companyName,
        current_title: 'Senior Software Engineer',
        experiences: [
          {
            company: companyName,
            title: 'Senior Software Engineer',
            start_date: '2022',
            end_date: 'Present',
            location: 'San Francisco, CA',
            is_current: true
          },
          {
            company: 'Microsoft',
            title: 'Software Engineer',
            start_date: '2020',
            end_date: '2022',
            location: 'Seattle, WA',
            is_current: false
          }
        ],
        education: [
          {
            title: 'Yale University',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            start_year: 2016,
            end_year: 2020
          }
        ],
        yale_connection: "Yale '20"
      },
      {
        person_id: 'mock-2',
        name: 'David Rodriguez',
        position: 'Product Manager',
        location: 'New York, NY',
        connections: 750,
        followers: 2100,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        about: 'Yale Economics grad with 5+ years in product management. Passionate about user experience and data-driven decisions.',
        current_company: companyName,
        current_title: 'Product Manager',
        experiences: [
          {
            company: companyName,
            title: 'Product Manager',
            start_date: '2021',
            end_date: 'Present',
            location: 'New York, NY',
            is_current: true
          },
          {
            company: 'McKinsey & Company',
            title: 'Business Analyst',
            start_date: '2019',
            end_date: '2021',
            location: 'New York, NY',
            is_current: false
          }
        ],
        education: [
          {
            title: 'Yale University',
            degree: 'Bachelor of Arts',
            field: 'Economics',
            start_year: 2015,
            end_year: 2019
          }
        ],
        yale_connection: "Yale '19"
      },
      {
        person_id: 'mock-3',
        name: 'Emily Watson',
        position: 'Research Scientist',
        location: 'Cambridge, MA',
        connections: 300,
        followers: 800,
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        about: 'Yale PhD in Machine Learning. Currently working on AI research with focus on natural language processing.',
        current_company: companyName,
        current_title: 'Research Scientist',
        experiences: [
          {
            company: companyName,
            title: 'Research Scientist',
            start_date: '2023',
            end_date: 'Present',
            location: 'Cambridge, MA',
            is_current: true
          },
          {
            company: 'MIT CSAIL',
            title: 'Postdoctoral Researcher',
            start_date: '2021',
            end_date: '2023',
            location: 'Cambridge, MA',
            is_current: false
          }
        ],
        education: [
          {
            title: 'Yale University',
            degree: 'PhD',
            field: 'Computer Science',
            start_year: 2017,
            end_year: 2021
          },
          {
            title: 'Yale University',
            degree: 'Bachelor of Science',
            field: 'Mathematics',
            start_year: 2013,
            end_year: 2017
          }
        ],
        yale_connection: "Yale PhD '21"
      }
    ];

    return {
      company: companyName,
      alumni_count: mockAlumni.length,
      alumni: mockAlumni,
      career_trajectories: {
        entry_level: 1,
        mid_level: 1,
        senior_level: 1,
        executive_level: 0
      },
      common_paths: [
        'Software Engineering → Senior Engineer',
        'Consulting → Product Management',
        'Research → Industry Research'
      ],
      top_locations: ['San Francisco, CA', 'New York, NY', 'Cambridge, MA']
    };
  }
}

export const yaleAlumniService = new YaleAlumniService();

