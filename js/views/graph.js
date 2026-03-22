/* =============================================================
   ExMnotes — Graph View
   Force-directed cognitive map
   ============================================================= */

import { t }                from '../i18n.js';
import * as store           from '../store.js';
import { GraphRenderer }    from '../components/graphRenderer.js';
import { openNoteEditor }   from '../components/noteEditor.js';
import { navigate }         from '../router.js';
import { iconEmptyWeb, iconLink } from '../components/icons.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

let _renderer  = null;
let _hovercard = null;

export function render(container) {
  container.innerHTML = loadingHTML();
  loadData(container);
}

export function teardown() {
  _renderer?.destroy();
  _renderer = null;
  _hovercard = null;
}

async function loadData(container) {
  const [{ nodes, edges }, tagsMap, allTags] = await Promise.all([
    store.getGraphData(),
    store.getTagsMap(),
    store.getAllTags(),
  ]);

  container.innerHTML = buildHTML(allTags);

  const graphContainer = container.querySelector('.graph-container');
  const svgEl          = container.querySelector('#graph-svg');

  if (!nodes.length) {
    const empty = document.createElement('div');
    empty.className = 'graph-empty';
    empty.innerHTML = `
      <span style="font-size:3rem;opacity:0.4;">${iconEmptyWeb()}</span>
      <p class="text-muted text-sm" style="max-width:24ch;text-align:center;">${t('graphEmpty').replace('\n','<br>')}</p>
      <button class="btn btn-primary btn-sm" id="btn-graph-capture">${t('navCapture')}</button>`;
    graphContainer?.appendChild(empty);
    graphContainer?.querySelector('#btn-graph-capture')?.addEventListener('click', () => navigate('#capture'));
    return;
  }

  _renderer = new GraphRenderer(svgEl, { nodes, edges }, {
    onNodeClick:    (n) => showHovercard(container, n, tagsMap),
    onNodeDblClick: (n) => {
      removeHovercard();
      openNoteEditor(n.id);
    },
  });

  // Give layout a moment then center
  setTimeout(() => _renderer?.recenter(), 100);

  bindControls(container, allTags);
}

function buildHTML(allTags) {
  return `
  <div class="view-panel view-enter">
    <div class="view-header">
      <h1>${t('graphTitle')}</h1>
      <div class="header-actions">
        <button class="icon-btn" id="btn-reheat" title="Riscalda grafo" aria-label="Riscalda simulazione">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M17 12a5 5 0 1 0-10 0 5 5 0 0 0 10 0zM12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-7 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm14 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>
          </svg>
        </button>
        <button class="icon-btn" id="btn-recenter" title="Centra" aria-label="Centra grafo">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M13 3H11v8H3v2h8v8h2v-8h8v-2h-8z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Graph canvas fills remaining space -->
    <div class="graph-container" id="graph-wrap" style="flex:1;position:relative;">
      <svg id="graph-svg" aria-label="${t('graphTitle')}"></svg>

      <!-- Tag filter bar -->
      ${allTags.length > 0 ? `
      <div class="graph-filter-bar">
        <button class="tag-chip active" data-graph-tag="">All</button>
        ${allTags.map((tag) =>
          `<button class="tag-chip" data-graph-tag="${tag.id}"
            style="border-color:${tag.color};color:${tag.color};">
            ${esc(tag.name)}
          </button>`
        ).join('')}
      </div>` : ''}

      <!-- Zoom controls -->
      <div class="graph-controls">
        <button class="icon-btn" id="btn-zoom-in"  style="background:var(--surface);border:1px solid var(--border-2);width:40px;height:40px;" aria-label="Zoom in">+</button>
        <button class="icon-btn" id="btn-zoom-out" style="background:var(--surface);border:1px solid var(--border-2);width:40px;height:40px;" aria-label="Zoom out">−</button>
      </div>
    </div>
  </div>`;
}

function bindControls(container, allTags) {
  container.querySelector('#btn-reheat')?.addEventListener('click', () => _renderer?.reheat());
  container.querySelector('#btn-recenter')?.addEventListener('click', () => _renderer?.recenter());
  container.querySelector('#btn-zoom-in')?.addEventListener('click', () => _renderer?._zoom(1.2, 0, 0));
  container.querySelector('#btn-zoom-out')?.addEventListener('click', () => _renderer?._zoom(0.83, 0, 0));

  // Tag filter
  container.querySelectorAll('[data-graph-tag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tid = btn.dataset.graphTag || null;
      _renderer?.setFilter(tid);
      container.querySelectorAll('[data-graph-tag]').forEach((b) =>
        b.classList.toggle('active', b.dataset.graphTag === (tid || ''))
      );
    });
  });

  // Click on graph background → remove hovercard
  container.querySelector('.graph-container')?.addEventListener('click', (e) => {
    if (e.target.id === 'graph-svg' || e.target.classList.contains('edge-group')) {
      removeHovercard();
    }
  });
}

function showHovercard(container, note, tagsMap) {
  removeHovercard();
  if (!_renderer) return;

  const graphWrap = container.querySelector('#graph-wrap');
  if (!graphWrap) return;

  // Find DOM node position
  const nodeData = _renderer.nodes.find((n) => n.id === note.id);
  if (!nodeData) return;

  const t_ = _renderer._transform;
  const svgRect = graphWrap.querySelector('#graph-svg').getBoundingClientRect();
  const wrapRect = graphWrap.getBoundingClientRect();
  const screenX = nodeData.x * t_.scale + t_.x + (svgRect.left - wrapRect.left);
  const screenY = nodeData.y * t_.scale + t_.y + (svgRect.top  - wrapRect.top);

  const card = document.createElement('div');
  card.className = 'graph-hovercard';
  card.id = 'graph-hovercard';

  const linkCount = (note.links || []).length;
  card.innerHTML = `
    <div class="hovercard-title">${esc(note.title)}</div>
    ${note.body ? `<div class="hovercard-body clamp-3">${esc(note.body)}</div>` : ''}
    <div class="hovercard-footer">
      <span class="stage-badge ${note.stage}">${t({ seed:'stageSeed', sprout:'stageSprout', mature:'stageMature' }[note.stage] || 'stageSeed')}</span>
      <span class="link-badge">${linkCount > 0 ? `${iconLink({ size: 14 })} ${linkCount}` : ''}</span>
      <button class="btn btn-sm btn-secondary" id="hc-open">${t('graphOpenNote')}</button>
    </div>`;

  // Position near node (avoid overflow)
  const wrapW = wrapRect.width;
  const wrapH = wrapRect.height;
  let left = screenX + 20;
  let top  = screenY - 80;
  if (left + 260 > wrapW) left = screenX - 260;
  if (top < 10)           top  = screenY + 20;
  if (top + 200 > wrapH)  top  = wrapH - 210;
  card.style.left = Math.max(8, left) + 'px';
  card.style.top  = Math.max(8, top)  + 'px';

  graphWrap.appendChild(card);
  _hovercard = card;

  card.querySelector('#hc-open')?.addEventListener('click', () => {
    removeHovercard();
    openNoteEditor(note.id);
  });
}

function removeHovercard() {
  _hovercard?.remove();
  _hovercard = null;
}

function loadingHTML() {
  return `<div class="view-panel">
    <div class="view-header"><h1 class="skeleton" style="width:160px;height:24px;"></h1></div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;">
      <span class="bounce-dot" style="width:12px;height:12px;border-radius:50%;background:var(--accent);display:inline-block;"></span>
    </div>
  </div>`;
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
