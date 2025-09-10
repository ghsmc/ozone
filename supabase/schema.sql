-- MILO Backend Database Schema
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Users and profiles
CREATE TABLE profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  school TEXT DEFAULT 'Yale University',
  major TEXT,
  class_year INTEGER,
  graduation_month TEXT,
  preferences JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs with rich metadata
CREATE TABLE jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  remote_type TEXT, -- 'remote', 'hybrid', 'onsite'
  salary JSONB, -- {base, bonus, total, benefits}
  description TEXT,
  requirements TEXT[],
  industry TEXT,
  company_size TEXT,
  apply_url TEXT,
  source TEXT DEFAULT 'simplifyjobs',
  lifestyle_data JSONB, -- photos, schedule, culture
  yale_network JSONB, -- employee data, connections
  growth_data JSONB, -- career progression, success rates
  embedding VECTOR(1536), -- for semantic matching
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User interactions and learning
CREATE TABLE user_swipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('like', 'pass', 'save', 'apply')),
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI dream planning
CREATE TABLE user_dreams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  dream_text TEXT,
  analysis JSONB, -- AI-parsed goals, timeline, requirements
  action_plan JSONB, -- three-column output
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Universal search history
CREATE TABLE search_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  search_type TEXT, -- career, alumni, research, opportunity, etc.
  results_count INTEGER DEFAULT 0,
  analysis JSONB, -- AI analysis of the query
  results JSONB, -- search results data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company data enrichment
CREATE TABLE companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE,
  logo_url TEXT,
  industry TEXT,
  size_category TEXT,
  headquarters TEXT,
  website TEXT,
  culture_data JSONB, -- photos, values, perks
  yale_alumni JSONB, -- network data
  compensation_data JSONB, -- salary bands, benefits
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX jobs_embedding_idx ON jobs USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX jobs_company_idx ON jobs(company);
CREATE INDEX jobs_industry_idx ON jobs(industry);
CREATE INDEX jobs_active_idx ON jobs(active);
CREATE INDEX user_swipes_user_idx ON user_swipes(user_id);
CREATE INDEX user_swipes_created_idx ON user_swipes(created_at DESC);
CREATE INDEX user_swipes_job_idx ON user_swipes(job_id);
CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX companies_name_idx ON companies(name);
CREATE INDEX search_history_user_idx ON search_history(user_id);
CREATE INDEX search_history_created_idx ON search_history(created_at DESC);
CREATE INDEX search_history_type_idx ON search_history(search_type);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_jobs(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  company text,
  title text,
  similarity float
)
language sql stable
as $$
  select
    jobs.id,
    jobs.company,
    jobs.title,
    1 - (jobs.embedding <=> query_embedding) as similarity
  from jobs
  where 1 - (jobs.embedding <=> query_embedding) > match_threshold
    and jobs.active = true
  order by jobs.embedding <=> query_embedding
  limit match_count;
$$;

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dreams ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- User swipes policies
CREATE POLICY "Users can view own swipes" ON user_swipes
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own swipes" ON user_swipes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- User dreams policies
CREATE POLICY "Users can view own dreams" ON user_dreams
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own dreams" ON user_dreams
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own dreams" ON user_dreams
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Jobs and companies are publicly readable
CREATE POLICY "Jobs are publicly readable" ON jobs
  FOR SELECT USING (true);

CREATE POLICY "Companies are publicly readable" ON companies
  FOR SELECT USING (true);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
