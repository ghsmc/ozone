export interface MockJobCard {
  companyLogo: string;
  companyName: string;
  jobTitle: string;
  description: string;
  location: string;
  salary?: string;
  postedDate: string;
  skills: string[];
  metrics: {
    trajectory: number;
    valuation?: string;
    funding?: string;
    lastRaised?: string;
    age?: string;
    employees: string;
    openJobs: number;
  };
  badges: {
    unicorn?: boolean;
    trueUpRemote200?: boolean;
  };
  type?: 'job' | 'club' | 'lab' | 'course';
}

export const mockJobCards: MockJobCard[] = [
  {
    companyLogo: 'https://img.logo.dev/google.com?token=pk_VAZ6tvAVQHCDwKeaNRVyjQ',
    companyName: 'Google',
    jobTitle: 'Software Engineering Intern',
    description: 'Build scalable systems and work on cutting-edge AI projects',
    location: 'Mountain View, CA',
    salary: '$8,000-12,000/month',
    postedDate: '2 days ago',
    skills: ['Python', 'Machine Learning', 'Cloud Computing', 'React'],
    metrics: {
      trajectory: 92,
      valuation: '$1.8T',
      employees: '190,000+',
      openJobs: 12
    },
    badges: {
      unicorn: true
    },
    type: 'job'
  },
  {
    companyLogo: 'https://img.logo.dev/yale.edu?token=pk_VAZ6tvAVQHCDwKeaNRVyjQ',
    companyName: 'Yale School of Medicine',
    jobTitle: 'Research Assistant - AI in Healthcare',
    description: 'Work on machine learning models for medical diagnosis',
    location: 'New Haven, CT',
    salary: '$3,500-4,500/month',
    postedDate: '1 day ago',
    skills: ['Python', 'TensorFlow', 'Medical Data', 'Research'],
    metrics: {
      trajectory: 88,
      employees: '15,000+',
      openJobs: 8
    },
    badges: {},
    type: 'lab'
  },
  {
    companyLogo: 'https://img.logo.dev/stripe.com?token=pk_VAZ6tvAVQHCDwKeaNRVyjQ',
    companyName: 'Stripe',
    jobTitle: 'Product Management Intern',
    description: 'Shape the future of online payments and financial infrastructure',
    location: 'San Francisco, CA',
    salary: '$7,500-10,000/month',
    postedDate: '3 days ago',
    skills: ['Product Strategy', 'Data Analysis', 'User Research', 'SQL'],
    metrics: {
      trajectory: 85,
      valuation: '$95B',
      employees: '8,000+',
      openJobs: 5
    },
    badges: {
      unicorn: true
    },
    type: 'job'
  },
  {
    companyLogo: 'https://img.logo.dev/mit.edu?token=pk_VAZ6tvAVQHCDwKeaNRVyjQ',
    companyName: 'MIT CSAIL',
    jobTitle: 'Undergraduate Research Fellow',
    description: 'Contribute to breakthrough research in computer science and AI',
    location: 'Cambridge, MA',
    salary: '$4,000-5,500/month',
    postedDate: '4 days ago',
    skills: ['Research', 'Algorithms', 'Machine Learning', 'Python'],
    metrics: {
      trajectory: 90,
      employees: '1,200+',
      openJobs: 15
    },
    badges: {},
    type: 'lab'
  },
  {
    companyLogo: 'https://img.logo.dev/tesla.com?token=pk_VAZ6tvAVQHCDwKeaNRVyjQ',
    companyName: 'Tesla',
    jobTitle: 'Autopilot Engineering Intern',
    description: 'Develop next-generation autonomous driving technology',
    location: 'Palo Alto, CA',
    salary: '$9,000-13,000/month',
    postedDate: '1 day ago',
    skills: ['C++', 'Computer Vision', 'Robotics', 'Neural Networks'],
    metrics: {
      trajectory: 87,
      valuation: '$800B',
      employees: '140,000+',
      openJobs: 7
    },
    badges: {
      unicorn: true
    },
    type: 'job'
  },
  {
    companyLogo: 'https://img.logo.dev/yale.edu?token=pk_VAZ6tvAVQHCDwKeaNRVyjQ',
    companyName: 'Yale Center for Research Computing',
    jobTitle: 'Data Science Research Intern',
    description: 'Work on high-performance computing and big data analytics',
    location: 'New Haven, CT',
    salary: '$3,200-4,200/month',
    postedDate: '2 days ago',
    skills: ['Python', 'R', 'HPC', 'Statistics', 'Data Visualization'],
    metrics: {
      trajectory: 82,
      employees: '50+',
      openJobs: 3
    },
    badges: {},
    type: 'lab'
  },
  {
    companyLogo: 'https://img.logo.dev/openai.com?token=pk_VAZ6tvAVQHCDwKeaNRVyjQ',
    companyName: 'OpenAI',
    jobTitle: 'AI Research Intern',
    description: 'Contribute to the development of artificial general intelligence',
    location: 'San Francisco, CA',
    salary: '$10,000-15,000/month',
    postedDate: '5 days ago',
    skills: ['Deep Learning', 'NLP', 'PyTorch', 'Research'],
    metrics: {
      trajectory: 95,
      valuation: '$80B',
      employees: '1,500+',
      openJobs: 4
    },
    badges: {
      unicorn: true
    },
    type: 'job'
  },
  {
    companyLogo: 'https://img.logo.dev/yale.edu?token=pk_VAZ6tvAVQHCDwKeaNRVyjQ',
    companyName: 'Yale Institute for Network Science',
    jobTitle: 'Network Analysis Research Assistant',
    description: 'Study complex networks and their applications in social systems',
    location: 'New Haven, CT',
    salary: '$3,000-4,000/month',
    postedDate: '3 days ago',
    skills: ['Network Analysis', 'Graph Theory', 'Python', 'Statistics'],
    metrics: {
      trajectory: 79,
      employees: '25+',
      openJobs: 2
    },
    badges: {},
    type: 'lab'
  },
  {
    companyLogo: 'https://img.logo.dev/anthropic.com?token=pk_VAZ6tvAVQHCDwKeaNRVyjQ',
    companyName: 'Anthropic',
    jobTitle: 'AI Safety Research Intern',
    description: 'Work on AI alignment and safety research',
    location: 'San Francisco, CA',
    salary: '$8,500-12,000/month',
    postedDate: '6 days ago',
    skills: ['AI Safety', 'Machine Learning', 'Research', 'Python'],
    metrics: {
      trajectory: 89,
      valuation: '$18B',
      employees: '500+',
      openJobs: 3
    },
    badges: {
      unicorn: true
    },
    type: 'job'
  },
  {
    companyLogo: 'https://img.logo.dev/yale.edu?token=pk_VAZ6tvAVQHCDwKeaNRVyjQ',
    companyName: 'Yale Center for Engineering Innovation & Design',
    jobTitle: 'Engineering Design Fellow',
    description: 'Work on innovative engineering projects and design challenges',
    location: 'New Haven, CT',
    salary: '$3,500-4,800/month',
    postedDate: '1 day ago',
    skills: ['Engineering Design', 'Prototyping', 'CAD', 'Innovation'],
    metrics: {
      trajectory: 84,
      employees: '30+',
      openJobs: 4
    },
    badges: {},
    type: 'lab'
  }
];
