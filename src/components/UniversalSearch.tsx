import React, { useState, useRef, useEffect } from 'react'
import { useDarkMode } from '../contexts/DarkModeContext'
import { JobCard } from './JobCard'
import { Professional } from '../types'

interface SearchResult {
  type: 'career' | 'alumni' | 'research' | 'opportunity' | 'company' | 'program' | 'course' | 'event' | 'general'
  title: string
  description: string
  relevance: number
  url?: string
  metadata: any
  actionItems?: string[]
}

interface SearchMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  results?: SearchResult[]
  isStreaming?: boolean
}

interface StreamingUpdate {
  type: 'start' | 'analysis' | 'search_start' | 'search_results' | 'complete' | 'error'
  message?: string
  data?: any
  category?: string
  results?: SearchResult[]
  error?: string
  timestamp: number
}

export const UniversalSearch: React.FC = () => {
  const [messages, setMessages] = useState<SearchMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [currentResults, setCurrentResults] = useState<SearchResult[]>([])
  const [searchAnalysis, setSearchAnalysis] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { isDarkMode } = useDarkMode()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: SearchMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setStreamingMessage('')
    setCurrentResults([])
    setSearchAnalysis(null)

    try {
      await streamSearch(inputValue.trim())
    } catch (error) {
      console.error('Search error:', error)
      const errorMessage: SearchMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setStreamingMessage('')
    }
  }

  const streamSearch = async (query: string) => {
    const response = await fetch('/api/search/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query, 
        userId: 'demo-user' // Replace with actual user ID
      })
    })

    if (!response.ok) {
      throw new Error('Search failed')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamingUpdate = JSON.parse(line.slice(6))
              handleStreamingUpdate(data)
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError)
            }
          }
        }
      }
    }
  }

  const handleStreamingUpdate = (update: StreamingUpdate) => {
    switch (update.type) {
      case 'start':
        setStreamingMessage(update.message || 'Starting search...')
        break
      
      case 'analysis':
        setSearchAnalysis(update.data)
        setStreamingMessage('Analysis complete. Searching across all sources...')
        break
      
      case 'search_start':
        setStreamingMessage(update.message || `Searching ${update.category}...`)
        break
      
      case 'search_results':
        if (update.results) {
          setCurrentResults(prev => [...prev, ...update.results!])
        }
        setStreamingMessage(`Found ${update.results?.length || 0} ${update.category} results...`)
        break
      
      case 'complete':
        // Create final assistant message with all results
        const assistantMessage: SearchMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `I found ${currentResults.length} relevant results for your search. Here's what I discovered:`,
          timestamp: new Date(),
          results: currentResults
        }
        setMessages(prev => [...prev, assistantMessage])
        setStreamingMessage('')
        setCurrentResults([])
        break
      
      case 'error':
        setStreamingMessage('')
        const errorMessage: SearchMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: update.error || 'An error occurred during search.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
        break
    }
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      career: '💼',
      alumni: '🎓',
      research: '🔬',
      opportunity: '🌟',
      company: '🏢',
      program: '📚',
      course: '📖',
      event: '📅',
      general: '🔍'
    }
    return icons[type as keyof typeof icons] || '🔍'
  }

  const getTypeColor = (type: string) => {
    const colors = {
      career: 'bg-blue-100 text-blue-800',
      alumni: 'bg-green-100 text-green-800',
      research: 'bg-purple-100 text-purple-800',
      opportunity: 'bg-yellow-100 text-yellow-800',
      company: 'bg-gray-100 text-gray-800',
      program: 'bg-indigo-100 text-indigo-800',
      course: 'bg-pink-100 text-pink-800',
      event: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} p-4`}>
        <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Universal Search
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Search anything - careers, alumni, research, opportunities, and more
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium mb-2">What would you like to explore?</h3>
            <p className="text-sm">Try searching for careers, alumni, research opportunities, or anything else!</p>
            <div className="mt-6 space-y-2">
              <div className={`inline-block px-3 py-1 rounded-full text-xs ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                "Software engineering internships"
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                "Yale alumni at Google"
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                "AI research opportunities"
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
              {message.type === 'user' ? (
                <div className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
                  {message.content}
                </div>
              ) : (
                <div className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  <div className="mb-3">{message.content}</div>
                  
                  {message.results && message.results.length > 0 && (
                    <div className="space-y-4">
                      {message.results.map((result, index) => {
                        // Render job cards using the existing JobCard component
                        if (result.type === 'career' && result.metadata.companyLogo) {
                          return (
                            <div key={index} className="mb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-lg">{getTypeIcon(result.type)}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                                  {result.type}
                                </span>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {result.relevance}% match
                                </span>
                              </div>
                              <JobCard
                                companyLogo={result.metadata.companyLogo}
                                companyName={result.metadata.companyName}
                                jobTitle={result.metadata.jobTitle}
                                description={result.metadata.description}
                                location={result.metadata.location}
                                salary={result.metadata.salary}
                                postedDate={result.metadata.postedDate}
                                skills={result.metadata.skills}
                                metrics={result.metadata.metrics}
                                badges={result.metadata.badges}
                                isDark={isDarkMode}
                                type={result.metadata.type}
                              />
                            </div>
                          )
                        }

                        // Render alumni cards using a custom component that matches the existing style
                        if (result.type === 'alumni' && result.metadata.person_id) {
                          return (
                            <div key={index} className="mb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-lg">{getTypeIcon(result.type)}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                                  {result.type}
                                </span>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {result.relevance}% match
                                </span>
                              </div>
                              <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-start space-x-3">
                                  <img 
                                    src={result.metadata.avatar_url} 
                                    alt={result.metadata.full_name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                  <div className="flex-1">
                                    <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {result.metadata.full_name}
                                    </h4>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      {result.metadata.headline}
                                    </p>
                                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {result.metadata.location_city}, {result.metadata.location_country} • {result.metadata.connections}+ connections
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {result.metadata.skills.slice(0, 4).map((skill: string, skillIndex: number) => (
                                        <span key={skillIndex} className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        }

                        // Render other result types with the original format
                        return (
                          <div key={index} className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getTypeIcon(result.type)}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                                  {result.type}
                                </span>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {result.relevance}% match
                                </span>
                              </div>
                            </div>
                            
                            <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {result.title}
                            </h4>
                            
                            <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {result.description}
                            </p>

                            {result.actionItems && result.actionItems.length > 0 && (
                              <div className="mb-3">
                                <h5 className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Next Steps:
                                </h5>
                                <ul className="space-y-1">
                                  {result.actionItems.map((item, itemIndex) => (
                                    <li key={itemIndex} className={`text-xs flex items-center space-x-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {result.url && (
                              <button className={`text-xs px-3 py-1 rounded ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
                                Learn More
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming Message */}
        {streamingMessage && (
          <div className="flex justify-start">
            <div className={`max-w-3xl px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">{streamingMessage}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} p-4`}>
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Search for anything - careers, alumni, research, opportunities..."
              className={`w-full px-4 py-3 rounded-lg border resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              !inputValue.trim() || isLoading
                ? isDarkMode
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Searching</span>
              </div>
            ) : (
              'Search'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
