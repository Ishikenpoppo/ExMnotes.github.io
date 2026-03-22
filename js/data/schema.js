/* =============================================================
   ExMnotes — Data Schemas (JSDoc types)
   Neural Console — Extended Mind representational objects
   ============================================================= */

/**
 * @typedef {'seed'|'sprout'|'mature'} NoteStage
 * Neural maturity stages (Spark → Synapse → Network):
 *  - seed:   newly captured neural impulse (Spark)
 *  - sprout: forming synaptic connections (Synapse)
 *  - mature: consolidated neural network (Network)
 */

/**
 * @typedef {Object} Note
 * @property {string}     id            — UUID v4
 * @property {string}     title         — short label (required)
 * @property {string}     body          — main text content
 * @property {string|null} imageData    — base64 data URL of image (nullable)
 * @property {string|null} audioData    — base64 data URL of audio recording (nullable)
 * @property {string|null} pdfData      — base64 data URL of attached PDF (nullable)
 * @property {number}      pdfBookmark  — last-read page number (default: 1)
 * @property {string[]}   tags          — array of tag IDs
 * @property {string[]}   links         — array of Note IDs this note links TO
 * @property {NoteStage}  stage         — cognitive maturity stage
 * @property {number}     reviewInterval — SM-2 interval in days (default: 1)
 * @property {number}     reviewEaseFactor — SM-2 ease factor (default: 2.5)
 * @property {number}     reviewDue     — timestamp (ms) when next review is due
 * @property {number}     reviewCount   — total number of reviews performed
 * @property {number}     created       — timestamp ms
 * @property {number}     updated       — timestamp ms
 */

/**
 * @typedef {Object} Connection
 * @property {string} id       — UUID v4
 * @property {string} from     — Note ID (source)
 * @property {string} to       — Note ID (target)
 * @property {string} label    — relationship description (e.g. "supports", "refutes")
 * @property {number} created  — timestamp ms
 */

/**
 * @typedef {Object} Tag
 * @property {string} id     — UUID v4
 * @property {string} name   — display name
 * @property {string} color  — hex color string
 * @property {number} created
 */

/**
 * @typedef {Object} GraphData
 * @property {Note[]}       nodes
 * @property {Connection[]} edges
 */

/**
 * Factory: create a new Note object with defaults
 * @param {Partial<Note>} data
 * @returns {Note}
 */
export function createNote(data = {}) {
  const now = Date.now();
  return {
    id:               data.id            ?? crypto.randomUUID(),
    title:            data.title         ?? '',
    body:             data.body          ?? '',
    imageData:        data.imageData     ?? null,
    audioData:        data.audioData     ?? null,
    pdfData:          data.pdfData       ?? null,
    pdfBookmark:      data.pdfBookmark   ?? 1,
    tags:             data.tags          ?? [],
    links:            data.links         ?? [],
    stage:            data.stage         ?? 'seed',
    reviewInterval:   data.reviewInterval   ?? 1,
    reviewEaseFactor: data.reviewEaseFactor ?? 2.5,
    reviewDue:        data.reviewDue     ?? now,
    reviewCount:      data.reviewCount   ?? 0,
    created:          data.created       ?? now,
    updated:          data.updated       ?? now,
  };
}

/**
 * Factory: create a new Connection
 * @param {Partial<Connection>} data
 * @returns {Connection}
 */
export function createConnection(data = {}) {
  return {
    id:      data.id      ?? crypto.randomUUID(),
    from:    data.from    ?? '',
    to:      data.to      ?? '',
    label:   data.label   ?? '',
    created: data.created ?? Date.now(),
  };
}

/**
 * Factory: create a new Tag
 * @param {Partial<Tag>} data
 * @returns {Tag}
 */
export function createTag(data = {}) {
  const PALETTE = ['#00f0ff','#39ff9f','#ffb800','#bf5af2','#ff4466','#64dfdf','#ff8c42'];
  return {
    id:      data.id      ?? crypto.randomUUID(),
    name:    data.name    ?? '',
    color:   data.color   ?? PALETTE[Math.floor(Math.random() * PALETTE.length)],
    created: data.created ?? Date.now(),
  };
}

/**
 * SM-2 algorithm: compute next review parameters
 * @param {Note} note
 * @param {0|1|2} quality — 0: hard, 1: ok, 2: easy
 * @returns {{ reviewInterval: number, reviewEaseFactor: number, reviewDue: number, stage: NoteStage }}
 */
export function sm2Update(note, quality) {
  const qualityMap = [1, 3, 5]; // 0→q=1 (hard), 1→q=3 (ok), 2→q=5 (easy)
  const q = qualityMap[quality];

  let ef = note.reviewEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ef = Math.max(1.3, ef);

  let interval = 1;
  if (q < 3) {
    // Hard: restart from 1 day
    interval = 1;
  } else if (note.reviewCount === 0) {
    interval = 1;
  } else if (note.reviewCount === 1) {
    interval = 6;
  } else {
    interval = Math.round(note.reviewInterval * ef);
  }

  const reviewCount = note.reviewCount + 1;

  // Stage progression
  let stage = note.stage;
  if (reviewCount >= 10 && ef > 2.2) stage = 'mature';
  else if (reviewCount >= 3  && ef > 1.8) stage = 'sprout';

  return {
    reviewInterval:   interval,
    reviewEaseFactor: ef,
    reviewDue:        Date.now() + interval * 86_400_000,
    reviewCount,
    stage,
    updated:          Date.now(),
  };
}
