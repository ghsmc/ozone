const fs = require('fs');
const path = require('path');

// Function to clean text and extract URLs
function cleanText(text) {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .trim();
}

// Function to extract URL from markdown link
function extractUrl(text) {
  const match = text.match(/\[([^\]]+)\]\(([^)]+)\)/);
  return match ? match[2] : null;
}

// Function to extract company name from markdown link
function extractCompanyName(text) {
  const match = text.match(/\[([^\]]+)\]\([^)]+\)/);
  return match ? match[1] : cleanText(text);
}

// Function to extract job URL from checkmark links
function extractJobUrl(text) {
  const match = text.match(/\[✅[^\]]*\]\(([^)]+)\)/);
  return match ? match[1] : null;
}

// Function to determine role type and title
function getRoleInfo(roleType, company) {
  const roleMap = {
    'SWE': {
      title: 'Software Engineering Intern',
      industry: 'Quantitative Finance',
      description: `Join ${company}'s quantitative development team to build high-performance trading systems and infrastructure. Work on cutting-edge technology in a fast-paced environment.`
    },
    'QR': {
      title: 'Quantitative Research Intern',
      industry: 'Quantitative Finance',
      description: `Work with ${company}'s research team to develop quantitative models and trading strategies. Analyze market data and contribute to systematic trading approaches.`
    },
    'QT': {
      title: 'Quantitative Trading Intern',
      industry: 'Quantitative Finance',
      description: `Join ${company}'s trading desk to execute quantitative strategies and manage risk. Gain hands-on experience in algorithmic trading and market making.`
    },
    'HW': {
      title: 'Hardware Engineering Intern',
      industry: 'Quantitative Finance',
      description: `Work on FPGA and hardware acceleration projects at ${company}. Develop low-latency systems for high-frequency trading applications.`
    }
  };
  
  return roleMap[roleType] || {
    title: 'Quantitative Intern',
    industry: 'Quantitative Finance',
    description: `Gain valuable experience in quantitative finance at ${company}. Work on challenging projects in a competitive environment.`
  };
}

// Function to generate salary for quant roles
function generateQuantSalary(roleType, company) {
  const companyLower = company.toLowerCase();
  
  // Top-tier quant firms pay more
  const isTopTier = ['citadel', 'jane street', 'two sigma', 'de shaw', 'jump', 'hrt', 'imc', 'optiver', 'sig'].some(firm => 
    companyLower.includes(firm)
  );
  
  const baseSalary = isTopTier ? 10000 : 8000;
  const maxSalary = isTopTier ? 15000 : 12000;
  
  return `$${baseSalary}-${maxSalary}/month`;
}

// Function to generate match score for quant roles
function generateQuantMatchScore(roleType, company) {
  const companyLower = company.toLowerCase();
  
  let score = 85; // Base score for quant roles (higher than general tech)
  
  // Top-tier firms get higher scores
  if (['citadel', 'jane street', 'two sigma', 'de shaw', 'jump', 'hrt', 'imc', 'optiver', 'sig'].some(firm => 
    companyLower.includes(firm)
  )) {
    score += 10;
  }
  
  // Add some randomness
  score += Math.floor(Math.random() * 8);
  
  return Math.min(score, 98);
}

// Function to generate Yale count for quant firms
function generateQuantYaleCount(company) {
  const companyLower = company.toLowerCase();
  
  // Top-tier quant firms likely have more Yalies
  if (['citadel', 'jane street', 'two sigma', 'de shaw', 'jump', 'hrt', 'imc', 'optiver', 'sig'].some(firm => 
    companyLower.includes(firm)
  )) {
    return Math.floor(Math.random() * 20) + 10; // 10-29 Yalies
  } else {
    return Math.floor(Math.random() * 10) + 2; // 2-11 Yalies
  }
}

// Main parsing function
function parseQuantJobs() {
  try {
    const readmePath = path.join(__dirname, '../quant-internships-data/README.md');
    const content = fs.readFileSync(readmePath, 'utf8');
    
    // Find the table section - look for the table after the header
    const lines = content.split('\n');
    let tableStartIndex = -1;
    
    // Find the start of the table (after the header row)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('| Company| Location|SWE|QR|QT|HW|Status| Notes|')) {
        tableStartIndex = i + 2; // Skip header and separator row
        break;
      }
    }
    
    if (tableStartIndex === -1) {
      console.log('Quant internships table not found');
      return [];
    }
    
    // Extract table rows
    const rows = [];
    for (let i = tableStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.includes('|') && !line.includes('---')) {
        rows.push(line);
      } else if (line === '' || line.startsWith('##')) {
        break; // End of table
      }
    }
    
    const jobs = [];
    let jobId = 1000; // Start from 1000 to avoid conflicts with regular jobs
    
    rows.forEach((row, index) => {
      // Skip header row
      if (row.includes('Company') || row.includes('---')) return;
      
      const cells = row.split('|').map(cell => cell.trim());
      
      if (cells.length < 8) {
        return; // Skip incomplete rows
      }
      
      const companyCell = cells[1];
      const locationCell = cells[2];
      const sweCell = cells[3];
      const qrCell = cells[4];
      const qtCell = cells[5];
      const hwCell = cells[6];
      const notesCell = cells[7];
      
      const company = extractCompanyName(companyCell);
      const location = cleanText(locationCell);
      
      // Process each role type that has a checkmark
      const roleTypes = [
        { type: 'SWE', cell: sweCell },
        { type: 'QR', cell: qrCell },
        { type: 'QT', cell: qtCell },
        { type: 'HW', cell: hwCell }
      ];
      
      roleTypes.forEach(({ type, cell }) => {
        if (cell.includes('✅')) {
          const jobUrl = extractJobUrl(cell);
          const roleInfo = getRoleInfo(type, company);
          
          jobs.push({
            id: jobId++,
            company: company,
            title: roleInfo.title,
            location: location,
            salary: generateQuantSalary(type, company),
            workModel: 'In-Office', // Most quant firms are in-office
            matchScore: generateQuantMatchScore(type, company),
            yaleCount: generateQuantYaleCount(company),
            industry: roleInfo.industry,
            description: roleInfo.description,
            requirements: ['Strong quantitative background', 'Programming skills', 'Mathematical aptitude', 'Problem-solving ability'],
            applicationUrl: jobUrl,
            age: '0d',
            roleType: type,
            notes: cleanText(notesCell)
          });
        }
      });
    });
    
    console.log(`Parsed ${jobs.length} quant internships from the repository`);
    return jobs;
    
  } catch (error) {
    console.error('Error parsing quant jobs:', error);
    return [];
  }
}

// Export the function
module.exports = { parseQuantJobs };

// Run if called directly
if (require.main === module) {
  const jobs = parseQuantJobs();
  console.log('Sample quant jobs:', jobs.slice(0, 3));
}
