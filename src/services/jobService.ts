import { OnboardingData } from '../lib/supabase';

export interface Job {
  id: number;
  company: string;
  title: string;
  location: string;
  salary: string;
  workModel: string;
  matchScore: number;
  yaleCount: number;
  industry: string;
  description: string;
  requirements: string[];
  age: string;
  isResearch?: boolean;
}

export interface JobResponse {
  jobs: Job[];
}

export class JobService {
  private static baseUrl = 'http://localhost:3001/api';

  static async getMatchedJobs(userProfile: OnboardingData): Promise<Job[]> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/matched`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userProfile }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch matched jobs: ${response.statusText}`);
      }

      const data: JobResponse = await response.json();
      return data.jobs;
    } catch (error) {
      console.error('Error fetching matched jobs:', error);
      throw error;
    }
  }

  static async recordSwipe(userId: string, jobId: number, action: 'like' | 'pass'): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/swipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId, 
          jobId, 
          action,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to record swipe: ${response.statusText}`);
      }

      console.log(`Swipe recorded: ${action} on job ${jobId}`);
    } catch (error) {
      console.error('Error recording swipe:', error);
      // Don't throw error for swipe recording - it's not critical
    }
  }
}
