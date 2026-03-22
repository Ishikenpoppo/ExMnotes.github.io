/* =============================================================
   ExMnotes — Hash Router
   ============================================================= */

import { renderBottomBar, setActiveTab } from './components/bottomBar.js';
import { isModalOpen, closeModalFromBack } from './components/modal.js';

const ROUTES = {
  home:    () => import('./views/home.js'),
  capture: () => import('./views/capture.js'),
  library: () => import('./views/library.js'),
  graph:   () => import('./views/graph.js'),
  review:  () => import('./views/review.js'),
};

// Tab order (for determining slide direction)
const TAB_ORDER = ['home', 'capture', 'library', 'graph', 'review'];

let _currentRoute  = null;
let _currentModule = null;

/**
 * Navigate to a route
 * @param {string} hash
 * @param {boolean} [replace]
 */
export function navigate(hash, replace = false) {
  const route = hash.replace('#', '') || 'home';
  if (replace) {
    history.replaceState(null, '', '#' + route);
  } else if (route !== _currentRoute) {
    history.pushState(null, '', '#' + route);
  }
  _loadRoute(route);
}

/**
 * Internal: load and render a route
 * @param {string} route
 */
async function _loadRoute(route) {
  const safeRoute = ROUTES[route] ? route : 'home';
  const prevRoute = _currentRoute;
  _currentRoute   = safeRoute;

  // Determine slide direction
  const prevIdx = TAB_ORDER.indexOf(prevRoute);
  const nextIdx = TAB_ORDER.indexOf(safeRoute);
  const direction = prevRoute === null ? 'fade'
    : nextIdx > prevIdx ? 'left'
    : nextIdx < prevIdx ? 'right'
    : 'fade';

  // Update bottom bar
  setActiveTab(safeRoute);

  try {
    // Teardown previous view
    if (_currentModule && typeof _currentModule.teardown === 'function') {
      _currentModule.teardown();
    }

    const viewEl = document.getElementById('view');
    if (!viewEl) return;

    // Load module
    const mod = await ROUTES[safeRoute]();
    _currentModule = mod;

    // Transition
    const startTransition = window.document.startViewTransition
      ? (cb) => document.startViewTransition(cb)
      : (cb) => { cb(); return { finished: Promise.resolve() }; };

    startTransition(() => {
      // Clear old content
      viewEl.innerHTML = '';

      // Get animation classes
      const enterClass = direction === 'left'  ? 'slide-left-enter'
                       : direction === 'right' ? 'slide-right-enter'
                       : 'fade-enter';

      // Render new view
      const panel = document.createElement('div');
      panel.className = `view-panel ${enterClass}`;
      panel.id = `view-${safeRoute}`;
      panel.setAttribute('data-view', safeRoute);
      viewEl.appendChild(panel);

      mod.render(panel);
    });
  } catch (err) {
    console.error('[Router] Failed to load route:', safeRoute, err);
  }
}

/**
 * Initialize router — read current hash and listen for popstate
 */
export function initRouter() {
  renderBottomBar();

  window.addEventListener('popstate', () => {
    // If a modal is open, close it instead of navigating
    if (isModalOpen()) {
      closeModalFromBack();
      return;
    }
    const hash = location.hash.replace('#', '') || 'home';
    _loadRoute(hash);
  });

  // Initial load
  const initial = location.hash.replace('#', '') || 'home';
  _loadRoute(initial);
}

/**
 * Get current route name
 */
export function getCurrentRoute() {
  return _currentRoute;
}

/**
 * Reload current view (e.g. after data change)
 */
export function reloadView() {
  if (_currentRoute) _loadRoute(_currentRoute);
}
