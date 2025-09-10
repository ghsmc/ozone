import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  return (
    <div className="flex items-center justify-center gap-6 pt-10 mt-10 border-t border-gray-200">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-2 px-4 py-2 bg-transparent border border-gray-300 text-black text-sm hover:border-red-700 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-black transition-colors font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>
      
      <div className="text-sm text-gray-600 font-normal">
        Page {currentPage} of {totalPages}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-2 px-4 py-2 bg-transparent border border-gray-300 text-black text-sm hover:border-red-700 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-black transition-colors font-medium"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};