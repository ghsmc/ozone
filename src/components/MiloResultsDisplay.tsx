import React, { useState, useEffect } from 'react';
import { SearchResults } from '../types';
import { Loader2 } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

interface MiloResultsDisplayProps {
  results: SearchResults;
  currentView: 'table' | 'cards';
  onViewChange: (view: 'table' | 'cards') => void;
  currentPage: number;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
  proMode: boolean;
  isLoading: boolean;
}

export const MiloResultsDisplay: React.FC<MiloResultsDisplayProps> = ({
  results,
  isLoading
}) => {
  const { isDarkMode } = useDarkMode();
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [streamingStatus, setStreamingStatus] = useState<string>('');

  // Update streaming content when results change
  useEffect(() => {
    const miloResponse = (results as any).milo_response;
    if (miloResponse) {
      setStreamingContent(JSON.stringify(miloResponse, null, 2));
    }
  }, [results]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin text-red-700" />
          <span>{streamingStatus || 'Finding opportunities...'}</span>
        </div>
      </div>
    );
  }

  const miloResponse = (results as any).milo_response;

  return (
    <div className="space-y-4">
      {/* Raw JSON Output */}
      <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          Milo Opportunity Scout - Raw JSON Response
        </h3>
        {streamingStatus && (
          <div className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Status: {streamingStatus}
          </div>
        )}
        <pre className={`text-sm overflow-auto max-h-96 whitespace-pre-wrap ${
          isDarkMode ? 'text-gray-300' : 'text-gray-800'
        }`}>
          {streamingContent || JSON.stringify(miloResponse, null, 2)}
        </pre>
      </div>
    </div>
  );
};
