import React from 'react';
import { Professional } from '../types';
import { ExternalLink, Users, Eye } from 'lucide-react';

interface ResultsTableProps {
  professionals: Professional[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ professionals }) => {
  const getCompanyLogo = (companyName?: string) => {
    if (!companyName) return '';
    
    const domainMap: Record<string, string> = {
      'Google': 'google.com',
      'Goldman Sachs': 'goldmansachs.com',
      'McKinsey': 'mckinsey.com',
      'Meta': 'meta.com',
      'Facebook': 'facebook.com',
      'Amazon': 'amazon.com',
      'Microsoft': 'microsoft.com',
      'Apple': 'apple.com'
    };
    
    const domain = Object.entries(domainMap).find(([key]) => 
      companyName.toLowerCase().includes(key.toLowerCase())
    )?.[1];
    
    return domain ? `https://img.logo.dev/${domain}?token=pk_VAZ6tvAVQHCDwKeaNRVyjQ` : '';
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full border-collapse text-sm min-w-[1000px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-4 border-b-2 border-gray-200 border-r border-gray-200 text-xs uppercase tracking-wide text-black font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
                Name & Stats
              </th>
              <th className="text-left p-4 border-b-2 border-gray-200 border-r border-gray-200 text-xs uppercase tracking-wide text-black font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
                Title & Bio
              </th>
              <th className="text-left p-4 border-b-2 border-gray-200 border-r border-gray-200 text-xs uppercase tracking-wide text-black font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
                Company
              </th>
              <th className="text-left p-4 border-b-2 border-gray-200 border-r border-gray-200 text-xs uppercase tracking-wide text-black font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
                Location
              </th>
              <th className="text-left p-4 border-b-2 border-gray-200 border-r border-gray-200 text-xs uppercase tracking-wide text-black font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
                Education
              </th>
              <th className="text-left p-4 border-b-2 border-gray-200 text-xs uppercase tracking-wide text-black font-semibold cursor-pointer hover:bg-gray-100 transition-colors">
                Skills
              </th>
            </tr>
          </thead>
          <tbody>
            {professionals.map((person, index) => (
              <tr 
                key={person.person_id} 
                className={`${
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                } hover:bg-gray-100 transition-colors cursor-pointer`}
                onClick={() => person.linkedin_url && window.open(person.linkedin_url, '_blank')}
              >
                <td className="p-3 border-b border-gray-100 border-r border-gray-100 align-top">
                  <div className="flex items-center gap-3">
                    {person.avatar_url ? (
                      <img 
                        src={person.avatar_url} 
                        alt={person.full_name}
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-medium">
                        {getInitials(person.full_name)}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-black hover:text-red-700 transition-colors">
                        {person.full_name || 'Unknown'}
                      </div>
                      {(person.connections || person.followers) && (
                        <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                          {person.connections && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {person.connections.toLocaleString()}
                            </span>
                          )}
                          {person.followers && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {person.followers.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3 border-b border-gray-100 border-r border-gray-100 align-top max-w-[200px]">
                  <div className="font-normal">
                    {person.current_title || person.headline || '-'}
                  </div>
                  {person.about && (
                    <div className="text-xs text-gray-600 mt-1 truncate" title={person.about}>
                      {person.about}
                    </div>
                  )}
                </td>
                <td className="p-3 border-b border-gray-100 border-r border-gray-100 align-top">
                  {person.current_company && (
                    <div className="flex items-center gap-2">
                      {person.current_company_logo ? (
                        <img 
                          src={person.current_company_logo} 
                          alt={person.current_company}
                          className="w-4 h-4 object-contain"
                        />
                      ) : (
                        getCompanyLogo(person.current_company) && (
                          <img 
                            src={getCompanyLogo(person.current_company)} 
                            alt={person.current_company}
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )
                      )}
                      <span className="font-normal">{person.current_company}</span>
                    </div>
                  )}
                  {!person.current_company && <span className="text-gray-500">-</span>}
                </td>
                <td className="p-3 border-b border-gray-100 border-r border-gray-100 align-top font-normal">
                  {person.location_city ? 
                    `${person.location_city}${person.location_country ? `, ${person.location_country}` : ''}` : 
                    '-'
                  }
                </td>
                <td className="p-3 border-b border-gray-100 border-r border-gray-100 align-top font-normal">
                  {person.education && person.education.length > 0 ? 
                    person.education.slice(0, 2).map(edu => edu.school).filter(Boolean).join(', ') : 
                    '-'
                  }
                </td>
                <td className="p-3 border-b border-gray-100 align-top font-normal max-w-[300px]">
                  {person.skills && person.skills.length > 0 ? 
                    person.skills.slice(0, 5).join(', ') : 
                    '-'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};