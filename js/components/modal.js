/* =============================================================
   ExMnotes — Modal / Drawer Component
   ============================================================= */

import { t, setLang, getLang } from '../i18n.js';
import { exportData, importData, clearAllData } from '../store.js';
import { showToast }    from './toast.js';
import { reloadView }   from '../router.js';

const overlay  = document.getElementById('modal-overlay');
const drawer   = document.getElementById('modal-drawer');
const content  = document.getElementById('modal-content');
const handle   = document.getElementById('modal-handle');

const settingsOverlay = document.getElementById('settings-overlay');
const settingsContent  = document.getElementById('settings-content');

/* ── Drag to close ── */
let startY = 0;
let dragging = false;

function setupDragClose(overlayEl, drawerEl) {
  const handleEl = drawerEl.querySelector('.modal-handle');
  if (!handleEl) return;

  handleEl.addEventListener('pointerdown', (e) => {
    startY   = e.clientY;
    dragging = true;
    drawerEl.style.transition = 'none';
    handleEl.setPointerCapture(e.pointerId);
  });
  handleEl.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dy = Math.max(0, e.clientY - startY);
    drawerEl.style.transform = `translateY(${dy}px)`;
  });
  handleEl.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    drawerEl.style.transition = '';
    const dy = Math.max(0, e.clientY - startY);
    if (dy > 80) {
      closeOverlay(overlayEl, drawerEl);
    } else {
      drawerEl.style.transform = '';
    }
  });
}

setupDragClose(overlay, drawer);
setupDragClose(settingsOverlay, settingsOverlay.querySelector('.modal-drawer'));

/* ── Close helpers ── */
function openOverlay(overlayEl) {
  overlayEl.setAttribute('aria-hidden', 'false');
  overlayEl.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeOverlay(overlayEl, drawerEl) {
  overlayEl.classList.remove('open');
  overlayEl.setAttribute('aria-hidden', 'true');
  if (drawerEl) drawerEl.style.transform = '';
  document.body.style.overflow = '';
}

// Click outside to close
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeOverlay(overlay, drawer);
});
settingsOverlay.addEventListener('click', (e) => {
  if (e.target === settingsOverlay) closeModal('settings');
});

/* ── Public: Generic modal ── */
export function openModal(htmlContent) {
  content.innerHTML = htmlContent;
  openOverlay(overlay);
  // Wire close buttons
  content.querySelectorAll('[data-action="close-modal"]').forEach((btn) => {
    btn.addEventListener('click', () => closeOverlay(overlay, drawer));
  });
}

export function closeModal(which = 'main') {
  if (which === 'settings') {
    closeOverlay(settingsOverlay, settingsOverlay.querySelector('.modal-drawer'));
  } else {
    closeOverlay(overlay, drawer);
  }
}

/* ── Settings Panel ── */
export function showSettings() {
  settingsContent.innerHTML = renderSettingsHTML();
  openOverlay(settingsOverlay);
  bindSettingsEvents();
}

function renderSettingsHTML() {
  const lang  = getLang();
  const theme = document.documentElement.getAttribute('data-theme') || 'auto';

  return `
    <div class="modal-header">
      <h2 class="modal-title">${t('settingsTitle')}</h2>
      <button class="icon-btn" data-action="close-settings" aria-label="${t('close')}">
        ${iconClose()}
      </button>
    </div>

    <!-- Theme -->
    <div class="section">
      <span class="section-label">${t('settingsTheme')}</span>
      <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap;">
        ${['auto','light','dark'].map((th) => `
          <button class="tag-chip${theme === th ? ' active' : ''}" data-theme-option="${th}">
            ${th === 'auto' ? t('settingsThemeAuto') : th === 'light' ? t('settingsThemeLight') : t('settingsThemeDark')}
          </button>`).join('')}
      </div>
    </div>

    <div class="divider" style="margin:var(--sp-4) 0;"></div>

    <!-- Language -->
    <div class="section">
      <span class="section-label">${t('settingsLang')}</span>
      <div style="display:flex;gap:var(--sp-2);">
        <button class="tag-chip${lang === 'it' ? ' active' : ''}" data-lang-option="it">Italiano</button>
        <button class="tag-chip${lang === 'en' ? ' active' : ''}" data-lang-option="en">English</button>
      </div>
    </div>

    <div class="divider" style="margin:var(--sp-4) 0;"></div>

    <!-- Data -->
    <div class="section">
      <span class="section-label">Data</span>

      <button class="btn btn-secondary" id="btn-export" style="justify-content:flex-start;gap:var(--sp-3);">
        ${iconDownload()} ${t('settingsExport')}
      </button>

      <label class="btn btn-secondary" style="justify-content:flex-start;gap:var(--sp-3);cursor:pointer;">
        ${iconUpload()} ${t('settingsImport')}
        <input type="file" accept=".json" id="btn-import" style="display:none;" />
      </label>

      <button class="btn btn-danger" id="btn-clear-all" style="justify-content:flex-start;gap:var(--sp-3);">
        ${iconTrash()} ${t('settingsClear')}
      </button>
    </div>

    <div class="divider" style="margin:var(--sp-4) 0;"></div>
    <p class="text-faint text-xs" style="text-align:center;padding-bottom:var(--sp-4);">${t('settingsVersion')}</p>
  `;
}

function bindSettingsEvents() {
  // Close button
  settingsContent.querySelector('[data-action="close-settings"]')?.addEventListener('click', () => closeModal('settings'));

  // Theme
  settingsContent.querySelectorAll('[data-theme-option]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const th = btn.dataset.themeOption;
      document.documentElement.setAttribute('data-theme', th);
      localStorage.setItem('exmnotes-theme', th);
      settingsContent.querySelectorAll('[data-theme-option]').forEach((b) => {
        b.classList.toggle('active', b.dataset.themeOption === th);
      });
    });
  });

  // Language
  settingsContent.querySelectorAll('[data-lang-option]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.langOption);
      closeModal('settings');
    });
  });

  // Export
  settingsContent.querySelector('#btn-export')?.addEventListener('click', async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `exmnotes-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t('toastExported'), 'success');
    } catch { showToast(t('toastError'), 'error'); }
  });

  // Import
  settingsContent.querySelector('#btn-import')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text    = await file.text();
      const payload = JSON.parse(text);
      await importData(payload);
      showToast(t('toastImported'), 'success');
      closeModal('settings');
      reloadView();
    } catch { showToast(t('toastError'), 'error'); }
  });

  // Clear all
  settingsContent.querySelector('#btn-clear-all')?.addEventListener('click', async () => {
    if (!confirm(t('settingsClearConfirm'))) return;
    if (!confirm(t('settingsClearConfirm2'))) return;
    await clearAllData();
    showToast(t('toastCleared'), 'info');
    closeModal('settings');
    reloadView();
  });
}

/* ── SVG icons ── */
function iconClose()    { return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>`; }
function iconDownload() { return `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`; }
function iconUpload()   { return `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M5 20h14v-2H5v2zm7-18l-7 7h4v6h6v-6h4l-7-7z"/></svg>`; }
function iconTrash()    { return `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`; }
