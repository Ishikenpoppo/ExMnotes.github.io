/* =============================================================
   ExMnotes — i18n (IT / EN)
   ============================================================= */

const STORAGE_KEY = 'exmnotes-lang';

export const LANG_DICT = {
  it: {
    // App
    appName:         'ExMnotes',
    appTagline:      'Il tuo laboratorio di mente estesa',

    // Navigation
    navHome:         'Mente',
    navCapture:      'Cattura',
    navLibrary:      'Biblioteca',
    navGraph:        'Grafo',
    navReview:       'Revisione',

    // Home
    homeCogSnapshot: 'Snapshot Cognitivo',
    homeNotes:       'Note',
    homeLinks:       'Connessioni',
    homeStages:      'Stadi',
    homeDueToday:    'Da rivedere oggi',
    homeRecentNotes: 'Note recenti',
    homeNoNotes:     'Nessuna nota ancora. Inizia catturando un pensiero.',
    homeGreetMorning:'Buongiorno',
    homeGreetAfternoon: 'Buon pomeriggio',
    homeGreetEvening:'Buonasera',

    // Capture
    captureTitle:     'Cattura Pensiero',
    capturePlaceholder: 'Titolo del pensiero…',
    captureBodyPh:    'Elabora l\'idea, aggiungi contesto…',
    captureAddTag:    'Aggiungi tag…',
    captureAddLink:   'Collega a una nota…',
    captureSave:      'Salva Nota',
    capturePhoto:     'Aggiungi immagine',
    captureSaved:     'Nota salvata nella mente estesa ✦',
    captureLinked:    'Connessione creata',
    captureMaxLinks:  'Puoi collegare al massimo 10 note',

    // Library
    libraryTitle:     'Biblioteca',
    librarySearch:    'Cerca nelle note…',
    libraryEmpty:     'Nessuna nota trovata. La mente attende.\nComincia a catturare.',
    libraryPageOf:    'Pagina {p} di {t}',
    libraryAllTags:   'Tutti',

    // Graph
    graphTitle:       'Mappa Cognitiva',
    graphEmpty:       'Crea almeno due note e collegale\nper vedere il grafo.',
    graphOpenNote:    'Apri nota',
    graphConnections: 'connessioni',

    // Review
    reviewTitle:      'Revisione',
    reviewProgress:   '{d} / {t} riviste',
    reviewEmpty:      'Mente Riposata',
    reviewEmptyBody:  'Nessuna nota da rivedere oggi.\nTorna domani per continuare a crescere.',
    reviewHard:       'Difficile',
    reviewOk:         'Ok',
    reviewEasy:       'Facile',
    reviewNextDue:    'Prossima revisione: {d}',

    // Stages
    stageSeed:        'Seme',
    stageSprout:      'Germoglio',
    stageMature:      'Maturo',
    stageDesc: {
      seed:   'Pensiero appena catturato',
      sprout: 'Concetto in elaborazione',
      mature: 'Idea radicata e connessa',
    },

    // Settings
    settingsTitle:    'Impostazioni',
    settingsTheme:    'Tema',
    settingsThemeAuto: 'Auto (sistema)',
    settingsThemeLight: 'Chiaro',
    settingsThemeDark: 'Scuro',
    settingsLang:     'Lingua',
    settingsExport:   'Esporta dati',
    settingsImport:   'Importa dati',
    settingsClear:    'Cancella tutto',
    settingsClearConfirm: 'Sei sicuro? Tutti i dati saranno eliminati.',
    settingsClearConfirm2: 'CONFERMA: eliminare tutto permanentemente?',
    settingsVersion:  'ExMnotes v1 — MIT License',

    // Editor
    editorTitle:      'Modifica nota',
    editorSave:       'Salva',
    editorDelete:     'Elimina',
    editorDeleteConfirm: 'Eliminare questa nota?',
    editorBacklinks:  'Backlink',
    editorNoBacklinks:'Nessun collegamento in entrata.',
    editorLinks:      'Collegata a',
    editorAddLink:    '+ Aggiungi collegamento',
    editorStage:      'Stadio cognitivo',
    editorImage:      'Immagine',
    editorChangeImage:'Sostituisci',
    editorRemoveImage:'Rimuovi',
    editorAudio:      'Vocale',
    editorRecord:     'Registra',
    editorStopRecord: 'Stop',
    editorRemoveAudio:'Rimuovi audio',
    editorRecording:  'Registrazione…',

    // Toast
    toastSaved:       'Salvato',
    toastDeleted:     'Eliminato',
    toastExported:    'Dati esportati',
    toastImported:    'Dati importati con successo',
    toastError:       'Errore imprevisto',
    toastCleared:     'Tutti i dati eliminati',
    swUpdateReady:    'Nuova versione disponibile — aggiornamento in corso…',

    // Misc
    cancel:           'Annulla',
    confirm:          'Conferma',
    close:            'Chiudi',
    today:            'Oggi',
    yesterday:        'Ieri',
    daysAgo:          '{n} giorni fa',
    inDays:           'fra {n} giorni',
    settings:         'Impostazioni',
    openSettings:     'Apri impostazioni',
  },

  en: {
    appName:         'ExMnotes',
    appTagline:      'Your extended mind laboratory',

    navHome:         'Mind',
    navCapture:      'Capture',
    navLibrary:      'Library',
    navGraph:        'Graph',
    navReview:       'Review',

    homeCogSnapshot: 'Cognitive Snapshot',
    homeNotes:       'Notes',
    homeLinks:       'Connections',
    homeStages:      'Stages',
    homeDueToday:    'Due for review',
    homeRecentNotes: 'Recent Notes',
    homeNoNotes:     'No notes yet. Start by capturing a thought.',
    homeGreetMorning:'Good morning',
    homeGreetAfternoon: 'Good afternoon',
    homeGreetEvening:'Good evening',

    captureTitle:     'Capture Thought',
    capturePlaceholder: 'Title of thought…',
    captureBodyPh:    'Elaborate the idea, add context…',
    captureAddTag:    'Add tag…',
    captureAddLink:   'Link to a note…',
    captureSave:      'Save Note',
    capturePhoto:     'Add image',
    captureSaved:     'Note saved to extended mind ✦',
    captureLinked:    'Connection created',
    captureMaxLinks:  'You can link at most 10 notes',

    libraryTitle:     'Library',
    librarySearch:    'Search notes…',
    libraryEmpty:     'No notes found. The mind awaits.\nStart capturing.',
    libraryPageOf:    'Page {p} of {t}',
    libraryAllTags:   'All',

    graphTitle:       'Cognitive Map',
    graphEmpty:       'Create at least two notes and link them\nto see the graph.',
    graphOpenNote:    'Open note',
    graphConnections: 'connections',

    reviewTitle:      'Review',
    reviewProgress:   '{d} / {t} reviewed',
    reviewEmpty:      'Rested Mind',
    reviewEmptyBody:  'No notes due for review today.\nCome back tomorrow to keep growing.',
    reviewHard:       'Hard',
    reviewOk:         'Ok',
    reviewEasy:       'Easy',
    reviewNextDue:    'Next review: {d}',

    stageSeed:        'Seed',
    stageSprout:      'Sprout',
    stageMature:      'Mature',
    stageDesc: {
      seed:   'Freshly captured thought',
      sprout: 'Concept being elaborated',
      mature: 'Deep, well-connected idea',
    },

    settingsTitle:    'Settings',
    settingsTheme:    'Theme',
    settingsThemeAuto: 'Auto (system)',
    settingsThemeLight: 'Light',
    settingsThemeDark: 'Dark',
    settingsLang:     'Language',
    settingsExport:   'Export data',
    settingsImport:   'Import data',
    settingsClear:    'Clear all',
    settingsClearConfirm: 'Are you sure? All data will be deleted.',
    settingsClearConfirm2: 'CONFIRM: permanently delete everything?',
    settingsVersion:  'ExMnotes v1 — MIT License',

    editorTitle:      'Edit note',
    editorSave:       'Save',
    editorDelete:     'Delete',
    editorDeleteConfirm: 'Delete this note?',
    editorBacklinks:  'Backlinks',
    editorNoBacklinks:'No incoming connections.',
    editorLinks:      'Linked to',
    editorAddLink:    '+ Add connection',
    editorStage:      'Cognitive stage',
    editorImage:      'Image',
    editorChangeImage:'Replace',
    editorRemoveImage:'Remove',
    editorAudio:      'Voice',
    editorRecord:     'Record',
    editorStopRecord: 'Stop',
    editorRemoveAudio:'Remove audio',
    editorRecording:  'Recording…',

    toastSaved:       'Saved',
    toastDeleted:     'Deleted',
    toastExported:    'Data exported',
    toastImported:    'Data imported successfully',
    toastError:       'Unexpected error',
    toastCleared:     'All data cleared',
    swUpdateReady:    'New version available — updating…',

    cancel:           'Cancel',
    confirm:          'Confirm',
    close:            'Close',
    today:            'Today',
    yesterday:        'Yesterday',
    daysAgo:          '{n} days ago',
    inDays:           'in {n} days',
    settings:         'Settings',
    openSettings:     'Open settings',
  },
};

