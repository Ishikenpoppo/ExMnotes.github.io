/* =============================================================
   ExMnotes — App Bootstrap
   ============================================================= */

import { initI18n, getLang } from './i18n.js';
import { initRouter }        from './router.js';
import { openDB }            from './db/idb.js';
import { showSettings }      from './components/modal.js';

async function boot() {
  // 1. i18n
  initI18n();

  // 2. Apply saved theme
  const savedTheme = localStorage.getItem('exmnotes-theme') || 'auto';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // 3. Init IndexedDB
  try {
    await openDB();
  } catch (err) {
    console.error('[App] IDB init failed:', err);
  }

  // 4. Init Router (also renders bottom bar)
  initRouter();

  // 5. Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('[App] SW registered:', reg.scope))
      .catch((err) => console.warn('[App] SW registration failed:', err));
  }

  // 6. Listen for language changes — reload current view
  document.addEventListener('langchange', () => {
    import('./router.js').then(({ reloadView }) => reloadView());
  });

  // 7. Handle "Add to Home Screen" prompt
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
  });

  // 8. Global settings button delegate
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="open-settings"]');
    if (btn) showSettings();
  });

  console.log('[ExMnotes] Booted — Extended Mind Laboratory ready ✦');
}

boot().catch(console.error);
