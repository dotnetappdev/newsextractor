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
  const md = document.getElementById('editor').value;
  document.getElementById('output').innerHTML = simpleMarkdownToHtml(md);
}

// News Extractor Web Version
async function fetchAndExtract(url) {
  setStatus('Fetching...');
  showProgressBar();
  try {
    // Animate progress bar to 40% while fetching
    setProgressBar(40);
    // Use a faster CORS proxy (try corsproxy.io)
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
    setProgressBar(70);
    const data = await res.json();
    setProgressBar(85);
    const html = data.contents;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // Extraction logic (similar to extension)
    let article = doc.querySelector('article') || doc.querySelector('main') || doc.body;
    let title = doc.querySelector('meta[property="og:title"]')?.content || doc.title;
    let image = doc.querySelector('meta[property="og:image"]')?.content || '';
    let description = doc.querySelector('meta[name="description"]')?.content || doc.querySelector('meta[property="og:description"]')?.content || '';
    let text = '';
    if (article) {
      article.querySelectorAll('script, nav, aside, style, noscript, iframe, header, footer, .ad, .ads, .advert').forEach(e => e.remove());
      // Preserve line breaks as markdown (double space + newline)
      text = article.innerText.replace(/\r?\n/g, '  \n').trim();
    }
    let markdown = `# ${title}\n`;
    if (description) markdown += `\n> ${description}\n`;
    markdown += `\n${text}`;
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

// Open code editor popup and handle code insertion
document.addEventListener('DOMContentLoaded', function () {
  const codeBtn = document.getElementById('code-btn');
  if (codeBtn) {
    codeBtn.addEventListener('click', function () {
      window.open('news-extractor-code-popup.html', 'Insert Code', 'width=600,height=500');
    });
  }
});

// Listen for code insertion from popup
window.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'insertCode') {
    const { code, lang } = event.data;
    const textarea = document.getElementById('editor');
    if (!textarea) return;
    // Detect mode (markdown or html)
    const mode = document.querySelector('input[name="mode"]:checked')?.value || 'markdown';
    let codeBlock = '';
    if (mode === 'markdown') {
      codeBlock = `\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    } else {
      codeBlock = `\n<pre><code class=\"language-${lang}\">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>\n`;
    }
    // Insert at cursor position
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    textarea.value = before + codeBlock + after;
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = before.length + codeBlock.length;
    // Optionally trigger preview update
    if (typeof updatePreview === 'function') updatePreview();
  }
});

// ...existing code...
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



window.addEventListener('DOMContentLoaded', function() {
  const fetchBtn = document.getElementById('fetch-article');
  if (fetchBtn) {
    fetchBtn.onclick = async () => {
      const url = document.getElementById('input-url').value;
      if (!url) return;
      const result = await fetchAndExtract(url);
      // Compose markdown: title first line, image second (if any), then article body
      let markdown = '';
      if (result.title) markdown += `# ${result.title}\n`;
      if (result.image) markdown += `![image](${result.image})\n`;
      if (result.markdown) markdown += `\n${result.markdown}`;
      const mdBox = document.getElementById('editor');
      if (mdBox) mdBox.value = markdown.trim();
      updateMarkdownPreview();
    };
  }
  // Live preview on input
  const mdBox = document.getElementById('editor');
  if (mdBox) mdBox.addEventListener('input', updateMarkdownPreview);
  updateMarkdownPreview();
});

document.getElementById('copy-markdown').onclick = () => copyToClipboard('markdown');
document.getElementById('markdown').addEventListener('input', updateMarkdownPreview);

const copyTitleBtn = document.getElementById('copy-title');
if (copyTitleBtn) copyTitleBtn.onclick = () => copyToClipboard('title');
const copyMarkdownBtn = document.getElementById('copy-markdown');
if (copyMarkdownBtn) copyMarkdownBtn.onclick = () => copyToClipboard('markdown');
const mdBox = document.getElementById('markdown');
if (mdBox) {
  mdBox.addEventListener('input', updateMarkdownPreview);
  // Sync scroll line numbers with textarea
  mdBox.addEventListener('scroll', function() {
    const ln = document.getElementById('line-numbers');
    if (ln) ln.scrollTop = mdBox.scrollTop;
  });
}

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
