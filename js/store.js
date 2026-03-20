/* =============================================================
   ExMnotes — Store (semantic facade over IDB)
   ============================================================= */

import * as idb from './db/idb.js';
import { createNote, createConnection, createTag, sm2Update } from './data/schema.js';

/* ═══ NOTES ════════════════════════════════════════════════ */

export async function getAllNotes() {
  const notes = await idb.getAll('notes');
  return notes.sort((a, b) => b.updated - a.updated);
}

export async function getNoteById(id) {
  return idb.getOne('notes', id);
}

export async function saveNote(data) {
  const note = createNote(data);
  await idb.put('notes', note);
  return note;
}

export async function updateNote(id, changes) {
  const existing = await idb.getOne('notes', id);
  if (!existing) throw new Error(`Note ${id} not found`);
  const updated = { ...existing, ...changes, updated: Date.now() };
  await idb.put('notes', updated);
  return updated;
}

export async function deleteNote(id) {
  // Remove note
  await idb.remove('notes', id);
  // Remove all connections involving this note
  const all = await idb.getAll('connections');
  const toDelete = all.filter((c) => c.from === id || c.to === id);
  await Promise.all(toDelete.map((c) => idb.remove('connections', c.id)));
  // Remove note id from other notes' links arrays
  const allNotes = await idb.getAll('notes');
  const affected  = allNotes.filter((n) => n.links.includes(id));
  await Promise.all(
    affected.map((n) =>
      idb.put('notes', { ...n, links: n.links.filter((l) => l !== id), updated: Date.now() })
    )
  );
}

export async function searchNotes(query) {
  const all = await idb.getAll('notes');
  if (!query || !query.trim()) return all.sort((a, b) => b.updated - a.updated);
  const q = query.toLowerCase();
  return all
    .filter((n) =>
      n.title.toLowerCase().includes(q) ||
      n.body.toLowerCase().includes(q) ||
      n.tags.some((t) => String(t).toLowerCase().includes(q))
    )
    .sort((a, b) => b.updated - a.updated);
}

export async function getNotesByTag(tagId) {
  const all = await idb.getAll('notes');
  return all.filter((n) => n.tags.includes(tagId)).sort((a, b) => b.updated - a.updated);
}

/* ═══ CONNECTIONS ═══════════════════════════════════════════ */

export async function getAllConnections() {
  return idb.getAll('connections');
}

export async function linkNotes(fromId, toId, label = '') {
  // Check if already linked
  const all = await idb.getAll('connections');
  const exists = all.find((c) => c.from === fromId && c.to === toId);
  if (exists) return exists;

  const conn = createConnection({ from: fromId, to: toId, label });
  await idb.put('connections', conn);

  // Also update the 'links' array on the source note for fast lookup
  const note = await idb.getOne('notes', fromId);
  if (note && !note.links.includes(toId)) {
    await idb.put('notes', {
      ...note,
      links: [...note.links, toId],
      updated: Date.now(),
    });
  }
  return conn;
}

export async function unlinkNotes(fromId, toId) {
  const all = await idb.getAll('connections');
  const conn = all.find((c) => c.from === fromId && c.to === toId);
  if (conn) await idb.remove('connections', conn.id);

  // Also update source note's links array
  const note = await idb.getOne('notes', fromId);
  if (note) {
    await idb.put('notes', {
      ...note,
      links: note.links.filter((l) => l !== toId),
      updated: Date.now(),
    });
  }
}

export async function getConnectionsForNote(noteId) {
  const all = await idb.getAll('connections');
  return {
    outgoing: all.filter((c) => c.from === noteId),
    incoming: all.filter((c) => c.to   === noteId),
  };
}

/* ═══ GRAPH ═════════════════════════════════════════════════ */

export async function getGraphData() {
  const [nodes, edges] = await Promise.all([
    idb.getAll('notes'),
    idb.getAll('connections'),
  ]);
  return { nodes, edges };
}

/* ═══ TAGS ══════════════════════════════════════════════════ */

export async function getAllTags() {
  return idb.getAll('tags');
}

export async function getTagById(id) {
  return idb.getOne('tags', id);
}

export async function upsertTag(name, color) {
  const all = await idb.getAll('tags');
  const existing = all.find((t) => t.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  const tag = createTag({ name, color });
  await idb.put('tags', tag);
  return tag;
}

export async function deleteTag(id) {
  await idb.remove('tags', id);
  // Remove tag from all notes
  const allNotes = await idb.getAll('notes');
  await Promise.all(
    allNotes
      .filter((n) => n.tags.includes(id))
      .map((n) =>
        idb.put('notes', { ...n, tags: n.tags.filter((t) => t !== id), updated: Date.now() })
      )
  );
}

export async function getTagsMap() {
  const tags = await idb.getAll('tags');
  return Object.fromEntries(tags.map((t) => [t.id, t]));
}

/* ═══ REVIEW / SM-2 ════════════════════════════════════════ */

export async function getDueReviews() {
  const all = await idb.getAll('notes');
  const now = Date.now();
  return all
    .filter((n) => n.reviewDue <= now)
    .sort((a, b) => a.reviewDue - b.reviewDue);
}

export async function submitReview(noteId, quality) {
  const note = await idb.getOne('notes', noteId);
  if (!note) throw new Error(`Note ${noteId} not found`);
  const updates = sm2Update(note, quality);
  const updated = { ...note, ...updates };
  await idb.put('notes', updated);
  return updated;
}

/* ═══ STATS ═════════════════════════════════════════════════ */

export async function getStats() {
  const [notes, connections, tags] = await Promise.all([
    idb.getAll('notes'),
    idb.getAll('connections'),
    idb.getAll('tags'),
  ]);
  const now = Date.now();
  const byStage = { seed: 0, sprout: 0, mature: 0 };
  let dueTodayCount = 0;
  for (const n of notes) {
    byStage[n.stage] = (byStage[n.stage] || 0) + 1;
    if (n.reviewDue <= now) dueTodayCount++;
  }
  const sortedByRecent = [...notes].sort((a, b) => b.updated - a.updated);
  return {
    totalNotes:       notes.length,
    totalConnections: connections.length,
    totalTags:        tags.length,
    byStage,
    dueTodayCount,
    recentNotes: sortedByRecent.slice(0, 6),
  };
}

/* ═══ IMPORT / EXPORT ═══════════════════════════════════════ */

export async function exportData() {
  const [notes, connections, tags] = await Promise.all([
    idb.getAll('notes'),
    idb.getAll('connections'),
    idb.getAll('tags'),
  ]);
  return { version: 1, exported: Date.now(), notes, connections, tags };
}

export async function importData(payload) {
  if (!payload || payload.version !== 1) throw new Error('Invalid export format');
  await Promise.all([
    idb.putMany('notes',       payload.notes       || []),
    idb.putMany('connections', payload.connections || []),
    idb.putMany('tags',        payload.tags        || []),
  ]);
}

export async function clearAllData() {
  await Promise.all([
    idb.clearAll('notes'),
    idb.clearAll('connections'),
    idb.clearAll('tags'),
  ]);
}
