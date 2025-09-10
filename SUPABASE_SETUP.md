# Supabase Setup for MILO Onboarding

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key

## 2. Environment Variables

Create a `.env` file in the root directory with:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-keyw
```

## 3. Database Schema

Run this SQL in your Supabase SQL editor to create the user profiles table:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  major TEXT NOT NULL,
  gpa DECIMAL(3,2),
  preferred_locations TEXT[] DEFAULT '{}',
  preferred_industries TEXT[] DEFAULT '{}',
  preferred_company_sizes TEXT[] DEFAULT '{}',
  work_model_preference TEXT DEFAULT 'any' CHECK (work_model_preference IN ('remote', 'hybrid', 'onsite', 'any')),
  salary_expectation_min INTEGER,
  salary_expectation_max INTEGER,
  skills TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  career_goals TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own profile
CREATE POLICY "Users can manage their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 4. Authentication Setup

1. In Supabase Dashboard, go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:5173` for development)
3. Enable email authentication if desired

## 5. Features

The onboarding system includes:

- **Multi-step form** with progress tracking
- **Dark mode support** matching MILO theme
- **Personalized job matching** based on user preferences
- **Supabase integration** for data persistence
- **Responsive design** for all screen sizes

## 6. Job Matching Algorithm

The system matches jobs based on:

- Industry preferences (30 points)
- Location preferences (25 points)  
- Work model preferences (20 points)
- Skills match (15 points)
- Academic background (10 points)
- Yale network bonus (5 points)

Total possible score: 100 points
