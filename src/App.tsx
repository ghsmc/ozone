import { useState, useEffect } from 'react';
import { LoadingPage } from './components/LoadingPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TopNavigation } from './components/TopNavigation';
import { SearchSection } from './components/SearchSection';
import { JobCard } from './components/JobCard';
import { EnhancedPeopleCard } from './components/EnhancedPeopleCard';
import Feed from './components/Feed';
import NewOnboarding from './components/NewOnboarding';
import { mockJobCards } from './data/mockJobCards';
import { OnboardingData } from './lib/supabase';
import { DarkModeProvider, useDarkMode } from './contexts/DarkModeContext';
import ReactMarkdown from 'react-markdown';




function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState<OnboardingData | null>({
    full_name: 'George McCain',
    graduation_year: 2025,
    major: 'Computer Science & Economics',
    gpa: 3.8,
    preferred_locations: ['New Haven, CT', 'New York, NY', 'San Francisco, CA'],
    preferred_industries: ['Technology', 'Finance', 'Startups', 'AI/ML'],
    preferred_company_sizes: ['Startup', 'Mid-size', 'Large'],
    work_model_preference: 'hybrid',
    salary_expectation_min: 80000,
    salary_expectation_max: 120000,
    skills: ['Python', 'JavaScript', 'React', 'Machine Learning', 'Data Analysis'],
    interests: ['AI/ML', 'Fintech', 'Startups', 'Quantitative Finance'],
    career_goals: 'Work at a leading tech company or fintech startup, focusing on AI/ML applications in finance'
  });
  const [proMode, setProMode] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<'search' | 'feed'>('search');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [userProfileForm, setUserProfileForm] = useState({
    full_name: 'George McCain',
    major: 'Computer Science & Economics',
    interests: 'Technology, Finance, Startups, AI/ML',
    skills: 'Python, JavaScript, React, Data Analysis, Leadership',
    location: 'New Haven, CT',
    graduationYear: '2025',
    gpa: '3.8',
    experience: 'Software Engineering Intern at Tech Startup, Research Assistant in AI Lab'
  });
  const { isDarkMode } = useDarkMode();

  // Profile form handlers
  const handleProfileSubmit = () => {
    setShowProfileForm(false);
    // Profile data is now available in userProfileForm state
  };

  const handleProfileChange = (field: string, value: string) => {
    setUserProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Chat functions
  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Set chat as started to trigger UI transformation
    setHasStartedChat(true);

    const userMessage = {
      id: `user-${Date.now()}-${Math.random()}`,
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    // Show immediate processing message with progress updates
    const processingMessage = {
      id: `processing-${Date.now()}-${Math.random()}`,
      role: 'assistant' as const,
      content: '🚀 **Milo is processing your request...**\n\n⚡ Starting 10 parallel AI calls...',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, processingMessage]);

    // Simulate streaming progress updates
    const progressUpdates = [
      '🔍 **Step 1/10:** Parsing your query...',
      '🤖 **Step 2/10:** Generating immediate response...',
      '📋 **Step 3/10:** Finding structured opportunities...',
      '🎓 **Step 4/10:** Searching Yale alumni database...',
      '🔗 **Step 5/10:** Connecting similar alumni...',
      '🌐 **Step 6/10:** Running Pinecone vector search...',
      '🗺️ **Step 7/10:** Analyzing career pathways...',
      '🧠 **Step 8/10:** Generating AI insights...',
      '📊 **Step 9/10:** Compiling results...',
      '✅ **Step 10/10:** Finalizing response...'
    ];

    let progressIndex = 0;
    const progressInterval = setInterval(() => {
      if (progressIndex < progressUpdates.length) {
        const progressMessage = {
          id: (Date.now() + 0.6 + progressIndex).toString(),
          role: 'assistant' as const,
          content: progressUpdates[progressIndex],
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, progressMessage]);
        progressIndex++;
      }
    }, 800); // Update every 800ms
    
    try {
      console.log('🎯 Sending streaming chat message to backend:', { message, userProfile });
      
      // Clear progress updates
      clearInterval(progressInterval);
      
      // Remove processing and progress messages
      setChatMessages(prev => prev.filter(msg => 
        msg.id !== processingMessage.id && 
        !progressUpdates.some((_, index) => msg.id === (Date.now() + 0.6 + index).toString())
      ));

      // Use fetch for streaming
      const response = await fetch('http://localhost:3001/api/chat-backend/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          userProfile: userProfile
        })
      });

      if (!response.ok) {
        throw new Error(`Streaming failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body reader available');
      }

      // Process streaming responses
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'immediate') {
                const messageId = 'immediate-response';
                setChatMessages(prev => {
                  const existingIndex = prev.findIndex(msg => msg.id === messageId);
                  if (existingIndex >= 0) {
                    // Update existing message
                    const updated = [...prev];
                    updated[existingIndex] = {
                      ...updated[existingIndex],
                      content: `**Thinking ⌄**\n\n${data.data.replace(/^"|"$/g, '')}`
                    };
                    return updated;
                  } else {
                    // Create new message
                    return [...prev, {
                      id: messageId,
                      role: 'assistant' as const,
                      content: `**Thinking ⌄**\n\n${data.data.replace(/^"|"$/g, '')}`,
                      timestamp: new Date()
                    }];
                  }
                });
              } else if (data.type === 'intent') {
                const messageId = 'intent-analysis';
                setChatMessages(prev => {
                  const existingIndex = prev.findIndex(msg => msg.id === messageId);
                  if (existingIndex >= 0) {
                    // Update existing message
                    const updated = [...prev];
                    updated[existingIndex] = {
                      ...updated[existingIndex],
                      content: `**Parsing user intent ⌄**\n\n${data.data}`
                    };
                    return updated;
                  } else {
                    // Create new message
                    return [...prev, {
                      id: messageId,
                      role: 'assistant' as const,
                      content: `**Parsing user intent ⌄**\n\n${data.data}`,
                      timestamp: new Date()
                    }];
                  }
                });
              } else if (data.type === 'pathways') {
                const messageId = 'pathways-response';
                setChatMessages(prev => {
                  const existingIndex = prev.findIndex(msg => msg.id === messageId);
                  if (existingIndex >= 0) {
                    // Update existing message
                    const updated = [...prev];
                    updated[existingIndex] = {
                      ...updated[existingIndex],
                      content: `**Companies to Consider**\n\n${data.data}`,
                      timestamp: new Date()
                    };
                    return updated;
                  } else {
                    // Create new message
                    return [...prev, {
                      id: messageId,
                      role: 'assistant' as const,
                      content: `**Companies to Consider**\n\n${data.data}`,
                      timestamp: new Date()
                    }];
                  }
                });
              } else if (data.type === 'pathways_moves') {
                const messageId = 'pathways-moves-response';
                setChatMessages(prev => {
                  const existingIndex = prev.findIndex(msg => msg.id === messageId);
                  if (existingIndex >= 0) {
                    // Update existing message
                    const updated = [...prev];
                    updated[existingIndex] = {
                      ...updated[existingIndex],
                      content: `**High-Leverage Next Moves**\n\n${data.data}`,
                      timestamp: new Date()
                    };
                    return updated;
                  } else {
                    // Create new message
                    return [...prev, {
                      id: messageId,
                      role: 'assistant' as const,
                      content: `**High-Leverage Next Moves**\n\n${data.data}`,
                      timestamp: new Date()
                    }];
                  }
                });
              } else if (data.type === 'alumni') {
                // Handle alumni data (people cards)
                const messageId = 'alumni-response';
                setChatMessages(prev => {
                  const existingIndex = prev.findIndex(msg => msg.id === messageId);
                  if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = {
                      ...updated[existingIndex],
                      content: `**Yale Alumni at Companies**\n\n${JSON.stringify(data.data)}`,
                      timestamp: new Date()
                    };
                    return updated;
                  } else {
                    return [...prev, {
                      id: messageId,
                      role: 'assistant' as const,
                      content: `**Yale Alumni at Companies**\n\n${JSON.stringify(data.data)}`,
                      timestamp: new Date()
                    }];
                  }
                });
              } else if (data.type === 'similar_alumni') {
                // Handle similar alumni data (people cards)
                const messageId = 'similar-alumni-response';
                setChatMessages(prev => {
                  const existingIndex = prev.findIndex(msg => msg.id === messageId);
                  if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = {
                      ...updated[existingIndex],
                      content: `**Similar Yale Alumni**\n\n${JSON.stringify(data.data)}`,
                      timestamp: new Date()
                    };
                    return updated;
                  } else {
                    return [...prev, {
                      id: messageId,
                      role: 'assistant' as const,
                      content: `**Similar Yale Alumni**\n\n${JSON.stringify(data.data)}`,
                      timestamp: new Date()
                    }];
                  }
                });
              } else if (data.type === 'alumni') {
                const alumniMessage = {
                  id: `alumni-${Date.now()}-${Math.random()}`,
                  role: 'assistant' as const,
                  content: `**🎓 Yale Alumni at Companies**\n\n${data.data}`,
                  timestamp: new Date()
                };
                setChatMessages(prev => [...prev, alumniMessage]);
              } else if (data.type === 'similar_alumni') {
                const similarAlumniMessage = {
                  id: `similar-alumni-${Date.now()}-${Math.random()}`,
                  role: 'assistant' as const,
                  content: `**🎯 Similar Yale Alumni**\n\n${JSON.stringify(data.data, null, 2)}`,
                  timestamp: new Date()
                };
                setChatMessages(prev => [...prev, similarAlumniMessage]);
              } else if (data.type === 'career_pathways') {
                const careerPathwaysMessage = {
                  id: `career-pathways-${Date.now()}-${Math.random()}`,
                  role: 'assistant' as const,
                  content: `**🗺️ Career Pathways Analysis**\n\n${data.data}`,
                  timestamp: new Date()
                };
                setChatMessages(prev => [...prev, careerPathwaysMessage]);
              } else if (data.type === 'structured') {
                const structuredMessage = {
                  id: `structured-${Date.now()}-${Math.random()}`,
                  role: 'assistant' as const,
                  content: `**📋 Structured Job Opportunities**\n\n${data.data}`,
                  timestamp: new Date()
                };
                setChatMessages(prev => [...prev, structuredMessage]);
              } else if (data.type === 'pinecone_search') {
                const pineconeMessage = {
                  id: `pinecone-${Date.now()}-${Math.random()}`,
                  role: 'assistant' as const,
                  content: `**📞 Pinecone Alumni Search Results**\n\n${JSON.stringify(data.data, null, 2)}`,
                  timestamp: new Date()
                };
                setChatMessages(prev => [...prev, pineconeMessage]);
              } else if (data.type === 'ai_insights') {
                const messageId = 'ai-insights';
                setChatMessages(prev => {
                  const existingIndex = prev.findIndex(msg => msg.id === messageId);
                  if (existingIndex >= 0) {
                    // Update existing message
                    const updated = [...prev];
                    updated[existingIndex] = {
                      ...updated[existingIndex],
                      content: `**🧠 AI Insights & Recommendations**\n\n${data.data}`
                    };
                    return updated;
                  } else {
                    // Create new message
                    return [...prev, {
                      id: messageId,
                      role: 'assistant' as const,
                      content: `**🧠 AI Insights & Recommendations**\n\n${data.data}`,
                      timestamp: new Date()
                    }];
                  }
                });
              } else if (data.type === 'complete') {
                console.log('✅ All parallel calls completed');
                break;
              } else if (data.type === 'error') {
                throw new Error(data.data);
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Chat error:', error);
      
      // Clear progress updates
      clearInterval(progressInterval);
      
      // Remove processing and progress messages
      setChatMessages(prev => prev.filter(msg => 
        msg.id !== processingMessage.id && 
        !progressUpdates.some((_, index) => msg.id === (Date.now() + 0.6 + index).toString())
      ));
      
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `❌ **Error:** ${error instanceof Error ? error.message : 'Something went wrong'}\n\nPlease try again or check the server connection.`,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = () => {
    if (!showChat) {
      setShowChat(true);
      setHasStartedChat(false);
      setChatMessages([]);
    } else {
      setShowChat(false);
      setHasStartedChat(false);
      setChatMessages([]);
    }
  };

  useEffect(() => {
    // Simulate initial loading
    const initializeApp = async () => {
      // Remove auto-complete - only advance when LoadingPage calls onComplete
    };
    
    initializeApp();
  }, []);

  const handleOnboardingComplete = (profileData: OnboardingData) => {
    console.log('=== APP: ONBOARDING COMPLETED ===');
    console.log('Profile data received:', profileData);
    setUserProfile(profileData);
    setShowOnboarding(false);
    setActivePage('feed'); // Switch to feed after onboarding
    console.log('Switched to feed page');
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
    // Check if user has completed onboarding
    // For now, we'll show onboarding for new users
    setShowOnboarding(true);
  };

  const bypassOnboarding = () => {
    setShowOnboarding(false);
    setActivePage('search'); // Go to search page instead of feed
  };



  const clearSearch = () => {
    setShowResults(false);
  };


  if (isLoading) {
    return <LoadingPage onComplete={handleLoadingComplete} />;
  }

  if (showOnboarding) {
    console.log('=== APP: RENDERING NEW ONBOARDING ===');
    return <NewOnboarding onComplete={handleOnboardingComplete} onBypass={bypassOnboarding} />;
  }

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <div className={`transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-64' : 'hidden md:block'
      }`}>
        <Sidebar 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentPage={activePage}
          onPageChange={setActivePage}
        />
      </div>
      
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'md:ml-0' : ''
      }`}>
        {activePage === 'search' && (
          <TopNavigation 
            sidebarOpen={sidebarOpen} 
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          />
        )}
        
        {activePage === 'search' ? (
          // Full-page ChatGPT-style Interface
          <div className="flex-1 flex flex-col h-screen w-full">
            {/* Minimal Header - Only show when chat has started */}
            {hasStartedChat && (
              <div className={`flex items-center justify-between px-4 py-3 border-b ${
                isDarkMode ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleChat}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="w-8 h-8 bg-red-600 flex items-center justify-center text-white text-sm font-bold rounded-lg">
                    人
                  </div>
                  <h2 className={`text-lg font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Milo
                  </h2>
                </div>
                <button
                  onClick={toggleChat}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Main Content Area - Full height with bottom padding for floating input */}
            <div className={`flex-1 flex ${hasStartedChat ? 'flex-col' : 'flex-col justify-center items-center'} w-full ${hasStartedChat ? 'pb-32' : ''}`}>
              {/* Header - Only show when no chat started */}
              {!hasStartedChat && (
              <Header />
              )}

              {/* Chat Messages - Increased width, markdown rendering, user message styling */}
              {hasStartedChat && (
                <div className="flex-1 overflow-y-auto w-full">
                  <div className="max-w-4xl mx-auto px-4 py-6 pb-16 space-y-8">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          {message.role === 'user' ? (
                            <div className={`inline-block px-4 py-3 rounded-2xl border ${
                              isDarkMode 
                                ? 'bg-gray-800/50 border-gray-600 text-gray-200' 
                                : 'bg-gray-100 border-gray-300 text-gray-800'
                            }`}>
                              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                {message.content}
                              </div>
                            </div>
                          ) : (
                            <div className={`text-sm leading-relaxed ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
       {/* Check if this is a loading message (contains shimmer text) */}
       {message.content.includes('**Thinking ⌄**') || message.content.includes('**Parsing user intent ⌄**') ? (
         <div className={`${
           isDarkMode
             ? 'text-gray-400'
             : 'text-gray-500'
         }`}>
           <div className={`${
             isDarkMode
               ? 'bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600'
               : 'bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300'
           } bg-[length:200%_100%] animate-shimmer bg-clip-text text-transparent`}>
             <ReactMarkdown>
               {message.content}
             </ReactMarkdown>
           </div>
         </div>
       ) : (
                                // Check if this is a pathways message with JSON data
                                message.content.includes('**Companies to Consider**') && (message.content.includes('```json') || message.content.includes('"companies"')) ? (
                                  <div>
                                    {(() => {
                                      try {
                                        // Try to extract JSON from code blocks first
                                        let jsonMatch = message.content.match(/```json\n([\s\S]*?)\n```/);
                                        let jsonString = '';
                                        
                                        if (jsonMatch) {
                                          jsonString = jsonMatch[1];
                                        } else {
                                          // If no code blocks, try to extract JSON from the message content
                                          const jsonStart = message.content.indexOf('{');
                                          const jsonEnd = message.content.lastIndexOf('}') + 1;
                                          if (jsonStart !== -1 && jsonEnd > jsonStart) {
                                            jsonString = message.content.substring(jsonStart, jsonEnd);
                                          }
                                        }
                                        
                                        if (jsonString) {
                                          // Clean the JSON string to handle common issues
                                          let cleanJsonString = jsonString
                                            .replace(/,\s*}/g, '}') // Remove trailing commas before }
                                            .replace(/,\s*]/g, ']') // Remove trailing commas before ]
                                            .replace(/\n/g, ' ') // Replace newlines with spaces
                                            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                                            .trim();
                                          
                                          const jsonData = JSON.parse(cleanJsonString);
                                          if (jsonData.companies && Array.isArray(jsonData.companies)) {
                                            return (
                                              <div className="mt-4">
                                                {/* Companies to Consider Header */}
                                                <div className="mb-3">
                                                  <div className="text-[10px] text-gray-400 font-light tracking-wider uppercase">
                                                    Companies to Consider
                                                  </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                  {jsonData.companies.map((company: any, index: number) => (
                                                    <div key={index} className="flex flex-col">
                                                      {/* Company Card */}
                                                      <div className={`aspect-square p-3 border rounded-lg transition-colors duration-200 flex flex-col bg-black border-gray-700 text-white`}>
                                                        {/* Header with Logo and Match Score */}
                                                        <div className="flex items-start justify-between mb-3">
                                                          {/* Company Logo */}
                                                          <div className="w-14 h-14 rounded flex items-center justify-center flex-shrink-0">
                                                            <img 
                                                              src={`https://img.logo.dev/${company.domain}?token=pk_c2nKhfMyRIOeCjrk-6-RRw`}
                                                              alt={`${company.name} logo`}
                                                              className="w-14 h-14 rounded object-contain"
                                                              onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const fallback = target.nextElementSibling as HTMLElement;
                                                                if (fallback) fallback.style.display = 'flex';
                                                              }}
                                                            />
                                                            <div 
                                                              className="w-14 h-14 rounded bg-gray-600 text-white text-lg font-bold flex items-center justify-center hidden"
                                                              style={{ display: 'none' }}
                                                            >
                                                              {company.name.charAt(0).toUpperCase()}
                                                            </div>
                                                          </div>

                                                          {/* Color-coded Match Score */}
                                                          <div className="flex flex-col items-end">
                                                            <div className="text-[8px] text-gray-400 font-light tracking-wider uppercase mb-0.5">
                                                              MATCH
                                                            </div>
                                                            <div className={`
                                                              px-1.5 py-0.5 rounded font-mono text-white text-xs font-bold
                                                              ${(() => {
                                                                const relevance = company.relevance;
                                                                if (typeof relevance === 'string') {
                                                                  return relevance.toLowerCase() === 'high' ? 'bg-emerald-500' :
                                                                         relevance.toLowerCase() === 'medium' ? 'bg-yellow-500' :
                                                                         'bg-orange-500';
                                                                } else {
                                                                  const numRelevance = Number(relevance) || 0;
                                                                  return numRelevance >= 90 ? 'bg-emerald-500' :
                                                                         numRelevance >= 70 ? 'bg-yellow-500' :
                                                                         numRelevance >= 50 ? 'bg-orange-500' :
                                                                         'bg-red-500';
                                                                }
                                                              })()}
                                                            `}>
                                                              {(() => {
                                                                const relevance = company.relevance;
                                                                if (typeof relevance === 'string') {
                                                                  return relevance === 'High' ? '95' :
                                                                         relevance === 'Medium' ? '75' :
                                                                         '60';
                                                                } else {
                                                                  // Display relevance score as-is (0-100 scale)
                                                                  return Math.round(Number(relevance) || 0);
                                                                }
                                                              })()}
                                                            </div>
                                                          </div>
                                                        </div>

                                                        {/* Company Name and Domain */}
                                                        <div className="flex-1 flex flex-col justify-between">
                                                          <div>
                                                            <h3 className="text-xs font-bold mb-1 truncate text-white">
                                                              {company.name}
                                                            </h3>
                                                            
                                                            <div className="text-[10px] mb-2 text-gray-400">
                                                              {company.domain}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                      
                                                      {/* Team Tag - Directly below each company card */}
                                                      <div className="mt-2 flex justify-center">
                                                        <div className="w-full px-3 py-1 bg-black text-white text-[10px] rounded border border-gray-600 font-medium text-center leading-tight min-h-[32px] flex items-center justify-center">
                                                          {company.team || 'Team not specified'}
                                                        </div>
                                                      </div>
                                                      
                                                      {/* Apply Button - Below team tag */}
                                                      <div className="mt-2 flex justify-center">
                                                        <a 
                                                          href={company.career_url || `https://${company.domain}/careers`}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium rounded transition-colors duration-200 flex items-center justify-center gap-1"
                                                        >
                                                          <div className="w-3 h-3 bg-red-500 rounded-sm flex items-center justify-center">
                                                            <span className="text-[8px] font-bold text-white">人</span>
                                                          </div>
                                                          Apply
                                                        </a>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                                
                                                {/* Extra padding for scrolling */}
                                                <div className="mt-8"></div>
                                              </div>
                                            );
                                          }
                                        }
                                      } catch (e) {
                                        console.error('Error parsing companies JSON:', e);
                                        return (
                                          <div className="mt-4">
                                            <div className="text-[10px] text-gray-400 font-light tracking-wider uppercase mb-3">
                                              Companies to Consider
                                            </div>
                                            <div className="text-red-400 text-sm">
                                              Error loading companies. Please try again.
                                            </div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                ) : message.content.includes('**High-Leverage Next Moves**') && (message.content.includes('```json') || message.content.includes('"moves"')) ? (
                                  <div>
                                    {(() => {
                                      try {
                                        // Try to extract JSON from code blocks first
                                        let jsonMatch = message.content.match(/```json\n([\s\S]*?)\n```/);
                                        let jsonString = '';
                                        
                                        if (jsonMatch) {
                                          jsonString = jsonMatch[1];
                                        } else {
                                          // If no code blocks, try to extract JSON from the message content
                                          const jsonStart = message.content.indexOf('{');
                                          const jsonEnd = message.content.lastIndexOf('}') + 1;
                                          if (jsonStart !== -1 && jsonEnd > jsonStart) {
                                            jsonString = message.content.substring(jsonStart, jsonEnd);
                                          }
                                        }
                                        
                                        if (jsonString) {
                                          // Clean the JSON string to handle common issues
                                          let cleanJsonString = jsonString
                                            .replace(/,\s*}/g, '}') // Remove trailing commas before }
                                            .replace(/,\s*]/g, ']') // Remove trailing commas before ]
                                            .replace(/\n/g, ' ') // Replace newlines with spaces
                                            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                                            .trim();
                                          
                                          const jsonData = JSON.parse(cleanJsonString);
                                          if (jsonData.moves && Array.isArray(jsonData.moves)) {
                                            return (
                                              <div className="mt-4">
                                                {/* High-Leverage Next Moves Header */}
                                                <div className="mb-3">
                                                  <div className="text-[10px] text-gray-400 font-light tracking-wider uppercase">
                                                    High-Leverage Next Moves
                                                  </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                  {jsonData.moves.map((move: any, index: number) => (
                                                    <div key={index} className="flex flex-col">
                                                      {/* Move Card */}
                                                      <div className={`p-3 border rounded-lg transition-colors duration-200 bg-black border-gray-700 text-white flex-1 flex flex-col`}>
                                                        {/* Logo and Timeline Badge */}
                                                        <div className="flex items-center justify-between mb-2">
                                                          <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                                                            <img 
                                                              src={`https://logo.clearbit.com/${move.domain}`}
                                                              alt={`${move.title} logo`}
                                                              className="w-6 h-6 rounded"
                                                              onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.nextElementSibling.style.display = 'flex';
                                                              }}
                                                            />
                                                            <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center text-xs font-bold text-white" style={{display: 'none'}}>
                                                              {move.title.charAt(0)}
                                                            </div>
                                                          </div>
                                                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            move.timeline === 'immediate' ? 'bg-red-500/20 text-red-400' :
                                                            move.timeline === 'this semester' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-green-500/20 text-green-400'
                                                          }`}>
                                                            {move.timeline}
                                                          </span>
                                                        </div>
                                                        
                                                        {/* Title */}
                                                        <h3 className="font-semibold text-white text-xs mb-2 leading-tight">
                                                          {move.title}
                                                        </h3>
                                                        
                                                        {/* Description as concise bullet points */}
                                                        <div className="text-gray-300 text-xs mb-2 flex-1">
                                                          <ul className="list-disc list-inside space-y-1">
                                                            {move.description.split('. ').filter(point => point.trim()).slice(0, 2).map((point: string, pointIndex: number) => (
                                                              <li key={pointIndex} className="leading-tight">
                                                                {point.trim()}
                                                              </li>
                                                            ))}
                                                          </ul>
                                                        </div>
                                                        
                                                        {/* How to start as concise bullet points */}
                                                        <div className="text-xs text-gray-400">
                                                          <strong>Start:</strong>
                                                          <ul className="list-disc list-inside mt-1 space-y-1">
                                                            {move.how_to_start.split('. ').filter(point => point.trim()).slice(0, 2).map((point: string, pointIndex: number) => (
                                                              <li key={pointIndex} className="leading-tight">
                                                                {point.trim()}
                                                              </li>
                                                            ))}
                                                          </ul>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                                
                                                {/* Extra padding for scrolling */}
                                                <div className="mt-8"></div>
                                              </div>
                                            );
                                          }
                                        }
                                      } catch (e) {
                                        console.error('Error parsing pathways moves JSON:', e);
                                        return (
                                          <div className="mt-4">
                                            <div className="text-[10px] text-gray-400 font-light tracking-wider uppercase mb-3">
                                              High-Leverage Next Moves
                                            </div>
                                            <div className="text-red-400 text-sm">
                                              Error loading pathways moves. Please try again.
                                            </div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                ) : message.content.includes('**Yale Alumni at Companies**') || message.content.includes('**Similar Yale Alumni**') ? (
                                  <div>
                                    <div className={`${
                                      isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                      <ReactMarkdown>
                                        {message.content.split('```json')[0]}
                                      </ReactMarkdown>
                                    </div>
                                    {(() => {
                                      try {
                                        // Extract JSON from the message content more efficiently
                                        const jsonStart = message.content.indexOf('[');
                                        const jsonEnd = message.content.lastIndexOf(']') + 1;
                                        
                                        if (jsonStart !== -1 && jsonEnd !== -1) {
                                          const jsonString = message.content.substring(jsonStart, jsonEnd);
                                          const alumniData = JSON.parse(jsonString);
                                          
                                          // Validate and filter alumni data
                                          if (Array.isArray(alumniData) && alumniData.length > 0) {
                                            const validAlumni = alumniData.filter(alumni => 
                                              alumni && 
                                              alumni.name && 
                                              alumni.current_role && 
                                              alumni.current_company
                                            );
                                            
                                            if (validAlumni.length > 0) {
                                              return (
                                                <div className="mt-4">
                                                  <div className="text-sm text-gray-400 mb-4">
                                                    Found {validAlumni.length} relevant Yale alumni
                                                  </div>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {validAlumni.map((alumni, index) => (
                                                      <EnhancedPeopleCard 
                                                        key={index} 
                                                        alumni={alumni} 
                                                        isDark={isDarkMode}
                                                      />
                                                    ))}
                                                  </div>
                                                </div>
                                              );
                                            } else {
                                              return (
                                                <div className="mt-4 text-sm text-gray-400">
                                                  No valid alumni data found
                                                </div>
                                              );
                                            }
                                          }
                                        }
                                      } catch (e) {
                                        console.error('Error parsing alumni JSON:', e);
                                        return (
                                          <div className="mt-4 text-sm text-red-400">
                                            Error loading alumni data
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                ) : (
                                  <ReactMarkdown>
                                    {message.content}
                                  </ReactMarkdown>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* ChatGPT-style Loading Animation */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%]">
                          {/* Single white ball loader */}
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Search Input - Only show when no chat started */}
              {!hasStartedChat && (
                <div className="w-full max-w-2xl px-4">
              <SearchSection
                    onSearch={sendMessage}
                onClear={clearSearch}
                isLoading={isTyping}
                proMode={proMode}
                setProMode={setProMode}
                    isChatMode={false}
                    onToggleChat={toggleChat}
              />
                </div>
              )}
            </div>

            {/* Profile Form Button */}
            {hasStartedChat && (
              <div className="fixed top-4 right-4 z-50">
                <button
                  onClick={() => setShowProfileForm(!showProfileForm)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-600' 
                      : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {showProfileForm ? 'Close Profile' : 'Edit Profile'}
                </button>
              </div>
            )}

            {/* Profile Form Modal */}
            {showProfileForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className={`w-full max-w-md rounded-lg p-6 ${
                  isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
                }`}>
                  <h3 className={`text-lg font-bold mb-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Your Profile
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Name
                      </label>
                      <input
                        type="text"
                        value={userProfileForm.full_name}
                        onChange={(e) => handleProfileChange('full_name', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="e.g., George McCain"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Major
                      </label>
                      <input
                        type="text"
                        value={userProfileForm.major}
                        onChange={(e) => handleProfileChange('major', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="e.g., Computer Science, Economics"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Interests
                      </label>
                      <input
                        type="text"
                        value={userProfileForm.interests}
                        onChange={(e) => handleProfileChange('interests', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="e.g., AI, Finance, Consulting"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Skills
                      </label>
                      <input
                        type="text"
                        value={userProfileForm.skills}
                        onChange={(e) => handleProfileChange('skills', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="e.g., Python, Excel, Leadership"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Preferred Location
                      </label>
                      <input
                        type="text"
                        value={userProfileForm.location}
                        onChange={(e) => handleProfileChange('location', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="e.g., New York, Remote, San Francisco"
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Graduation Year
                      </label>
                      <input
                        type="text"
                        value={userProfileForm.graduationYear}
                        onChange={(e) => handleProfileChange('graduationYear', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="e.g., 2025, 2026"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleProfileSubmit}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Profile
                    </button>
                    <button
                      onClick={() => setShowProfileForm(false)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        isDarkMode 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Chat Input - Transparent background, increased width */}
            {hasStartedChat && (
              <div className="fixed bottom-0 left-0 right-0 z-50">
                <div className="w-full">
                  <div className="max-w-3xl mx-auto px-4 py-2">
                    <SearchSection
                      onSearch={sendMessage}
                      onClear={clearSearch}
                      isLoading={isTyping}
                      proMode={proMode}
                      setProMode={setProMode}
                      isChatMode={true}
                      onToggleChat={toggleChat}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Feed userProfile={userProfile} />
        )}

            {showResults && (
              <div className={`rounded-lg p-4 sm:p-6 max-w-6xl mx-auto w-full transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-900/80' : 'bg-white'
              }`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-xl font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Job Opportunities
                    </h2>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {mockJobCards.length} opportunities found
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    {mockJobCards.map((job, index) => (
                      <JobCard
                        key={index}
                        companyLogo={job.companyLogo}
                        companyName={job.companyName}
                        jobTitle={job.jobTitle}
                        description={job.description}
                        location={job.location}
                        salary={job.salary}
                        postedDate={job.postedDate}
                        skills={job.skills}
                        metrics={job.metrics}
                        badges={job.badges}
                        isDark={isDarkMode}
                        type={job.type}
                      />
                    ))}
                  </div>
                </div>
              </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <DarkModeProvider>
      <AppContent />
    </DarkModeProvider>
  );
}

export default App;