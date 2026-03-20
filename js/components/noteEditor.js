/* =============================================================
   ExMnotes — Note Editor (Modal Drawer)
   ============================================================= */

import { t, formatDate }       from '../i18n.js';
import { openModal, closeModal } from './modal.js';
import { showToast }            from './toast.js';
import * as store               from '../store.js';
import { reloadView }           from '../router.js';

/**
 * Open note editor modal
 * @param {string|null} noteId — null to create new
 * @param {Partial<import('../data/schema.js').Note>} [prefill]
 */
export async function openNoteEditor(noteId = null, prefill = {}) {
  const isNew = !noteId;
  const [note, allNotes, tagsMap, conns] = await Promise.all([
    noteId ? store.getNoteById(noteId) : Promise.resolve(null),
    store.getAllNotes(),
    store.getTagsMap(),
    noteId ? store.getConnectionsForNote(noteId) : Promise.resolve({ incoming: [], outgoing: [] }),
  ]);

  const data = note
    ? { ...note }
    : { title: prefill.title || '', body: prefill.body || '', tags: [], links: [], stage: 'seed', imageData: null };

  // Local mutable state
  let localTags  = [...(data.tags  || [])];
  let localLinks = [...(data.links || [])];
  let localImage = data.imageData || null;
  let localStage = data.stage || 'seed';
  let localTitle = data.title || '';
  let localBody  = data.body  || '';

  const backlinks = conns.incoming;

  openModal(buildHTML(data, allNotes, tagsMap, backlinks, conns.outgoing));

  const mc = document.getElementById('modal-content');

  /* ── Bind fields ── */
  const titleInput = mc.querySelector('#editor-title');
  const bodyInput  = mc.querySelector('#editor-body');

  titleInput?.addEventListener('input', (e) => { localTitle = e.target.value; });
  bodyInput?.addEventListener('input',  (e) => {
    localBody = e.target.value;
    // auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, window.innerHeight * 0.4) + 'px';
  });

  /* ── Stage selector ── */
  mc.querySelectorAll('.stage-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      localStage = btn.dataset.stage;
      mc.querySelectorAll('.stage-option').forEach((b) =>
        b.classList.toggle('selected', b.dataset.stage === localStage)
      );
    });
  });

  /* ── Image handling ── */
  mc.querySelector('#editor-img-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      localImage = re.target.result;
      renderImagePreview(mc, localImage);
    };
    reader.readAsDataURL(file);
  });

  mc.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="remove-image"]')) {
      localImage = null;
      mc.querySelector('.image-preview')?.remove();
    }
  });

  /* ── Tags ── */
  const tagInput = mc.querySelector('#editor-tag-input');
  tagInput?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const name = tagInput.value.trim().replace(',', '');
      if (!name) return;
      const tag = await store.upsertTag(name);
      if (!localTags.includes(tag.id)) {
        localTags.push(tag.id);
        renderTagChips(mc, localTags, await store.getTagsMap(), (id) => {
          localTags = localTags.filter((t) => t !== id);
        });
      }
      tagInput.value = '';
    }
  });

  mc.addEventListener('click', async (e) => {
    const removeBtn = e.target.closest('[data-remove-tag]');
    if (removeBtn) {
      const tid = removeBtn.dataset.removeTag;
      localTags = localTags.filter((t) => t !== tid);
      const map  = await store.getTagsMap();
      renderTagChips(mc, localTags, map, (id) => {
        localTags = localTags.filter((t) => t !== id);
      });
    }
  });

  /* ── Add link ── */
  mc.querySelector('[data-action="add-link"]')?.addEventListener('click', () => {
    showLinkSearch(mc, allNotes, localLinks, async (targetId) => {
      if (localLinks.includes(targetId)) return;
      localLinks.push(targetId);
      if (noteId) await store.linkNotes(noteId, targetId);
      renderLinkList(mc, localLinks, await store.getAllNotes());
    });
  });

  mc.addEventListener('click', async (e) => {
    const unlinkBtn = e.target.closest('[data-unlink]');
    if (unlinkBtn) {
      const tid = unlinkBtn.dataset.unlink;
      localLinks = localLinks.filter((l) => l !== tid);
      if (noteId) await store.unlinkNotes(noteId, tid);
      renderLinkList(mc, localLinks, await store.getAllNotes());
    }
    // Backlink navigation
    const backlinkBtn = e.target.closest('[data-open-backlink]');
    if (backlinkBtn) {
      closeModal();
      setTimeout(() => openNoteEditor(backlinkBtn.dataset.openBacklink), 200);
    }
  });

  /* ── Save ── */
  mc.querySelector('[data-action="save-note"]')?.addEventListener('click', async () => {
    if (!localTitle.trim()) {
      titleInput?.focus();
      titleInput?.setAttribute('placeholder', '⚠ ' + t('capturePlaceholder'));
      return;
    }
    try {
      const payload = {
        id:        data.id,
        title:     localTitle.trim(),
        body:      localBody.trim(),
        tags:      localTags,
        links:     localLinks,
        stage:     localStage,
        imageData: localImage,
      };
      if (isNew) {
        const saved = await store.saveNote(payload);
        // Create connections
        await Promise.all(localLinks.map((l) => store.linkNotes(saved.id, l)));
      } else {
        await store.updateNote(noteId, payload);
        // Sync connections
        const existing   = conns.outgoing.map((c) => c.to);
        const toAdd      = localLinks.filter((l) => !existing.includes(l));
        const toRemove   = existing.filter((l)  => !localLinks.includes(l));
        await Promise.all([
          ...toAdd.map((l)    => store.linkNotes(noteId, l)),
          ...toRemove.map((l) => store.unlinkNotes(noteId, l)),
        ]);
      }
      showToast(t('toastSaved'), 'success');
      closeModal();
      reloadView();
    } catch (err) {
      console.error(err);
      showToast(t('toastError'), 'error');
    }
  });

  /* ── Delete ── */
  mc.querySelector('[data-action="delete-note"]')?.addEventListener('click', async () => {
    if (!confirm(t('editorDeleteConfirm'))) return;
    await store.deleteNote(noteId);
    showToast(t('toastDeleted'), 'info');
    closeModal();
    reloadView();
  });
}

