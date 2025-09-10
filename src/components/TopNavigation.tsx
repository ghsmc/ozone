import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

interface TopNavigationProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({ sidebarOpen, onToggleSidebar }) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className={`w-full py-3 px-3 md:px-3 transition-colors duration-300 ${
      isDarkMode ? 'bg-black' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between">
        {/* Left side - Mobile hamburger + MILO logo */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu */}
          <div
            onClick={onToggleSidebar}
            className="md:hidden w-8 h-8 bg-red-600 flex items-center justify-center text-white text-sm font-bold shadow-sm border border-red-700 rounded-sm cursor-pointer transition-all duration-200 hover:bg-red-700 group"
            title="Open menu"
          >
            <span className="group-hover:opacity-0 transition-opacity duration-200">人</span>
            <Menu className="w-4 h-4 opacity-0 group-hover:opacity-100 absolute transition-opacity duration-200" />
          </div>
          
          {/* MILO logo - always visible */}
          <div className="flex items-center gap-2">
            <h1 className={`text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>MILO</h1>
            <span className={`text-xs uppercase tracking-wide transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>AI CAREER PLATFORM</span>
          </div>
        </div>
        
        {/* Right side - Dark mode toggle */}
        <div className="flex items-center">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
};