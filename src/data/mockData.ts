import { Professional, Stats } from '../types';

export const mockProfessionals = (): Professional[] => [
  {
    person_id: '1',
    full_name: 'Sarah Chen',
    headline: 'Product Manager at Google',
    about: 'Experienced product manager with a passion for building user-centric products that scale. Previously led product initiatives at early-stage startups before joining Google.',
    current_title: 'Senior Product Manager',
    current_company: 'Google',
    location_city: 'San Francisco',
    location_country: 'USA',
    avatar_url: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    linkedin_url: 'https://linkedin.com/in/sarah-chen',
    connections: 500,
    followers: 1200,
    recommendations_count: 8,
    match_score: 95,
    education: [
      { school: 'Yale University', degree: 'Bachelor of Science', field: 'Computer Science' },
      { school: 'Stanford University', degree: 'MBA', field: 'Business Administration' }
    ],
    experience: [
      { company: 'Google', title: 'Senior Product Manager', start_date: '2021', end_date: null },
      { company: 'Stripe', title: 'Product Manager', start_date: '2019', end_date: '2021' },
      { company: 'Airbnb', title: 'Associate Product Manager', start_date: '2017', end_date: '2019' }
    ],
    skills: ['Product Management', 'Data Analysis', 'User Research', 'A/B Testing', 'SQL', 'Python']
  },
  {
    person_id: '2',
    full_name: 'Michael Rodriguez',
    headline: 'Investment Banking Associate at Goldman Sachs',
    about: 'Investment banking professional with expertise in M&A transactions and capital markets. Strong background in financial modeling and valuation.',
    current_title: 'Associate',
    current_company: 'Goldman Sachs',
    location_city: 'New York',
    location_country: 'USA',
    avatar_url: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    linkedin_url: 'https://linkedin.com/in/michael-rodriguez',
    connections: 850,
    followers: 2100,
    recommendations_count: 12,
    match_score: 88,
    education: [
      { school: 'Yale University', degree: 'Bachelor of Arts', field: 'Economics' }
    ],
    experience: [
      { company: 'Goldman Sachs', title: 'Associate', start_date: '2022', end_date: null },
      { company: 'Goldman Sachs', title: 'Analyst', start_date: '2020', end_date: '2022' }
    ],
    skills: ['Financial Modeling', 'Valuation', 'M&A', 'Excel', 'PowerPoint', 'Capital Markets']
  },
  {
    person_id: '3',
    full_name: 'Emily Johnson',
    headline: 'Management Consultant at McKinsey & Company',
    about: 'Strategy consultant helping Fortune 500 companies transform their operations and drive growth. Specialized in digital transformation and operational excellence.',
    current_title: 'Senior Associate',
    current_company: 'McKinsey & Company',
    location_city: 'Boston',
    location_country: 'USA',
    avatar_url: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    linkedin_url: 'https://linkedin.com/in/emily-johnson',
    connections: 650,
    followers: 980,
    recommendations_count: 15,
    match_score: 92,
    education: [
      { school: 'Harvard University', degree: 'Bachelor of Arts', field: 'Government' },
      { school: 'MIT Sloan', degree: 'MBA', field: 'Strategy' }
    ],
    experience: [
      { company: 'McKinsey & Company', title: 'Senior Associate', start_date: '2023', end_date: null },
      { company: 'McKinsey & Company', title: 'Associate', start_date: '2021', end_date: '2023' },
      { company: 'Bain & Company', title: 'Consultant', start_date: '2019', end_date: '2021' }
    ],
    skills: ['Strategy', 'Digital Transformation', 'Operations', 'Problem Solving', 'Leadership', 'Analytics']
  },
  {
    person_id: '4',
    full_name: 'David Kim',
    headline: 'Software Engineer at Meta',
    about: 'Full-stack software engineer passionate about building scalable systems. Currently working on machine learning infrastructure at Meta.',
    current_title: 'Senior Software Engineer',
    current_company: 'Meta',
    location_city: 'Menlo Park',
    location_country: 'USA',
    avatar_url: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    linkedin_url: 'https://linkedin.com/in/david-kim',
    connections: 420,
    followers: 750,
    recommendations_count: 6,
    match_score: 85,
    education: [
      { school: 'Stanford University', degree: 'Bachelor of Science', field: 'Computer Science' }
    ],
    experience: [
      { company: 'Meta', title: 'Senior Software Engineer', start_date: '2022', end_date: null },
      { company: 'Meta', title: 'Software Engineer', start_date: '2020', end_date: '2022' },
      { company: 'Spotify', title: 'Software Engineer', start_date: '2018', end_date: '2020' }
    ],
    skills: ['Python', 'Java', 'React', 'Machine Learning', 'System Design', 'AWS']
  },
  {
    person_id: '5',
    full_name: 'Jessica Liu',
    headline: 'Principal at Microsoft Ventures',
    about: 'Venture capital investor focused on early-stage enterprise software and AI startups. Former entrepreneur with successful exit experience.',
    current_title: 'Principal',
    current_company: 'Microsoft Ventures',
    location_city: 'Seattle',
    location_country: 'USA',
    avatar_url: 'https://images.pexels.com/photos/3586966/pexels-photo-3586966.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    linkedin_url: 'https://linkedin.com/in/jessica-liu',
    connections: 1200,
    followers: 3500,
    recommendations_count: 20,
    match_score: 90,
    education: [
      { school: 'MIT', degree: 'Bachelor of Science', field: 'Electrical Engineering' },
      { school: 'Wharton School', degree: 'MBA', field: 'Finance' }
    ],
    experience: [
      { company: 'Microsoft Ventures', title: 'Principal', start_date: '2023', end_date: null },
      { company: 'Andreessen Horowitz', title: 'Principal', start_date: '2021', end_date: '2023' },
      { company: 'DataSense AI', title: 'Co-Founder & CEO', start_date: '2018', end_date: '2021' }
    ],
    skills: ['Venture Capital', 'AI/ML', 'Enterprise Software', 'Entrepreneurship', 'Strategic Planning']
  },
  {
    person_id: '6',
    full_name: 'Alexander Thompson',
    headline: 'Managing Director at Morgan Stanley',
    about: 'Senior investment banker with 15+ years of experience in healthcare and technology M&A. Led over $50B in transaction value.',
    current_title: 'Managing Director',
    current_company: 'Morgan Stanley',
    location_city: 'New York',
    location_country: 'USA',
    avatar_url: 'https://images.pexels.com/photos/2182863/pexels-photo-2182863.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    linkedin_url: 'https://linkedin.com/in/alexander-thompson',
    connections: 2500,
    followers: 5200,
    recommendations_count: 35,
    match_score: 94,
    education: [
      { school: 'Princeton University', degree: 'Bachelor of Arts', field: 'Economics' },
      { school: 'Columbia Business School', degree: 'MBA', field: 'Finance' }
    ],
    experience: [
      { company: 'Morgan Stanley', title: 'Managing Director', start_date: '2020', end_date: null },
      { company: 'Morgan Stanley', title: 'Director', start_date: '2017', end_date: '2020' },
      { company: 'Credit Suisse', title: 'Vice President', start_date: '2012', end_date: '2017' }
    ],
    skills: ['Investment Banking', 'M&A', 'Healthcare', 'Technology', 'Financial Analysis', 'Client Relations']
  },
  {
    person_id: '7',
    full_name: 'Rachel Martinez',
    headline: 'Director of Operations at Amazon',
    about: 'Operations leader driving efficiency and innovation in supply chain and logistics. Expert in process optimization and team leadership.',
    current_title: 'Director of Operations',
    current_company: 'Amazon',
    location_city: 'Seattle',
    location_country: 'USA',
    avatar_url: 'https://images.pexels.com/photos/3785106/pexels-photo-3785106.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    linkedin_url: 'https://linkedin.com/in/rachel-martinez',
    connections: 890,
    followers: 1500,
    recommendations_count: 18,
    match_score: 87,
    education: [
      { school: 'Yale University', degree: 'Bachelor of Science', field: 'Industrial Engineering' }
    ],
    experience: [
      { company: 'Amazon', title: 'Director of Operations', start_date: '2022', end_date: null },
      { company: 'Amazon', title: 'Senior Manager', start_date: '2019', end_date: '2022' },
      { company: 'FedEx', title: 'Operations Manager', start_date: '2016', end_date: '2019' }
    ],
    skills: ['Operations Management', 'Supply Chain', 'Process Improvement', 'Leadership', 'Data Analysis', 'Lean Six Sigma']
  },
  {
    person_id: '8',
    full_name: 'James Wilson',
    headline: 'Partner at BCG',
    about: 'Strategy consulting partner specializing in private equity and corporate development. Passionate about helping organizations unlock growth potential.',
    current_title: 'Partner',
    current_company: 'Boston Consulting Group',
    location_city: 'Chicago',
    location_country: 'USA',
    avatar_url: 'https://images.pexels.com/photos/2182968/pexels-photo-2182968.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    linkedin_url: 'https://linkedin.com/in/james-wilson',
    connections: 1800,
    followers: 4200,
    recommendations_count: 28,
    match_score: 93,
    education: [
      { school: 'Harvard University', degree: 'Bachelor of Arts', field: 'Economics' },
      { school: 'Harvard Business School', degree: 'MBA', field: 'Strategy' }
    ],
    experience: [
      { company: 'Boston Consulting Group', title: 'Partner', start_date: '2021', end_date: null },
      { company: 'Boston Consulting Group', title: 'Principal', start_date: '2018', end_date: '2021' },
      { company: 'Deloitte Consulting', title: 'Senior Manager', start_date: '2014', end_date: '2018' }
    ],
    skills: ['Strategy Consulting', 'Private Equity', 'Corporate Development', 'Due Diligence', 'Growth Strategy']
  }
];

export const generateMockStats = (professionals: Professional[]): Stats => {
  const companies = new Set(professionals.map(p => p.current_company).filter(Boolean));
  const cities = new Set(professionals.map(p => p.location_city).filter(Boolean));
  const industries = new Set(['Technology', 'Finance', 'Consulting', 'Healthcare', 'Retail']);
  
  return {
    total_people: professionals.length * 125, // Scale up for demo
    total_companies: companies.size * 15,
    total_cities: cities.size * 25,
    total_industries: industries.size * 3
  };
};