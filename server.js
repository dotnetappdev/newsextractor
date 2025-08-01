const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Article extraction endpoint
app.post('/api/extract', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let browser;
  try {
    console.log(`Extracting article from: ${url}`);
    
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: true,
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    
    // Set user agent to avoid blocking
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Extract article content
    const article = await page.evaluate(() => {
      // Helper function to clean text
      const cleanText = (text) => {
        return text.replace(/\s+/g, ' ').trim();
      };

      // Try multiple selectors for title
      let title = '';
      const titleSelectors = [
        'h1.headline',
        'h1[data-component="HeadlineBlock"]',
        'h1.article-headline',
        'h1.story-headline',
        'h1.entry-title',
        'meta[property="og:title"]',
        'title',
        'h1'
      ];
      
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          if (selector.includes('meta')) {
            title = element.getAttribute('content') || '';
          } else {
            title = cleanText(element.textContent || '');
          }
          if (title && title.length > 5) break;
        }
      }

      // Try multiple selectors for main image
      let image = '';
      const imageSelectors = [
        'meta[property="og:image"]',
        'article img',
        '.article-body img',
        '.story-body img',
        '.entry-content img',
        'main img',
        'img[data-component="Image"]'
      ];
      
      for (const selector of imageSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          if (selector.includes('meta')) {
            image = element.getAttribute('content') || '';
          } else {
            image = element.src || element.getAttribute('data-src') || '';
          }
          if (image && image.startsWith('http')) break;
        }
      }

      // Try multiple selectors for article body
      let bodyText = '';
      const bodySelectors = [
        'div[data-component="ArticleBody"]',
        'div[data-component="TextBlock"]',
        '.article-body',
        '.story-body',
        '.entry-content',
        'article .content',
        'article p',
        'main p'
      ];
      
      for (const selector of bodySelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          // Remove unwanted elements
          elements.forEach(element => {
            const unwanted = element.querySelectorAll('script, style, nav, aside, .ad, .ads, .advert, .social, .share, .related, .recommended, .footer, .header');
            unwanted.forEach(el => el.remove());
          });
          
          bodyText = Array.from(elements)
            .map(el => cleanText(el.textContent || ''))
            .filter(text => text.length > 20)
            .join('\n\n');
          
          if (bodyText.length > 100) break;
        }
      }

      // Fallback: extract all paragraphs from article or main
      if (!bodyText) {
        const containers = document.querySelectorAll('article, main, .main-content');
        for (const container of containers) {
          const paragraphs = container.querySelectorAll('p');
          bodyText = Array.from(paragraphs)
            .map(p => cleanText(p.textContent || ''))
            .filter(text => text.length > 20)
            .join('\n\n');
          
          if (bodyText.length > 100) break;
        }
      }

      // Get meta description as fallback
      let description = '';
      const descriptionMeta = document.querySelector('meta[name="description"]') || 
                             document.querySelector('meta[property="og:description"]');
      if (descriptionMeta) {
        description = descriptionMeta.getAttribute('content') || '';
      }

      return {
        title: title || document.title || '',
        image: image,
        bodyText: bodyText || description,
        url: window.location.href
      };
    });

    await browser.close();

    // Validate extracted content
    if (!article.title && !article.bodyText) {
      return res.status(422).json({ 
        error: 'Could not extract meaningful content from the page',
        article: article
      });
    }

    console.log(`Successfully extracted: ${article.title.substring(0, 50)}...`);
    
    res.json({
      success: true,
      article: article
    });

  } catch (error) {
    console.error('Extraction error:', error);
    
    if (browser) {
      await browser.close();
    }
    
    res.status(500).json({ 
      error: 'Failed to extract article content',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html by default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`News Extractor server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to use the application`);
});