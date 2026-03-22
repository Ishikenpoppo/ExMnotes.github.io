/* =============================================================
   ExMnotes — Bottom Bar Component
   ============================================================= */

import { t } from '../i18n.js';
import { iconMind, iconArchive, iconCapture, iconGraph, iconReview } from './icons.js';

const TABS = [
  { id: 'home',    icon: () => iconMind({ size: 22, cls: 'tab-icon' }),    label: () => t('navHome') },
  { id: 'library', icon: () => iconArchive({ size: 22, cls: 'tab-icon' }), label: () => t('navLibrary') },
  {
    id: 'capture',
    label: () => t('navCapture'),
    isFab: true,
    icon: () => iconCapture({ size: 22, fill: 'white', stroke: 'white' }),
  },
  { id: 'graph',   icon: () => iconGraph({ size: 22, cls: 'tab-icon' }),   label: () => t('navGraph') },
  { id: 'review',  icon: () => iconReview({ size: 22, cls: 'tab-icon' }),  label: () => t('navReview') },
];

let _currentRoute = 'home';

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
          <div class="fab-circle" aria-hidden="true">${tab.icon()}</div>
          <span class="tab-label">${tab.label()}</span>
        </button>`;
      }
      return `<button
        class="nav-tab${_currentRoute === tab.id ? ' active' : ''}"
        data-route="${tab.id}"
        aria-label="${tab.label()}"
        aria-current="${_currentRoute === tab.id ? 'page' : 'false'}">
        ${tab.icon()}
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
