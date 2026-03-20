/* =============================================================
   ExMnotes — Bottom Bar Component
   ============================================================= */

import { t } from '../i18n.js';

const TABS = [
  { id: 'home',    iconPath: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z', label: () => t('navHome') },
  { id: 'library', iconPath: 'M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z', label: () => t('navLibrary') },
  {
    id: 'capture',
    label: () => t('navCapture'),
    isFab: true,
    iconPath: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  },
  { id: 'graph',   iconPath: 'M17 12a5 5 0 1 0-10 0 5 5 0 0 0 10 0zM12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-7 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm14 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z', label: () => t('navGraph') },
  { id: 'review',  iconPath: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z', label: () => t('navReview') },
];

let _currentRoute = 'home';

function buildIcon(path) {
  return `<svg class="tab-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="${path}"/>
  </svg>`;
}

function buildFabIcon(path) {
  return `<svg viewBox="0 0 24 24" fill="white" width="22" height="22" aria-hidden="true">
    <path d="${path}"/>
  </svg>`;
}

export function renderBottomBar() {
  const nav = document.getElementById('bottom-bar');
  if (!nav) return;

  nav.innerHTML = `<div class="bottom-bar-inner">${
    TABS.map((tab) => {
      if (tab.isFab) {
        return `<button
          class="nav-tab nav-fab${_currentRoute === tab.id ? ' active' : ''}"
          data-route="${tab.id}"
          aria-label="${tab.label()}"
          aria-current="${_currentRoute === tab.id ? 'page' : 'false'}">
          <div class="fab-circle" aria-hidden="true">${buildFabIcon(tab.iconPath)}</div>
          <span class="tab-label">${tab.label()}</span>
        </button>`;
      }
      return `<button
        class="nav-tab${_currentRoute === tab.id ? ' active' : ''}"
        data-route="${tab.id}"
        aria-label="${tab.label()}"
        aria-current="${_currentRoute === tab.id ? 'page' : 'false'}">
        ${buildIcon(tab.iconPath)}
        <span class="tab-label">${tab.label()}</span>
      </button>`;
    }).join('')
  }</div>`;

  // Attach click handlers
  nav.querySelectorAll('.nav-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const route = btn.dataset.route;
      import('../router.js').then(({ navigate }) => navigate('#' + route));
    });
  });
}

export function setActiveTab(route) {
  _currentRoute = route;
  const nav = document.getElementById('bottom-bar');
  if (!nav) return;
  nav.querySelectorAll('.nav-tab').forEach((btn) => {
    const isActive = btn.dataset.route === route;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

// Re-render labels on language change
document.addEventListener('langchange', () => renderBottomBar());
