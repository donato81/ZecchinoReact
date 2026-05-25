/**
 * WinRTSavePicker — contratto pubblico TypeScript del modulo nativo.
 *
 * Allineato letteralmente al DESIGN 009-native §5.
 * Single-method TurboModule: `pickSavePath`.
 *
 * Invarianti (DESIGN 009-native §5, §7, §10):
 *   INV-CONTRACT-1 — un solo metodo pubblico (`pickSavePath`).
 *   INV-CONTRACT-2 — `fileTypeChoices` generico, mai default CSV hardcoded.
 *   INV-CONTRACT-3 — solo codici opachi nei `status`/`code`, nessuna stringa user-facing.
 *   INV-CONTRACT-4 — nessuna eccezione attraversa il bridge.
 *   INV-CONTRACT-5 — shape `PickSavePathResult` discriminata da `status`, stabile.
 *   INV-L10        — nessuna stringa localizzata né in input né in output.
 *   INV-FILENAME   — pass-through opaco di `suggestedFileName` (nessuna sanitizzazione).
 *   INV-CANCEL     — cancellation modellata come `USER_CANCELLED`, mai come errore.
 *   INV-NVDA       — nessun import da `@/announcements`, `@/accessibility`, `@/locales`.
 *
 * NOTA: questo file espone solo il **contratto** lato TS. Le
 * implementazioni per piattaforma vivono in
 * `WinRTSavePicker.windows.ts` (binding TurboModule reale) e
 * `WinRTSavePicker.macos.ts` / `WinRTSavePicker.stub.ts` (stub
 * `PICKER_UNAVAILABLE`). Il dispatcher Metro risolve
 * `from '@/native'` → corretto modulo per piattaforma.
 */

// ---------------------------------------------------------------------------
// Tipi pubblici (DESIGN 009-native §5)
// ---------------------------------------------------------------------------

export interface FileTypeChoice {
  description: string
  extensions: string[]
}

export interface PickSavePathOptions {
  fileTypeChoices: FileTypeChoice[]
  suggestedFileName?: string
  defaultExtension?: string
}

export type PickSavePathResult =
  | { status: 'SUCCESS'; path: string }
  | { status: 'USER_CANCELLED' }
  | { status: 'INVALID_ARGUMENT'; code: 'EMPTY_CHOICES' | 'INVALID_EXT' }
  | { status: 'PICKER_UNAVAILABLE' }
  | { status: 'INTERNAL_ERROR'; code: string }

export interface WinRTSavePickerSpec {
  pickSavePath(options: PickSavePathOptions): Promise<PickSavePathResult>
}

// ---------------------------------------------------------------------------
// Default export: stub `PICKER_UNAVAILABLE`.
//
// Questo file `.ts` (senza suffisso piattaforma) viene risolto da Metro come
// fallback finale. Su tutte le piattaforme dove esiste un override
// (`.windows.ts`, `.macos.ts`, `.stub.ts` selezionato da `index.ts`),
// questo modulo NON viene caricato. Restituisce comunque un valore conforme
// al contratto per garantire INV-CONTRACT-4 anche in scenari di
// risoluzione bundler inattesi (es. test Node).
// ---------------------------------------------------------------------------

export const WinRTSavePicker: WinRTSavePickerSpec = {
  pickSavePath(_options: PickSavePathOptions): Promise<PickSavePathResult> {
    return Promise.resolve({ status: 'PICKER_UNAVAILABLE' })
  },
}
