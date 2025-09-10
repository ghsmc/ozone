import { createClient } from '@supabase/supabase-js'

// Your Supabase credentials
const supabaseUrl = 'https://nbrqemrttrgxmahcnhsf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icnFlbXJ0dHJneG1haGNuaHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NzI2NTIsImV4cCI6MjA3MjQ0ODY1Mn0.eAzYIdiWGZ81N8X6We4tEFzPAbb3DmRsczRZdB4lxiM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface UserProfile {
  id: string
  email: string
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
  created_at: string
  updated_at: string
}

export interface OnboardingData {
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
}
