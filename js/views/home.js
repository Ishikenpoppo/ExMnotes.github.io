/* =============================================================
   ExMnotes — Home View
   "Snapshot Cognitivo" — Overview + recent notes + stats
   ============================================================= */

import { t, formatDate }    from '../i18n.js';
import * as store            from '../store.js';
import { renderNoteCard }    from '../components/noteCard.js';
import { openNoteEditor }    from '../components/noteEditor.js';
import { navigate }          from '../router.js';
import { iconSettings }      from '../components/icons.js';

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
    ? `<p class="text-faint text-sm home-no-notes">${t('homeNoNotes')}</p>`
    : recentNotes.map((n) => `
        <div class="card home-recent-card" data-note-id="${n.id}">
          <h4 class="truncate text-sm fw-semibold">${esc(n.title)}</h4>
          ${n.body ? `<p class="text-xs text-muted clamp-2">${esc(n.body)}</p>` : ''}
          <div class="stage-wrap">
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
        ${iconSettings({ size: 20 })}
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
        <div class="home-stats-grid">
          <div class="stat-card">
            <span class="stat-value">${totalNotes}</span>
            <span class="stat-label">${t('homeNotes')}</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${totalConnections}</span>
            <span class="stat-label">${t('homeLinks')}</span>
          </div>
          <div class="stat-card stat-card--due${dueTodayCount > 0 ? ' has-due' : ''}" id="due-card">
            <span class="stat-value">${dueTodayCount}</span>
            <span class="stat-label">${t('homeDueToday')}</span>
          </div>
        </div>
      </div>

      <!-- Stage progress bar -->
      ${totalNotes > 0 ? `
      <div class="section stagger-item">
        <span class="section-label">${t('homeStages')}</span>
        <div class="home-stages-col">
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
        <div class="h-strip home-h-strip-bleed">
          ${recentHTML}
        </div>
      </div>

    </div>
  </div>`;
}

function stageRow(stage, count, pct) {
  const color = { seed: 'var(--stage-seed)', sprout: 'var(--stage-sprout)', mature: 'var(--stage-mature)' }[stage];
  const label = t({ seed: 'stageSeed', sprout: 'stageSprout', mature: 'stageMature' }[stage]);
  return `<div class="home-stage-row">
    <span class="home-stage-label" style="color:${color};">${label}</span>
    <div class="progress-bar" style="flex:1;">
      <div class="progress-bar-fill" style="width:${pct}%;background:${color};"></div>
    </div>
    <span class="home-stage-count">${count}</span>
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

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
