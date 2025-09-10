import React, { useState } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { 
  Search, 
  Home, 
  Users, 
  Plus, 
  Settings, 
  Star,
  Trash2,
  FileText,
  Clock,
  ChevronDown,
  Menu,
  Building2,
  MapPin,
  GraduationCap,
  Briefcase,
  TrendingUp,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPage?: 'search' | 'feed';
  onPageChange?: (page: 'search' | 'feed') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, currentPage = 'search', onPageChange }) => {
  const { isDarkMode } = useDarkMode();
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
  const [isPrivateOpen, setIsPrivateOpen] = useState(true);

  return (
    <div className={`h-screen flex flex-col transition-all duration-300 ease-in-out ${
      isOpen ? 'w-64 md:w-64' : 'w-16'
    } ${
      isDarkMode 
        ? 'bg-black border-r border-gray-900' 
        : 'bg-stone-50 border-r border-stone-200'
    }`}>
        {isOpen ? (
          <>
            {/* Full Sidebar Content */}
            <div className={`p-3 transition-colors duration-300 ${
              isDarkMode ? 'border-b border-gray-900' : 'border-b border-stone-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div 
                  onClick={onToggle}
                  className="w-8 h-8 bg-red-600 flex items-center justify-center text-white text-sm font-bold shadow-sm border border-red-700 rounded-sm cursor-pointer transition-all duration-200 hover:bg-red-700 group"
                >
                  人
                </div>
                <button
                  onClick={onToggle}
                  className="p-1.5 hover:bg-stone-200 rounded transition-colors"
                  title="Close sidebar"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              {/* Search */}
              <div className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-800' 
                  : 'text-gray-500 hover:bg-stone-100'
              }`}>
                <Search className="w-4 h-4" />
                <span className="text-sm">Search</span>
              </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                {/* Core Items */}
                <div className="space-y-0.5 mb-4">
                  <SidebarItem 
                    icon={Search} 
                    label="Search" 
                    active={currentPage === 'search'}
                    onClick={() => onPageChange?.('search')}
                  />
                  <SidebarItem 
                    icon={Users} 
                    label="Feed" 
                    active={currentPage === 'feed'}
                    onClick={() => onPageChange?.('feed')}
                  />
                </div>

                {/* Workspace Section */}
                <div className="mb-4">
                  <button
                    onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                    className={`w-full flex items-center justify-between px-2 py-1 text-xs font-medium rounded transition-colors duration-200 ${
                      isDarkMode 
                        ? 'text-gray-300 hover:bg-gray-900' 
                        : 'text-gray-500 hover:bg-stone-100'
                    }`}
                  >
                    <span>Workspace</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isWorkspaceOpen ? '' : '-rotate-90'}`} />
                  </button>
                  {isWorkspaceOpen && (
                    <div className="mt-1 space-y-0.5">
                      <SidebarItem icon={Users} label="All People" />
                      <SidebarItem icon={Star} label="Saved Searches" />
                      <SidebarItem icon={FileText} label="Lists" />
                      <SidebarItem icon={Building2} label="Companies" />
                      <SidebarItem icon={GraduationCap} label="Universities" />
                      <SidebarItem icon={TrendingUp} label="Analytics" />
                    </div>
                  )}
                </div>

                {/* Private Section */}
                <div className="mb-4">
                  <button
                    onClick={() => setIsPrivateOpen(!isPrivateOpen)}
                    className={`w-full flex items-center justify-between px-2 py-1 text-xs font-medium rounded transition-colors duration-200 ${
                      isDarkMode 
                        ? 'text-gray-300 hover:bg-gray-900' 
                        : 'text-gray-500 hover:bg-stone-100'
                    }`}
                  >
                    <span>Private</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isPrivateOpen ? '' : '-rotate-90'}`} />
                  </button>
                  {isPrivateOpen && (
                    <div className="mt-1 space-y-0.5">
                      <SidebarItem icon={Star} label="My Favorites" />
                      <SidebarItem icon={Clock} label="Recent Searches" />
                      <SidebarItem icon={BookOpen} label="Career Research" />
                      <div className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors cursor-pointer ${
                        isDarkMode 
                          ? 'text-gray-200 hover:bg-gray-900' 
                          : 'text-gray-700 hover:bg-stone-100'
                      }`}>
                        <span className="text-blue-600">💼</span>
                        <span>Investment Banking</span>
                      </div>
                      <div className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors cursor-pointer ${
                        isDarkMode 
                          ? 'text-gray-200 hover:bg-gray-900' 
                          : 'text-gray-700 hover:bg-stone-100'
                      }`}>
                        <span className="text-green-600">🚀</span>
                        <span>Tech Companies</span>
                      </div>
                      <SidebarItem icon={FileText} label="Consulting Firms" />
                      <div className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors cursor-pointer ${
                        isDarkMode 
                          ? 'text-gray-200 hover:bg-gray-900' 
                          : 'text-gray-700 hover:bg-stone-100'
                      }`}>
                        <span className="text-purple-600">🎓</span>
                        <span>Yale Alumni Network</span>
                      </div>
                      <SidebarItem icon={FileText} label="Product Managers" />
                      <SidebarItem icon={FileText} label="MILO: Career Intelligence" />
                    </div>
                  )}
                </div>

                {/* Add New */}
                <button className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 hover:bg-gray-900' 
                    : 'text-gray-500 hover:bg-stone-100'
                }`}>
                  <Plus className="w-4 h-4" />
                  Add a page
                </button>
              </div>
            </div>

            {/* Bottom Section */}
            <div className={`p-2 transition-colors duration-300 ${
              isDarkMode ? 'border-t border-gray-900' : 'border-t border-stone-200'
            }`}>
              <div className="space-y-0.5 mb-4">
                <SidebarItem icon={Settings} label="Settings" />
                <SidebarItem icon={Trash2} label="Trash" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Collapsed Sidebar - Icon Only */}
            <div className="flex flex-col items-center py-3">
              {/* MILO Logo */}
              <div className="mb-6 group relative">
                <div 
                  onClick={onToggle}
                  className="w-8 h-8 bg-red-600 flex items-center justify-center text-white text-sm font-bold shadow-sm border border-red-700 rounded-sm cursor-pointer transition-all duration-200 hover:bg-red-700 group-hover:bg-red-700"
                >
                  <span className="group-hover:hidden transition-opacity duration-200">人</span>
                  <Menu className="w-4 h-4 opacity-0 group-hover:opacity-100 absolute transition-opacity duration-200" />
                </div>
                {/* Hover tooltip */}
                <div className="absolute left-12 top-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                  Open sidebar
                </div>
              </div>
              
              {/* Core Icons */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative group">
                  <button 
                    onClick={() => onPageChange?.('search')}
                    className={`p-2 rounded transition-colors ${
                      currentPage === 'search' 
                        ? 'bg-red-100 text-red-700' 
                        : 'hover:bg-stone-200 text-gray-500'
                    }`} 
                    title="Search"
                  >
                    <Search className={`w-4 h-4 ${
                      currentPage === 'search' ? 'text-red-700' : 'text-gray-500'
                    }`} />
                  </button>
                  <div className="absolute left-12 top-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    Search
                  </div>
                </div>
                <div className="relative group">
                  <button 
                    onClick={() => onPageChange?.('feed')}
                    className={`p-2 rounded transition-colors ${
                      currentPage === 'feed' 
                        ? 'bg-red-100 text-red-700' 
                        : 'hover:bg-stone-200 text-gray-500'
                    }`} 
                    title="Feed"
                  >
                    <Users className={`w-4 h-4 ${
                      currentPage === 'feed' ? 'text-red-700' : 'text-gray-500'
                    }`} />
                  </button>
                  <div className="absolute left-12 top-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    Feed
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Icons */}
            <div className={`mt-auto flex flex-col items-center py-3 transition-colors duration-300 ${
              isDarkMode ? 'border-t border-gray-900' : 'border-t border-stone-200'
            }`}>
              <div className="relative group">
                <button className={`p-2 rounded transition-colors ${
                  isDarkMode ? 'hover:bg-gray-900' : 'hover:bg-stone-200'
                }`} title="Settings">
                  <Settings className={`w-4 h-4 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`} />
                </button>
                <div className="absolute left-12 top-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                  Settings
                </div>
              </div>
            </div>
          </>
        )}
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active = false, onClick }) => {
  const { isDarkMode } = useDarkMode();

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors duration-200 ${
        active
          ? isDarkMode 
            ? 'bg-red-950/50 text-red-300 border border-red-900/50'
            : 'bg-red-50 text-red-700 border border-red-200'
          : isDarkMode
            ? 'text-gray-200 hover:bg-gray-900'
            : 'text-gray-700 hover:bg-stone-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
};