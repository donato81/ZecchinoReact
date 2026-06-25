// src/accessibility/types.ts
// Tipi condivisi tra engine.ts e detection.ts.
// Regola generale: NON importare direttamente da questo file fuori da
// src/accessibility/. Unica eccezione ammessa: src/announcements/types.ts
// può importare Announcement e AnnouncementPriority come `import type`
// — mai codice eseguibile. Vedi DESIGN 003 §3.1 per la motivazione completa.

// ── Tipi del motore di annuncio ────────────────────────────────────────────

/**
 * Priorità di un annuncio.
 * - 'polite': l'annuncio aspetta che lo screen reader finisca quello che
 *   sta leggendo.
 * - 'assertive': l'annuncio ha precedenza sul contenuto corrente.
 *
 * React Native 0.82 non espone nativamente questa distinzione tramite
 * AccessibilityInfo.announceForAccessibility. Il campo è mantenuto nella
 * struttura Announcement per:
 * a) Documentare l'intenzione semantica del chiamante.
 * b) Forward compatibility: quando React Native aggiungerà supporto nativo
 *    la distinzione è già codificata nell'oggetto.
 * c) Permettere agli screen reader che la supportano (Narrator su Windows)
 *    di ricevere context aggiuntivo in una futura versione dell'engine.
 */
export type AnnouncementPriority = 'polite' | 'assertive';

/**
 * Struttura di un annuncio pronto da pronunciare.
 * Prodotta dai moduli src/announcements/, consumata da engine.ts.
 * Il testo deve essere già composto e localizzato — engine.ts non esegue
 * nessuna trasformazione sul testo.
 */
export interface Announcement {
  text: string;
  priority: AnnouncementPriority;
}

// ── Tipi del rilevamento piattaforma ──────────────────────────────────────

/**
 * Stato corrente del rilevamento screen reader.
 *
 * CAMBIAMENTO RISPETTO ALLA VERSIONE PRECEDENTE:
 * Il livello intermedio di confidenceLevel è eliminato.
 * L'API nativa AccessibilityInfo.isScreenReaderEnabled() fornisce una
 * risposta binaria certa — non graduata — quindi due soli valori:
 * - 'high': isScreenReaderEnabled() ha restituito true.
 * - 'low': stato iniziale prima che la Promise sia risolta, o nessuno
 *   screen reader attivo.
 * I consumatori che verificavano il livello intermedio devono essere
 * aggiornati a questo contratto binario.
 */
export interface TalkBackState {
  /** true se lo screen reader è attivo (nativo o override manuale) */
  isEnabled: boolean;
  /** true se AccessibilityInfo.isScreenReaderEnabled() ha restituito true */
  isDetected: boolean;
  /**
   * 'high' = risposta certa dal sistema operativo (isEnabled è affidabile)
   * 'low' = stato iniziale prima che la Promise sia risolta, oppure
   *         nessuno screen reader attivo
   */
  confidenceLevel: 'high' | 'low';
  /** true se le adattazioni (touch target, timeout, descrizioni) sono attive */
  adaptationsActive: boolean;
}

/**
 * Adattamenti attivi quando uno screen reader è rilevato.
 * Questo tipo è la forma client-side. Una forma compatibile esiste anche
 * in src/lib/supabase/types.ts per la persistenza su DB.
 * Fonte di verità: questo file. Vedi DESIGN 003 §11 — "Nota critica: migrazione TalkBackAdaptations".
 */
export interface TalkBackAdaptations {
  enhancedTouchTargets: boolean;
  simplifiedNavigation: boolean;
  extendedTimeouts: boolean;
  verboseDescriptions: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
  autoFocusManagement: boolean;
  // Campo mantenuto per compatibilità con la shape persistita in
  // src/lib/supabase/types.ts e nel database. Non esiste un audio
  // engine che consumi questo flag in questa fase del progetto.
  // Il default in DEFAULT_ADAPTATIONS è `true` per preservare la
  // coerenza con la shape originale persistita — non perché il flag
  // sia attivo funzionalmente. Va rivalutato quando il layer audio
  // verrà implementato.
  spatialAudio: boolean;
}
