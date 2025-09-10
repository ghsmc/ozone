import { Redis } from '@upstash/redis'
import { ScoredJob } from './matching-engine'

// Initialize Redis client
const redis = new Redis({
  url: import.meta.env.VITE_UPSTASH_REDIS_URL!,
  token: import.meta.env.VITE_UPSTASH_REDIS_TOKEN!,
})

export class CacheService {
  async getJobFeed(userId: string): Promise<ScoredJob[] | null> {
    try {
      const cached = await redis.get(`job-feed:${userId}`)
      return cached as ScoredJob[] | null
    } catch (error) {
      console.error('Error getting cached job feed:', error)
      return null
    }
  }

  async setJobFeed(userId: string, jobs: ScoredJob[], ttl: number = 3600) {
    try {
      await redis.setex(`job-feed:${userId}`, ttl, JSON.stringify(jobs))
    } catch (error) {
      console.error('Error caching job feed:', error)
    }
  }

  async getUserPreferences(userId: string): Promise<any | null> {
    try {
      const cached = await redis.get(`user-preferences:${userId}`)
      return cached as any | null
    } catch (error) {
      console.error('Error getting cached preferences:', error)
      return null
    }
  }

  async setUserPreferences(userId: string, preferences: any, ttl: number = 1800) {
    try {
      await redis.setex(`user-preferences:${userId}`, ttl, JSON.stringify(preferences))
    } catch (error) {
      console.error('Error caching preferences:', error)
    }
  }

  async invalidateUserCache(userId: string) {
    try {
      const pattern = `*${userId}*`
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Error invalidating user cache:', error)
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      return await redis.get(key)
    } catch (error) {
      console.error('Error getting from cache:', error)
      return null
    }
  }

  async set(key: string, value: any, ttl: number = 3600) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Error setting cache:', error)
    }
  }

  async del(key: string) {
    try {
      await redis.del(key)
    } catch (error) {
      console.error('Error deleting from cache:', error)
    }
  }
}

// Middleware for API routes
export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cacheService = new CacheService()
  
  try {
    const cached = await cacheService.get(key)
    if (cached) {
      console.log('Cache hit for:', key)
      return cached as T
    }
  } catch (error) {
    console.error('Cache read error:', error)
  }
  
  console.log('Cache miss for:', key)
  const fresh = await fetcher()
  
  try {
    await cacheService.set(key, fresh, ttl)
  } catch (error) {
    console.error('Cache write error:', error)
  }
  
  return fresh
}

export const cacheService = new CacheService()
