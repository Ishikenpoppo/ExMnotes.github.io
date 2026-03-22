/* =============================================================
   ExMnotes — SVG Icon System
   Neural Console — Custom stroke-based icons
   All icons: 24×24 viewBox, 1.5-2px stroke, round caps/joins
   ============================================================= */

const S = (d, { size = 24, cls = '', fill = 'none', stroke = 'currentColor', sw = 1.75 } = {}) =>
  `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

/* ─── Navigation ─── */

/** Mind / Home — brain with neural nodes */
export const iconMind = (o) => S(
  `<path d="M12 2C9 2 6 4.5 6 8c0 2 .8 3.5 2 4.5V14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-1.5C17.2 11.5 18 10 18 8c0-3.5-3-6-6-6z"/>
   <line x1="9" y1="18" x2="9" y2="20"/><line x1="15" y1="18" x2="15" y2="20"/>
   <line x1="10" y1="22" x2="14" y2="22"/>
   <circle cx="10" cy="7" r="1" fill="currentColor" stroke="none"/>
   <circle cx="14" cy="7" r="1" fill="currentColor" stroke="none"/>
   <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none"/>
   <line x1="10" y1="7" x2="12" y2="10"/><line x1="14" y1="7" x2="12" y2="10"/>`, o);

/** Archive / Library — stacked layers */
export const iconArchive = (o) => S(
  `<polygon points="12 2 22 8 12 14 2 8"/>
   <polyline points="2 12 12 18 22 12"/>
   <polyline points="2 16 12 22 22 16"/>`, o);

/** Capture — electric impulse / zap */
export const iconCapture = (o) => S(
  `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10" fill="currentColor" stroke="none"/>`, o);

/** Graph — synaptic network */
export const iconGraph = (o) => S(
  `<circle cx="12" cy="12" r="3"/>
   <circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/>
   <circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/>
   <line x1="9.5" y1="10.5" x2="5.5" y2="7.5"/>
   <line x1="14.5" y1="10.5" x2="18.5" y2="7.5"/>
   <line x1="9.5" y1="13.5" x2="5.5" y2="16.5"/>
   <line x1="14.5" y1="13.5" x2="18.5" y2="16.5"/>`, o);

/** Review — neural loop */
export const iconReview = (o) => S(
  `<path d="M21 12a9 9 0 1 1-6.2-8.6"/>
   <polyline points="21 3 21 9 15 9"/>
   <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>`, o);


/* ─── Stages (Spark → Synapse → Network) ─── */

/** Spark — single luminous point with rays */
export const iconSpark = (o) => S(
  `<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" opacity="0.9"/>
   <line x1="12" y1="2" x2="12" y2="6"/>
   <line x1="12" y1="18" x2="12" y2="22"/>
   <line x1="2" y1="12" x2="6" y2="12"/>
   <line x1="18" y1="12" x2="22" y2="12"/>
   <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
   <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
   <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
   <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>`, o);

/** Synapse — two nodes connected by an arc */
export const iconSynapse = (o) => S(
  `<circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/>
   <path d="M10 12c0-3 4-3 4 0" fill="none"/>
   <path d="M10 12c0 3 4 3 4 0" fill="none"/>
   <circle cx="7" cy="12" r="1" fill="currentColor" stroke="none"/>
   <circle cx="17" cy="12" r="1" fill="currentColor" stroke="none"/>`, o);

/** Network — cluster of interconnected nodes */
export const iconNetwork = (o) => S(
  `<circle cx="12" cy="8" r="2.5"/>
   <circle cx="6" cy="16" r="2.5"/>
   <circle cx="18" cy="16" r="2.5"/>
   <line x1="12" y1="10.5" x2="6" y2="13.5"/>
   <line x1="12" y1="10.5" x2="18" y2="13.5"/>
   <line x1="8.5" y1="16" x2="15.5" y2="16"/>
   <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none"/>
   <circle cx="6" cy="16" r="1" fill="currentColor" stroke="none"/>
   <circle cx="18" cy="16" r="1" fill="currentColor" stroke="none"/>`, o);


/* ─── Review difficulty ─── */

/** Hard — compressed, jagged wave */
export const iconHard = (o) => S(
  `<polyline points="2 12 5 8 7 15 9 6 11 17 13 7 15 16 17 9 19 14 22 12"/>`, { sw: 2, ...o });

/** Ok — stable signal wave */
export const iconOk = (o) => S(
  `<path d="M2 12c2 0 3-3 5-3s3 6 5 6 3-6 5-6 3 3 5 3" fill="none"/>`, { sw: 2, ...o });

/** Easy — smooth flowing boost */
export const iconEasy = (o) => S(
  `<path d="M2 16c3-2 5-8 8-10s7 2 10 0" fill="none"/>
   <polyline points="16 4 20 6 18 10"/>`, { sw: 2, ...o });


/* ─── Empty states (large, 48px default) ─── */

/** Brain resting — calm brain outline */
export const iconBrainResting = (o) => S(
  `<path d="M12 2C9 2 6 4.5 6 8c0 2 .8 3.5 2 4.5V14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-1.5C17.2 11.5 18 10 18 8c0-3.5-3-6-6-6z"/>
   <path d="M8.5 20h7" stroke-dasharray="2 2"/>
   <path d="M9.5 22h5" stroke-dasharray="2 2"/>`, { size: 48, sw: 1.5, ...o });

