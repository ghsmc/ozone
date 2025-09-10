export interface Professional {
  person_id: string;
  full_name: string;
  headline?: string;
  about?: string;
  current_title?: string;
  current_company?: string;
  current_company_logo?: string;
  location_city?: string;
  location_country?: string;
  avatar_url?: string;
  linkedin_url?: string;
  connections?: number;
  followers?: number;
  recommendations_count?: number;
  match_score?: number;
  education?: Education[];
  experience?: Experience[];
  skills?: string[];
}

export interface Education {
  school: string;
  degree?: string;
  field?: string;
  start_date?: string;
  end_date?: string;
}

export interface Experience {
  company: string;
  title: string;
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface SearchFilters {
  company: string;
  location: string;
  title: string;
  school: string;
}

export interface SearchResults {
  results: Professional[];
  total: number;
  query_explanation: string;
  sql_query: string;
  nlp_filters: {
    companies?: string[];
    titles?: string[];
    schools?: string[];
    locations?: string[];
    skills?: string[];
    current_only?: boolean;
  };
  milo_response?: any; // Milo Opportunity Scout response
}

export interface Stats {
  total_people: number;
  total_companies: number;
  total_cities: number;
  total_industries: number;
}