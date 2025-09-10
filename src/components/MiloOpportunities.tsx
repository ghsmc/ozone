import React, { useState, useEffect } from 'react';
import { miloScout, MiloResponse, StudentProfile } from '../lib/milo-opportunity-scout';
import { OnboardingData } from '../lib/supabase';

interface MiloOpportunitiesProps {
  userProfile: OnboardingData | null;
}

export const MiloOpportunities: React.FC<MiloOpportunitiesProps> = ({ userProfile }) => {
  const [opportunities, setOpportunities] = useState<MiloResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [streamingStatus, setStreamingStatus] = useState<string>('');

  useEffect(() => {
    if (userProfile) {
      loadOpportunities();
    }
  }, [userProfile]);

  const loadOpportunities = async () => {
    if (!userProfile) return;
    
    setIsLoading(true);
    setError(null);
    setStreamingContent('');
    setStreamingStatus('');
    
    try {
      const studentProfile = miloScout.fromOnboardingData(userProfile);
      
      // Use streaming API for better UX
      const response = await miloScout.findOpportunitiesStream(studentProfile, (update) => {
        if (update.type === 'start') {
          setStreamingStatus(update.message);
        } else if (update.type === 'content') {
          setStreamingContent(update.content);
        } else if (update.type === 'complete') {
          setOpportunities(update.data);
          setStreamingStatus('Complete!');
        } else if (update.type === 'error') {
          setError(update.error);
        }
      });
      
      setOpportunities(response);
    } catch (err) {
      console.error('Error loading opportunities:', err);
      setError('Failed to load opportunities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="w-20 h-20 bg-red-600 flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-3xl font-black">人</span>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">
            {streamingStatus || 'Finding your perfect opportunities...'}
          </h2>
          
          {streamingContent && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
              <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
                {streamingContent}
              </pre>
            </div>
          )}
          
          <div className="w-8 h-8 bg-red-600 rounded-full animate-pulse mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-red-600 flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-3xl font-black">人</span>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">
            Something went wrong
          </h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={loadOpportunities}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 font-medium transition-all duration-200 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!opportunities) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-red-600 flex items-center justify-center">
              <span className="text-white text-xl font-black">人</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Milo Opportunity Scout</h1>
              <p className="text-gray-400">Unconventional opportunities tailored for you</p>
            </div>
          </div>
          
          {/* Student Reflection */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-red-400">Your Profile</h2>
            <p className="text-gray-300 mb-4">{opportunities.student_reflection.who_you_are}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-200 mb-2">Motivations</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  {opportunities.student_reflection.motivations.map((motivation, index) => (
                    <li key={index}>• {motivation}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-200 mb-2">Skill Themes</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  {opportunities.student_reflection.skill_themes.map((skill, index) => (
                    <li key={index}>• {skill}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Opportunities */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-red-400">Opportunities for You</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {opportunities.opportunities.map((opportunity, index) => (
              <div key={index} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{opportunity.title}</h3>
                    <p className="text-gray-400 text-sm">{opportunity.org_name}</p>
                  </div>
                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                    {opportunity.category.replace('_', ' ')}
                  </span>
                </div>
                
                <p className="text-gray-300 text-sm mb-4">{opportunity.why_it_fits}</p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-200 text-sm mb-1">First Touch</h4>
                    <p className="text-gray-400 text-sm">{opportunity.action_ladder.first_touch}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-200 text-sm mb-1">Micro Project</h4>
                    <p className="text-gray-400 text-sm">{opportunity.action_ladder.micro_project_to_offer}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-200 text-sm mb-1">Timing</h4>
                    <p className="text-gray-400 text-sm">{opportunity.timing.best_apply_window}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <a
                    href={opportunity.link_or_how_to_find}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:text-red-300 text-sm font-medium"
                  >
                    Learn More →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Yale-Specific Doors */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-red-400">Yale Connections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.yale_specific_doors.map((door, index) => (
              <div key={index} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">{door.name}</h3>
                <p className="text-gray-400 text-sm mb-3">{door.how_to_engage}</p>
                <div className="text-xs text-gray-500 mb-3">
                  Next: {door.exact_next_step}
                </div>
                <a
                  href={door.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:text-red-300 text-sm font-medium"
                >
                  Explore →
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Plan */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-red-400">This Week's Action Plan</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {opportunities.weekly_plan.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="bg-red-600 text-white text-sm font-medium px-3 py-1 rounded mb-2">
                    {day.day}
                  </div>
                  <p className="text-gray-300 text-sm">{day.task}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quality Check */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-400">Quality Check</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{opportunities.quality_checks.specific_items_count}</div>
              <div className="text-gray-400">Specific Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{opportunities.quality_checks.yale_items_count}</div>
              <div className="text-gray-400">Yale Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{opportunities.quality_checks.links_present ? '✓' : '✗'}</div>
              <div className="text-gray-400">Links Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{opportunities.quality_checks.aligned_with_constraints ? '✓' : '✗'}</div>
              <div className="text-gray-400">Constraints Met</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
