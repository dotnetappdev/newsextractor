// News Extractor Web Version
async function fetchAndExtract(url) {
  setStatus('Fetching...');
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    const html = data.contents;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // Extraction logic (similar to extension)
    let article = doc.querySelector('article') || doc.querySelector('main') || doc.body;
    let title = doc.querySelector('meta[property="og:title"]')?.content || doc.title;
    let image = doc.querySelector('meta[property="og:image"]')?.content || '';
    let text = '';
    if (article) {
      article.querySelectorAll('script, nav, aside, style, noscript, iframe, header, footer, .ad, .ads, .advert').forEach(e => e.remove());
      text = article.innerText.trim();
    }
    let markdown = `# ${title}\n\n${text}`;
    if (image) markdown = `![image](${image})\n\n` + markdown;
    return { title, url, image, markdown };
  } catch (e) {
    setStatus('Failed to fetch or extract.');
    return { title: '', url, image: '', markdown: '' };
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

document.getElementById('fetch-article').onclick = async () => {
  const url = document.getElementById('input-url').value;
  if (!url) return setStatus('Enter a URL.');
  const result = await fetchAndExtract(url);
  document.getElementById('title').value = result.title || '';
  document.getElementById('url').value = url;
  document.getElementById('markdown').value = result.markdown || '';
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
document.getElementById('copy-title-url').onclick = () => {
  const title = document.getElementById('title').value;
  const url = document.getElementById('url').value;
  navigator.clipboard.writeText(`${title}\n${url}`);
  setStatus('Title + URL copied!');
};
