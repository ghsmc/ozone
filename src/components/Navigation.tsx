import React from 'react';

export const Navigation: React.FC = () => {
  return (
    <div className="fixed top-8 left-8 flex flex-col gap-4 z-50">
      <div className="flex items-center gap-2 text-black">
        <div className="w-1.5 h-1.5 bg-red-700 rounded-full"></div>
        <span className="text-sm font-medium">People</span>
      </div>
      <div className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors cursor-pointer">
        <div className="w-1.5 h-1.5 bg-transparent rounded-full"></div>
        <span className="text-sm">Timelines</span>
      </div>
    </div>
  );
};