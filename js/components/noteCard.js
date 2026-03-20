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

  // Audio badge
  const audioBadge = note.audioData
    ? `<span class="audio-badge">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
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
      <div style="display:flex;align-items:center;gap:var(--sp-2);">${linkBadge}${audioBadge}</div>
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
