import React, { useState } from 'react';
import { ArrowUp, Paperclip, ChevronDown, Globe, TrendingUp, Briefcase, MapPin, Factory, Wrench } from 'lucide-react';
import { SearchFilters } from '../types';
import { ProToggle } from './ProToggle';
import { useDarkMode } from '../contexts/DarkModeContext';

interface SearchSectionProps {
  onSearch: (query: string, filters?: SearchFilters) => Promise<void>;
  onClear: () => void;
  isLoading: boolean;
  proMode: boolean;
  setProMode: (enabled: boolean) => void;
  isChatMode?: boolean;
  onToggleChat?: () => void;
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  onSearch,
  onClear,
  isLoading,
  proMode,
  setProMode,
  isChatMode = false,
  onToggleChat
}) => {
  const { isDarkMode } = useDarkMode();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    company: '',
    location: '',
    title: '',
    school: ''
  });

  const handleSearch = () => {
    if (isChatMode) {
      onSearch(query);
    } else {
      onSearch(query, filters);
    }
  };

  const handleClear = () => {
    setQuery('');
    setFilters({
      company: '',
      location: '',
      title: '',
      school: ''
    });
    onClear();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const nlpQueries = [
    'Find opportunities in sustainable energy',
    'Research positions in urban mobility',
    'Startup internships in AI and machine learning',
    'Fellowships in Latin American policy',
    'Consulting opportunities with Yale connections'
  ];


  const setExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  return (
    <div className="space-y-6 mb-12">
      {/* Main Search Container - ChatGPT Style */}
      <div className="max-w-4xl mx-auto px-2 sm:px-0">
        <div className={`rounded-2xl p-3 shadow-lg border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-black border-gray-800' 
            : 'bg-black border-gray-800'
        }`}>
          {/* Add Context Button */}
          <div className="mb-3 hidden sm:block">
            <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs uppercase tracking-wide transition-colors font-medium ${
              isDarkMode
                ? 'bg-black hover:bg-gray-900 text-gray-200'
                : 'bg-black hover:bg-gray-900 text-gray-200'
            }`}>
              <Paperclip className="w-4 h-4" />
              Add Resume
            </button>
          </div>

          {/* Main Input Area */}
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isChatMode ? "Ask Milo about opportunities, internships, research, or career advice..." : "Describe your dream job"}
              className={`w-full bg-transparent text-sm sm:text-base resize-none border-none outline-none min-h-[45px] pr-12 transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-white placeholder-gray-400' 
                  : 'text-black placeholder-gray-500'
              }`}
              disabled={isLoading}
              rows={1}
              style={{ 
                resize: 'none',
                overflow: 'hidden'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 200) + 'px';
              }}
            />
            
            {/* Send Button */}
            <button
              onClick={isChatMode && onToggleChat ? onToggleChat : handleSearch}
              disabled={isLoading || (!query.trim() && !isChatMode)}
              className={`absolute right-2 bottom-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold ${
                (query.trim() || isChatMode) && !isLoading 
                  ? 'bg-red-700 text-white hover:bg-red-800' 
                  : 'bg-gray-200 text-gray-400'
              }`}
              title={isChatMode ? "Toggle Chat Mode" : "Search Opportunities"}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-red-700 rounded-full animate-spin" />
              ) : (
                '人'
              )}
            </button>
          </div>

          {/* Bottom Options - Hidden in chat mode */}
          {!isChatMode && (
            <div className={`hidden sm:flex items-center justify-between mt-3 pt-3 border-t transition-colors duration-300 ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
            <div className="flex items-center gap-4">              
              <div className={`flex items-center gap-2 px-3 py-1.5 border rounded text-xs uppercase tracking-wide font-medium cursor-pointer transition-colors ${
                isDarkMode
                  ? 'border-gray-600 text-gray-200 hover:text-white hover:border-gray-500'
                  : 'border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
              }`}>
                <div className="w-4 h-4 bg-red-600 flex items-center justify-center text-white text-xs font-bold border border-red-700 rounded-sm">
                  人
                </div>
                <span>Company</span>
                <ChevronDown className="w-3 h-3" />
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 border rounded text-xs uppercase tracking-wide font-medium cursor-pointer transition-colors ${
                isDarkMode
                  ? 'border-gray-600 text-gray-200 hover:text-white hover:border-gray-500'
                  : 'border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
              }`}>
                <Globe className="w-4 h-4" />
                <span>Industry</span>
                <ChevronDown className="w-3 h-3" />
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 border rounded text-xs uppercase tracking-wide font-medium cursor-pointer transition-colors ${
                isDarkMode
                  ? 'border-gray-600 text-gray-200 hover:text-white hover:border-gray-500'
                  : 'border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
              }`}>
                <span className="text-sm">📍</span>
                <span>Location</span>
                <ChevronDown className="w-3 h-3" />
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 border rounded text-xs uppercase tracking-wide font-medium cursor-pointer transition-colors ${
                isDarkMode
                  ? 'border-gray-600 text-gray-200 hover:text-white hover:border-gray-500'
                  : 'border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
              }`}>
                <Wrench className="w-4 h-4" />
                <span>Role</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>
            
            </div>
          )}
        </div>
      </div>

      {/* Mobile Toggleable Sections - Hidden in chat mode */}
      {!isChatMode && (
        <div className="max-w-4xl mx-auto px-2 sm:hidden space-y-3">
        {/* Mobile Toolbar - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 border rounded text-xs uppercase tracking-wide font-medium cursor-pointer transition-colors ${
            isDarkMode
              ? 'border-gray-600 text-gray-200 hover:text-white hover:border-gray-500'
              : 'border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
          }`}>
            <div className="w-4 h-4 bg-red-600 flex items-center justify-center text-white text-xs font-bold border border-red-700 rounded-sm">
              人
            </div>
            <span>Company</span>
            <ChevronDown className="w-3 h-3 ml-auto" />
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 border rounded text-xs uppercase tracking-wide font-medium cursor-pointer transition-colors ${
            isDarkMode
              ? 'border-gray-600 text-gray-200 hover:text-white hover:border-gray-500'
              : 'border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
          }`}>
            <Globe className="w-4 h-4" />
            <span>Industry</span>
            <ChevronDown className="w-3 h-3 ml-auto" />
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 border rounded text-xs uppercase tracking-wide font-medium cursor-pointer transition-colors ${
            isDarkMode
              ? 'border-gray-600 text-gray-200 hover:text-white hover:border-gray-500'
              : 'border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
          }`}>
            <span className="text-sm">📍</span>
            <span>Location</span>
            <ChevronDown className="w-3 h-3 ml-auto" />
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 border rounded text-xs uppercase tracking-wide font-medium cursor-pointer transition-colors ${
            isDarkMode
              ? 'border-gray-600 text-gray-200 hover:text-white hover:border-gray-500'
              : 'border-gray-200 text-gray-600 hover:text-black hover:border-gray-300'
          }`}>
            <Wrench className="w-4 h-4" />
            <span>Role</span>
            <ChevronDown className="w-3 h-3 ml-auto" />
          </div>
        </div>
        </div>
      )}

      {/* Desktop Example Queries - Hidden on Mobile and in chat mode */}
      {!isChatMode && (
        <div className="max-w-4xl mx-auto px-2 sm:px-0 hidden sm:block">
        <div className="space-y-6">
          {/* Recommended Searches */}
          <div>
            <div className={`text-xs uppercase tracking-wide mb-3 font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Recommended Searches
            </div>
            <div className="space-y-2">
              {nlpQueries.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setExampleQuery(example)}
                  className={`block w-full text-left px-3 py-2 text-sm border border-transparent transition-all font-normal rounded-md ${
                    isDarkMode
                      ? 'bg-black text-gray-200 hover:bg-gray-900 hover:text-white hover:border-gray-600'
                      : 'bg-black text-gray-200 hover:bg-gray-900 hover:text-white hover:border-gray-600'
                  }`}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
        </div>
      )}

    </div>
  );
};

interface FilterDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  onChange,
  options
}) => {
  return (
    <div className="relative">
      <label className="absolute -top-2 left-3 bg-white px-2 text-xs text-gray-600 uppercase tracking-wide z-10 font-medium">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg bg-white text-black text-xs uppercase tracking-wide focus:border-red-700 focus:outline-none appearance-none cursor-pointer font-medium hover:border-gray-400 transition-colors"
      >
        <option value="">All {label}s</option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};