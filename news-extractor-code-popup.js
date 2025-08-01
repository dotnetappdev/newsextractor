// news-extractor-code-popup.js
// Handles CodeMirror setup and communication with the main window

let editor;

function getModeFromLang(lang) {
  switch (lang) {
    case 'javascript': return 'javascript';
    case 'python': return 'python';
    case 'html': return 'htmlmixed';
    case 'css': return 'css';
    case 'bash': return 'shell';
    case 'json': return 'application/json';
    case 'xml': return 'xml';
    case 'java': return 'text/x-java';
    case 'c': return 'text/x-csrc';
    case 'cpp': return 'text/x-c++src';
    case 'go': return 'go';
    case 'php': return 'php';
    case 'ruby': return 'ruby';
    case 'typescript': return 'application/typescript';
    default: return 'javascript';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const langSelect = document.getElementById('code-lang-select');
  editor = CodeMirror(document.getElementById('code-editor'), {
    value: '',
    mode: getModeFromLang(langSelect.value),
    theme: 'material-darker',
    lineNumbers: true,
    indentUnit: 2,
    tabSize: 2,
    autofocus: true,
  });

  langSelect.addEventListener('change', () => {
    editor.setOption('mode', getModeFromLang(langSelect.value));
  });

  document.getElementById('insert-code').onclick = () => {
    const code = editor.getValue();
    const lang = langSelect.value;
    // Send code and language back to opener
    if (window.opener) {
      window.opener.postMessage({ type: 'insertCode', code, lang }, '*');
    }
    window.close();
  };

  document.getElementById('close-code-popup').onclick = () => {
    window.close();
  };
});
