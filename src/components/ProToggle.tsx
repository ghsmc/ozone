import React from 'react';
import { Sparkles } from 'lucide-react';

interface ProToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export const ProToggle: React.FC<ProToggleProps> = ({ enabled, onChange }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-5 flex items-center justify-between border border-gray-200">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-800">Pro</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 hover:bg-gray-400 peer-checked:hover:bg-blue-700"></div>
        </label>
      </div>
      <div className="text-gray-600 text-sm">
        AI-powered career insights
      </div>
    </div>
  );
};