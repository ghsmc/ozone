import React, { useState, useEffect } from 'react';
import { Users, MapPin, TrendingUp, ExternalLink, ChevronDown, ChevronUp, Heart, Target, Trophy } from 'lucide-react';
import { yaleAlumniService, CompanyAlumniData, YaleAlumni } from '../services/yaleAlumniService';

interface YaleAlumniSectionProps {
  companyName: string;
  isDark?: boolean;
}

export function YaleAlumniSection({ companyName, isDark = false }: YaleAlumniSectionProps) {
  const [alumniData, setAlumniData] = useState<CompanyAlumniData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedAlumni, setExpandedAlumni] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [showCount, setShowCount] = useState(3);
  const [analyzingProfiles, setAnalyzingProfiles] = useState<Set<string>>(new Set());

  // ChatGPT Analysis Function
  const analyzeProfileWithChatGPT = async (alumni: YaleAlumni) => {
    setAnalyzingProfiles(prev => new Set(prev).add(alumni.person_id));
    
    try {
      const response = await fetch('http://localhost:3001/api/alumni-insights/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alumni_profile: {
            name: alumni.name,
            current_title: alumni.current_title,
            current_company: alumni.current_company,
            yale_connection: alumni.yale_connection,
            experiences: alumni.experiences,
            connections: alumni.connections,
            followers: alumni.followers,
            about: alumni.about,
            location: alumni.location
          }
        })
      });

      if (response.ok) {
        const insights = await response.json();
        
        // Show insights in a modal or expand the profile
        alert(`AI Insights for ${alumni.name}:\n\n` +
              `Networking Strategy: ${insights.networking_strategy}\n\n` +
              `Career Advice: ${insights.career_advice}\n\n` +
              `Connection Approach: ${insights.connection_approach}\n\n` +
              `Key Questions: ${insights.key_questions}\n\n` +
              `Referral Potential: ${insights.referral_potential}\n\n` +
              `Value Proposition: ${insights.value_proposition}`);
      } else {
        console.error('Failed to analyze profile');
        alert('Failed to get AI insights. Please try again.');
      }
    } catch (error) {
      console.error('Error analyzing profile:', error);
      alert('Error getting AI insights. Please try again.');
    } finally {
      setAnalyzingProfiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(alumni.person_id);
        return newSet;
      });
    }
  };

  // Helper function to get company domain for logo
  const getCompanyDomain = (companyName: string): string => {
    const companyMap: { [key: string]: string } = {
      'Google': 'google.com',
      'Microsoft': 'microsoft.com',
      'Apple': 'apple.com',
      'Amazon': 'amazon.com',
      'Meta': 'meta.com',
      'Facebook': 'facebook.com',
      'Tesla': 'tesla.com',
      'Netflix': 'netflix.com',
      'Uber': 'uber.com',
      'Airbnb': 'airbnb.com',
      'Stripe': 'stripe.com',
      'Goldman Sachs': 'goldmansachs.com',
      'McKinsey & Company': 'mckinsey.com',
      'Bain & Company': 'bain.com',
      'Boston Consulting Group (BCG)': 'bcg.com',
      'Deloitte': 'deloitte.com',
      'EY': 'ey.com',
      'PwC': 'pwc.com',
      'KPMG': 'kpmg.com',
      'Morgan Stanley': 'morganstanley.com',
      'JPMorgan Chase': 'jpmorganchase.com',
      'Bank of America': 'bankofamerica.com',
      'Citi': 'citi.com',
      'Wells Fargo': 'wellsfargo.com',
      'IBM': 'ibm.com',
      'Oracle': 'oracle.com',
      'Salesforce': 'salesforce.com',
      'Adobe': 'adobe.com',
      'Intel': 'intel.com',
      'NVIDIA': 'nvidia.com',
      'AMD': 'amd.com',
      'Cisco': 'cisco.com',
      'VMware': 'vmware.com',
      'Red Hat': 'redhat.com',
      'GitHub': 'github.com',
      'GitLab': 'gitlab.com',
      'Atlassian': 'atlassian.com',
      'Slack': 'slack.com',
      'Zoom': 'zoom.us',
      'Dropbox': 'dropbox.com',
      'Box': 'box.com',
      'Palantir': 'palantir.com',
      'Snowflake': 'snowflake.com',
      'Databricks': 'databricks.com',
      'MongoDB': 'mongodb.com',
      'Elastic': 'elastic.co',
      'Splunk': 'splunk.com',
      'ServiceNow': 'servicenow.com',
      'Workday': 'workday.com',
      'HubSpot': 'hubspot.com',
      'Zendesk': 'zendesk.com',
      'Twilio': 'twilio.com',
      'SendGrid': 'sendgrid.com',
      'Mailchimp': 'mailchimp.com',
      'Shopify': 'shopify.com',
      'Square': 'squareup.com',
      'PayPal': 'paypal.com',
      'Visa': 'visa.com',
      'Mastercard': 'mastercard.com',
      'American Express': 'americanexpress.com',
      'Discover': 'discover.com',
      'Capital One': 'capitalone.com',
      'Chase': 'chase.com',
      'US Bank': 'usbank.com',
      'PNC': 'pnc.com',
      'TD Bank': 'td.com',
      'HSBC': 'hsbc.com',
      'Barclays': 'barclays.com',
      'Deutsche Bank': 'db.com',
      'Credit Suisse': 'credit-suisse.com',
      'UBS': 'ubs.com',
      'BNP Paribas': 'bnpparibas.com',
      'Société Générale': 'societegenerale.com',
      'ING': 'ing.com',
      'Rabobank': 'rabobank.com',
      'ABN AMRO': 'abnamro.com',
      'Standard Chartered': 'sc.com',
      'DBS': 'dbs.com',
      'OCBC': 'ocbc.com',
      'UOB': 'uob.com.sg',
      'Commonwealth Bank': 'commbank.com.au',
      'ANZ': 'anz.com',
      'Westpac': 'westpac.com.au',
      'NAB': 'nab.com.au',
      'RBC': 'rbc.com',
      'TD': 'td.com',
      'BMO': 'bmo.com',
      'Scotiabank': 'scotiabank.com',
      'CIBC': 'cibc.com',
      'National Bank': 'nbc.ca',
      'Desjardins': 'desjardins.com',
      'Laurentian Bank': 'laurentianbank.ca',
      'HSBC Canada': 'hsbc.ca',
      'ING Direct': 'ingdirect.com',
      'Tangerine': 'tangerine.ca',
      'PC Financial': 'pcfinancial.ca',
      'Simplii Financial': 'simplii.com',
      'EQ Bank': 'eqbank.ca',
      'Motive Financial': 'motivefinancial.com',
      'Alterna Bank': 'alterna.ca',
      'Manulife Bank': 'manulifebank.ca',
      'ICICI Bank': 'icicibank.com',
      'HDFC Bank': 'hdfcbank.com',
      'Axis Bank': 'axisbank.com',
      'Kotak Mahindra Bank': 'kotak.com',
      'Yes Bank': 'yesbank.in',
      'IndusInd Bank': 'indusind.com',
      'Federal Bank': 'federalbank.co.in',
      'South Indian Bank': 'southindianbank.com',
      'Karnataka Bank': 'karnatakabank.com',
      'Karur Vysya Bank': 'kvb.co.in',
      'City Union Bank': 'cityunionbank.com',
      'Tamilnad Mercantile Bank': 'tmb.in',
      'Lakshmi Vilas Bank': 'lvbank.com',
      'Dhanlaxmi Bank': 'dhanbank.com',
      'Jammu & Kashmir Bank': 'jkbank.com',
      'Punjab & Sind Bank': 'psbindia.com',
      'Punjab National Bank': 'pnb.co.in',
      'Bank of Baroda': 'bankofbaroda.com',
      'Canara Bank': 'canarabank.com',
      'Union Bank of India': 'unionbankofindia.co.in',
      'Indian Bank': 'indianbank.in',
      'Bank of India': 'bankofindia.co.in',
      'Central Bank of India': 'centralbankofindia.co.in',
      'UCO Bank': 'ucobank.com',
      'Bank of Maharashtra': 'bankofmaharashtra.in',
      'Indian Overseas Bank': 'iob.in',
      'Allahabad Bank': 'allahabadbank.in',
      'Andhra Bank': 'andhrabank.in',
      'Corporation Bank': 'corporationbank.com',
      'Syndicate Bank': 'syndicatebank.in',
      'Vijaya Bank': 'vijayabank.com',
      'Oriental Bank of Commerce': 'obcindia.co.in',
      'United Bank of India': 'unitedbankofindia.com',
      'IDBI Bank': 'idbi.com',
      'State Bank of India': 'sbi.co.in',
      'State Bank of Bikaner & Jaipur': 'sbbjbank.com',
      'State Bank of Hyderabad': 'sbhyd.com',
      'State Bank of Mysore': 'sbm.co.in',
      'State Bank of Patiala': 'sbp.co.in',
      'State Bank of Travancore': 'sbt.co.in',
      'Bharatiya Mahila Bank': 'bmbl.co.in',
      'Bandhan Bank': 'bandhanbank.com',
      'IDFC First Bank': 'idfcfirstbank.com',
      'RBL Bank': 'rblbank.com',
      'DCB Bank': 'dcbbank.com',
      // Additional companies from Yale alumni data
      'Jane Street': 'janestreet.com',
      'GSR': 'gsr.io',
      'GlossGenius': 'glossgenius.com',
      'Federal Public Defender': 'fd.org',
      'Yale University': 'yale.edu',
      'Yale School of Medicine': 'medicine.yale.edu',
      'Yale Center for Research Computing': 'research.computing.yale.edu',
      'Yale Institute for Network Science': 'yins.yale.edu',
      'Yale Center for Engineering Innovation & Design': 'ceid.yale.edu',
      'Yale School of Public Health': 'publichealth.yale.edu',
      'Yale Center for Business and the Environment': 'cbey.yale.edu',
      'Yale Center for Emotional Intelligence': 'ei.yale.edu',
      'Yale Center for Molecular Discovery': 'ycmd.yale.edu',
      'Yale Center for Green Chemistry and Green Engineering': 'greenchemistry.yale.edu',
      'Yale Center for the Study of Representative Institutions': 'csri.yale.edu',
      'Yale Center for the Study of Globalization': 'globalization.yale.edu',
      'Yale Center for the Study of Race, Indigeneity, and Transnational Migration': 'ritm.yale.edu',
      'Yale Center for Collaborative Arts and Media': 'ccam.yale.edu',
      'Yale Center for Research on Aging': 'aging.yale.edu',
      'Yale Law School Center for the Study of Corporate Law': 'law.yale.edu',
      'MIT CSAIL': 'csail.mit.edu',
      'Stanford AI Lab': 'ai.stanford.edu',
      'Harvard Medical School': 'hms.harvard.edu',
      'MIT': 'mit.edu',
      'Stanford University': 'stanford.edu',
      'Harvard University': 'harvard.edu',
      'Princeton University': 'princeton.edu',
      'Columbia University': 'columbia.edu',
      'University of Pennsylvania': 'upenn.edu',
      'Dartmouth College': 'dartmouth.edu',
      'Brown University': 'brown.edu',
      'Cornell University': 'cornell.edu'
    };

    // Return mapped domain or generate from company name
    if (companyMap[companyName]) {
      return companyMap[companyName];
    }

    // Fallback: generate domain from company name
    return companyName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .replace(/&/g, 'and')
      .replace(/inc|llc|corp|corporation|ltd|limited/g, '') + '.com';
  };

  useEffect(() => {
    const fetchAlumniData = async () => {
      setLoading(true);
      try {
        const data = await yaleAlumniService.getCompanyAlumni(companyName);
        setAlumniData(data);
      } catch (error) {
        console.error('Error fetching alumni data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlumniData();
  }, [companyName]);

  const toggleAlumniExpansion = (personId: string) => {
    const newExpanded = new Set(expandedAlumni);
    if (newExpanded.has(personId)) {
      newExpanded.delete(personId);
    } else {
      newExpanded.add(personId);
    }
    setExpandedAlumni(newExpanded);
  };

  const getSeniorityColor = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('senior') || lowerTitle.includes('lead') || lowerTitle.includes('principal')) {
      return 'bg-purple-100 text-purple-800';
    } else if (lowerTitle.includes('director') || lowerTitle.includes('vp') || lowerTitle.includes('head') || lowerTitle.includes('chief')) {
      return 'bg-red-100 text-red-800';
    } else if (lowerTitle.includes('manager') || lowerTitle.includes('analyst')) {
      return 'bg-blue-100 text-blue-800';
    } else {
      return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-black border border-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!alumniData || alumniData.alumni_count === 0) {
    return (
      <div className="bg-black border border-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <img src="/Yale_University_Shield_1.svg.png" alt="Yale" className="w-8 h-8" />
          <div>
            <h3 className="text-white font-semibold">Yale Alumni</h3>
            <p className="text-gray-400 text-sm">No alumni found at {companyName}</p>
          </div>
        </div>
      </div>
    );
  }

  const displayedAlumni = showAll ? alumniData.alumni : alumniData.alumni.slice(0, showCount);
  const totalAlumni = alumniData.alumni_count;
  const avgConnections = Math.round(alumniData.alumni.reduce((sum, a) => sum + a.connections, 0) / alumniData.alumni.length);

  return (
    <div className="p-4 border border-gray-800 rounded-lg transition-colors duration-200 w-full bg-black text-white">
      {/* Header with Yale Logo and Count */}
      <div className="flex items-start gap-3 min-w-0 mb-4">
        <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0">
          <img src="/Yale_University_Shield_1.svg.png" alt="Yale" className="w-8 h-8 rounded object-contain" />
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-semibold flex items-center gap-2 truncate text-white">
                Yale Alumni
                <ExternalLink size={14} className="flex-shrink-0 text-gray-400" />
              </h3>
              
              <div className="mt-0.5 flex items-center gap-2 min-w-0">
                <span className="text-[13px] font-medium whitespace-nowrap text-white">
                  {totalAlumni} working at {companyName}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end flex-shrink-0">
              <div className="text-[11px] uppercase tracking-wide font-medium text-right whitespace-nowrap text-gray-400">
                NETWORK
              </div>
              <div className="text-[11px] mt-0.5 text-gray-400">
                {avgConnections} avg
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row - SCORE/STREAK/LIKES style */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap text-[12px]">
          <div className="flex items-center gap-1.5">
            <div className={`px-1.5 py-0.5 rounded font-mono text-white text-xs ${
              totalAlumni >= 10 ? 'bg-emerald-500' : totalAlumni >= 5 ? 'bg-yellow-500' : 'bg-gray-500'
            }`}>
              {totalAlumni}
            </div>
            <span className="text-gray-400">SCORE</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div className={`px-1.5 py-0.5 rounded font-mono text-white text-xs ${
              avgConnections >= 500 ? 'bg-emerald-500' : avgConnections >= 300 ? 'bg-yellow-500' : 'bg-gray-500'
            }`}>
              {avgConnections}
            </div>
            <span className="text-gray-400">STREAK</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className={`px-1.5 py-0.5 rounded font-mono text-white text-xs ${
              (alumniData.career_trajectories.senior_level + alumniData.career_trajectories.executive_level) >= 3 ? 'bg-emerald-500' : 
              (alumniData.career_trajectories.senior_level + alumniData.career_trajectories.executive_level) >= 1 ? 'bg-yellow-500' : 'bg-gray-500'
            }`}>
              {alumniData.career_trajectories.senior_level + alumniData.career_trajectories.executive_level}
            </div>
            <span className="text-gray-400">LIKES</span>
          </div>

          {/* Additional rich data */}
          <div className="flex items-center gap-1">
            <span role="img" aria-label="location">📍</span>
            <span className="text-gray-400">
              {alumniData.top_locations.length > 0 ? alumniData.top_locations[0] : 'Global'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span role="img" aria-label="experience">💼</span>
            <span className="text-gray-400">
              {alumniData.common_paths.length > 0 ? 'Career Paths' : 'Direct Hires'}
            </span>
          </div>

          {/* Top company logos */}
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-[10px]">Top:</span>
            <div className="flex items-center gap-1">
              {alumniData.alumni.slice(0, 3).map((alumni, idx) => (
                <div key={idx} className="w-3 h-3 rounded flex items-center justify-center bg-gray-700">
                  <img 
                    src={`https://logo.clearbit.com/${getCompanyDomain(alumni.current_company)}`}
                    alt={alumni.current_company}
                    className="w-3 h-3 rounded object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div 
                    className="w-3 h-3 rounded bg-gray-600 text-white text-[6px] font-bold flex items-center justify-center hidden"
                    style={{ display: 'none' }}
                  >
                    {alumni.current_company.charAt(0).toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Alumni - Match JobCard individual card style */}
      <div className="mt-4 space-y-3">
        {displayedAlumni.slice(0, 3).map((alumni, index) => (
          <div key={alumni.person_id} className="p-3 border border-gray-700 rounded-lg transition-colors duration-200 bg-gray-900 text-white">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0">
                {alumni.avatar ? (
                  <img 
                    src={alumni.avatar} 
                    alt={alumni.name}
                    className="w-8 h-8 rounded object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-8 h-8 rounded bg-gray-600 text-white text-xs font-bold flex items-center justify-center hidden"
                  style={{ display: alumni.avatar ? 'none' : 'flex' }}
                >
                  {alumni.name.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[14px] font-semibold flex items-center gap-2 truncate text-white">
                      {alumni.name}
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-700 text-gray-200">
                        #{index + 1}
                      </span>
                    </h4>
                    
                    <div className="mt-0.5 flex items-center gap-2 min-w-0">
                      <span className="text-[13px] font-medium whitespace-nowrap text-white">
                        {alumni.current_title}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm truncate text-gray-400">
                        {alumni.yale_connection}
                      </span>
                    </div>

                    {/* Rich profile data with actionable insights */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {alumni.experiences.length > 0 && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-800 text-gray-200">
                          {alumni.experiences.length} roles
                        </span>
                      )}
                      {alumni.followers > 0 && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-800 text-gray-200">
                          {alumni.followers} followers
                        </span>
                      )}
                      {alumni.recommendations_count > 0 && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-800 text-gray-200">
                          {alumni.recommendations_count} recs
                        </span>
                      )}
                      {alumni.about && alumni.about.length > 50 && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-800 text-gray-200">
                          Bio available
                        </span>
                      )}
                      {alumni.connections >= 500 && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-200">
                          High Network
                        </span>
                      )}
                      {alumni.experiences.some(exp => exp.is_current) && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-blue-800 text-blue-200">
                          Current Employee
                        </span>
                      )}
                    </div>

                    {/* Career trajectory with company logos */}
                    {alumni.experiences.length > 1 && (
                      <div className="mt-2">
                        <div className="text-[11px] text-gray-400 font-medium mb-1">Career Path:</div>
                        <div className="flex flex-wrap gap-2">
                          {alumni.experiences.slice(0, 3).map((exp, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-gray-800 px-2 py-1 rounded">
                              <div className="w-4 h-4 rounded flex items-center justify-center bg-gray-700 flex-shrink-0">
                                <img 
                                  src={`https://logo.clearbit.com/${getCompanyDomain(exp.company)}`}
                                  alt={exp.company}
                                  className="w-4 h-4 rounded object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                                <div 
                                  className="w-4 h-4 rounded bg-gray-600 text-white text-[8px] font-bold flex items-center justify-center hidden"
                                  style={{ display: 'none' }}
                                >
                                  {exp.company.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <span className="text-[10px] text-gray-300 font-medium whitespace-nowrap">
                                {exp.company}
                              </span>
                              {idx < Math.min(2, alumni.experiences.length - 1) && (
                                <span className="text-gray-500 text-[10px] ml-1">→</span>
                              )}
                            </div>
                          ))}
                          {alumni.experiences.length > 3 && (
                            <div className="flex items-center bg-gray-800 px-2 py-1 rounded">
                              <span className="text-[10px] text-gray-400">+{alumni.experiences.length - 3} more</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Key bullet points for Yale students */}
                    <div className="mt-2 p-2 bg-gray-800 rounded text-[11px] text-gray-300">
                      <div className="font-medium text-gray-200 mb-1">🎯 Key Insights:</div>
                      <ul className="space-y-1">
                        {alumni.connections >= 500 && (
                          <li className="flex items-start gap-1">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span>High-influence networker - can connect you to other Yale grads</span>
                          </li>
                        )}
                        {alumni.experiences.some(exp => exp.is_current) && (
                          <li className="flex items-start gap-1">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>Currently at {alumni.current_company} - perfect for company insights</span>
                          </li>
                        )}
                        {alumni.experiences.length > 3 && (
                          <li className="flex items-start gap-1">
                            <span className="text-purple-400 mt-0.5">•</span>
                            <span>Career progression expert - ask about industry trends</span>
                          </li>
                        )}
                        {alumni.yale_connection && alumni.yale_connection.includes('Bachelor') && (
                          <li className="flex items-start gap-1">
                            <span className="text-yellow-400 mt-0.5">•</span>
                            <span>Yale undergrad - relatable career journey</span>
                          </li>
                        )}
                        {alumni.yale_connection && alumni.yale_connection.includes('Master') && (
                          <li className="flex items-start gap-1">
                            <span className="text-orange-400 mt-0.5">•</span>
                            <span>Yale graduate degree - advanced career insights</span>
                          </li>
                        )}
                        {alumni.followers > 100 && (
                          <li className="flex items-start gap-1">
                            <span className="text-pink-400 mt-0.5">•</span>
                            <span>Thought leader with {alumni.followers} followers</span>
                          </li>
                        )}
                        {alumni.recommendations_count > 5 && (
                          <li className="flex items-start gap-1">
                            <span className="text-cyan-400 mt-0.5">•</span>
                            <span>Highly recommended ({alumni.recommendations_count} recs)</span>
                          </li>
                        )}
                        {alumni.about && alumni.about.length > 100 && (
                          <li className="flex items-start gap-1">
                            <span className="text-indigo-400 mt-0.5">•</span>
                            <span>Detailed profile - rich background info available</span>
                          </li>
                        )}
                        {alumni.experiences.length > 0 && alumni.experiences.some(exp => exp.company.includes('Yale')) && (
                          <li className="flex items-start gap-1">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>Yale experience - understands campus culture</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* ChatGPT Analysis Button */}
                    <div className="mt-2 flex justify-center">
                      <button
                        onClick={() => analyzeProfileWithChatGPT(alumni)}
                        disabled={analyzingProfiles.has(alumni.person_id)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-all duration-200 flex items-center gap-1 ${
                          analyzingProfiles.has(alumni.person_id)
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {analyzingProfiles.has(alumni.person_id) ? (
                          <>
                            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <span>🤖</span>
                            Get AI Insights
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0">
                    <div className={`text-[11px] uppercase tracking-wide font-medium text-right whitespace-nowrap ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {alumni.location || 'Remote'}
                    </div>
                    <div className={`text-[11px] mt-0.5 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {alumni.connections} connections
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less Button - Match JobCard button style */}
      {alumniData.alumni.length > showCount && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              if (showAll) {
                setShowAll(false);
                setShowCount(3);
              } else {
                const newCount = Math.min(showCount + 7, alumniData.alumni.length);
                setShowCount(newCount);
                if (newCount >= alumniData.alumni.length) {
                  setShowAll(true);
                }
              }
            }}
            className={`relative px-3 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showAll ? 'Show Less' : `Show 7 More`}
          </button>
          
          {showAll && (
            <button
              onClick={() => {
                setShowAll(false);
                setShowCount(3);
              }}
              className={`relative px-3 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                isDark 
                  ? 'bg-red-800 text-red-200 hover:bg-red-700' 
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              Reset to Top 3
            </button>
          )}
        </div>
      )}
    </div>
  );
}
