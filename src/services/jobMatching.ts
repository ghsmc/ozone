import { OnboardingData } from '../lib/supabase';
import allJobsData from '../data/allJobs.json';

export interface MatchedJob {
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
  applicationUrl?: string;
  age?: string;
  matchReasons: string[];
}

export class JobMatchingService {
  private static calculateMatchScore(job: any, profile: OnboardingData): number {
    let score = 0;
    const reasons: string[] = [];

    // Industry match (30 points max)
    if (profile.preferred_industries.length > 0) {
      const industryMatch = profile.preferred_industries.some(industry => 
        job.industry.toLowerCase().includes(industry.toLowerCase()) ||
        job.description.toLowerCase().includes(industry.toLowerCase())
      );
      if (industryMatch) {
        score += 30;
        reasons.push('Industry preference match');
      }
    }

    // Location match (25 points max)
    if (profile.preferred_locations.length > 0) {
      const locationMatch = profile.preferred_locations.some(location => 
        job.location.toLowerCase().includes(location.toLowerCase())
      );
      if (locationMatch) {
        score += 25;
        reasons.push('Location preference match');
      }
    }

    // Work model match (20 points max)
    if (profile.work_model_preference !== 'any') {
      const workModelMatch = job.workModel.toLowerCase().includes(profile.work_model_preference.toLowerCase());
      if (workModelMatch) {
        score += 20;
        reasons.push('Work model preference match');
      }
    }

    // Skills match (15 points max)
    if (profile.skills.length > 0) {
      const skillsMatch = profile.skills.some(skill => 
        job.requirements.some((req: string) => 
          req.toLowerCase().includes(skill.toLowerCase())
        )
      );
      if (skillsMatch) {
        score += 15;
        reasons.push('Skills match');
      }
    }

    // Major/Field match (10 points max)
    if (profile.major) {
      const majorMatch = job.requirements.some((req: string) => 
        req.toLowerCase().includes(profile.major.toLowerCase())
      ) || job.description.toLowerCase().includes(profile.major.toLowerCase());
      
      if (majorMatch) {
        score += 10;
        reasons.push('Academic background match');
      }
    }

    // Yale network bonus (5 points max)
    if (job.yaleCount > 0) {
      score += Math.min(job.yaleCount * 2, 5);
      reasons.push(`${job.yaleCount} Yale alumni at company`);
    }

    return Math.min(score, 100); // Cap at 100
  }

  private static getCompanySize(job: any): string {
    // This is a simplified approach - in a real app, you'd have actual company size data
    const largeCompanies = ['Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'Goldman Sachs', 'JPMorgan', 'McKinsey'];
    const mediumCompanies = ['Stripe', 'Palantir', 'Airbnb', 'Uber', 'Netflix'];
    
    if (largeCompanies.some(company => job.company.includes(company))) {
      return 'Large (1000+)';
    } else if (mediumCompanies.some(company => job.company.includes(company))) {
      return 'Medium (201-1000)';
    } else {
      return 'Small (51-200)';
    }
  }

  private static matchesCompanySizePreference(job: any, profile: OnboardingData): boolean {
    if (profile.preferred_company_sizes.length === 0) return true;
    
    const companySize = this.getCompanySize(job);
    return profile.preferred_company_sizes.includes(companySize);
  }

  private static matchesSalaryExpectation(job: any, profile: OnboardingData): boolean {
    if (!profile.salary_expectation_min) return true;
    
    // Extract salary range from job.salary string (e.g., "$80,000 - $120,000")
    const salaryMatch = job.salary.match(/\$?([0-9,]+)/g);
    if (!salaryMatch) return true;
    
    const minSalary = parseInt(salaryMatch[0].replace(/[$,]/g, ''));
    return minSalary >= (profile.salary_expectation_min || 0);
  }

  static generateMatchedJobs(profile: OnboardingData, limit: number = 20): MatchedJob[] {
    const allJobs = allJobsData as any[];
    
    // Filter and score jobs
    const scoredJobs = allJobs
      .map(job => {
        const matchScore = this.calculateMatchScore(job, profile);
        const matchReasons = this.getMatchReasons(job, profile);
        
        return {
          ...job,
          matchScore,
          matchReasons
        };
      })
      .filter(job => {
        // Apply filters
        const companySizeMatch = this.matchesCompanySizePreference(job, profile);
        const salaryMatch = this.matchesSalaryExpectation(job, profile);
        
        return companySizeMatch && salaryMatch && job.matchScore > 0;
      })
      .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score descending
      .slice(0, limit);

    return scoredJobs;
  }

  private static getMatchReasons(job: any, profile: OnboardingData): string[] {
    const reasons: string[] = [];

    // Industry match
    if (profile.preferred_industries.length > 0) {
      const industryMatch = profile.preferred_industries.some(industry => 
        job.industry.toLowerCase().includes(industry.toLowerCase()) ||
        job.description.toLowerCase().includes(industry.toLowerCase())
      );
      if (industryMatch) {
        reasons.push('Industry preference match');
      }
    }

    // Location match
    if (profile.preferred_locations.length > 0) {
      const locationMatch = profile.preferred_locations.some(location => 
        job.location.toLowerCase().includes(location.toLowerCase())
      );
      if (locationMatch) {
        reasons.push('Location preference match');
      }
    }

    // Work model match
    if (profile.work_model_preference !== 'any') {
      const workModelMatch = job.workModel.toLowerCase().includes(profile.work_model_preference.toLowerCase());
      if (workModelMatch) {
        reasons.push('Work model preference match');
      }
    }

    // Skills match
    if (profile.skills.length > 0) {
      const skillsMatch = profile.skills.some(skill => 
        job.requirements.some((req: string) => 
          req.toLowerCase().includes(skill.toLowerCase())
        )
      );
      if (skillsMatch) {
        reasons.push('Skills match');
      }
    }

    // Major match
    if (profile.major) {
      const majorMatch = job.requirements.some((req: string) => 
        req.toLowerCase().includes(profile.major.toLowerCase())
      ) || job.description.toLowerCase().includes(profile.major.toLowerCase());
      
      if (majorMatch) {
        reasons.push('Academic background match');
      }
    }

    // Yale network
    if (job.yaleCount > 0) {
      reasons.push(`${job.yaleCount} Yale alumni at company`);
    }

    return reasons;
  }

  static getPersonalizedFeedMessage(profile: OnboardingData): string {
    const { full_name, preferred_industries, preferred_locations } = profile;
    
    let message = `Welcome ${full_name}! `;
    
    if (preferred_industries.length > 0) {
      message += `We've curated opportunities in ${preferred_industries.join(', ')}. `;
    }
    
    if (preferred_locations.length > 0) {
      message += `Focusing on ${preferred_locations.join(', ')} locations. `;
    }
    
    message += 'Swipe through your personalized job matches!';
    
    return message;
  }
}