/** Empty archive — open box with nothing */
export const iconEmptyArchive = (o) => S(
  `<path d="M21 8V21H3V8"/>
   <path d="M1 3h22v5H1z"/>
   <line x1="10" y1="12" x2="14" y2="12"/>`, { size: 48, sw: 1.5, ...o });

/** Empty web — disconnected nodes */
export const iconEmptyWeb = (o) => S(
  `<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/>
   <circle cx="12" cy="18" r="2.5"/><circle cx="12" cy="12" r="1.5"/>
   <line x1="8" y1="7" x2="11" y2="11" stroke-dasharray="2 3"/>
   <line x1="16" y1="7" x2="13" y2="11" stroke-dasharray="2 3"/>
   <line x1="12" y1="13.5" x2="12" y2="15.5" stroke-dasharray="2 3"/>`, { size: 48, sw: 1.5, ...o });


/* ─── Action icons ─── */

/** PDF document */
export const iconPdf = (o) => S(
  `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
   <polyline points="14 2 14 8 20 8"/>
   <line x1="8" y1="13" x2="16" y2="13"/>
   <line x1="8" y1="17" x2="13" y2="17"/>`, o);

/** Bookmark */
export const iconBookmark = (o) => S(
  `<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>`, o);

/** Pin / anchor point */
export const iconPin = (o) => S(
  `<path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 0 1 18 0z"/>
   <circle cx="12" cy="10" r="3"/>`, o);

/** Translate — concentric signal waves */
export const iconTranslate = (o) => S(
  `<path d="M2 5h6M5 2v6"/>
   <path d="M8 2h2a4 4 0 0 1 0 8H8"/>
   <path d="M14 14l3 8 3-8"/>
   <line x1="15.5" y1="18" x2="18.5" y2="18"/>
   <path d="M2 14l6 6m0-6l-6 6"/>`, { sw: 1.5, ...o });

/** Search — scanner style */
export const iconSearch = (o) => S(
  `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`, o);

/** Camera — viewfinder/target */
export const iconCamera = (o) => S(
  `<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
   <circle cx="12" cy="13" r="4"/>`, o);

/** Microphone — sound wave */
export const iconMic = (o) => S(
  `<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
   <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
   <line x1="12" y1="19" x2="12" y2="23"/>
   <line x1="8" y1="23" x2="16" y2="23"/>`, o);

/** Settings — modular hexagonal gear */
export const iconSettings = (o) => S(
  `<circle cx="12" cy="12" r="3"/>
   <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`, o);

/** Close — X with style */
export const iconClose = (o) => S(
  `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`, o);

/** Trash — dissolve effect */
export const iconTrash = (o) => S(
  `<polyline points="3 6 5 6 21 6"/>
   <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
   <line x1="10" y1="11" x2="10" y2="17"/>
   <line x1="14" y1="11" x2="14" y2="17"/>`, o);

/** Download */
export const iconDownload = (o) => S(
  `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
   <polyline points="7 10 12 15 17 10"/>
   <line x1="12" y1="15" x2="12" y2="3"/>`, o);

/** Upload */
export const iconUpload = (o) => S(
  `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
   <polyline points="17 8 12 3 7 8"/>
   <line x1="12" y1="3" x2="12" y2="15"/>`, o);

/** Link / connection count */
export const iconLink = (o) => S(
  `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
   <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`, o);

/** Plus */
export const iconPlus = (o) => S(
  `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`, o);

/** Warning / alert */
export const iconWarning = (o) => S(
  `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
   <line x1="12" y1="9" x2="12" y2="13"/>
   <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none"/>`, o);

/** Stop (square) — for recording state */
export const iconStop = (o) => S(
  `<rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" stroke="none"/>`, o);

/** Italian flag — simplified */
export const iconFlag = (o) => S(
  `<rect x="3" y="5" width="6" height="14" rx="1" fill="#009246" stroke="none"/>
   <rect x="9" y="5" width="6" height="14" fill="#fff" stroke="none"/>
   <rect x="15" y="5" width="6" height="14" rx="1" fill="#ce2b37" stroke="none"/>`, { sw: 0, ...o });

/** Notes / stats */
export const iconNotes = (o) => S(
  `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
   <polyline points="14 2 14 8 20 8"/>`, o);

/** Connections / stats */
export const iconConnections = (o) => S(
  `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
   <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
   <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>`, o);

/** Clock / due */
export const iconClock = (o) => S(
  `<circle cx="12" cy="12" r="10"/>
   <polyline points="12 6 12 12 16 14"/>`, o);

/** Crosshair — recenter graph */
export const iconCrosshair = (o) => S(
  `<circle cx="12" cy="12" r="10"/>
   <line x1="22" y1="12" x2="18" y2="12"/>
   <line x1="6" y1="12" x2="2" y2="12"/>
   <line x1="12" y1="6" x2="12" y2="2"/>
   <line x1="12" y1="22" x2="12" y2="18"/>`, o);

/** Arrow right */
export const iconArrowRight = (o) => S(
  `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`, o);

/** Chevron left */
export const iconChevronLeft = (o) => S(
  `<polyline points="15 18 9 12 15 6"/>`, o);

/** Chevron right */
export const iconChevronRight = (o) => S(
  `<polyline points="9 18 15 12 9 6"/>`, o);

/* ─── Map from old stage names to icons ─── */
export const STAGE_ICONS = {
  seed:    iconSpark,
  sprout:  iconSynapse,
  mature:  iconNetwork,
  spark:   iconSpark,
  synapse: iconSynapse,
  network: iconNetwork,
};
