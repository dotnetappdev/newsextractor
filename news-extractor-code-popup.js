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
  const modeSelect = document.getElementById('code-insert-mode');
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

  function wrapCode(code, lang, mode) {
    if (mode === 'markdown') {
      return `\n\n\${lang}\n${code}\n\\n\n`.replace(/\u007F/g, '`');
    } else {
      return `\n<pre><code class="language-${lang}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>\n`;
    }
  }

  document.getElementById('insert-code').onclick = () => {
    const code = editor.getValue();
    const lang = langSelect.value;
    const mode = modeSelect.value;
    const wrapped = wrapCode(code, lang, mode);
    if (window.opener) {
      window.opener.postMessage({ type: 'insertCode', code: wrapped, lang }, '*');
    }
    window.close();
  };

  document.getElementById('apply-code').onclick = () => {
    const code = editor.getValue();
    const lang = langSelect.value;
    const mode = modeSelect.value;
    const wrapped = wrapCode(code, lang, mode);
    if (window.opener) {
      window.opener.postMessage({ type: 'insertCode', code: wrapped, lang }, '*');
    }
  };

  document.getElementById('close-code-popup').onclick = () => {
    window.close();
  };
});
