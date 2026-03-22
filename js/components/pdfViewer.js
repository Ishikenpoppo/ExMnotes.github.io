/* =============================================================
   ExMnotes — PDF Viewer Component
   Minimal full-screen PDF reader with bookmark + translation
   ============================================================= */

import { showToast } from './toast.js';
import * as store    from '../store.js';
import { iconBookmark, iconPin, iconTranslate, iconFlag } from './icons.js';

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let _pdfjsLoaded = false;

/** Lazily load PDF.js from CDN (once) */
async function loadPdfJs() {
  if (_pdfjsLoaded || window.pdfjsLib) { _pdfjsLoaded = true; return; }
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PDFJS_CDN;
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_CDN; _pdfjsLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/**
 * Open the full-screen PDF viewer
 * @param {import('../data/schema.js').Note} note
 * @param {function(number):void} [onBookmarkSave] — called with page number when user saves bookmark
 */
export async function openPdfViewer(note, onBookmarkSave) {
  if (!note.pdfData) return;

  // --- Build / reuse overlay container ---
  let overlay = document.getElementById('pdf-viewer-overlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'pdf-viewer-overlay';
  overlay.innerHTML = `
    <div class="pdf-topbar">
      <span class="pdf-title-label truncate"></span>
      <div style="display:flex;gap:var(--sp-2);flex-shrink:0;">
        <button class="btn btn-secondary btn-sm" id="pdf-bookmark-btn" title="Salva segnalibro (pagina corrente)">
          ${iconBookmark({ size: 14 })} Segna
        </button>
        <button class="icon-btn" id="pdf-close-btn" aria-label="Chiudi lettore PDF">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="pdf-canvas-area" id="pdf-canvas-area">
      <div id="pdf-resume-banner" class="pdf-resume-banner" style="display:none;">
        ${iconPin({ size: 14 })} Ripresa da pagina <span id="pdf-resume-page"></span>
      </div>
      <div class="pdf-page-wrap" id="pdf-page-wrap">
        <canvas id="pdf-canvas"></canvas>
        <div class="pdf-text-layer" id="pdf-text-layer"></div>
      </div>
      <div class="pdf-translation-tooltip" id="pdf-translation-tooltip" style="display:none;">
        <span class="pdf-tooltip-word" id="pdf-tooltip-word"></span>
        <button class="btn btn-sm btn-primary" id="pdf-translate-btn">${iconTranslate({ size: 14 })} Traduci in italiano</button>
        <div class="pdf-tooltip-result" id="pdf-tooltip-result"></div>
      </div>
    </div>
    <div class="pdf-navbar">
      <button class="btn btn-secondary btn-sm" id="pdf-prev-btn">&#8592;</button>
      <span class="pdf-page-info" id="pdf-page-info">Pagina 1 / 1</span>
      <button class="btn btn-secondary btn-sm" id="pdf-next-btn">&#8594;</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // --- State ---
  let pdfDoc      = null;
  let currentPage = note.pdfBookmark ?? 1;
  let totalPages  = 0;
  let renderTask  = null;
  let _currentSelectedText = '';

  const canvas    = overlay.querySelector('#pdf-canvas');
  const textLayer = overlay.querySelector('#pdf-text-layer');
  const pageInfo  = overlay.querySelector('#pdf-page-info');
  const prevBtn   = overlay.querySelector('#pdf-prev-btn');
  const nextBtn   = overlay.querySelector('#pdf-next-btn');
  const bookmark  = overlay.querySelector('#pdf-bookmark-btn');
  const closeBtn  = overlay.querySelector('#pdf-close-btn');
  const titleLabel= overlay.querySelector('.pdf-title-label');
  const resumeBanner = overlay.querySelector('#pdf-resume-banner');
  const resumePage   = overlay.querySelector('#pdf-resume-page');
  const tooltip   = overlay.querySelector('#pdf-translation-tooltip');
  const tooltipWord  = overlay.querySelector('#pdf-tooltip-word');
  const translateBtn = overlay.querySelector('#pdf-translate-btn');
  const tooltipResult= overlay.querySelector('#pdf-tooltip-result');

  titleLabel.textContent = note.title || 'PDF';

  // --- Load PDF.js then the document ---
  try {
    showToast('Caricamento PDF…', 'info');
    await loadPdfJs();

    // base64 data URL → Uint8Array
    const base64 = note.pdfData.split(',')[1];
    const raw    = atob(base64);
    const bytes  = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

    pdfDoc     = await window.pdfjsLib.getDocument({ data: bytes }).promise;
    totalPages = pdfDoc.numPages;

    // Show resume banner if bookmark > 1
    if (currentPage > 1 && currentPage <= totalPages) {
      resumePage.textContent = currentPage;
      resumeBanner.style.display = 'block';
      setTimeout(() => { resumeBanner.style.opacity = '0'; setTimeout(() => resumeBanner.style.display = 'none', 400); }, 3000);
    } else {
      currentPage = 1;
    }

    await renderPage(currentPage);
  } catch (err) {
    console.error('PDF load error', err);
    showToast('Errore caricamento PDF', 'error');
    overlay.remove();
    return;
  }

  // --- Render a page ---
  async function renderPage(num) {
    if (!pdfDoc) return;
    if (renderTask) { try { await renderTask.promise; } catch { /* cancelled */ } }

    const page    = await pdfDoc.getPage(num);
    const area    = overlay.querySelector('#pdf-canvas-area');
    const maxW    = area.clientWidth  - 32;
    const maxH    = area.clientHeight - 80;
    const viewport0 = page.getViewport({ scale: 1 });
    const scale   = Math.min(maxW / viewport0.width, maxH / viewport0.height, 2.5);
    const vp      = page.getViewport({ scale });

    canvas.width  = vp.width;
    canvas.height = vp.height;

    const ctx = canvas.getContext('2d');
    renderTask = page.render({ canvasContext: ctx, viewport: vp });
    await renderTask.promise;

    // --- Text layer for selection ---
    textLayer.innerHTML = '';
    textLayer.style.width  = vp.width  + 'px';
    textLayer.style.height = vp.height + 'px';

    const textContent = await page.getTextContent();
    textContent.items.forEach((item) => {
      if (!item.str) return;
      const tx = window.pdfjsLib.Util.transform(vp.transform, item.transform);
      const span = document.createElement('span');
      span.textContent = item.str + ' ';
      span.style.cssText = `
        position: absolute;
        left: ${tx[4]}px;
        top: ${vp.height - tx[5]}px;
        font-size: ${Math.abs(tx[3])}px;
        font-family: sans-serif;
        white-space: pre;
        transform-origin: 0 100%;
        transform: scaleX(${tx[0] / Math.abs(tx[3]) || 1});
        color: transparent;
        cursor: text;
        user-select: text;
        -webkit-user-select: text;
      `;
      textLayer.appendChild(span);
    });

    // Update nav
    currentPage = num;
    pageInfo.textContent = `Pagina ${num} / ${totalPages}`;
    prevBtn.disabled = num <= 1;
    nextBtn.disabled = num >= totalPages;

    // scroll to top
    area.scrollTo(0, 0);
  }

  // --- Nav ---
  prevBtn.addEventListener('click', () => { if (currentPage > 1) renderPage(currentPage - 1); });
  nextBtn.addEventListener('click', () => { if (currentPage < totalPages) renderPage(currentPage + 1); });

  // Keyboard arrows
  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { if (currentPage < totalPages) renderPage(currentPage + 1); }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { if (currentPage > 1) renderPage(currentPage - 1); }
    if (e.key === 'Escape') closePdfViewer();
  };
  document.addEventListener('keydown', onKey);

  // --- Bookmark ---
  bookmark.addEventListener('click', async () => {
    try {
      await store.updateNote(note.id, { pdfBookmark: currentPage });
      onBookmarkSave?.(currentPage);
      showToast(`${iconBookmark({ size: 14 })} Segnalibro salvato: pagina ${currentPage}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Errore salvataggio segnalibro', 'error');
    }
  });

  // --- Close ---
  function closePdfViewer() {
    document.removeEventListener('keydown', onKey);
    overlay.classList.add('pdf-viewer-closing');
    setTimeout(() => overlay.remove(), 250);
  }
  closeBtn.addEventListener('click', closePdfViewer);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePdfViewer();
  });

  // --- Translation on text selection ---
  const onSelectionChange = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text || text.length < 2) { hideTooltip(); return; }
    _currentSelectedText = text;
    tooltipWord.textContent = `"${text}"`;
    tooltipResult.textContent = '';
    tooltipResult.style.display = 'none';

    // Position tooltip near selection
    try {
      const range = sel.getRangeAt(0);
      const rect  = range.getBoundingClientRect();
      const area  = overlay.querySelector('#pdf-canvas-area').getBoundingClientRect();
      tooltip.style.left = Math.max(8, Math.min(rect.left - area.left, area.width - 240)) + 'px';
      tooltip.style.top  = (rect.top - area.top - tooltip.offsetHeight - 12) + 'px';
    } catch { /* ignore */ }

    tooltip.style.display = 'flex';
  };

  textLayer.addEventListener('mouseup', onSelectionChange);
  textLayer.addEventListener('touchend', onSelectionChange);

  function hideTooltip() {
    tooltip.style.display = 'none';
    tooltipResult.style.display = 'none';
    tooltipResult.textContent = '';
  }

  // Hide tooltip when clicking elsewhere
  overlay.addEventListener('mousedown', (e) => {
    if (!tooltip.contains(e.target) && !textLayer.contains(e.target)) hideTooltip();
  });

  // --- Translate ---
  translateBtn.addEventListener('click', async () => {
    const word = _currentSelectedText;
    if (!word) return;
    translateBtn.disabled = true;
    translateBtn.textContent = '…';
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=it&dt=t&q=${encodeURIComponent(word)}`;
      const res = await fetch(url);
      const json = await res.json();
      // Response shape: [[["translated","original",...],...],..]
      const translated = json?.[0]?.map(chunk => chunk?.[0]).filter(Boolean).join('') || '—';
      tooltipResult.textContent = `${translated}`;
      tooltipResult.dataset.lang = 'it';
      tooltipResult.style.display = 'block';
    } catch (err) {
      console.error('Translate error', err);
      tooltipResult.textContent = 'Traduzione non disponibile (verifica la connessione)';
      tooltipResult.style.color = 'var(--red)';
      tooltipResult.style.display = 'block';
    } finally {
      translateBtn.disabled = false;
      translateBtn.innerHTML = `${iconTranslate({ size: 14 })} Traduci in italiano`;
    }
  });

  // Animate in
  requestAnimationFrame(() => overlay.classList.add('pdf-viewer-open'));
}
