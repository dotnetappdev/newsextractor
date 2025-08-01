// Theme toggle logic: use system/browser color scheme by default, but allow user override via toggle and persist in localStorage
window.addEventListener('DOMContentLoaded', function () {
  const themeLight = document.getElementById('theme-light');
  const themeDark = document.getElementById('theme-dark');
  const body = document.body;
  const THEME_KEY = 'theme-override';

  function setTheme(mode) {
    if (mode === 'dark') {
      body.classList.add('dark-mode');
      body.classList.remove('light-mode');
      if (themeDark) themeDark.checked = true;
      if (themeLight) themeLight.checked = false;
    } else {
      body.classList.add('light-mode');
      body.classList.remove('dark-mode');
      if (themeLight) themeLight.checked = true;
      if (themeDark) themeDark.checked = false;
    }
  }

  function getSystemTheme() {
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  // Apply theme on load
  let override = localStorage.getItem(THEME_KEY);
  let initialTheme = (override === 'dark' || override === 'light') ? override : getSystemTheme();
  setTheme(initialTheme);

  // Listen for system theme changes if no override
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
      if (!localStorage.getItem(THEME_KEY)) {
        setTheme(getSystemTheme());
      }
    });
  }

  if (themeLight && themeDark) {
    themeLight.addEventListener('change', function () {
      if (themeLight.checked) {
        setTheme('light');
        localStorage.setItem(THEME_KEY, 'light');
      }
    });
    themeDark.addEventListener('change', function () {
      if (themeDark.checked) {
        setTheme('dark');
        localStorage.setItem(THEME_KEY, 'dark');
      }
    });
  }
});
// Copy Title and Content button logic
window.addEventListener('DOMContentLoaded', function () {
  const copyTitleBtn = document.getElementById('copy-title-btn');
  if (copyTitleBtn) {
    copyTitleBtn.onclick = function () {
      const titleBox = document.getElementById('title-box');
      const title = titleBox ? titleBox.value : '';
      if (title) {
        navigator.clipboard.writeText(title);
      }
    };
  }
  const copyContentBtn = document.getElementById('copy-content-btn');
  if (copyContentBtn) {
    copyContentBtn.onclick = function () {
      const modeRadio = document.querySelector('input[name="mode"]:checked');
      const mode = modeRadio ? modeRadio.value : 'markdown';
      if (mode === 'markdown') {
        const mdBox = document.getElementById('editor');
        const md = mdBox ? mdBox.value : '';
        navigator.clipboard.writeText(md);
      } else {
        const output = document.getElementById('output');
        const html = output ? output.innerHTML : '';
        navigator.clipboard.writeText(html);
      }
    };
  }
});
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