let _lang = localStorage.getItem(STORAGE_KEY) || 'it';

/**
 * Get translated string
 * @param {string} key
 * @param {Record<string,string|number>} [vars]
 * @returns {string}
 */
export function t(key, vars = {}) {
  const dict = LANG_DICT[_lang] || LANG_DICT['it'];
  let str = dict[key] ?? LANG_DICT['it'][key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, String(v));
  }
  return str;
}

export function getLang() { return _lang; }

export function setLang(code) {
  if (!LANG_DICT[code]) return;
  _lang = code;
  localStorage.setItem(STORAGE_KEY, code);
  document.documentElement.setAttribute('lang', code);
  document.documentElement.setAttribute('data-lang', code);
  // Emit custom event so views can re-render
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: code } }));
}

/**
 * Format a timestamp for display
 * @param {number} ts
 * @returns {string}
 */
export function formatDate(ts) {
  const now   = Date.now();
  const diff  = now - ts;
  const days  = Math.floor(diff / 86_400_000);
  const future = ts - now;
  const futureDays = Math.ceil(future / 86_400_000);

  if (future > 86_400_000) return t('inDays', { n: futureDays });
  if (diff < 86_400_000 * 0.5) return t('today');
  if (diff < 86_400_000 * 1.5) return t('yesterday');
  return t('daysAgo', { n: days });
}

export function initI18n() {
  document.documentElement.setAttribute('lang', _lang);
  document.documentElement.setAttribute('data-lang', _lang);
}
