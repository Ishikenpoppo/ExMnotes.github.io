/* =============================================================
   ExMnotes — App Bootstrap
   ============================================================= */

import { initI18n, getLang, t } from './i18n.js';
import { initRouter }            from './router.js';
import { openDB }                from './db/idb.js';
import { showSettings }          from './components/modal.js';
import { showToast }             from './components/toast.js';

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

  // 5. Register Service Worker with auto-update support
  if ('serviceWorker' in navigator) {
    // Prevent multiple reloads in the same session
    let swRefreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!swRefreshing) {
        swRefreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('[App] SW registered:', reg.scope);

        // Sends SKIP_WAITING to the given waiting worker
        const applyUpdate = (worker) => {
          showToast(t('swUpdateReady'), 'info', 3000);
          setTimeout(() => worker.postMessage({ type: 'SKIP_WAITING' }), 800);
        };

        // Case 1: a new SW is already waiting when the page loads
        if (reg.waiting) {
          applyUpdate(reg.waiting);
        }

        // Case 2: a new SW becomes available while the page is open
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              applyUpdate(newWorker);
            }
          });
        });

        // Periodically check for updates (every 60 min) when the page is visible
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update();
        });
      })
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
