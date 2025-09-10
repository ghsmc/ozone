import { Pinecone } from '@pinecone-database/pinecone'

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: import.meta.env.VITE_PINECONE_API_KEY!,
})

export class PineconeService {
  private index: any

  constructor() {
    this.index = pinecone.index(import.meta.env.VITE_PINECONE_INDEX_NAME || 'milo-jobs')
  }

  async upsertJobEmbedding(jobId: string, embedding: number[], metadata: any) {
    try {
      await this.index.upsert([
        {
          id: jobId,
          values: embedding,
          metadata: {
            ...metadata,
            type: 'job',
            timestamp: new Date().toISOString()
          }
        }
      ])
      console.log(`Upserted embedding for job ${jobId}`)
    } catch (error) {
      console.error('Error upserting job embedding:', error)
      throw error
    }
  }

  async upsertUserEmbedding(userId: string, embedding: number[], metadata: any) {
    try {
      await this.index.upsert([
        {
          id: `user_${userId}`,
          values: embedding,
          metadata: {
            ...metadata,
            type: 'user',
            timestamp: new Date().toISOString()
          }
        }
      ])
      console.log(`Upserted embedding for user ${userId}`)
    } catch (error) {
      console.error('Error upserting user embedding:', error)
      throw error
    }
  }

  async searchSimilarJobs(userEmbedding: number[], topK: number = 20, filter?: any) {
    try {
      const searchRequest: any = {
        vector: userEmbedding,
        topK,
        includeMetadata: true,
        includeValues: false
      }

      if (filter) {
        searchRequest.filter = filter
      }

      const response = await this.index.query(searchRequest)
      
      return response.matches?.map((match: any) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata
      })) || []
    } catch (error) {
      console.error('Error searching similar jobs:', error)
      throw error
    }
  }

  async searchSimilarUsers(jobEmbedding: number[], topK: number = 10) {
    try {
      const response = await this.index.query({
        vector: jobEmbedding,
        topK,
        includeMetadata: true,
        includeValues: false,
        filter: { type: 'user' }
      })
      
      return response.matches?.map((match: any) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata
      })) || []
    } catch (error) {
      console.error('Error searching similar users:', error)
      throw error
    }
  }

  async deleteEmbedding(id: string) {
    try {
      await this.index.deleteOne(id)
      console.log(`Deleted embedding ${id}`)
    } catch (error) {
      console.error('Error deleting embedding:', error)
      throw error
    }
  }

  async getIndexStats() {
    try {
      const stats = await this.index.describeIndexStats()
      return stats
    } catch (error) {
      console.error('Error getting index stats:', error)
      throw error
    }
  }
}

export const pineconeService = new PineconeService()
