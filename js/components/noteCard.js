/* =============================================================
   ExMnotes — Note Card Component
   ============================================================= */

import { t, formatDate } from '../i18n.js';

/**
 * @param {import('../data/schema.js').Note} note
 * @param {Record<string,import('../data/schema.js').Tag>} tagsMap
 * @param {{ onClick?: Function }} [opts]
 * @returns {HTMLElement}
 */
export function renderNoteCard(note, tagsMap = {}, opts = {}) {
  const el = document.createElement('article');
  el.className = 'card note-card stagger-item';
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', note.title || t('navCapture'));

  const stageKey = { seed: 'stageSeed', sprout: 'stageSprout', mature: 'stageMature' }[note.stage] || 'stageSeed';
  const stageClass = note.stage || 'seed';

  // Thumbnail
  const thumb = note.imageData
    ? `<img class="note-card-thumb" src="${note.imageData}" alt="" loading="lazy" />`
    : '';

  // Tags (show max 2)
  const tags = (note.tags || [])
    .slice(0, 2)
    .map((tid) => {
      const tag = tagsMap[tid];
      if (!tag) return '';
      return `<span class="tag-chip" style="border-color:${tag.color};color:${tag.color};">${tag.name}</span>`;
    }).join('');

  // Links count
  const linkCount = (note.links || []).length;
  const linkBadge = linkCount > 0
    ? `<span class="link-badge">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
        ${linkCount}
      </span>`
    : '';

  el.innerHTML = `
    ${thumb}
    <h3 class="note-card-title truncate">${escapeHtml(note.title || '—')}</h3>
    ${note.body
      ? `<p class="note-card-body clamp-2">${escapeHtml(note.body)}</p>`
      : ''}
    <div class="note-card-footer">
      <span class="stage-badge ${stageClass}">${t(stageKey)}</span>
      ${linkBadge}
    </div>
    ${tags ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:var(--sp-1);">${tags}</div>` : ''}
    <span class="note-card-meta text-xs text-faint" style="display:block;margin-top:var(--sp-1);">${formatDate(note.updated)}</span>
  `;

  const handleOpen = () => opts.onClick?.(note);
  el.addEventListener('click', handleOpen);
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') handleOpen(); });

  return el;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
