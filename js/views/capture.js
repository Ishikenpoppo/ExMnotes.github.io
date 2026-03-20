/* =============================================================
   ExMnotes — Capture View
   Quick thought capture: text + image + tags + links
   ============================================================= */

import { t }             from '../i18n.js';
import * as store        from '../store.js';
import { showToast }     from '../components/toast.js';
import { navigate }      from '../router.js';

let _container = null;

// Local state
let _title     = '';
let _body      = '';
let _tags      = [];   // tag IDs
let _links     = [];   // note IDs
let _imageData = null;
let _audioData = null;

export function render(container) {
  _container = container;
  reset();
  buildView(container);
}

export function teardown() {
  _container = null;
}

function reset() {
  _title = _body = '';
  _tags  = []; _links = [];
  _imageData = null;
  _audioData = null;
}

async function buildView(container) {
  const allNotes  = await store.getAllNotes();
  const allTags   = await store.getAllTags();

  container.innerHTML = `
  <div class="view-panel view-enter" id="capture-panel">
    <div class="view-header">
      <h1>${t('captureTitle')}</h1>
    </div>

    <div class="view-body" id="capture-body">

      <!-- Title -->
      <div class="field-group">
        <input id="capture-title" class="field-input"
          style="font-size:var(--text-xl);font-weight:var(--fw-bold);background:transparent;border:none;border-bottom:2px solid var(--border-2);border-radius:0;padding:var(--sp-2) 0;"
          type="text" placeholder="${t('capturePlaceholder')}" autocomplete="off" maxlength="120" />
      </div>

      <!-- Body -->
      <div class="field-group">
        <textarea id="capture-body-input" class="field-input field-textarea"
          placeholder="${t('captureBodyPh')}"
          style="background:transparent;border:none;border-bottom:1px solid var(--border);border-radius:0;padding:var(--sp-2) 0;resize:none;"
          rows="3"></textarea>
      </div>

      <!-- Image preview area -->
      <div id="image-area"></div>

      <!-- Audio preview area -->
      <div id="audio-area"></div>

      <!-- ── Stage selector ── -->
      <div class="section">
        <span class="section-label">${t('editorStage')}</span>
        <div class="stage-selector">
          ${['seed','sprout','mature'].map((s, i) => `
            <button class="stage-option ${s}${i === 0 ? ' selected' : ''}" data-stage="${s}">
              <span class="stage-emoji">${s === 'seed' ? '🌱' : s === 'sprout' ? '🌿' : '🌳'}</span>
              <span class="stage-name">${t(s === 'seed' ? 'stageSeed' : s === 'sprout' ? 'stageSprout' : 'stageMature')}</span>
            </button>`).join('')}
        </div>
      </div>

      <!-- Tags -->
      <div class="section">
        <span class="section-label">Tags</span>
        <div id="tags-area" style="display:flex;flex-wrap:wrap;gap:var(--sp-2);margin-bottom:var(--sp-2);">
          <!-- existing popular tags -->
          ${allTags.slice(0, 8).map((tag) =>
            `<button class="tag-chip" data-tag-id="${tag.id}" data-tag-name="${esc(tag.name)}"
              style="border-color:${tag.color};color:${tag.color};">${esc(tag.name)}</button>`
          ).join('')}
        </div>
        <input id="capture-tag-input" class="field-input" type="text"
          placeholder="${t('captureAddTag')}" autocomplete="off" style="border-radius:var(--r-full);font-size:var(--text-sm);" />
      </div>

      <!-- Links -->
      <div class="section">
        <span class="section-label">${t('editorLinks')}</span>
        <div class="search-bar">
          <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input id="capture-link-input" class="field-input" type="text"
            placeholder="${t('captureAddLink')}" autocomplete="off" />
        </div>
        <div id="link-suggestions" class="backlink-list" style="margin-top:var(--sp-2);"></div>
        <div id="selected-links" style="display:flex;flex-wrap:wrap;gap:var(--sp-2);margin-top:var(--sp-2);"></div>
      </div>

    </div>

    <!-- Footer: image + mic + save -->
    <div class="view-footer" style="display:flex;align-items:center;gap:var(--sp-3);">
      <label class="icon-btn" title="${t('capturePhoto')}" style="cursor:pointer;">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
        <input type="file" id="capture-img-input" accept="image/*" capture="environment" style="display:none;" />
      </label>
      <button class="icon-btn capture-record-btn" id="capture-record-btn" title="${t('editorAudio')}">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
      </button>
      <button id="btn-capture-save" class="btn btn-primary" style="flex:1;">
        ${t('captureSave')}
      </button>
    </div>
  </div>`;

  _bindEvents(container, allNotes);
}