/* ─────────────────────────────────── HTML ─────────────────────────────────── */

function buildHTML(data, allNotes, tagsMap, backlinks, outgoing) {
  const stage = data.stage || 'seed';
  const outIds = outgoing.map((c) => c.to);

  const tagChips = (data.tags || []).map((tid) => {
    const tag = tagsMap[tid];
    if (!tag) return '';
    return `<span class="tag-chip" style="border-color:${tag.color};color:${tag.color};">
      ${escHtml(tag.name)}
      <button class="chip-remove" data-remove-tag="${tid}" aria-label="Rimuovi tag">×</button>
    </span>`;
  }).join('');

  const linkItems = outIds.map((lid) => {
    const linked = allNotes.find((n) => n.id === lid);
    if (!linked) return '';
    return `<div class="backlink-item">
      <span class="text-sm fw-medium">${escHtml(linked.title)}</span>
      <button class="icon-btn backlink-arrow" data-unlink="${lid}" aria-label="Scollega">×</button>
    </div>`;
  }).join('');

  const backlinkItems = backlinks.map((c) => {
    const src = allNotes.find((n) => n.id === c.from);
    if (!src) return '';
    return `<div class="backlink-item" data-open-backlink="${src.id}" role="button" tabindex="0">
      <span class="text-sm">${escHtml(src.title)}</span>
      <span class="backlink-arrow">↗</span>
    </div>`;
  }).join('');

  const imageSection = data.imageData
    ? `<div class="image-preview" id="img-preview-wrap">
        <img src="${data.imageData}" alt="" />
        <button class="preview-remove" data-action="remove-image" aria-label="${t('editorRemoveImage')}">×</button>
      </div>`
    : '';

  return `
    <div class="modal-header">
      <h2 class="modal-title">${data.id ? t('editorTitle') : t('captureTitle')}</h2>
      <div style="display:flex;gap:var(--sp-2);">
        ${data.id ? `<button class="btn btn-sm btn-danger" data-action="delete-note">${t('editorDelete')}</button>` : ''}
        <button class="icon-btn" data-action="close-modal" aria-label="${t('close')}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Title -->
    <div class="field-group" style="margin-bottom:var(--sp-4);">
      <input id="editor-title" class="field-input" style="font-size:var(--text-lg);font-weight:var(--fw-semibold);"
        type="text" placeholder="${t('capturePlaceholder')}" value="${escHtml(data.title || '')}" autocomplete="off" />
    </div>

    <!-- Body -->
    <div class="field-group" style="margin-bottom:var(--sp-4);">
      <textarea id="editor-body" class="field-input field-textarea"
        placeholder="${t('captureBodyPh')}">${escHtml(data.body || '')}</textarea>
    </div>

    <!-- Image -->
    <div class="field-group" style="margin-bottom:var(--sp-4);">
      <span class="section-label">${t('editorImage')}</span>
      ${imageSection}
      <label class="btn btn-secondary btn-sm" style="cursor:pointer;width:fit-content;">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        ${t('capturePhoto')}
        <input type="file" id="editor-img-input" accept="image/*" capture="environment" style="display:none;" />
      </label>
    </div>

    <!-- Stage -->
    <div class="field-group" style="margin-bottom:var(--sp-4);">
      <span class="section-label">${t('editorStage')}</span>
      <div class="stage-selector">
        ${['seed','sprout','mature'].map((s) => `
          <button class="stage-option ${s}${stage === s ? ' selected' : ''}" data-stage="${s}">
            <span class="stage-emoji">${s === 'seed' ? '🌱' : s === 'sprout' ? '🌿' : '🌳'}</span>
            <span class="stage-name">${t(s === 'seed' ? 'stageSeed' : s === 'sprout' ? 'stageSprout' : 'stageMature')}</span>
          </button>`).join('')}
      </div>
    </div>

    <!-- Tags -->
    <div class="field-group" style="margin-bottom:var(--sp-4);">
      <span class="section-label">Tags</span>
      <div id="editor-tags" style="display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-bottom:var(--sp-2);">${tagChips}</div>
      <input id="editor-tag-input" class="field-input" type="text"
        placeholder="${t('captureAddTag')}" autocomplete="off" />
    </div>

    <!-- Linked to -->
    <div class="field-group" style="margin-bottom:var(--sp-4);">
      <span class="section-label">${t('editorLinks')}</span>
      <div id="editor-links" class="backlink-list">${linkItems || `<p class="text-xs text-faint">${t('editorNoBacklinks')}</p>`}</div>
      <button class="btn btn-secondary btn-sm" data-action="add-link" style="margin-top:var(--sp-2);">
        ${t('editorAddLink')}
      </button>
    </div>

    <!-- Backlinks -->
    ${backlinks.length ? `
    <div class="field-group" style="margin-bottom:var(--sp-4);">
      <span class="section-label">${t('editorBacklinks')}</span>
      <div class="backlink-list">${backlinkItems}</div>
    </div>` : ''}

    <!-- Save -->
    <button class="btn btn-primary btn-full" data-action="save-note">${t('editorSave')}</button>
    <div style="height:var(--sp-4);"></div>
  `;
}

