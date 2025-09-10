import React from 'react';

interface Professional {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  experience: Array<{
    company: string;
    title: string;
    duration: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
  }>;
  skills: string[];
  summary: string;
}

interface ResultsCardsProps {
  professionals: Professional[];
}

export const ResultsCards: React.FC<ResultsCardsProps> = ({ professionals }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {professionals.map((professional) => (
        <div key={professional.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900">{professional.name}</h3>
            <p className="text-gray-600">{professional.title}</p>
            <p className="text-sm text-gray-500">{professional.company} • {professional.location}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-700 line-clamp-3">{professional.summary}</p>
          </div>
          
          {professional.experience.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Experience</h4>
              <div className="space-y-1">
                {professional.experience.slice(0, 2).map((exp, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    <span className="font-medium">{exp.title}</span> at {exp.company}
                    <span className="text-gray-500"> • {exp.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {professional.education.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Education</h4>
              <div className="space-y-1">
                {professional.education.slice(0, 1).map((edu, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    <span className="font-medium">{edu.degree}</span> in {edu.field}
                    <div className="text-gray-500">{edu.school}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {professional.skills.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1">
                {professional.skills.slice(0, 6).map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded">
                    {skill}
                  </span>
                ))}
                {professional.skills.length > 6 && (
                  <span className="px-2 py-1 bg-gray-100 text-xs text-gray-500 rounded">
                    +{professional.skills.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};