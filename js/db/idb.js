/* =============================================================
   ExMnotes — IndexedDB Wrapper
   Zero-dependency promisified IDB helper
   ============================================================= */

const DB_NAME    = 'exmnotes';
const DB_VERSION = 1;

/** @type {IDBDatabase|null} */
let _db = null;

/**
 * Open (or upgrade) the database
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // notes store
      if (!db.objectStoreNames.contains('notes')) {
        const notes = db.createObjectStore('notes', { keyPath: 'id' });
        notes.createIndex('created',   'created',   { unique: false });
        notes.createIndex('updated',   'updated',   { unique: false });
        notes.createIndex('stage',     'stage',     { unique: false });
        notes.createIndex('reviewDue', 'reviewDue', { unique: false });
      }

      // connections store
      if (!db.objectStoreNames.contains('connections')) {
        const conns = db.createObjectStore('connections', { keyPath: 'id' });
        conns.createIndex('from',    'from',    { unique: false });
        conns.createIndex('to',      'to',      { unique: false });
        conns.createIndex('created', 'created', { unique: false });
      }

      // tags store
      if (!db.objectStoreNames.contains('tags')) {
        const tags = db.createObjectStore('tags', { keyPath: 'id' });
        tags.createIndex('name',    'name',    { unique: true });
        tags.createIndex('created', 'created', { unique: false });
      }
    };

    request.onsuccess  = (e) => { _db = e.target.result; resolve(_db); };
    request.onerror    = (e) => reject(e.target.error);
    request.onblocked  = ()  => reject(new Error('IDB blocked — close other tabs'));
  });
}

/**
 * Generic transaction helper
 * @param {string|string[]} stores
 * @param {'readonly'|'readwrite'} mode
 * @param {(tx: IDBTransaction) => any} fn
 * @returns {Promise<any>}
 */
function transaction(stores, mode, fn) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    tx.onerror = (e) => reject(e.target.error);
    const result = fn(tx);
    if (result && typeof result.then === 'function') {
      result.then(resolve).catch(reject);
    } else {
      tx.oncomplete = () => resolve(result);
    }
  }));
}

/**
 * Wrap an IDBRequest into a Promise
 * @param {IDBRequest} req
 * @returns {Promise<any>}
 */
function req(r) {
  return new Promise((resolve, reject) => {
    r.onsuccess = (e) => resolve(e.target.result);
    r.onerror   = (e) => reject(e.target.error);
  });
}

/* ── CRUD helpers ── */

export function getAll(store) {
  return transaction(store, 'readonly', (tx) =>
    req(tx.objectStore(store).getAll())
  ).then((r) => r);
}

export function getOne(store, id) {
  return transaction(store, 'readonly', (tx) =>
    req(tx.objectStore(store).get(id))
  );
}

export function put(store, object) {
  return transaction(store, 'readwrite', (tx) => {
    const r = tx.objectStore(store).put(object);
    return new Promise((resolve, reject) => {
      r.onsuccess = () => resolve(object);
      r.onerror   = (e) => reject(e.target.error);
    });
  });
}

export function remove(store, id) {
  return transaction(store, 'readwrite', (tx) =>
    req(tx.objectStore(store).delete(id))
  );
}

export function getAllByIndex(store, indexName, value) {
  return transaction(store, 'readonly', (tx) =>
    req(tx.objectStore(store).index(indexName).getAll(value))
  );
}

export function clearAll(store) {
  return transaction(store, 'readwrite', (tx) =>
    req(tx.objectStore(store).clear())
  );
}

export function putMany(store, objects) {
  return transaction(store, 'readwrite', (tx) => {
    const os = tx.objectStore(store);
    return Promise.all(objects.map((obj) => req(os.put(obj))));
  });
}
