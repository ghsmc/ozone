import React, { useState, useEffect } from 'react';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { Sidebar } from './components/Sidebar';
import { TopNavigation } from './components/TopNavigation';
import { SearchSection } from './components/SearchSection';
import { ResultsDisplay } from './components/ResultsDisplay';
import { MiloResultsDisplay } from './components/MiloResultsDisplay';
import { UniversalSearch } from './components/UniversalSearch';
import { LoadingPage } from './components/LoadingPage';
import { HoursGrid } from './components/HoursGrid';
import NewOnboarding from './components/NewOnboarding';
import Feed from './components/Feed';
import { SearchResults, SearchFilters } from './types';
import { OnboardingData } from './lib/supabase';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'search' | 'feed'>('search');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'table' | 'cards'>('table');
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [resultsPerPage] = useState(25);
  const [proMode, setProMode] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [showLoadingPage, setShowLoadingPage] = useState(true);
  const [showHoursGrid, setShowHoursGrid] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState<OnboardingData | null>(null);
  const [messages, setMessages] = useState<Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);

  const handleSearch = async (query: string, filters?: SearchFilters) => {
    if (isChatMode) {
      await sendMessage(query);
      return;
    }

    setIsLoading(true);
    setResults(null);
    
    try {
      const endpoint = proMode ? '/api/milo/opportunities' : '/api/search/universal';
      const body = proMode 
        ? { 
            studentProfile: {
              name: userProfile?.full_name || 'Demo User',
              class_year: userProfile?.graduation_year || 2025,
              major: userProfile?.major || 'Computer Science',
              skills_and_clubs: userProfile?.skills || [],
              interests: userProfile?.interests || userProfile?.preferred_industries || [],
              constraints: ['paid'],
              current_term: 'Fall 2024',
              current_date: new Date().toISOString().split('T')[0],
              location: 'New Haven, CT'
            }
          }
        : { query, userId: 'demo-user', filters };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (proMode) {
        setResults({
          results: [],
          total: 0,
          query_explanation: '',
          sql_query: '',
          nlp_filters: {},
          milo_response: data
        });
      } else {
        setResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults({
        results: [],
        total: 0,
        query_explanation: 'Search failed',
        sql_query: '',
        nlp_filters: {}
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/search/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: content, 
          userId: 'demo-user' 
        })
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;
                
                // Handle potential malformed JSON by validating before parsing
                if (!this.isValidJSON(jsonStr)) {
                  console.warn('Skipping malformed JSON:', jsonStr);
                  continue;
                }
                
                const data = JSON.parse(jsonStr);
                
                if (data.type === 'content') {
                  assistantContent += data.content || '';
                } else if (data.type === 'complete') {
                  const assistantMessage = {
                    id: (Date.now() + 1).toString(),
                    type: 'assistant' as const,
                    content: assistantContent || data.content || 'Search completed.',
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, assistantMessage]);
                }
              } catch (parseError) {
                console.error('Failed to parse streaming data:', parseError);
                console.error('Problematic JSON string:', line.slice(6));
                // Continue processing other lines instead of breaking
                continue;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper method to validate JSON before parsing
  const isValidJSON = (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleClear = () => {
    setResults(null);
    setCurrentPageNum(1);
    if (isChatMode) {
      setMessages([]);
    }
  };

  const handleToggleChat = () => {
    setIsChatMode(!isChatMode);
    handleClear();
  };

  const handleOnboardingComplete = (profileData: OnboardingData) => {
    setUserProfile(profileData);
    setShowOnboarding(false);
    setCurrentPage('feed');
  };

  const handleOnboardingBypass = () => {
    setShowOnboarding(false);
    setCurrentPage('search');
  };

  const handleLoadingComplete = () => {
    setShowLoadingPage(false);
    setShowHoursGrid(true);
  };

  const handleHoursGridComplete = () => {
    setShowHoursGrid(false);
    setShowOnboarding(true);
  };

  // Show loading sequence
  if (showLoadingPage) {
    return (
      <DarkModeProvider>
        <LoadingPage onComplete={handleLoadingComplete} />
      </DarkModeProvider>
    );
  }

  // Show hours grid
  if (showHoursGrid) {
    return (
      <DarkModeProvider>
        <HoursGrid onComplete={handleHoursGridComplete} />
      </DarkModeProvider>
    );
  }

  // Show onboarding
  if (showOnboarding) {
    return (
      <DarkModeProvider>
        <NewOnboarding 
          onComplete={handleOnboardingComplete}
          onBypass={handleOnboardingBypass}
        />
      </DarkModeProvider>
    );
  }

  return (
    <DarkModeProvider>
      <div className="flex h-screen bg-white">
        <Sidebar 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavigation 
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          
          <div className="flex-1 overflow-auto">
            {currentPage === 'search' ? (
              <div className="max-w-6xl mx-auto px-4 py-8">
                {isChatMode ? (
                  <UniversalSearch />
                ) : (
                  <>
                    <SearchSection
                      onSearch={handleSearch}
                      onClear={handleClear}
                      isLoading={isLoading}
                      proMode={proMode}
                      setProMode={setProMode}
                      isChatMode={isChatMode}
                      onToggleChat={handleToggleChat}
                    />
                    
                    {results && (
                      proMode ? (
                        <MiloResultsDisplay
                          results={results}
                          currentView={currentView}
                          onViewChange={setCurrentView}
                          currentPage={currentPageNum}
                          resultsPerPage={resultsPerPage}
                          onPageChange={setCurrentPageNum}
                          proMode={proMode}
                          isLoading={isLoading}
                        />
                      ) : (
                        <ResultsDisplay
                          results={results}
                          currentView={currentView}
                          onViewChange={setCurrentView}
                          currentPage={currentPageNum}
                          resultsPerPage={resultsPerPage}
                          onPageChange={setCurrentPageNum}
                          proMode={proMode}
                          isLoading={isLoading}
                        />
                      )
                    )}
                  </>
                )}
              </div>
            ) : (
              <Feed userProfile={userProfile} />
            )}
          </div>
        </div>
      </div>
    </DarkModeProvider>
  );
}

export default App;