/* ── Partial re-renders ── */
function renderImagePreview(mc, imageData) {
  mc.querySelector('.image-preview')?.remove();
  if (!imageData) return;
  const wrap = mc.querySelector('#img-preview-wrap') || (() => {
    const d = document.createElement('div');
    d.id = 'img-preview-wrap';
    d.className = 'image-preview';
    const label = mc.querySelector('label[style*="cursor:pointer"]');
    label?.before(d);
    return d;
  })();
  wrap.innerHTML = `
    <img src="${imageData}" alt="" />
    <button class="preview-remove" data-action="remove-image">×</button>
  `;
  wrap.id = 'img-preview-wrap';
  if (!wrap.parentNode) {
    const label = mc.querySelector('label[style*="cursor:pointer"]');
    label?.before(wrap);
  }
}

function renderTagChips(mc, tagIds, tagsMap, onRemove) {
  const container = mc.querySelector('#editor-tags');
  if (!container) return;
  container.innerHTML = tagIds.map((tid) => {
    const tag = tagsMap[tid];
    if (!tag) return '';
    return `<span class="tag-chip" style="border-color:${tag.color};color:${tag.color};">
      ${escHtml(tag.name)}
      <button class="chip-remove" data-remove-tag="${tid}">×</button>
    </span>`;
  }).join('');
}

function renderLinkList(mc, linkIds, allNotes) {
  const container = mc.querySelector('#editor-links');
  if (!container) return;
  if (!linkIds.length) {
    container.innerHTML = `<p class="text-xs text-faint">${t('editorNoBacklinks')}</p>`;
    return;
  }
  container.innerHTML = linkIds.map((lid) => {
    const linked = allNotes.find((n) => n.id === lid);
    if (!linked) return '';
    return `<div class="backlink-item">
      <span class="text-sm fw-medium">${escHtml(linked.title)}</span>
      <button class="icon-btn backlink-arrow" data-unlink="${lid}">×</button>
    </div>`;
  }).join('');
}

function showLinkSearch(mc, allNotes, excludeIds, onSelect) {
  const searchEl = document.createElement('div');
  searchEl.style.cssText = 'margin:var(--sp-3) 0;';
  searchEl.innerHTML = `
    <input class="field-input" id="link-search-input" type="text"
      placeholder="${t('captureAddLink')}" autocomplete="off" style="margin-bottom:var(--sp-2);" />
    <div id="link-search-results" class="backlink-list"></div>
  `;
  mc.querySelector('[data-action="add-link"]')?.after(searchEl);

  const input   = searchEl.querySelector('#link-search-input');
  const results = searchEl.querySelector('#link-search-results');

  input.focus();
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    const matches = allNotes
      .filter((n) => !excludeIds.includes(n.id) && n.title.toLowerCase().includes(q))
      .slice(0, 5);
    results.innerHTML = matches.map((n) =>
      `<div class="backlink-item" data-select-link="${n.id}" role="button" tabindex="0">
        <span class="text-sm">${escHtml(n.title)}</span>
        <span class="backlink-arrow">+</span>
      </div>`
    ).join('') || `<p class="text-xs text-faint">${t('libraryEmpty').split('\n')[0]}</p>`;

    results.querySelectorAll('[data-select-link]').forEach((item) => {
      item.addEventListener('click', () => {
        onSelect(item.dataset.selectLink);
        searchEl.remove();
      });
    });
  });
  // Show all initially
  input.dispatchEvent(new Event('input'));
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
