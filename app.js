const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Function to ensure URLs have a protocol
function ensureProtocol(url) {
  if (!/^[a-zA-Z]+:\/\//.test(url)) {
    return `http://${url}`;
  }
  return url;
}

// API endpoint to fetch and modify content
app.post('/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Ensure URL has a protocol
    const processedUrl = ensureProtocol(url);

    // Fetch the content from the provided URL
    const response = await axios.get(processedUrl);
    const html = response.data;

    // Use cheerio to parse HTML and selectively replace text content, not URLs
    const $ = cheerio.load(html);
    
    // Function to replace text but skip URLs and attributes
    function replaceYaleWithFale(i, el) {
      if ($(el).children().length === 0 || $(el).text().trim() !== '') {
        // Get the HTML content of the element
        let content = $(el).html();
        
        // Only process if it's a text node
        if (content && $(el).children().length === 0) {
          // Replace Yale with Fale in text content only (including uppercase YALE)
          content = content.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale').replace(/YALE/g, 'FALE');
          $(el).html(content);
        }
      }
    }
    
    // Process text nodes in the body
    $('body *').contents().filter(function() {
      return this.nodeType === 3; // Text nodes only
    }).each(function() {
      // Replace text content but not in URLs or attributes
      const text = $(this).text();
      const newText = text.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale').replace(/YALE/g, 'FALE');
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    // Process title separately
    const title = $('title').text().replace(/Yale/g, 'Fale').replace(/yale/g, 'fale').replace(/YALE/g, 'FALE');
    $('title').text(title);
    
    return res.json({ 
      success: true, 
      content: $.html(),
      title: title,
      originalUrl: url
    });
  } catch (error) {
    console.error('Error fetching URL:', error.message);
    return res.status(500).json({ 
      error: `Failed to fetch content: ${error.message}` 
    });
  }
});

// For Vercel serverless functions, we need to export the Express app as the default export
// This allows Vercel to use it as a serverless function
module.exports = app;

// Also export other functions for testing
module.exports.ensureProtocol = ensureProtocol;

// Only start the server if this file is run directly (not imported as a module)
if (require.main === module) {
  // Start the server
  app.listen(PORT, () => {
    console.log(`Faleproxy server running at http://localhost:${PORT}`);
  });
}
