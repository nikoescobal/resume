(function () {
  const key = 'resume-edit:' + location.pathname;
  const page = document.querySelector('.page');
  if (!page) return;

  const saved = localStorage.getItem(key);
  if (saved) page.innerHTML = saved;

  const bar = document.createElement('div');
  bar.id = 'editBar';
  bar.style.cssText =
    'position:fixed;top:20px;left:20px;display:flex;gap:8px;z-index:1000;font-family:Inter,sans-serif;';
  bar.innerHTML = `
    <button id="editToggle" style="padding:10px 16px;font-size:13px;font-weight:600;border:1px solid #2563eb;background:#fff;color:#2563eb;border-radius:6px;cursor:pointer;box-shadow:0 2px 8px rgba(37,99,235,0.15);">Edit</button>
    <button id="editReset" style="padding:10px 16px;font-size:13px;font-weight:600;border:1px solid #e2e8f0;background:#fff;color:#64748b;border-radius:6px;cursor:pointer;display:none;">Reset</button>
    <button id="editExport" style="padding:10px 16px;font-size:13px;font-weight:600;border:1px solid #e2e8f0;background:#fff;color:#64748b;border-radius:6px;cursor:pointer;display:none;">Export HTML</button>
    <span id="editStatus" style="align-self:center;font-size:11px;color:#64748b;display:none;">saved</span>
  `;
  document.body.appendChild(bar);

  const toggle = document.getElementById('editToggle');
  const reset = document.getElementById('editReset');
  const exportBtn = document.getElementById('editExport');
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
      localStorage.setItem(key, page.innerHTML);
      status.textContent = 'saved';
    }, 300);
  });

  reset.addEventListener('click', () => {
    if (confirm('Discard all edits on this page and reload?')) {
      localStorage.removeItem(key);
      location.reload();
    }
  });

  exportBtn.addEventListener('click', () => {
    page.contentEditable = false;
    const clone = document.documentElement.cloneNode(true);
    const cloneBar = clone.querySelector('#editBar');
    if (cloneBar) cloneBar.remove();
    const html = '<!DOCTYPE html>\n' + clone.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (location.pathname.split('/').pop() || 'resume.html').replace(/\.html$/, '') + '-edited.html';
    a.click();
    page.contentEditable = editing;
  });

  const style = document.createElement('style');
  style.textContent = '@media print { #editBar { display:none !important; } }';
  document.head.appendChild(style);
})();
