/* =============================================================
   ExMnotes — Review View
   SM-2 Spaced Repetition — one card at a time
   ============================================================= */

import { t, formatDate }  from '../i18n.js';
import * as store         from '../store.js';
import { showToast }      from '../components/toast.js';
import { openNoteEditor } from '../components/noteEditor.js';

let _queue      = [];
let _current    = 0;
let _totalDue   = 0;
let _container  = null;

export function render(container) {
  _container = container;
  container.innerHTML = loadingHTML();
  loadQueue(container);
}

export function teardown() { _container = null; }

async function loadQueue(container) {
  _queue   = await store.getDueReviews();
  _totalDue = _queue.length;
  _current  = 0;
  renderCurrent(container);
}

function renderCurrent(container) {
  if (!container) return;

  if (_queue.length === 0) {
    renderEmpty(container);
    return;
  }

  const note     = _queue[_current];
  const reviewed = _current;
  const total    = _totalDue;
  const pct      = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  const tagsMap  = {};  // simplified — no tag colors needed here

  const nextDue = new Date(note.reviewDue).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short',
  });

  container.innerHTML = `
  <div class="view-panel view-enter">
    <div class="view-header">
      <h1>${t('reviewTitle')}</h1>
      <span class="text-sm text-faint">${t('reviewProgress', { d: reviewed, t: total })}</span>
    </div>

    <!-- Progress bar -->
    <div class="progress-bar" style="margin:0 var(--sp-4);flex-shrink:0;height:3px;">
      <div class="progress-bar-fill" style="width:${pct}%;"></div>
    </div>

    <div class="view-body" style="justify-content:center;padding-top:var(--sp-6);">

      <!-- Card -->
      <div class="review-card stagger-item" id="review-card">

        <!-- Stage badge -->
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="stage-badge ${note.stage}">${t({ seed:'stageSeed', sprout:'stageSprout', mature:'stageMature' }[note.stage])}</span>
          <button class="btn btn-ghost btn-sm text-faint" id="btn-open-note">↗</button>
        </div>

        <!-- Title -->
        <h2 style="font-size:var(--text-xl);line-height:var(--lh-tight);">${esc(note.title)}</h2>

        <!-- Image -->
        ${note.imageData ? `
        <div class="image-preview">
          <img src="${note.imageData}" alt="" />
        </div>` : ''}

        <!-- Body -->
        ${note.body ? `<p class="text-muted" style="line-height:var(--lh-relaxed);">${esc(note.body)}</p>` : ''}

        <!-- Meta -->
        <p class="text-xs text-faint">${t('reviewNextDue', { d: nextDue })} · revisioni: ${note.reviewCount}</p>
      </div>

      <!-- Action buttons -->
      <div class="review-actions" id="review-actions">
        <button class="btn btn-hard"  data-quality="0">${t('reviewHard')} 😓</button>
        <button class="btn btn-ok"    data-quality="1">${t('reviewOk')} 🙂</button>
        <button class="btn btn-easy"  data-quality="2">${t('reviewEasy')} 🚀</button>
      </div>

      <!-- Card count -->
      <p class="text-xs text-faint" style="text-align:center;">
        ${_current + 1} / ${_totalDue}
      </p>
    </div>
  </div>`;

  bindEvents(container, note);
}

function bindEvents(container, note) {
  // Quality buttons
  container.querySelectorAll('[data-quality]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const quality = parseInt(btn.dataset.quality, 10);

      // Animate out
      const card = container.querySelector('#review-card');
      if (card) {
        card.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
        card.style.transform  = quality === 0 ? 'translateX(-40px)' : 'translateX(40px)';
        card.style.opacity    = '0';
      }

      await store.submitReview(note.id, quality);

      // Advance
      _current++;
      if (_current >= _queue.length) {
        // Reload due (some may have become not-due after update)
        _queue   = await store.getDueReviews();
        _totalDue = _totalDue; // keep original total for progress display
        _current  = 0;
        if (_queue.length === 0) {
          setTimeout(() => renderEmpty(container), 220);
          return;
        }
      }

      setTimeout(() => renderCurrent(container), 220);
    });
  });

  // Open note editor
  container.querySelector('#btn-open-note')?.addEventListener('click', () => {
    openNoteEditor(note.id);
  });
}

function renderEmpty(container) {
  container.innerHTML = `
  <div class="view-panel view-enter">
    <div class="view-header">
      <h1>${t('reviewTitle')}</h1>
    </div>
    <div class="view-body" style="align-items:center;justify-content:center;text-align:center;gap:var(--sp-6);">
      <div class="celebration">
        <div class="big-emoji">🧠</div>
        <h2>${t('reviewEmpty')}</h2>
        <p class="text-muted" style="max-width:26ch;line-height:var(--lh-relaxed);">${t('reviewEmptyBody').replace('\n','<br>')}</p>
      </div>
      <canvas id="confetti-canvas" style="position:absolute;inset:0;pointer-events:none;width:100%;height:100%;"></canvas>
    </div>
  </div>`;

  // Launch confetti
  requestAnimationFrame(() => launchConfetti(container.querySelector('#confetti-canvas')));
}

function launchConfetti(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  const colors = ['#7c6af7','#34d399','#f0a500','#60a5fa','#f87171'];
  const particles = Array.from({ length: 55 }, () => ({
    x:    Math.random() * canvas.width,
    y:    -20 - Math.random() * 100,
    r:    4 + Math.random() * 6,
    d:    1.5 + Math.random() * 2.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    tilt: Math.random() * 10 - 5,
    tiltAngle: 0,
    tiltVel: 0.05 + Math.random() * 0.05,
    opacity: 1,
  }));

  let frame = 0;
  const MAX_FRAMES = 180;

  function draw() {
    if (frame++ > MAX_FRAMES) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.tiltAngle += p.tiltVel;
      p.y += p.d;
      p.tilt = Math.sin(p.tiltAngle) * 10;
      p.opacity = Math.max(0, 1 - frame / MAX_FRAMES);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.ellipse(p.x + p.tilt, p.y, p.r, p.r * 0.5, p.tiltAngle, 0, 2 * Math.PI);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
}

function loadingHTML() {
  return `<div class="view-panel">
    <div class="view-header"><h1 class="skeleton" style="width:120px;height:24px;"></h1></div>
    <div class="view-body" style="align-items:center;justify-content:center;">
      <div class="skeleton" style="width:100%;height:200px;border-radius:16px;"></div>
    </div>
  </div>`;
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
