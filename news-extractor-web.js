function updateRedditPreview() {
  // For Reddit, just show the markdown as plain text (Reddit renders markdown natively)
  const md = document.getElementById('markdown').value;
  document.getElementById('reddit-preview').textContent = md;
}
// Simple markdown to HTML converter for preview
function simpleMarkdownToHtml(md) {
  if (!md) return '';
  let html = md
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
    .replace(/\*(.*?)\*/gim, '<i>$1</i>')
    .replace(/!\[.*?\]\((.*?)\)/gim, '<img src="$1" style="max-width:100%;max-height:180px;" />')
    .replace(/\n/g, '<br>');
  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2" target="_blank">$1</a>');
  return html;
}

function updateMarkdownPreview() {
  const md = document.getElementById('markdown').value;
  document.getElementById('markdown-preview').innerHTML = simpleMarkdownToHtml(md);
  updateRedditPreview();
}

// News Extractor Web Version
async function fetchAndExtract(url) {
  setStatus('Fetching...');
  showProgressBar();
  try {
    // Animate progress bar to 40% while fetching
    setProgressBar(40);
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    setProgressBar(70);
    const data = await res.json();
    setProgressBar(85);
    const html = data.contents;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // Extraction logic (similar to extension)
    let article = doc.querySelector('article') || doc.querySelector('main') || doc.body;
    let title = doc.querySelector('meta[property="og:title"]')?.content || doc.title;
    let image = doc.querySelector('meta[property="og:image"]')?.content || '';
    let text = '';
    if (article) {
      article.querySelectorAll('script, nav, aside, style, noscript, iframe, header, footer, .ad, .ads, .advert').forEach(e => e.remove());
      // Preserve line breaks as markdown (double space + newline)
      text = article.innerText.replace(/\r?\n/g, '  \n').trim();
    }
    let markdown = `# ${title}\n\n${text}`;
    if (image) markdown = `![image](${image})\n\n` + markdown;
    setProgressBar(100);
    setTimeout(hideProgressBar, 500);
    return { title, url, image, markdown };
  } catch (e) {
    setStatus('Failed to fetch or extract.');
    setProgressBar(100);
    setTimeout(hideProgressBar, 500);
    return { title: '', url, image: '', markdown: '' };
  }
}

function showProgressBar() {
  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.display = '';
  setProgressBar(10);
}
function hideProgressBar() {
  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.display = 'none';
  setProgressBar(0);
}
function setProgressBar(percent) {
  const inner = document.querySelector('.progress-bar-inner');
  if (inner) inner.style.width = percent + '%';
}

function setStatus(msg) {
  document.getElementById('status').textContent = msg;
  setTimeout(() => { document.getElementById('status').textContent = ''; }, 2000);
}

function copyToClipboard(id) {
  const el = document.getElementById(id);
  el.select();
  document.execCommand('copy');
  setStatus('Copied!');
}

document.getElementById('fetch-article').onclick = async () => {
  const url = document.getElementById('input-url').value;
  if (!url) return setStatus('Enter a URL.');
  const result = await fetchAndExtract(url);
  document.getElementById('title').value = result.title || '';
  // URL box removed, but keep for copy button compatibility if needed
  // document.getElementById('url').value = url;
  // Insert URL as first line in markdown
  let markdownWithUrl = url ? `${url}\n\n${result.markdown || ''}` : (result.markdown || '');
  document.getElementById('markdown').value = markdownWithUrl;
  updateMarkdownPreview();
  if (result.image) {
    document.getElementById('image-container').innerHTML = `<img src="${result.image}" alt="Article Image">`;
  } else {
    document.getElementById('image-container').innerHTML = '';
  }
  setStatus('Done!');
};

document.getElementById('copy-title').onclick = () => copyToClipboard('title');
document.getElementById('copy-url').onclick = () => copyToClipboard('url');

document.getElementById('copy-markdown').onclick = () => copyToClipboard('markdown');
document.getElementById('markdown').addEventListener('input', updateMarkdownPreview);
// Initial preview update
updateMarkdownPreview();

// Markdown formatting toolbar logic
window.formatMarkdown = function(type) {
  const textarea = document.getElementById('markdown');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  let value = textarea.value;
  let before = value.substring(0, start);
  let selected = value.substring(start, end);
  let after = value.substring(end);
  let insert = '';
  switch(type) {
    case 'bold':
      insert = `**${selected || 'bold text'}**`;
      break;
    case 'italic':
      insert = `*${selected || 'italic text'}*`;
      break;
    case 'h1':
      insert = `# ${selected || 'Heading 1'}`;
      break;
    case 'h2':
      insert = `## ${selected || 'Heading 2'}`;
      break;
    case 'img':
      const url = prompt('Enter image URL:');
      if (url) insert = `![image](${url})`;
      else return;
      break;
    default:
      return;
  }
  textarea.value = before + insert + after;
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = before.length + insert.length;
  updateMarkdownPreview();
};
document.getElementById('copy-title-url').onclick = () => {
  const title = document.getElementById('title').value;
  const url = document.getElementById('url').value;
  navigator.clipboard.writeText(`${title}\n${url}`);
  setStatus('Title + URL copied!');
};
