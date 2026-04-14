(function () {
  // SHA-256 of the edit passphrase. Default: "niko-edit-0414"
  // To rotate: pick a new passphrase, run in terminal:
  //   node -e "console.log(require('crypto').createHash('sha256').update('YOUR_PHRASE').digest('hex'))"
  // then paste the hex below.
  const PASS_HASH = '3990e94ef546e4047679ee7df2cc5729a0eda8be4d27ea50f49034e380086e65';
  const UNLOCK_KEY = 'resume-edit:unlocked';
  const DATA_KEY = 'resume-edit:' + location.pathname;

  const page = document.querySelector('.page');
  if (!page) return;

  // Always apply saved edits for the owner's browser (localStorage is per-origin).
  const saved = localStorage.getItem(DATA_KEY);
  if (saved) page.innerHTML = saved;

  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function tryUnlock() {
    const phrase = prompt('Passphrase:');
    if (!phrase) return false;
    const h = await sha256(phrase);
    if (h === PASS_HASH) {
      localStorage.setItem(UNLOCK_KEY, '1');
      return true;
    }
    alert('Nope.');
    return false;
  }

  function isUnlocked() {
    return localStorage.getItem(UNLOCK_KEY) === '1';
  }

  function mountEditor() {
    const bar = document.createElement('div');
    bar.id = 'editBar';
    bar.style.cssText =
      'position:fixed;top:20px;left:20px;display:flex;gap:8px;z-index:1000;font-family:Inter,sans-serif;';
    bar.innerHTML = `
      <button id="editToggle" style="padding:10px 16px;font-size:13px;font-weight:600;border:1px solid #2563eb;background:#fff;color:#2563eb;border-radius:6px;cursor:pointer;box-shadow:0 2px 8px rgba(37,99,235,0.15);">Edit</button>
      <button id="editReset" style="padding:10px 16px;font-size:13px;font-weight:600;border:1px solid #e2e8f0;background:#fff;color:#64748b;border-radius:6px;cursor:pointer;display:none;">Reset</button>
      <button id="editExport" style="padding:10px 16px;font-size:13px;font-weight:600;border:1px solid #e2e8f0;background:#fff;color:#64748b;border-radius:6px;cursor:pointer;display:none;">Export HTML</button>
      <button id="editLock" style="padding:10px 12px;font-size:13px;font-weight:600;border:1px solid #e2e8f0;background:#fff;color:#64748b;border-radius:6px;cursor:pointer;" title="Lock editor">🔒</button>
      <span id="editStatus" style="align-self:center;font-size:11px;color:#64748b;display:none;">saved</span>
    `;
    document.body.appendChild(bar);

    const toggle = document.getElementById('editToggle');
    const reset = document.getElementById('editReset');
    const exportBtn = document.getElementById('editExport');
    const lock = document.getElementById('editLock');
    const status = document.getElementById('editStatus');

    let editing = false;
    let saveTimer;

    toggle.addEventListener('click', () => {
      editing = !editing;
      page.contentEditable = editing;
      page.style.outline = editing ? '2px dashed #2563eb' : '';
      page.style.outlineOffset = editing ? '4px' : '';
      toggle.textContent = editing ? 'Done' : 'Edit';
      toggle.style.background = editing ? '#2563eb' : '#fff';
      toggle.style.color = editing ? '#fff' : '#2563eb';
      reset.style.display = editing ? 'inline-block' : 'none';
      exportBtn.style.display = editing ? 'inline-block' : 'none';
      status.style.display = editing ? 'inline' : 'none';
    });

    page.addEventListener('input', () => {
      clearTimeout(saveTimer);
      status.textContent = 'saving…';
      saveTimer = setTimeout(() => {
        localStorage.setItem(DATA_KEY, page.innerHTML);
        status.textContent = 'saved';
      }, 300);
    });

    reset.addEventListener('click', () => {
      if (confirm('Discard all edits on this page and reload?')) {
        localStorage.removeItem(DATA_KEY);
        location.reload();
      }
    });

    exportBtn.addEventListener('click', () => {
      page.contentEditable = false;
      const clone = document.documentElement.cloneNode(true);
      const cloneBar = clone.querySelector('#editBar');
      if (cloneBar) cloneBar.remove();
      const scripts = clone.querySelectorAll('script[src*="editor.js"]');
      scripts.forEach(s => s.remove());
      const html = '<!DOCTYPE html>\n' + clone.outerHTML;
      const blob = new Blob([html], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (location.pathname.split('/').pop() || 'resume.html').replace(/\.html$/, '') + '-edited.html';
      a.click();
      page.contentEditable = editing;
    });

    lock.addEventListener('click', () => {
      if (confirm('Lock the editor? You\'ll need the passphrase again.')) {
        localStorage.removeItem(UNLOCK_KEY);
        bar.remove();
        page.contentEditable = false;
        page.style.outline = '';
      }
    });

    const style = document.createElement('style');
    style.textContent = '@media print { #editBar { display:none !important; } }';
    document.head.appendChild(style);
  }

  // Unlock via keystroke (Cmd/Ctrl+Shift+E) or ?edit=1 in the URL.
  const urlWantsEdit = new URLSearchParams(location.search).get('edit') === '1';

  async function handleUnlockRequest() {
    if (isUnlocked() || (await tryUnlock())) {
      if (!document.getElementById('editBar')) mountEditor();
    }
  }

  if (isUnlocked()) {
    mountEditor();
  } else if (urlWantsEdit) {
    handleUnlockRequest();
  }

  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
      e.preventDefault();
      handleUnlockRequest();
    }
  });
})();
