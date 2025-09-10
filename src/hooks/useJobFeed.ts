import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ScoredJob } from '@/lib/matching-engine'

export const useJobFeed = (userId: string) => {
  const [jobs, setJobs] = useState<ScoredJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    // Subscribe to real-time job updates
    const channel = supabase
      .channel('job-feed')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'jobs' },
        (payload) => {
          console.log('New job added:', payload.new)
          // You could add a toast notification here
        }
      )
      .subscribe()

    // Load initial personalized feed
    loadPersonalizedJobs()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const loadPersonalizedJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/jobs/personalized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setJobs(data.jobs)
      } else {
        setError(data.error || 'Failed to load jobs')
      }
    } catch (err) {
      setError('Network error loading jobs')
      console.error('Error loading personalized jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    loadPersonalizedJobs()
  }

  return { 
    jobs, 
    loading, 
    error, 
    refetch 
  }
}
