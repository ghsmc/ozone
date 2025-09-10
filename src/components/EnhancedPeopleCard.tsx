import React, { useState } from 'react';

interface AlumniData {
  name: string;
  current_role: string;
  current_company: string;
  current_location: string;
  linkedin_url: string;
  major: string;
  graduation_year: string;
  relevance_score: number;
  match_reason: string;
  text_snippet: string;
}

interface EnhancedPeopleCardProps {
  alumni: AlumniData;
  isDark?: boolean;
}

export const EnhancedPeopleCard: React.FC<EnhancedPeopleCardProps> = ({ 
  alumni, 
  isDark = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div 
      className={`p-6 border rounded-lg transition-all duration-200 w-full hover:shadow-lg ${
        isDark 
          ? 'bg-gray-900 border-gray-800 text-white hover:border-gray-700' 
          : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'
      }`}
    >
      {/* Header with Avatar, Name, Role, and Match Score */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-lg font-bold">
            {getInitials(alumni.name)}
          </span>
        </div>
        
        {/* Name, Role, and Company */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {alumni.name}
          </h3>
          <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {alumni.current_role}
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {alumni.current_company}
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {alumni.current_location}
          </p>
        </div>
        
        {/* Match Score */}
        <div className="flex flex-col items-end">
          <div className={`text-[8px] ${isDark ? 'text-gray-400' : 'text-gray-500'} font-light tracking-wider uppercase mb-1`}>
            MATCH
          </div>
          <div className={`px-2 py-1 rounded font-mono text-white text-sm font-bold ${getMatchScoreColor(alumni.relevance_score)}`}>
            {alumni.relevance_score}
          </div>
        </div>
      </div>

      {/* Yale Information */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Yale Major</div>
            <div className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {alumni.major}
            </div>
          </div>
          <div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Class Year</div>
            <div className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {alumni.graduation_year}
            </div>
          </div>
        </div>
      </div>

      {/* Match Reason */}
      <div className="mb-4">
        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Why This Match</div>
        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {alumni.match_reason}
        </div>
      </div>

      {/* Expandable Text Snippet */}
      {alumni.text_snippet && (
        <div className="mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`text-xs ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
          >
            {isExpanded ? 'Show Less' : 'Show More'} ▼
          </button>
          {isExpanded && (
            <div className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
              {alumni.text_snippet}
            </div>
          )}
        </div>
      )}

      {/* LinkedIn Button */}
      {alumni.linkedin_url && (
        <div className="pt-4 border-t border-gray-700">
          <a
            href={alumni.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
            </svg>
            Connect on LinkedIn
          </a>
        </div>
      )}
    </div>
  );
};
