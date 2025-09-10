import React from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';

export const Header: React.FC = () => {
  const { isDarkMode } = useDarkMode();

  return (
    <div className="text-center mb-12 mt-16 space-y-6">
      <div className="flex items-center justify-center gap-3 mb-2">
        <div className="w-8 h-8 bg-red-600 flex items-center justify-center text-white text-sm font-bold shadow-sm border border-red-700 rounded-sm">
          人
        </div>
        <h1 className={`text-4xl font-bold transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Find the dream job.</h1>
      </div>
    </div>
  );
}