let _selectedStage = 'seed';
let _selectedTags  = new Set();
let _selectedLinks = new Set();

function _bindEvents(container, allNotes) {
  const titleInput  = container.querySelector('#capture-title');
  const bodyInput   = container.querySelector('#capture-body-input');
  const tagInput    = container.querySelector('#capture-tag-input');
  const linkInput   = container.querySelector('#capture-link-input');
  const imgInput    = container.querySelector('#capture-img-input');
  const saveBtn     = container.querySelector('#btn-capture-save');
  const tagsArea    = container.querySelector('#tags-area');
  const linkSug     = container.querySelector('#link-suggestions');
  const selLinks    = container.querySelector('#selected-links');
  const imageArea   = container.querySelector('#image-area');
  const audioArea   = container.querySelector('#audio-area');
  const capRecBtn   = container.querySelector('#capture-record-btn');

  // Reset local state
  _selectedStage = 'seed';
  _selectedTags  = new Set();
  _selectedLinks = new Set();

  titleInput?.addEventListener('input', (e) => { _title = e.target.value; });
  bodyInput?.addEventListener('input', (e) => {
    _body = e.target.value;
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, window.innerHeight * 0.35) + 'px';
  });

  // Stage
  container.querySelectorAll('.stage-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      _selectedStage = btn.dataset.stage;
      container.querySelectorAll('.stage-option').forEach((b) =>
        b.classList.toggle('selected', b.dataset.stage === _selectedStage)
      );
    });
  });

  // Tag chips (existing)
  tagsArea?.addEventListener('click', async (e) => {
    const chip = e.target.closest('[data-tag-id]');
    if (!chip) return;
    const tid = chip.dataset.tagId;
    if (_selectedTags.has(tid)) {
      _selectedTags.delete(tid);
      chip.classList.remove('active');
    } else {
      _selectedTags.add(tid);
      chip.classList.add('active');
    }
  });

  // New tag input
  tagInput?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const name = tagInput.value.trim().replace(',', '');
      if (!name) return;
      const tag = await store.upsertTag(name);
      _selectedTags.add(tag.id);
      // Add chip
      const chip = document.createElement('button');
      chip.className = 'tag-chip active';
      chip.dataset.tagId = tag.id;
      chip.textContent = tag.name;
      chip.style.cssText = `border-color:${tag.color};color:${tag.color};`;
      chip.addEventListener('click', () => {
        _selectedTags.delete(tag.id);
        chip.remove();
      });
      tagsArea?.appendChild(chip);
      tagInput.value = '';
    }
  });

  // Link search
  linkInput?.addEventListener('input', () => {
    const q = linkInput.value.toLowerCase().trim();
    const matches = q.length < 1 ? [] : allNotes
      .filter((n) => !_selectedLinks.has(n.id) && n.title.toLowerCase().includes(q))
      .slice(0, 5);
    linkSug.innerHTML = matches.map((n) =>
      `<div class="backlink-item" data-link-id="${n.id}" role="button" tabindex="0" style="cursor:pointer;">
        <span class="text-sm">${esc(n.title)}</span>
        <span class="backlink-arrow">+</span>
      </div>`
    ).join('');
    linkSug.querySelectorAll('[data-link-id]').forEach((item) => {
      item.addEventListener('click', () => {
        const id = item.dataset.linkId;
        const note = allNotes.find((n) => n.id === id);
        if (!note || _selectedLinks.has(id)) return;
        if (_selectedLinks.size >= 10) { showToast(t('captureMaxLinks'), 'info'); return; }
        _selectedLinks.add(id);
        linkInput.value = '';
        linkSug.innerHTML = '';
        // Show chip
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.innerHTML = `${esc(note.title)} <button class="chip-remove" data-remove-link="${id}">×</button>`;
        selLinks.appendChild(chip);
        chip.querySelector('[data-remove-link]').addEventListener('click', () => {
          _selectedLinks.delete(id);
          chip.remove();
        });
      });
    });
  });

  // Audio recording
  let _capMediaRecorder = null;
  let _capAudioChunks   = [];
  let _capRecInterval   = null;
  let _capRecSecs       = 0;

  capRecBtn?.addEventListener('click', async () => {
    if (_capMediaRecorder && _capMediaRecorder.state === 'recording') {
      _capMediaRecorder.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        _capAudioChunks = [];
        _capRecSecs = 0;
        _capMediaRecorder = new MediaRecorder(stream);
        _capMediaRecorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) _capAudioChunks.push(ev.data);
        };
        _capMediaRecorder.onstop = () => {
          stream.getTracks().forEach((trk) => trk.stop());
          clearInterval(_capRecInterval);
          const blob = new Blob(_capAudioChunks, { type: _capMediaRecorder.mimeType || 'audio/webm' });
          const reader = new FileReader();
          reader.onload = (re) => {
            _audioData = re.target.result;
            audioArea.innerHTML = `
              <div class="audio-player-wrap" style="margin-bottom:var(--sp-2);">
                <audio class="audio-player" controls src="${_audioData}"></audio>
                <button class="icon-btn" id="remove-audio-preview">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
              </div>`;
            audioArea.querySelector('#remove-audio-preview')?.addEventListener('click', () => {
              _audioData = null;
              audioArea.innerHTML = '';
            });
          };
          reader.readAsDataURL(blob);
          capRecBtn.classList.remove('recording');
          capRecBtn.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>`;
        };
        _capMediaRecorder.start(100);
        capRecBtn.classList.add('recording');
        capRecBtn.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>`;
        _capRecInterval = setInterval(() => {
          _capRecSecs++;
          if (_capRecSecs >= 120) { _capMediaRecorder?.stop(); return; }
        }, 1000);
      } catch (err) {
        console.error('Mic error', err);
        showToast(t('toastError'), 'error');
      }
    }
  });

  // Image
  imgInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      _imageData = re.target.result;
      imageArea.innerHTML = `
        <div class="image-preview" style="margin-bottom:var(--sp-2);">
          <img src="${_imageData}" alt="" />
          <button class="preview-remove" id="remove-preview">×</button>
        </div>`;
      imageArea.querySelector('#remove-preview')?.addEventListener('click', () => {
        _imageData = null;
        imageArea.innerHTML = '';
      });
    };
    reader.readAsDataURL(file);
  });

  // Save
  saveBtn?.addEventListener('click', async () => {
    _title = titleInput?.value.trim() || '';
    _body  = bodyInput?.value.trim()  || '';
    if (!_title) {
      titleInput?.focus();
      titleInput?.setAttribute('placeholder', '⚠ ' + t('capturePlaceholder'));
      return;
    }
    try {
      const note = await store.saveNote({
        title:     _title,
        body:      _body,
        tags:      [..._selectedTags],
        links:     [..._selectedLinks],
        stage:     _selectedStage,
        imageData: _imageData,
        audioData: _audioData,
      });
      await Promise.all([..._selectedLinks].map((l) => store.linkNotes(note.id, l)));
      showToast(t('captureSaved'), 'success');
      navigate('#library');
    } catch (err) {
      console.error(err);
      showToast(t('toastError'), 'error');
    }
  });
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
