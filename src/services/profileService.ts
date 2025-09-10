import { OnboardingData } from '../lib/supabase';

export interface ProfileResponse {
  success: boolean;
  message: string;
  profileId: string;
}

export class ProfileService {
  private static baseUrl = 'http://localhost:3001/api';

  static async saveProfile(profileData: OnboardingData): Promise<ProfileResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileData }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save profile: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  }

  static async getProfile(userId: string): Promise<OnboardingData> {
    try {
      const response = await fetch(`${this.baseUrl}/profiles/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  static async validateProfile(profileData: OnboardingData): Promise<{
    matchingJobs: number;
    recommendation: string;
  }> {
    try {
      // For now, return mock validation
      // In a real app, this would call the backend to validate against job database
      const mockMatchingJobs = Math.floor(Math.random() * 50) + 10;
      return {
        matchingJobs: mockMatchingJobs,
        recommendation: mockMatchingJobs < 10 ? 'Consider broadening your interests' : 'Great selection!'
      };
    } catch (error) {
      console.error('Error validating profile:', error);
      return { matchingJobs: 0, recommendation: 'Please check your preferences' };
    }
  }
}
