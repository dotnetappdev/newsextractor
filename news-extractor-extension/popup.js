// Handles UI and copy actions
function setStatus(msg) {
  document.getElementById('status').textContent = msg;
  setTimeout(() => { document.getElementById('status').textContent = ''; }, 1500);
}

function copyToClipboard(id) {
  const el = document.getElementById(id);
  el.select();
  document.execCommand('copy');
  setStatus('Copied!');
}

document.getElementById('copy-title').onclick = () => copyToClipboard('title');
document.getElementById('copy-url').onclick = () => copyToClipboard('url');
document.getElementById('copy-markdown').onclick = () => copyToClipboard('markdown');
document.getElementById('copy-title-url').onclick = () => {
  const title = document.getElementById('title').value;
  const url = document.getElementById('url').value;
  navigator.clipboard.writeText(`${title}\n${url}`);
  setStatus('Title + URL copied!');
};

// Receive extracted data from content script
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.tabs.sendMessage(tabs[0].id, {action: 'extract'}, function(response) {
    if (!response) return setStatus('No article found.');
    document.getElementById('title').value = response.title || '';
    document.getElementById('url').value = response.url || '';
    document.getElementById('markdown').value = response.markdown || '';
    if (response.image) {
      document.getElementById('image-container').innerHTML = `<img src="${response.image}" alt="Article Image">`;
    } else {
      document.getElementById('image-container').innerHTML = '';
    }
  });
});
