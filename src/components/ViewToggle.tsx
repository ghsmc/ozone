import React from 'react';
import { Table, Grid } from 'lucide-react';

interface ViewToggleProps {
  currentView: 'table' | 'cards';
  onViewChange: (view: 'table' | 'cards') => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="flex justify-center gap-3">
      <button
        onClick={() => onViewChange('table')}
        className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wide border transition-all font-medium ${
          currentView === 'table'
            ? 'bg-black text-white border-black'
            : 'bg-transparent text-gray-600 border-gray-300 hover:border-red-700 hover:text-red-700'
        }`}
      >
        <Table className="w-4 h-4" />
        Table View
      </button>
      <button
        onClick={() => onViewChange('cards')}
        className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wide border transition-all font-medium ${
          currentView === 'cards'
            ? 'bg-black text-white border-black'
            : 'bg-transparent text-gray-600 border-gray-300 hover:border-red-700 hover:text-red-700'
        }`}
      >
        <Grid className="w-4 h-4" />
        Card View
      </button>
    </div>
  );
};