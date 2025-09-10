export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          school: string
          major: string | null
          class_year: number | null
          graduation_month: string | null
          preferences: any
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          school?: string
          major?: string | null
          class_year?: number | null
          graduation_month?: string | null
          preferences?: any
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          school?: string
          major?: string | null
          class_year?: number | null
          graduation_month?: string | null
          preferences?: any
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          company: string
          title: string
          location: string | null
          remote_type: string | null
          salary: any | null
          description: string | null
          requirements: string[] | null
          industry: string | null
          company_size: string | null
          apply_url: string | null
          source: string
          lifestyle_data: any | null
          yale_network: any | null
          growth_data: any | null
          embedding: any | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company: string
          title: string
          location?: string | null
          remote_type?: string | null
          salary?: any | null
          description?: string | null
          requirements?: string[] | null
          industry?: string | null
          company_size?: string | null
          apply_url?: string | null
          source?: string
          lifestyle_data?: any | null
          yale_network?: any | null
          growth_data?: any | null
          embedding?: any | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company?: string
          title?: string
          location?: string | null
          remote_type?: string | null
          salary?: any | null
          description?: string | null
          requirements?: string[] | null
          industry?: string | null
          company_size?: string | null
          apply_url?: string | null
          source?: string
          lifestyle_data?: any | null
          yale_network?: any | null
          growth_data?: any | null
          embedding?: any | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_swipes: {
        Row: {
          id: string
          user_id: string
          job_id: string
          action: 'like' | 'pass' | 'save' | 'apply'
          session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          action: 'like' | 'pass' | 'save' | 'apply'
          session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          action?: 'like' | 'pass' | 'save' | 'apply'
          session_id?: string | null
          created_at?: string
        }
      }
      user_dreams: {
        Row: {
          id: string
          user_id: string
          dream_text: string
          analysis: any | null
          action_plan: any | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          dream_text: string
          analysis?: any | null
          action_plan?: any | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          dream_text?: string
          analysis?: any | null
          action_plan?: any | null
          status?: string
          created_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          industry: string | null
          size_category: string | null
          headquarters: string | null
          website: string | null
          culture_data: any | null
          yale_alumni: any | null
          compensation_data: any | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          industry?: string | null
          size_category?: string | null
          headquarters?: string | null
          website?: string | null
          culture_data?: any | null
          yale_alumni?: any | null
          compensation_data?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          industry?: string | null
          size_category?: string | null
          headquarters?: string | null
          website?: string | null
          culture_data?: any | null
          yale_alumni?: any | null
          compensation_data?: any | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_jobs: {
        Args: {
          query_embedding: any
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          company: string
          title: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
