import React, { useState } from 'react';
import { SearchResults } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface QueryDetailsProps {
  results: SearchResults;
}

export const QueryDetails: React.FC<QueryDetailsProps> = ({ results }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-6 py-4 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Query Analysis
        </h3>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-600" />
        )}
      </div>
      
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* Query Explanation */}
          {results.query_explanation && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>🔍 Query Interpretation:</strong> {results.query_explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* SQL Query */}
          {results.sql_query && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-600 mb-2 tracking-wide">
                Generated SQL Query
              </h4>
              <div className="bg-gray-50 p-4 rounded border text-xs font-mono text-gray-800 overflow-x-auto">
                <pre>{results.sql_query}</pre>
              </div>
            </div>
          )}
          
          {/* Extracted Filters */}
          {results.nlp_filters && Object.keys(results.nlp_filters).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-gray-600 mb-2 tracking-wide">
                Extracted Filters
              </h4>
              <div className="flex flex-wrap gap-2">
                {results.nlp_filters.companies && results.nlp_filters.companies.map((company, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 border border-gray-300 text-xs text-gray-800 rounded">
                    Company: {company}
                  </span>
                ))}
                {results.nlp_filters.titles && results.nlp_filters.titles.map((title, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 border border-gray-300 text-xs text-gray-800 rounded">
                    Title: {title}
                  </span>
                ))}
                {results.nlp_filters.schools && results.nlp_filters.schools.map((school, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 border border-gray-300 text-xs text-gray-800 rounded">
                    School: {school}
                  </span>
                ))}
                {results.nlp_filters.locations && results.nlp_filters.locations.map((location, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 border border-gray-300 text-xs text-gray-800 rounded">
                    Location: {location}
                  </span>
                ))}
                {results.nlp_filters.skills && results.nlp_filters.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 border border-gray-300 text-xs text-gray-800 rounded">
                    Skill: {skill}
                  </span>
                ))}
                {results.nlp_filters.current_only && (
                  <span className="px-3 py-1 bg-gray-100 border border-gray-300 text-xs text-gray-800 rounded">
                    Current positions only
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};