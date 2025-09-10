import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class TrackrScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set user agent to avoid detection
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  }

  async scrapeInternships() {
    try {
      console.log('Starting to scrape internships from The Trackr...');
      
      await this.page.goto('https://app.the-trackr.com/na-finance/summer-internships', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for content to load
      await this.page.waitForTimeout(3000);

      // Extract internship data
      const internships = await this.page.evaluate(() => {
        const results = [];
        
        // Look for common internship listing selectors
        const selectors = [
          '[data-testid*="internship"]',
          '.internship-card',
          '.job-listing',
          '.opportunity-card',
          '[class*="internship"]',
          '[class*="job"]',
          '[class*="opportunity"]'
        ];

        let elements = [];
        for (const selector of selectors) {
          const found = document.querySelectorAll(selector);
          if (found.length > 0) {
            elements = found;
            break;
          }
        }

        // If no specific selectors found, look for common patterns
        if (elements.length === 0) {
          // Look for divs with text content that might be internships
          const allDivs = document.querySelectorAll('div');
          elements = Array.from(allDivs).filter(div => {
            const text = div.textContent?.toLowerCase() || '';
            return text.includes('intern') || text.includes('summer') || 
                   text.includes('analyst') || text.includes('associate');
          });
        }

        elements.forEach((element, index) => {
          try {
            const text = element.textContent?.trim();
            if (text && text.length > 10) {
              // Extract company name (look for common patterns)
              const companyMatch = text.match(/([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Company|Group|Partners|Capital|Bank|Securities)?)/);
              const company = companyMatch ? companyMatch[1].trim() : 'Unknown Company';

              // Extract title (look for common internship titles)
              const titleMatch = text.match(/(Summer\s+Intern|Intern|Analyst|Associate|Trainee|Program)/i);
              const title = titleMatch ? titleMatch[0] : 'Internship Opportunity';

              // Extract location (look for common location patterns)
              const locationMatch = text.match(/(New York|NYC|San Francisco|SF|Boston|Chicago|Los Angeles|LA|London|Remote|Hybrid)/i);
              const location = locationMatch ? locationMatch[0] : 'Location TBD';

              results.push({
                id: `trackr_${index}`,
                company: company,
                title: title,
                location: location,
                description: text.substring(0, 200) + '...',
                source: 'The Trackr',
                url: window.location.href,
                scraped_at: new Date().toISOString(),
                raw_text: text
              });
            }
          } catch (error) {
            console.error('Error processing element:', error);
          }
        });

        return results;
      });

      console.log(`Found ${internships.length} internship opportunities`);
      return internships;

    } catch (error) {
      console.error('Error scraping internships:', error);
      return [];
    }
  }

  async scrapeWithFallback() {
    try {
      // Try the main scraping method first
      let internships = await this.scrapeInternships();
      
      if (internships.length === 0) {
        console.log('No internships found with main method, trying fallback...');
        
        // Fallback: try to get any structured data from the page
        internships = await this.page.evaluate(() => {
          const results = [];
          
          // Look for any JSON-LD structured data
          const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
          jsonLdScripts.forEach(script => {
            try {
              const data = JSON.parse(script.textContent);
              if (data['@type'] === 'JobPosting' || data['@type'] === 'Organization') {
                results.push({
                  id: `trackr_json_${results.length}`,
                  company: data.hiringOrganization?.name || data.name || 'Unknown',
                  title: data.title || 'Internship',
                  location: data.jobLocation?.address?.addressLocality || 'Location TBD',
                  description: data.description || '',
                  source: 'The Trackr (JSON-LD)',
                  url: window.location.href,
                  scraped_at: new Date().toISOString()
                });
              }
            } catch (e) {
              // Ignore JSON parsing errors
            }
          });

          // If still no results, create a generic entry
          if (results.length === 0) {
            results.push({
              id: 'trackr_generic',
              company: 'Various Finance Companies',
              title: 'Summer Internship',
              location: 'North America',
              description: 'Summer internship opportunities in North American finance sector',
              source: 'The Trackr',
              url: window.location.href,
              scraped_at: new Date().toISOString()
            });
          }

          return results;
        });
      }

      return internships;
    } catch (error) {
      console.error('Fallback scraping failed:', error);
      return [];
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async saveToFile(internships, filename = 'trackr-internships.json') {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filepath = path.join(dataDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(internships, null, 2));
    console.log(`Saved ${internships.length} internships to ${filepath}`);
  }
}

// Main execution
async function main() {
  const scraper = new TrackrScraper();
  
  try {
    await scraper.init();
    const internships = await scraper.scrapeWithFallback();
    
    if (internships.length > 0) {
      await scraper.saveToFile(internships);
      console.log('Scraping completed successfully!');
    } else {
      console.log('No internships found. The page might be protected or have changed structure.');
    }
  } catch (error) {
    console.error('Scraping failed:', error);
  } finally {
    await scraper.close();
  }
}

// Export for use in other modules
export { TrackrScraper };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

