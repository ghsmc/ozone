/**
 * Formats salary strings for consistent, beautiful display
 */

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: string;
}

export function parseSalary(salaryString: string): SalaryRange | null {
  if (!salaryString) return null;

  // Remove extra spaces and normalize
  const normalized = salaryString.trim().toLowerCase();
  
  // Extract currency symbol
  const currency = normalized.includes('$') ? '$' : '';
  
  // Extract period (month, year, etc.)
  let period = 'year';
  if (normalized.includes('/month')) {
    period = 'month';
  } else if (normalized.includes('/year')) {
    period = 'year';
  } else if (normalized.includes('/hr') || normalized.includes('/hour')) {
    period = 'hour';
  }
  
  // Handle different salary formats
  let min: number, max: number;
  
  // Pattern 1: $6,000-9,000/month or $6000-9000/month
  const rangeMatch = normalized.match(/\$?([0-9,]+)\s*-\s*([0-9,]+)/);
  if (rangeMatch) {
    min = parseFloat(rangeMatch[1].replace(/,/g, ''));
    max = parseFloat(rangeMatch[2].replace(/,/g, ''));
    return { min, max, currency, period };
  }
  
  // Pattern 2: Single number like $100,000 or $100000
  const singleMatch = normalized.match(/\$?([0-9,]+)/);
  if (singleMatch) {
    const value = parseFloat(singleMatch[1].replace(/,/g, ''));
    return { min: value, max: value, currency, period };
  }
  
  return null;
}

export function formatSalary(salaryString: string): string {
  const parsed = parseSalary(salaryString);
  if (!parsed) return salaryString; // Return original if parsing fails
  
  const { min, max, currency, period } = parsed;
  
  // Format numbers with commas
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    } else {
      return num.toLocaleString();
    }
  };
  
  // Handle different periods
  let periodDisplay = '';
  switch (period) {
    case 'month':
      periodDisplay = '/mo';
      break;
    case 'hour':
      periodDisplay = '/hr';
      break;
    case 'year':
      periodDisplay = '/yr';
      break;
    default:
      periodDisplay = '';
  }
  
  // Format the range
  if (min === max) {
    return `${currency}${formatNumber(min)}${periodDisplay}`;
  } else {
    return `${currency}${formatNumber(min)}-${formatNumber(max)}${periodDisplay}`;
  }
}

export function formatSalaryDetailed(salaryString: string): string {
  const parsed = parseSalary(salaryString);
  if (!parsed) return salaryString;
  
  const { min, max, currency, period } = parsed;
  
  // Convert to annual equivalent for comparison
  let annualMin = min;
  let annualMax = max;
  
  switch (period) {
    case 'month':
      annualMin = min * 12;
      annualMax = max * 12;
      break;
    case 'hour':
      annualMin = min * 2080; // 40 hours/week * 52 weeks
      annualMax = max * 2080;
      break;
  }
  
  // Format with full numbers and annual equivalent
  const formatFullNumber = (num: number) => num.toLocaleString();
  
  if (min === max) {
    return `${currency}${formatFullNumber(min)}${period === 'month' ? '/mo' : period === 'hour' ? '/hr' : ''} (${currency}${formatFullNumber(annualMin)}/yr)`;
  } else {
    return `${currency}${formatFullNumber(min)}-${formatFullNumber(max)}${period === 'month' ? '/mo' : period === 'hour' ? '/hr' : ''} (${currency}${formatFullNumber(annualMin)}-${formatFullNumber(annualMax)}/yr)`;
  }
}

// Example usage and testing
export const salaryExamples = [
  '$6,000-9,000/month',
  '$8000-12000/month', 
  '$80,000-120,000/year',
  '$25-35/hour',
  '$100,000',
  '$150K-200K',
  'Competitive'
];

// Test function
export function testSalaryFormatting() {
  console.log('Testing salary formatting:');
  salaryExamples.forEach(salary => {
    console.log(`Original: ${salary}`);
    console.log(`Formatted: ${formatSalary(salary)}`);
    console.log(`Detailed: ${formatSalaryDetailed(salary)}`);
    console.log('---');
  });
}
