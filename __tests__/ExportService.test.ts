/**
 * Placeholder di test per ExportService e handleExportCSV (DESIGN 009).
 *
 * Questo file documenta i casi di test attesi a fronte dell'implementazione
 * del Coding Plan 009. Non contiene asserzioni eseguibili: i test reali
 * verranno scritti contestualmente all'implementazione di
 * `src/lib/export-service.ts` e all'aggiornamento di
 * `src/context/AppDataContext.tsx` (firma `handleExportCSV` -> Promise<void>).
 *
 * Riferimento: docs/2-projects/009-DESIGN_export-nativo_v0.1.0.md
 */

describe('ExportService (placeholder DESIGN 009)', () => {
  // Casi di test attesi sul contratto ExportResult:
  it.todo('export riuscito su iOS/Android -> { success: true } via share sheet')
  it.todo('export riuscito su Windows -> { success: true } via save file dialog')
  it.todo('utente annulla share sheet/save dialog -> { success: false, reason: CANCELLED }')
  it.todo('OS nega permesso di scrittura -> { success: false, reason: PERMISSION_DENIED }')
  it.todo('errore I/O filesystem -> { success: false, reason: FILESYSTEM_ERROR }')
  it.todo('piattaforma non supportata -> { success: false, reason: UNSUPPORTED_PLATFORM }')
  it.todo('path invalido (Windows) -> { success: false, reason: INVALID_PATH }')
  it.todo('spazio insufficiente -> { success: false, reason: INSUFFICIENT_SPACE }')
  it.todo('errore non classificabile -> { success: false, reason: UNKNOWN }')
  it.todo('ExportService non solleva mai eccezioni (catch + mapping interno)')
  it.todo('nessun side effect UX dentro ExportService (no toast/sound/haptic/screenReader)')
  // Strategia Windows a due componenti (DESIGN 009, Sezione 6):
  it.todo('Windows Layer A: scrittura file in directory temporanea via @react-native-windows/fs')
  it.todo('Windows Layer B: selezione percorso destinazione via WinRT Save File Picker (TurboModule)')
  it.todo('Windows: utente annulla il WinRT Save Picker -> { success: false, reason: CANCELLED } senza scrittura file')
  it.todo('Windows: fallimento scrittura su path selezionato dall\'utente -> { success: false, reason: FILESYSTEM_ERROR }')
})

describe('handleExportCSV in AppDataContext (placeholder DESIGN 009)', () => {
  // Verifiche sulla nuova firma asincrona e sull'orchestrazione UX:
  it.todo('handleExportCSV ha firma Promise<void> (non piu void)')
  it.todo('handleExportCSV chiama exportToCSV e poi ExportService nell\'ordine corretto')
  it.todo('su success=true esegue soundSystem.play("export"), hapticSystem.export(), toast.success, screenReader.announceSuccess')
  it.todo('su reason=CANCELLED non mostra toast di errore')
  it.todo('su reason=PERMISSION_DENIED mostra toast di errore con istruzioni permessi')
  it.todo('su reason=FILESYSTEM_ERROR mostra toast di errore generico')
  it.todo('su reason=UNSUPPORTED_PLATFORM mostra toast di errore di non disponibilita')
  it.todo('nessun riferimento residuo al simbolo rimosso downloadFile')
})
