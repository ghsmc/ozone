import React from 'react';
import { SearchResults } from '../types';
import { QueryDetails } from './QueryDetails';
import { ViewToggle } from './ViewToggle';
import { ResultsTable } from './ResultsTable';
import { ResultsCards } from './ResultsCards';
import { Pagination } from './Pagination';
import { AIInsights } from './AIInsights';
import { Loader2 } from 'lucide-react';

interface ResultsDisplayProps {
  results: SearchResults;
  currentView: 'table' | 'cards';
  onViewChange: (view: 'table' | 'cards') => void;
  currentPage: number;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
  proMode: boolean;
  isLoading: boolean;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  currentView,
  onViewChange,
  currentPage,
  resultsPerPage,
  onPageChange,
  proMode,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin text-red-700" />
          <span>Searching database...</span>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(results.total / resultsPerPage);

  return (
    <div className="space-y-8">
      {/* Query Details */}
      {(results.query_explanation || results.sql_query) && (
        <QueryDetails results={results} />
      )}

      {/* AI Insights */}
      {proMode && results.results.length > 0 && (
        <AIInsights results={results.results} />
      )}

      {/* Results Header */}
      <div className="flex justify-between items-center pb-6 border-b border-gray-200">
        <div>
          <div className="text-lg font-medium uppercase tracking-wide text-black">
            Search Results
          </div>
        </div>
        <div className="text-sm text-gray-600 font-normal">
          {results.total.toLocaleString()} professional{results.total !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* View Toggle */}
      {results.results.length > 0 && (
        <ViewToggle currentView={currentView} onViewChange={onViewChange} />
      )}

      {/* Results */}
      {results.results.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          No professionals found matching your criteria.
        </div>
      ) : currentView === 'table' ? (
        <ResultsTable professionals={results.results} />
      ) : (
        <ResultsCards professionals={results.results} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};