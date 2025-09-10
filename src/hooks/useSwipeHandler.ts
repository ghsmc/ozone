import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type SwipeAction = 'like' | 'pass' | 'save' | 'apply'

export const useSwipeHandler = (userId: string) => {
  const [swiping, setSwiping] = useState(false)
  const supabase = createClient()

  const handleSwipe = async (jobId: string, action: SwipeAction) => {
    if (swiping) return // Prevent double swipes
    
    try {
      setSwiping(true)
      
      const sessionId = crypto.randomUUID()
      
      const response = await fetch('/api/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          jobId,
          action,
          sessionId
        })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save swipe')
      }
      
      return data.swipe
    } catch (error) {
      console.error('Error saving swipe:', error)
      throw error
    } finally {
      setSwiping(false)
    }
  }

  const handleLike = (jobId: string) => handleSwipe(jobId, 'like')
  const handlePass = (jobId: string) => handleSwipe(jobId, 'pass')
  const handleSave = (jobId: string) => handleSwipe(jobId, 'save')
  const handleApply = (jobId: string) => handleSwipe(jobId, 'apply')

  return {
    handleSwipe,
    handleLike,
    handlePass,
    handleSave,
    handleApply,
    swiping
  }
}
