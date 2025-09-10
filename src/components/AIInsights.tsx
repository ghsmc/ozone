import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Professional } from '../types';

interface AIInsightsProps {
  results: Professional[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ results }) => {
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateInsights = async () => {
      setIsLoading(true);
      
      // Simulate AI analysis delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock AI insights based on the results
      const companies = [...new Set(results.map(p => p.current_company).filter(Boolean))];
      const schools = [...new Set(results.flatMap(p => p.education?.map(e => e.school) || []).filter(Boolean))];
      const locations = [...new Set(results.map(p => p.location_city).filter(Boolean))];
      
      let insight = `Based on your search results, here are key career insights:\n\n`;
      
      if (companies.length > 0) {
        insight += `🏢 **Top Companies**: The most represented companies include ${companies.slice(0, 3).join(', ')}. `;
        
        if (companies.includes('Goldman Sachs') || companies.includes('McKinsey')) {
          insight += `These are prestigious firms known for rigorous hiring standards and strong alumni networks.\n\n`;
        } else if (companies.includes('Google') || companies.includes('Meta')) {
          insight += `These tech giants offer excellent career growth and competitive compensation packages.\n\n`;
        } else {
          insight += `These organizations represent diverse industry sectors with strong growth potential.\n\n`;
        }
      }
      
      if (schools.length > 0) {
        insight += `🎓 **Educational Background**: Alumni from ${schools.slice(0, 3).join(', ')} are well-represented. `;
        insight += `These institutions provide excellent networking opportunities and strong career services.\n\n`;
      }
      
      if (locations.length > 0) {
        insight += `📍 **Geographic Distribution**: Professionals are concentrated in ${locations.slice(0, 3).join(', ')}. `;
        
        if (locations.includes('New York')) {
          insight += `New York offers the highest concentration of finance and consulting opportunities.\n\n`;
        } else if (locations.includes('San Francisco')) {
          insight += `San Francisco remains the hub for tech innovation and startup opportunities.\n\n`;
        } else {
          insight += `These locations offer diverse career opportunities across multiple industries.\n\n`;
        }
      }
      
      insight += `💡 **Career Recommendations**: Consider reaching out through alumni networks, attending industry events in these locations, and building skills relevant to these top companies.`;
      
      setInsights(insight);
      setIsLoading(false);
    };

    if (results.length > 0) {
      generateInsights();
    }
  }, [results]);

  if (!results.length) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5" />
        <h3 className="text-lg font-semibold">AI Career Insights</h3>
      </div>
      
      {isLoading ? (
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Analyzing career patterns and generating insights...</span>
        </div>
      ) : (
        <div className="space-y-3 text-white/95">
          {insights.split('\n\n').map((paragraph, index) => (
            <p key={index} className="leading-relaxed">
              {paragraph.split('**').map((part, i) => 
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
              )}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};