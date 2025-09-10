# 🏗️ MILO Backend Setup Guide

## 🎯 Overview

This guide will help you set up the complete MILO backend architecture with Supabase, OpenAI, and Redis caching.

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account and project
- OpenAI API key
- Upstash Redis account (optional, for caching)

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Redis Configuration (Optional)
UPSTASH_REDIS_URL=your-redis-url
UPSTASH_REDIS_TOKEN=your-redis-token

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Schema**:
   ```bash
   # Copy the schema from supabase/schema.sql
   # Run it in your Supabase SQL editor
   ```

3. **Enable Extensions**:
   ```sql
   -- In Supabase SQL editor
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

### 3. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr openai @types/node @upstash/redis
```

### 4. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy sync-jobs
supabase functions deploy match-jobs
supabase functions deploy dream-engine
```

### 5. Set Up Scheduled Jobs

In your Supabase SQL editor, run:

```sql
-- Schedule daily job sync at 2 AM
SELECT cron.schedule(
  'sync-jobs-daily',
  '0 2 * * *',
  'SELECT net.http_post(
    url:=''https://your-project.supabase.co/functions/v1/sync-jobs'',
    headers:=''{"Authorization": "Bearer YOUR_ANON_KEY"}''::jsonb
  );'
);
```

## 🔧 API Endpoints

### Job Management

- `POST /api/sync/jobs` - Sync jobs from SimplifyJobs
- `POST /api/jobs/personalized` - Get personalized job feed
- `POST /api/swipes` - Record user swipe action
- `GET /api/swipes?userId=xxx` - Get user swipe history

### Dream Engine

- `POST /api/dreams/process` - Process user dream and generate action plan

### Supabase Edge Functions

- `POST /functions/v1/sync-jobs` - Automated job synchronization
- `POST /functions/v1/match-jobs` - AI-powered job matching
- `POST /functions/v1/dream-engine` - Dream analysis and planning

## 🎨 Frontend Integration

### Using the Job Feed Hook

```typescript
import { useJobFeed } from '@/hooks/useJobFeed'

function JobFeedComponent({ userId }: { userId: string }) {
  const { jobs, loading, error, refetch } = useJobFeed(userId)
  
  if (loading) return <div>Loading jobs...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      {jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  )
}
```

### Using the Swipe Handler

```typescript
import { useSwipeHandler } from '@/hooks/useSwipeHandler'

function SwipeableJobCard({ job, userId }: { job: Job, userId: string }) {
  const { handleLike, handlePass, swiping } = useSwipeHandler(userId)
  
  return (
    <div>
      <h3>{job.title} at {job.company}</h3>
      <button onClick={() => handleLike(job.id)} disabled={swiping}>
        Like
      </button>
      <button onClick={() => handlePass(job.id)} disabled={swiping}>
        Pass
      </button>
    </div>
  )
}
```

### Using Real-time Updates

```typescript
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates'

function App({ userId }: { userId: string }) {
  useRealTimeUpdates(userId) // Automatically handles real-time updates
  
  return <YourAppContent />
}
```

## 🧠 AI Features

### Job Matching Algorithm

The matching engine uses:
1. **Semantic Similarity**: Vector embeddings for job descriptions
2. **Behavioral Learning**: Learns from user swipe patterns
3. **Business Rules**: Yale network, salary, location preferences
4. **Chemistry Score**: Combined scoring algorithm (65-95 range)

### Dream Engine

Processes user dreams with:
1. **Goal Analysis**: Extracts career objectives
2. **Action Planning**: Generates specific next steps
3. **Opportunity Matching**: Finds relevant jobs/programs
4. **Network Building**: Identifies Yale alumni connections

## 📊 Performance Optimization

### Caching Strategy

- **Job Feeds**: 1-hour TTL with Redis
- **User Preferences**: 30-minute TTL
- **Company Data**: 24-hour TTL
- **Automatic Invalidation**: On user action

### Database Indexes

- Vector similarity search on job embeddings
- User swipe history for behavioral learning
- Company and industry lookups
- Real-time update subscriptions

## 🔒 Security

### Row Level Security (RLS)

- Users can only access their own profiles and swipes
- Jobs and companies are publicly readable
- Dreams are private to each user

### API Security

- Service role key for admin operations
- Anon key for client-side operations
- Rate limiting on Edge Functions
- Input validation on all endpoints

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Supabase Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Check function logs
supabase functions logs sync-jobs
```

## 📈 Monitoring

### Key Metrics to Track

- Job sync success rate
- Matching algorithm accuracy
- User engagement (swipe rates)
- Dream processing completion
- API response times

### Logging

- All Edge Functions log to Supabase dashboard
- Client-side errors logged to console
- Performance metrics in Vercel Analytics

## 🛠️ Troubleshooting

### Common Issues

1. **Vector Extension Not Found**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **RLS Policies Blocking Access**:
   Check that policies are correctly configured

3. **Edge Function Timeouts**:
   Increase timeout in Supabase dashboard

4. **OpenAI API Errors**:
   Check API key and rate limits

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

## 📚 Next Steps

1. **Customize Matching Algorithm**: Adjust scoring weights
2. **Add More Data Sources**: Integrate additional job boards
3. **Enhance AI Features**: Add more sophisticated NLP
4. **Scale Infrastructure**: Add more caching layers
5. **Analytics Dashboard**: Build admin interface

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase documentation
3. Check OpenAI API status
4. Create an issue in the repository

---

**Ready to build the future of career discovery! 🚀**
