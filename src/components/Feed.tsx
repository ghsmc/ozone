import React, { useState, useEffect, useRef } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import allJobsData from '../data/allJobs.json';
import { OnboardingData } from '../lib/supabase';
import { JobMatchingService } from '../services/jobMatching';
import { JobService, Job } from '../services/jobService';
import { MiloOpportunities } from './MiloOpportunities';
import { JobCard as NewJobCard } from './JobCard';
import { formatSalary } from '../utils/salaryFormatter';
import { YaleAlumniSection } from './YaleAlumniSection';

// Layered Loading Animation Component
const LayeredLoadingAnimation: React.FC = () => {
  const [showLayer1, setShowLayer1] = useState(false);
  const [showLayer2, setShowLayer2] = useState(false);
  const [showLayer3, setShowLayer3] = useState(false);
  const [isSubtracting, setIsSubtracting] = useState(false);

  useEffect(() => {
    // Build up layers
    const buildTimer1 = setTimeout(() => setShowLayer1(true), 200);
    const buildTimer2 = setTimeout(() => setShowLayer2(true), 400);
    const buildTimer3 = setTimeout(() => setShowLayer3(true), 600);
    
    // Start subtracting after a pause
    const subtractTimer = setTimeout(() => {
      setIsSubtracting(true);
      // Subtract layers in reverse order
      setTimeout(() => setShowLayer3(false), 200);
      setTimeout(() => setShowLayer2(false), 400);
      setTimeout(() => setShowLayer1(false), 600);
    }, 1200);

    return () => {
      clearTimeout(buildTimer1);
      clearTimeout(buildTimer2);
      clearTimeout(buildTimer3);
      clearTimeout(subtractTimer);
    };
  }, []);

  return (
    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center relative">
      {/* Layer 3 - Outer ring */}
      <div 
        className={`absolute w-20 h-20 bg-red-900/20 transition-all duration-300 ${
          showLayer3 && !isSubtracting ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} 
      />
      {/* Layer 2 - Middle ring */}
      <div 
        className={`absolute w-16 h-16 bg-red-800/40 transition-all duration-300 ${
          showLayer2 && !isSubtracting ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} 
      />
      {/* Layer 1 - Inner ring */}
      <div 
        className={`absolute w-12 h-12 bg-red-700/60 transition-all duration-300 ${
          showLayer1 && !isSubtracting ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} 
      />
      {/* Core logo */}
      <div className="absolute w-12 h-12 bg-red-600 flex items-center justify-center"
           style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <span className="text-white text-2xl font-black">人</span>
      </div>
    </div>
  );
};

// Job interface is now imported from JobService

// Helper function to convert Job to NewJobCard format
const convertJobToNewJobCard = (job: Job) => {
  // Get company domain for logo
  const getCompanyDomain = (company: string) => {
    const domainMap: { [key: string]: string } = {
      'Google': 'google.com',
      'Apple': 'apple.com',
      'Meta': 'meta.com',
      'Microsoft': 'microsoft.com',
      'Amazon': 'amazon.com',
      'Netflix': 'netflix.com',
      'Tesla': 'tesla.com',
      'Stripe': 'stripe.com',
      'Palantir': 'palantir.com',
      'Goldman Sachs': 'goldmansachs.com',
      'JPMorgan Chase': 'jpmorganchase.com',
      'Morgan Stanley': 'morganstanley.com',
      'McKinsey & Company': 'mckinsey.com',
      'Bain & Company': 'bain.com',
      'Boston Consulting Group': 'bcg.com',
      'Deloitte': 'deloitte.com',
      'PwC': 'pwc.com',
      'EY': 'ey.com',
      'KPMG': 'kpmg.com',
      'Accenture': 'accenture.com',
      'Citadel': 'citadel.com',
      'Jane Street': 'janestreet.com',
      'Two Sigma': 'twosigma.com',
      'DE Shaw': 'deshaw.com',
      'Jump Trading': 'jumptrading.com',
      'Hudson River Trading': 'hudsonrivertrading.com',
      'Akuna Capital': 'akunacapital.com',
      'Aquatic': 'aquatic.com',
      'Marshall Wace': 'marshallwace.com',
      'Yale School of Medicine': 'yale.edu',
      'MIT CSAIL': 'mit.edu',
      'Stanford AI Lab': 'stanford.edu',
      'Harvard Medical School': 'harvard.edu',
      'Yale Center for Research Computing': 'yale.edu',
      'Yale Institute for Network Science': 'yale.edu',
      'Yale Center for Engineering Innovation & Design': 'yale.edu',
      'Yale School of Public Health': 'yale.edu',
      'Yale Center for Business and the Environment': 'yale.edu',
      'Yale Law School Center for the Study of Corporate Law': 'yale.edu',
      'Yale Center for Emotional Intelligence': 'yale.edu',
      'Yale Center for the Study of Race, Indigeneity, and Transnational Migration': 'yale.edu',
      'Yale Center for Collaborative Arts and Media': 'yale.edu',
      'Yale Center for Research on Aging': 'yale.edu',
      'Yale Center for Molecular Discovery': 'yale.edu',
      'Yale Center for Green Chemistry and Green Engineering': 'yale.edu',
      'Yale Center for the Study of Representative Institutions': 'yale.edu',
      'Yale Center for the Study of Globalization': 'yale.edu'
    };
    return domainMap[company] || 'default.com';
  };

  return {
    companyLogo: `https://img.logo.dev/${getCompanyDomain(job.company || 'default')}?token=pk_VAZ6tvAVQHCDwKeaNRVyjQ`,
    companyName: job.company || 'Unknown Company',
    jobTitle: job.title || 'Unknown Position',
    description: job.description || 'No description available',
    location: job.location || 'Location not specified',
    salary: formatSalary(job.salary || 'Salary not specified'),
    postedDate: job.age || 'Unknown',
    skills: job.requirements?.slice(0, 4) || [], // Take first 4 requirements as skills
    metrics: {
      trajectory: job.matchScore || 0,
      employees: `${(job.yaleCount || 0) * 1000}+`, // Rough estimate
      openJobs: Math.floor(Math.random() * 10) + 1
    },
    badges: {
      unicorn: (job.matchScore || 0) > 85 && ['Google', 'Apple', 'Microsoft', 'Meta', 'Amazon', 'Tesla', 'Stripe'].includes(job.company || '')
    },
    type: (job.isResearch ? 'lab' : 'job') as 'lab' | 'job' | 'club' | 'course'
  };
};

// Old JobCard component removed - now using NewJobCard

interface FeedProps {
  userProfile?: OnboardingData | null;
}

const Feed: React.FC<FeedProps> = ({ userProfile }) => {
  const [currentJob, setCurrentJob] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintDirection, setHintDirection] = useState<'left' | 'right' | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [likes, setLikes] = useState(0);
  const [passes, setPasses] = useState(0);
  const [showScoreAnimation, setShowScoreAnimation] = useState(false);
  const [activeTab, setActiveTab] = useState<'jobs' | 'opportunities'>('jobs');
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isDarkMode } = useDarkMode();

  // Tinder-style swipe state
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeThreshold] = useState(100); // Minimum distance to trigger swipe
  const [rotationThreshold] = useState(50); // Distance for rotation effect
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userProfile && activeTab === 'jobs') {
      loadMatchedJobs();
    } else if (activeTab === 'jobs') {
      // Use all jobs if no profile
      setJobs(allJobsData as Job[]);
    }
  }, [userProfile, activeTab]);

  const loadMatchedJobs = async () => {
    if (!userProfile) return;
    
    setIsLoadingJobs(true);
    try {
      const matchedJobs = await JobService.getMatchedJobs(userProfile);
      setJobs(matchedJobs);
    } catch (error) {
      console.error('Error loading matched jobs:', error);
      // Fallback to local data
      const fallbackJobs = JobMatchingService.generateMatchedJobs(userProfile, 50);
      setJobs(fallbackJobs as Job[]);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Calculate card transform based on drag
  const getCardTransform = () => {
    if (!dragStart || !dragCurrent || !isDragging) return '';
    
    const deltaX = dragCurrent.x - dragStart.x;
    const deltaY = dragCurrent.y - dragStart.y;
    const rotation = Math.min(Math.max(deltaX / 10, -15), 15); // Limit rotation to ±15 degrees
    
    return `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
  };

  // Calculate swipe overlay opacity and text
  const getSwipeOverlay = () => {
    if (!dragStart || !dragCurrent || !isDragging) return { opacity: 0, text: '', color: '' };
    
    const deltaX = dragCurrent.x - dragStart.x;
    const absDeltaX = Math.abs(deltaX);
    const opacity = Math.min(absDeltaX / 100, 0.8);
    
    if (deltaX > 50) {
      return { opacity, text: 'LIKE', color: 'text-green-500' };
    } else if (deltaX < -50) {
      return { opacity, text: 'PASS', color: 'text-red-500' };
    }
    
    return { opacity: 0, text: '', color: '' };
  };

  const handleSwipe = (action: 'like' | 'pass') => {
    if (isAnimating || isDragging) return;
    
    setAnimationDirection(action === 'like' ? 'right' : 'left');
    setIsAnimating(true);
    
    // Update gamification stats
    if (action === 'like') {
      setLikes(prev => prev + 1);
      const points = jobs[currentJob]?.matchScore || 0;
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      setShowScoreAnimation(true);
      setTimeout(() => setShowScoreAnimation(false), 1000);
    } else {
      setPasses(prev => prev + 1);
      setStreak(0); // Reset streak on pass
    }
    
    // Record swipe in backend
    if (userProfile) {
      JobService.recordSwipe(userProfile.full_name || 'demo-user', jobs[currentJob]?.id || 0, action);
    }
    
    // Log action for ML learning
    console.log(`${action} on ${jobs[currentJob]?.company}`);
    
    // Move to next job after animation
    setTimeout(() => {
      setCurrentJob(prev => prev + 1);
      setIsAnimating(false);
      setAnimationDirection(null);
      setShowHint(false);
      setHintDirection(null);
      // Reset drag state
      setDragStart(null);
      setDragCurrent(null);
      setIsDragging(false);
    }, 300);
  };

  // Mouse/touch event handlers
  const handleStart = (clientX: number, clientY: number) => {
    if (isAnimating) return;
    setDragStart({ x: clientX, y: clientY });
    setDragCurrent({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !dragStart) return;
    setDragCurrent({ x: clientX, y: clientY });
  };

  const handleEnd = () => {
    if (!isDragging || !dragStart || !dragCurrent) {
      setIsDragging(false);
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    const deltaX = dragCurrent.x - dragStart.x;
    const absDeltaX = Math.abs(deltaX);

    if (absDeltaX > swipeThreshold) {
      // Trigger swipe
      const action = deltaX > 0 ? 'like' : 'pass';
      handleSwipe(action);
    } else {
      // Snap back to center
      setIsDragging(false);
      setDragStart(null);
      setDragCurrent(null);
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (isAnimating || isDragging) return;
    
    if (e.key === 'ArrowLeft') {
      // Show hint animation
      setHintDirection('left');
      setShowHint(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setShowHint(false);
        setHintDirection(null);
      }, 200);
      
      // Execute action after hint
      setTimeout(() => handleSwipe('pass'), 100);
    } else if (e.key === 'ArrowRight') {
      // Show hint animation
      setHintDirection('right');
      setShowHint(true);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => {
        setShowHint(false);
        setHintDirection(null);
      }, 200);
      
      // Execute action after hint
      setTimeout(() => handleSwipe('like'), 100);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentJob, isAnimating, isDragging]);

  if (jobs.length === 0 || isLoadingJobs) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-black' : 'bg-white'
      }`}>
        <div className="text-center">
          <LayeredLoadingAnimation />
          <p className={`text-lg mt-8 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {isLoadingJobs ? 'Loading personalized matches...' : 'Loading opportunities...'}
          </p>
        </div>
      </div>
    );
  }

  if (currentJob >= jobs.length) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-black' : 'bg-white'
      }`}>
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl font-bold">人</span>
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>All caught up!</h2>
          <p className={`text-lg mb-6 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            You've seen all available opportunities. Check back later for new matches.
          </p>
          <button 
            onClick={() => setCurrentJob(0)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode ? 'bg-black' : 'bg-white'
    }`}>
      {/* Header */}
      <div className={`px-6 py-4 ${
        isDarkMode ? '' : ''
      }`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center gap-4 flex-1">
              <div className="w-10 h-10 bg-red-600 flex items-center justify-center border-2 border-red-700">
                <span className="text-white text-lg font-black">人</span>
              </div>
              <h1 className={`text-2xl font-mono font-medium tracking-wider ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>FEED</h1>
            </div>
            <div className={`text-sm font-bold px-3 py-1 border ${
              isDarkMode 
                ? 'text-gray-300 border-gray-800 bg-black' 
                : 'text-gray-400 border-gray-700 bg-gray-900'
            }`}>
              {activeTab === 'jobs' ? `${currentJob + 1} / ${jobs.length}` : 'Opportunities'}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'jobs'
                  ? 'bg-red-600 text-white'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Job Matches
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'opportunities'
                  ? 'bg-red-600 text-white'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Milo Scout
            </button>
          </div>
          
          {/* Gamification Stats */}
          <div className="grid grid-cols-4 gap-1">
            <div className={`text-center p-1.5 border ${
              isDarkMode ? 'border-gray-800 bg-black' : 'border-gray-700 bg-gray-900'
            }`}>
              <div className={`text-sm font-mono font-light ${
                showScoreAnimation ? 'text-green-400 animate-pulse' : 'text-red-400'
              }`}>
                {score}
              </div>
              <div className={`text-xs font-semibold ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>SCORE</div>
            </div>
            <div className={`text-center p-1.5 border ${
              isDarkMode ? 'border-gray-800 bg-black' : 'border-gray-700 bg-gray-900'
            }`}>
              <div className={`text-sm font-mono font-light ${
                streak > 0 ? 'text-yellow-400' : 'text-gray-500'
              }`}>
                {streak}
              </div>
              <div className={`text-xs font-semibold ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>STREAK</div>
            </div>
            <div className={`text-center p-1.5 border ${
              isDarkMode ? 'border-gray-800 bg-black' : 'border-gray-700 bg-gray-900'
            }`}>
              <div className="text-sm font-mono font-light text-green-400">{likes}</div>
              <div className={`text-xs font-semibold ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>LIKES</div>
            </div>
            <div className={`text-center p-1.5 border ${
              isDarkMode ? 'border-gray-800 bg-black' : 'border-gray-700 bg-gray-900'
            }`}>
              <div className="text-sm font-mono font-light text-gray-500">{passes}</div>
              <div className={`text-xs font-semibold ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>PASSES</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'jobs' ? (
        <>
          {/* Job Card with Swipe Animation */}
          <div className="px-6 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Swipe Overlay */}
                {isDragging && (() => {
                  const overlay = getSwipeOverlay();
                  return (
                    <div 
                      className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none ${
                        overlay.text === 'LIKE' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}
                      style={{ opacity: overlay.opacity }}
                    >
                      <div className={`text-6xl font-black ${overlay.color} transform rotate-12`}>
                        {overlay.text}
                      </div>
                    </div>
                  );
                })()}
                
                {/* Job Card */}
                <div 
                  ref={cardRef}
                  className={`relative cursor-grab active:cursor-grabbing select-none ${
                    isAnimating 
                      ? `transition-all duration-300 ease-out ${
                          animationDirection === 'left' 
                            ? 'transform -translate-x-full opacity-0' 
                            : 'transform translate-x-full opacity-0'
                        }`
                      : isDragging 
                        ? 'transition-none' 
                        : 'transition-transform duration-200 ease-out'
                  }`}
                  style={{
                    transform: isDragging ? getCardTransform() : 'translate(0px, 0px) rotate(0deg)'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <NewJobCard 
                    {...convertJobToNewJobCard(jobs[currentJob])}
                    isDark={isDarkMode}
                  />
                </div>
              </div>
              
              {/* Swipe Buttons - Outside JobCard */}
              <div className="flex justify-center items-center gap-8 py-6">
                <button 
                  onClick={() => handleSwipe('pass')}
                  disabled={isAnimating || isDragging}
                  className="w-16 h-16 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-full transition-all duration-200 flex items-center justify-center transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  <span className="text-white text-2xl font-bold">×</span>
                </button>
                <button 
                  onClick={() => handleSwipe('like')}
                  disabled={isAnimating || isDragging}
                  className="w-16 h-16 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-full transition-all duration-200 flex items-center justify-center transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  <span className="text-white text-2xl font-bold">✓</span>
                </button>
              </div>
              
              {/* Yale Alumni Section */}
              <div className="mt-6">
                <YaleAlumniSection 
                  companyName={jobs[currentJob]?.company || ''} 
                  isDark={isDarkMode} 
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <MiloOpportunities userProfile={userProfile || null} />
      )}

      {/* Arrow key navigation hint - only for jobs tab */}
      {activeTab === 'jobs' && (
        <div className="px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <div className={`text-center transition-opacity duration-500 ${
              isAnimating ? 'opacity-0' : 'opacity-100'
            }`}>
            <div className={`text-sm font-bold tracking-wider flex flex-col items-center justify-center gap-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <div className="flex items-center gap-2">
                <span>Use</span>
                <span className={`px-3 py-1 border-2 font-black transition-all duration-200 ${
                  showHint && hintDirection === 'left' 
                    ? 'bg-red-600 text-white border-red-600 scale-110' 
                    : isDarkMode 
                      ? 'bg-gray-800 text-gray-300 border-gray-600' 
                      : 'bg-gray-100 text-gray-700 border-gray-400'
                }`}>←</span>
                <span>to pass or</span>
                <span className={`px-3 py-1 border-2 font-black transition-all duration-200 ${
                  showHint && hintDirection === 'right' 
                    ? 'bg-green-600 text-white border-green-600 scale-110' 
                    : isDarkMode 
                      ? 'bg-gray-800 text-gray-300 border-gray-600' 
                      : 'bg-gray-100 text-gray-700 border-gray-400'
                }`}>→</span>
                <span>to like</span>
              </div>
              <div className="text-xs opacity-75">
                Or drag the card left/right
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
