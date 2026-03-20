/* =============================================================
   ExMnotes — Home View
   "Snapshot Cognitivo" — Overview + recent notes + stats
   ============================================================= */

import { t, formatDate }    from '../i18n.js';
import * as store            from '../store.js';
import { renderNoteCard }    from '../components/noteCard.js';
import { openNoteEditor }    from '../components/noteEditor.js';
import { navigate }          from '../router.js';

export function render(container) {
  container.innerHTML = loadingHTML();
  loadData(container);
}

export function teardown() {}

async function loadData(container) {
  const stats = await store.getStats();
  container.innerHTML = buildHTML(stats);
  bindEvents(container, stats);
}

function loadingHTML() {
  return `<div class="view-panel">
    <div class="view-header"><h1 class="skeleton" style="width:140px;height:24px;border-radius:4px;"></h1></div>
    <div class="view-body">
      <div class="skeleton" style="height:100px;border-radius:12px;"></div>
      <div class="skeleton" style="height:80px;border-radius:12px;"></div>
    </div>
  </div>`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return t('homeGreetMorning');
  if (h < 18) return t('homeGreetAfternoon');
  return t('homeGreetEvening');
}

function buildHTML(stats) {
  const { totalNotes, totalConnections, byStage, dueTodayCount, recentNotes } = stats;
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  // Stage bar inline SVG
  const total = totalNotes || 1;
  const seedPct   = ((byStage.seed   || 0) / total * 100).toFixed(1);
  const sproutPct = ((byStage.sprout || 0) / total * 100).toFixed(1);
  const maturePct = ((byStage.mature || 0) / total * 100).toFixed(1);

  const recentHTML = recentNotes.length === 0
    ? `<p class="text-faint text-sm" style="padding:var(--sp-8) 0;text-align:center;">${t('homeNoNotes')}</p>`
    : recentNotes.map((n) => `
        <div class="card" style="min-width:160px;max-width:180px;flex-shrink:0;padding:var(--sp-3);" data-note-id="${n.id}">
          <h4 class="truncate text-sm fw-semibold" style="margin-bottom:var(--sp-1);">${esc(n.title)}</h4>
          ${n.body ? `<p class="text-xs text-muted clamp-2">${esc(n.body)}</p>` : ''}
          <div style="margin-top:var(--sp-2);">
            <span class="stage-badge ${n.stage}">${t({ seed:'stageSeed', sprout:'stageSprout', mature:'stageMature' }[n.stage])}</span>
          </div>
        </div>`).join('');

  return `<div class="view-panel view-enter">
    <!-- Header -->
    <div class="view-header">
      <div style="flex:1;">
        <p class="text-xs text-faint">${today}</p>
        <h1>${getGreeting()}</h1>
      </div>
      <button class="icon-btn" data-action="open-settings" aria-label="${t('openSettings')}">
        ${iconSettings()}
      </button>
    </div>

    <div class="view-body">

      <!-- Epigraph -->
      <div class="home-epigraph stagger-item">
        <blockquote>&#8220;Where does the mind stop and the rest of the world?&#8221;</blockquote>
        <cite>&#8212; Clark &amp; Chalmers, <em>The Extended Mind</em> (1998)</cite>
      </div>

      <!-- Cognitive Snapshot -->
      <div class="section stagger-item">
        <span class="section-label">${t('homeCogSnapshot')}</span>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-3);">
          <div class="stat-card">
            <span class="stat-value">${totalNotes}</span>
            <span class="stat-label">${t('homeNotes')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${totalConnections}</span>
            <span class="stat-label">${t('homeLinks')}</span>
          </div>
          <div class="stat-card" id="due-card" style="cursor:pointer;${dueTodayCount > 0 ? 'border-color:var(--accent);' : ''}">
            <span class="stat-value" style="${dueTodayCount > 0 ? 'color:var(--amber);' : ''}">${dueTodayCount}</span>
            <span class="stat-label">${t('homeDueToday')}</span>
          </div>
        </div>
      </div>

      <!-- Stage progress bar -->
      ${totalNotes > 0 ? `
      <div class="section stagger-item">
        <span class="section-label">${t('homeStages')}</span>
        <div style="display:flex;flex-direction:column;gap:var(--sp-2);">
          ${stageRow('seed',   byStage.seed   || 0, seedPct)}
          ${stageRow('sprout', byStage.sprout || 0, sproutPct)}
          ${stageRow('mature', byStage.mature || 0, maturePct)}
        </div>
      </div>` : ''}

      <!-- Recent Notes (horizontal strip) -->
      <div class="section stagger-item">
        <div class="flex items-center justify-between">
          <span class="section-label">${t('homeRecentNotes')}</span>
          <button class="btn btn-ghost btn-sm text-accent" id="btn-see-all">Tutte →</button>
        </div>
        <div class="h-strip" style="margin:0 calc(-1 * var(--view-padding));padding:var(--sp-2) var(--view-padding);">
          ${recentHTML}
        </div>
      </div>

    </div>
  </div>`;
}

function stageRow(stage, count, pct) {
  const color = { seed: 'var(--stage-seed)', sprout: 'var(--stage-sprout)', mature: 'var(--stage-mature)' }[stage];
  const label = t({ seed: 'stageSeed', sprout: 'stageSprout', mature: 'stageMature' }[stage]);
  return `<div style="display:flex;align-items:center;gap:var(--sp-3);">
    <span class="text-xs fw-medium" style="width:64px;color:${color};">${label}</span>
    <div class="progress-bar" style="flex:1;">
      <div class="progress-bar-fill" style="width:${pct}%;background:${color};"></div>
    </div>
    <span class="text-xs text-faint" style="width:28px;text-align:right;">${count}</span>
  </div>`;
}

function bindEvents(container, stats) {
  // Due today card → review
  container.querySelector('#due-card')?.addEventListener('click', () => navigate('#review'));

  // See all → library
  container.querySelector('#btn-see-all')?.addEventListener('click', () => navigate('#library'));

  // Recent note cards
  container.querySelectorAll('[data-note-id]').forEach((card) => {
    card.addEventListener('click', () => openNoteEditor(card.dataset.noteId));
  });
}

function iconSettings() {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
  </svg>`;
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