// Splitter logic for resizable panes
window.addEventListener('DOMContentLoaded', function () {
  const divider = document.getElementById('split-divider');
  const left = document.getElementById('edit');
  const right = document.getElementById('preview');
  let isDragging = false;
  divider.addEventListener('mousedown', function (e) {
    isDragging = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });
  window.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    const container = document.getElementById('container');
    const rect = container.getBoundingClientRect();
    let percent = (e.clientX - rect.left) / rect.width;
    percent = Math.max(0.1, Math.min(0.9, percent));
    left.style.flex = percent + ' 1 0';
    right.style.flex = (1 - percent) + ' 1 0';
  });
  window.addEventListener('mouseup', function () {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
});
function showProgressBar() {
  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.display = '';
  setProgressBar(10);
  document.getElementById('progress-bar-container').style.visibility = 'visible';
}
function hideProgressBar() {
  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.display = 'none';
  setProgressBar(0);
  document.getElementById('progress-bar-container').style.visibility = 'hidden';
  // Hide progress bar initially
  const progressBarContainer = document.getElementById('progress-bar-container');
  if (progressBarContainer) progressBarContainer.style.visibility = 'hidden';

  // Status bar logic
  const editor = document.getElementById('editor');
  const lineCol = document.getElementById('statusbar-linecol');
  const modeEl = document.getElementById('statusbar-mode');
  const capsEl = document.getElementById('statusbar-caps');
  const numEl = document.getElementById('statusbar-num');
  let capsOn = false, numOn = false;
  function updateLineCol() {
    if (!editor || !lineCol) return;
    const val = editor.value;
    const pos = editor.selectionStart;
    const lines = val.substr(0, pos).split('\n');
    const ln = lines.length;
    const col = lines[lines.length-1].length + 1;
    lineCol.textContent = `Ln ${ln}, Col ${col}`;
  }
  if (editor) {
    editor.addEventListener('keyup', updateLineCol);
    editor.addEventListener('click', updateLineCol);
    editor.addEventListener('input', updateLineCol);
    updateLineCol();
  }
  // Mode
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  function updateMode() {
    if (!modeEl) return;
    const checked = Array.from(modeRadios).find(r=>r.checked);
    modeEl.textContent = checked ? (checked.value==='html'?'HTML':'Markdown') : '';
  }
  modeRadios.forEach(r=>r.addEventListener('change', updateMode));
  updateMode();
  // Caps lock
  window.addEventListener('keydown', e => {
    if (e.getModifierState && capsEl) {
      capsOn = e.getModifierState('CapsLock');
      capsEl.textContent = capsOn ? 'CAPS' : '';
    }
    if (e.getModifierState && numEl) {
      numOn = e.getModifierState('NumLock');
      numEl.textContent = numOn ? 'NUM' : '';
    }
  });
  window.addEventListener('keyup', e => {
    if (e.getModifierState && capsEl) {
      capsOn = e.getModifierState('CapsLock');
      capsEl.textContent = capsOn ? 'CAPS' : '';
    }
    if (e.getModifierState && numEl) {
      numOn = e.getModifierState('NumLock');
      numEl.textContent = numOn ? 'NUM' : '';
    }
  });
  // Initial state
  if (capsEl) capsEl.textContent = (window.getModifierState && window.getModifierState('CapsLock')) ? 'CAPS' : '';
  if (numEl) numEl.textContent = (window.getModifierState && window.getModifierState('NumLock')) ? 'NUM' : '';
}
function setProgressBar(percent) {
  const bar = document.getElementById('progress-bar');
  const label = document.getElementById('progress-label');
  if (bar) bar.style.width = percent + '%';
  if (label) {
    if (percent === 0) label.textContent = 'Idle';
    else if (percent < 100) label.textContent = `Fetching: ${percent}%`;
    else label.textContent = 'Done';
  }
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
      // Set the title box to the fetched title
      const titleBox = document.getElementById('title-box');
      if (titleBox) titleBox.value = result.title || '';
      // Compose markdown: url first line, then title, image, then article body
      let markdown = '';
      if (url) markdown += url + '\n';
      if (result.title) markdown += `# ${result.title}\n`;
      if (result.image) markdown += `![image](${result.image})\n`;
      if (result.markdown) markdown += `\n${result.markdown}`;
      const mdBox = document.getElementById('editor');
      if (mdBox) mdBox.value = markdown.trim();
      updateMarkdownPreview();
    };
  }
  // Live preview on input and validate body
  const mdBox = document.getElementById('editor');
  const errorDiv = document.getElementById('editor-error');
  function validateBody() {
    if (!mdBox) return true;
    const value = mdBox.value.trim();
    // Require at least 20 non-whitespace characters in the body (excluding url and title lines)
    const lines = value.split('\n');
    let body = lines.slice(2).join('\n').replace(/\s/g, '');
    if (body.length < 20) {
      if (errorDiv) {
        errorDiv.textContent = 'Article body must be at least 20 characters.';
        errorDiv.style.display = '';
      }
      return false;
    } else {
      if (errorDiv) errorDiv.style.display = 'none';
      return true;
    }
  }
  if (mdBox) {
    mdBox.addEventListener('input', function() {
      updateMarkdownPreview();
      validateBody();
    });
  }
  updateMarkdownPreview();
});


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
