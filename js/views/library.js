/* =============================================================
   ExMnotes — Library View
   Paginated grid of note cards + search + tag filter
   ============================================================= */

import { t }              from '../i18n.js';
import * as store         from '../store.js';
import { renderNoteCard } from '../components/noteCard.js';
import { openNoteEditor } from '../components/noteEditor.js';
import { navigate }       from '../router.js';
import { iconEmptyArchive } from '../components/icons.js';

const PAGE_SIZE = 10;

let _allNotes   = [];
let _filtered   = [];
let _tagsMap    = {};
let _allTags    = [];
let _query      = '';
let _activeTag  = null;
let _page       = 0;
let _container  = null;

export function render(container) {
  _container = container;
  container.innerHTML = loadingHTML();
  loadData(container);
}

export function teardown() { _container = null; }

async function loadData(container) {
  [_allNotes, _tagsMap, _allTags] = await Promise.all([
    store.getAllNotes(),
    store.getTagsMap(),
    store.getAllTags(),
  ]);
  _filtered  = [..._allNotes];
  _query     = '';
  _activeTag = null;
  _page      = 0;
  renderView(container);
}

function renderView(container) {
  const totalPages = Math.max(1, Math.ceil(_filtered.length / PAGE_SIZE));
  const pageNotes  = _filtered.slice(_page * PAGE_SIZE, (_page + 1) * PAGE_SIZE);

  container.innerHTML = `
  <div class="view-panel view-enter">
    <div class="view-header" style="flex-direction:column;align-items:stretch;gap:var(--sp-2);padding-bottom:var(--sp-2);">
      <div style="display:flex;align-items:center;">
        <h1 style="flex:1;">${t('libraryTitle')}</h1>
        <button class="btn btn-primary btn-sm" id="btn-new-note">+ ${t('navCapture')}</button>
      </div>
      <!-- Search -->
      <div class="search-bar">
        <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input id="library-search" class="field-input" type="search"
          placeholder="${t('librarySearch')}" value="${esc(_query)}" autocomplete="off" />
      </div>
      <!-- Tag filter -->
      ${_allTags.length > 0 ? `
      <div class="h-strip" style="margin:0 calc(-1 * var(--sp-4));">
        <button class="tag-chip${!_activeTag ? ' active' : ''}" data-tag-filter="">
          ${t('libraryAllTags')}
        </button>
        ${_allTags.map((tag) =>
          `<button class="tag-chip${_activeTag === tag.id ? ' active' : ''}"
            data-tag-filter="${tag.id}"
            style="border-color:${tag.color};color:${_activeTag === tag.id ? 'white' : tag.color};
                   ${_activeTag === tag.id ? 'background:'+tag.color : ''}">
            ${esc(tag.name)}
          </button>`
        ).join('')}
      </div>` : ''}
    </div>

    <div class="view-body" id="library-body">
      ${_filtered.length === 0
        ? `<div class="empty-state stagger-item">
            <span class="empty-icon">${iconEmptyArchive()}</span>
            <p>${t('libraryEmpty').replace('\n','<br>')}</p>
            <button class="btn btn-primary" id="btn-empty-new">+ ${t('navCapture')}</button>
          </div>`
        : `<div class="card-grid" id="note-grid">
            ${pageNotes.map((n, i) => `<div data-note-slot="${n.id}"></div>`).join('')}
          </div>
          ${totalPages > 1 ? renderPagination(totalPages) : ''}
          `
      }
    </div>
  </div>`;

  // Mount note cards
  const grid = container.querySelector('#note-grid');
  if (grid) {
    pageNotes.forEach((note) => {
      const slot = grid.querySelector(`[data-note-slot="${note.id}"]`);
      if (!slot) return;
      const card = renderNoteCard(note, _tagsMap, {
        onClick: () => openNoteEditor(note.id),
      });
      card.classList.add('stagger-item');
      slot.replaceWith(card);
    });
  }

  bindEvents(container);
}

function renderPagination(totalPages) {
  const dots = Array.from({ length: totalPages }, (_, i) =>
    `<button class="pagination-dot${_page === i ? ' active' : ''}" data-page="${i}" aria-label="Pagina ${i+1}"></button>`
  ).join('');
  return `<div class="pagination">${dots}</div>`;
}

function filterNotes() {
  let result = _allNotes;
  if (_activeTag) result = result.filter((n) => n.tags.includes(_activeTag));
  if (_query.trim()) {
    const q = _query.toLowerCase();
    result = result.filter((n) =>
      n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    );
  }
  _filtered = result;
  _page = 0;
}

function bindEvents(container) {
  // New note
  container.querySelector('#btn-new-note')?.addEventListener('click', () => navigate('#capture'));
  container.querySelector('#btn-empty-new')?.addEventListener('click', () => navigate('#capture'));

  // Search
  const searchInput = container.querySelector('#library-search');
  let searchTimer;
  searchInput?.addEventListener('input', (e) => {
    _query = e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      filterNotes();
      renderView(container);
    }, 250);
  });

  // Tag filter
  container.querySelectorAll('[data-tag-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      _activeTag = btn.dataset.tagFilter || null;
      filterNotes();
      renderView(container);
    });
  });

  // Pagination
  container.querySelectorAll('.pagination-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      _page = parseInt(dot.dataset.page, 10);
      renderView(container);
      container.querySelector('#library-body')?.scrollTo(0, 0);
    });
  });
}

function loadingHTML() {
  return `<div class="view-panel">
    <div class="view-header"><h1 class="skeleton" style="width:120px;height:24px;"></h1></div>
    <div class="view-body">
      <div class="card-grid">
        ${Array(6).fill(`<div class="skeleton" style="height:120px;border-radius:12px;"></div>`).join('')}
      </div>
    </div>
  </div>`;
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
