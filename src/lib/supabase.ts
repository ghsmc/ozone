import { createClient } from '@supabase/supabase-js'

// Supabase configuration - using environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface UserProfile extends OnboardingData {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface OnboardingData {
  id?: string
  email: string
  password?: string
  full_name: string
  graduation_year: number
  major: string
  gpa?: number
  preferred_locations: string[]
  preferred_industries: string[]
  preferred_company_sizes: string[]
  work_model_preference: 'remote' | 'hybrid' | 'onsite' | 'any'
  salary_expectation_min?: number
  salary_expectation_max?: number
  skills: string[]
  interests: string[]
  career_goals: string
  created_at?: string
  updated_at?: string
}
