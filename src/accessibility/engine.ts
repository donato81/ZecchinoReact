// src/accessibility/engine.ts
import { AccessibilityInfo } from 'react-native'
import type { Announcement } from './types'

class ScreenReaderEngine {
  /**
   * Pronuncia un annuncio già costruito.
   *
   * Natura fire-and-forget:
   * - Il metodo non attende la pronuncia né gestisce callback.
   * - Il fallimento è sempre silenzioso: se lo screen reader non è attivo,
   *   se la piattaforma non supporta la chiamata, o se la coda è piena,
   *   non viene generata nessuna eccezione né attivato nessun fallback.
   * - L'unico gate: se announcement.text.trim() è vuoto, la chiamata
   *   a AccessibilityInfo viene saltata.
   *
   * Sul campo `priority`:
   * React Native 0.82 non espone un parametro priority in
   * announceForAccessibility. Il campo è presente nell'oggetto Announcement
   * per documentazione semantica e forward compatibility — quando RN
   * aggiungerà il supporto nativo la distinzione sarà in questo unico punto.
   *
   * Comportamento per piattaforma (RN 0.82):
   * - Android / TalkBack: pronuncia il testo; TalkBack gestisce la coda
   *   interna. La distinzione polite/assertive non è esposta.
   * - iOS / VoiceOver: pronuncia il testo; VoiceOver gestisce interruzioni
   *   in base alle sue policy interne.
   * - Windows / Narrator: vedere DESIGN 003 §10 — Rischio R1.
   *
   * @param announcement Oggetto Announcement prodotto da src/announcements/
   */
  announce(announcement: Announcement): void {
    if (!announcement.text.trim()) {
      return
    }
    if (typeof AccessibilityInfo.announceForAccessibility !== 'function') {
      // Fallback silenzioso in ambienti che non supportano l'API
      // (es. Jest/Node, versioni RN Windows senza supporto completo).
      // Coerente con il principio fire-and-forget: il fallimento è sempre
      // silenzioso e non genera eccezioni.
      if (__DEV__) {
        console.log('[engine] announceForAccessibility non disponibile:', announcement.text)
      }
      return
    }
    AccessibilityInfo.announceForAccessibility(announcement.text)
  }
}

/**
 * Singleton esportato.
 * Unico punto dell'app che chiama AccessibilityInfo.announceForAccessibility.
 * I moduli src/announcements/ importano questo singleton per pronunciare —
 * ma questo avviene nel documento successivo (DESIGN 004), non in questo.
 * In questo documento nessun file chiama engine.announce() tranne il
 * componente di test temporaneo del Gate 2, che va rimosso prima del commit.
 */
export const engine = new ScreenReaderEngine()
