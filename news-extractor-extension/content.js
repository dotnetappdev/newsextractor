// Extracts article info from the page
function extractArticle() {
  // Try to use <article> tag or fallback to main content heuristics
  let article = document.querySelector('article');
  if (!article) {
    article = document.querySelector('main') || document.body;
  }
  // Title
  let title = document.querySelector('meta[property="og:title"]')?.content || document.title;
  // URL
  let url = window.location.href;
  // Image
  let image = document.querySelector('meta[property="og:image"]')?.content || '';
  // Try to get main text content
  let text = '';
  if (article) {
    // Remove scripts, nav, ads, etc.
    article.querySelectorAll('script, nav, aside, style, noscript, iframe, header, footer, .ad, .ads, .advert').forEach(e => e.remove());
    text = article.innerText.trim();
  }
  // Markdown conversion (simple)
  let markdown = `# ${title}\n\n${text}`;
  if (image) markdown = `![image](${image})\n\n` + markdown;
  return { title, url, image, markdown };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'extract') {
    sendResponse(extractArticle());
  }
});

// Attempt to bypass JS paywalls (basic)
(function() {
  // Remove overlays and blur
  document.querySelectorAll('[style*="overflow: hidden"], [class*="paywall"], [id*="paywall"], [class*="overlay"], [id*="overlay"]').forEach(e => {
    e.style.display = 'none';
    e.style.visibility = 'hidden';
    e.style.pointerEvents = 'none';
    e.style.position = 'static';
    e.style.overflow = 'visible';
    e.style.filter = 'none';
  });
  // Remove blur
  document.querySelectorAll('[style*="blur"], .blur, .blurry').forEach(e => {
    e.style.filter = 'none';
  });
})();
