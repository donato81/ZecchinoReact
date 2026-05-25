/**
 * ExportService — Layer 2 del DESIGN 009 (export nativo multi-piattaforma).
 *
 * Espone una API pubblica unica `exportFile(content, fileName, mimeType)`
 * con dispatch su `Platform.OS`:
 *   - ios | android → share sheet nativa (react-native-share, data URL)
 *   - windows       → WinRT FileSavePicker (modulo nativo custom, T3-N3)
 *   - default       → UNSUPPORTED_PLATFORM
 *
 * Invarianti (DESIGN 009 §5):
 *   INV-2 — nessun import da `react`, `@/context`, `@/hooks`, `@/components`.
 *   INV-3 — `mimeType: string` parametro pubblico generico.
 *   INV-4 — nessun throw non catturato; tutti gli errori mappati su `ExportResult.reason`.
 *   INV-5 — nessun side effect UX (toast, sound, haptic, screen reader).
 */

import { Platform } from 'react-native'
import Share from 'react-native-share'

import {
  WinRTSavePicker,
  type FileTypeChoice,
  type PickSavePathOptions,
  type PickSavePathResult,
} from '@/native'

// ---------------------------------------------------------------------------
// Tipi pubblici — coerenti con DESIGN 009 §5 (sette reason di errore).
// ---------------------------------------------------------------------------

export type ExportFailureReason =
  | 'CANCELLED'
  | 'PERMISSION_DENIED'
  | 'FILESYSTEM_ERROR'
  | 'UNSUPPORTED_PLATFORM'
  | 'INVALID_PATH'
  | 'INSUFFICIENT_SPACE'
  | 'UNKNOWN'

export type ExportResult =
  | { success: true }
  | { success: false; reason: ExportFailureReason }

// ---------------------------------------------------------------------------
// Helper interni (privati al modulo).
// ---------------------------------------------------------------------------

/**
 * Encoding base64 cross-platform. RN 0.82 espone `global.Buffer`; in fallback
 * usa `btoa` con escape UTF-8. Eventuale fallimento è mappato dal chiamante.
 */
function toBase64(input: string): string {
  // Accesso difensivo a `global.Buffer` (presente in RN 0.82) senza
  // dipendere da @types/node nel tsconfig del progetto.
  const g = globalThis as unknown as {
    Buffer?: { from(str: string, enc: string): { toString(enc: string): string } }
    btoa?: (s: string) => string
  }
  if (g.Buffer) {
    return g.Buffer.from(input, 'utf-8').toString('base64')
  }
  if (typeof g.btoa === 'function') {
    return g.btoa(unescape(encodeURIComponent(input)))
  }
  // INV-4 — il chiamante deve incapsulare questo throw in un try/catch.
  throw new Error('NO_BASE64_RUNTIME')
}

/**
 * Mappa un errore arbitrario (stringa o Error) su `ExportFailureReason`
 * tramite euristica sul messaggio. Conservativa: tutto ciò che non è
 * classificabile cade su `UNKNOWN`.
 */
function mapErrorToReason(err: unknown): ExportFailureReason {
  const msg = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase()
  if (!msg) return 'UNKNOWN'
  if (msg.includes('user did not share') || msg.includes('cancel')) return 'CANCELLED'
  if (msg.includes('permission') || msg.includes('eacces')) return 'PERMISSION_DENIED'
  if (msg.includes('enospc') || msg.includes('no space') || msg.includes('insufficient'))
    return 'INSUFFICIENT_SPACE'
  if (msg.includes('enoent') || msg.includes('invalid path') || msg.includes('no such file'))
    return 'INVALID_PATH'
  if (msg.includes('eio') || msg.includes('write') || msg.includes('read')) return 'FILESYSTEM_ERROR'
  return 'UNKNOWN'
}

// ---------------------------------------------------------------------------
// Strategie per piattaforma.
// ---------------------------------------------------------------------------

/**
 * iOS / Android: share sheet nativa via `react-native-share` usando un
 * data URL base64 (evita scritture su filesystem temporaneo e quindi
 * permessi runtime aggiuntivi).
 */
async function exportViaShareSheet(
  content: string,
  fileName: string,
  mimeType: string,
): Promise<ExportResult> {
  try {
    const base64 = toBase64(content)
    const url = `data:${mimeType};base64,${base64}`
    await Share.open({
      url,
      filename: fileName,
      type: mimeType,
      failOnCancel: false,
    })
    return { success: true }
  } catch (err) {
    return { success: false, reason: mapErrorToReason(err) }
  }
}

/**
 * Windows: WinRT FileSavePicker tramite modulo nativo `WinRTSavePicker`
 * (DESIGN 009-native §5). Mappatura risultati per tabella §8:
 *
 *   PickSavePathResult.status        →  ExportResult
 *   ─────────────────────────────────────────────────────────────────
 *   SUCCESS                          →  scrittura file su result.path
 *                                       (success se write ok,
 *                                       altrimenti mapErrorToReason)
 *   USER_CANCELLED                   →  { reason: 'CANCELLED' } (INV-CANCEL)
 *   PICKER_UNAVAILABLE               →  { reason: 'UNSUPPORTED_PLATFORM' }
 *   INVALID_ARGUMENT                 →  { reason: 'UNKNOWN' }
 *   INTERNAL_ERROR code='INVALID_FILENAME'
 *                                    →  { reason: 'INVALID_PATH' }
 *   INTERNAL_ERROR (altri codici)    →  { reason: 'UNKNOWN' }
 *
 * INV-CONTRACT-2: la derivazione di `fileTypeChoices` da `mimeType` è
 * generica (description + estensione derivata dal `fileName` o defaulting a
 * estensione opaca derivata dal MIME). Nessuna conoscenza CSV/budget/Zecchino.
 *
 * INV-FILENAME: `suggestedFileName` pass-through opaco verso il modulo.
 *
 * Dipendenza opzionale: il write su disco richiede un modulo FS Windows
 * (`react-native-fs` o equivalente). Caricato via dynamic require: se
 * assente, ritorna `UNSUPPORTED_PLATFORM` senza lanciare. L'installazione
 * effettiva è prevista come prerequisito di T3-N5 (build manuale).
 */

// Tipo minimo del modulo FS dinamico, per evitare dipendenze TS forti.
type FsModule = {
  writeFile: (path: string, content: string, encoding: string) => Promise<void>
}

/**
 * Carica un modulo FS Windows in modo opzionale. Non fallisce se assente.
 * Ritorna `null` quando la dipendenza non è installata.
 */
function loadOptionalFsModule(): FsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    return require('react-native-fs') as FsModule
  } catch {
    return null
  }
}

/**
 * Estrae l'estensione (senza punto, lowercase) dalla coda di `fileName`.
 * Ritorna `null` se non trovata.
 */
function extractExtension(fileName: string): string | null {
  const idx = fileName.lastIndexOf('.')
  if (idx <= 0 || idx === fileName.length - 1) return null
  return fileName.slice(idx + 1).toLowerCase()
}

/**
 * Costruisce un singolo `FileTypeChoice` generico a partire da
 * `fileName` e `mimeType`. Non distingue formati specifici:
 *   - description: il `mimeType` stesso (opaco, senza localizzazione → INV-L10)
 *   - extensions: ['.<ext>'] derivata dal fileName, oppure ['.bin'] di fallback
 */
function buildFileTypeChoices(fileName: string, mimeType: string): FileTypeChoice[] {
  const ext = extractExtension(fileName)
  const extension = ext ? `.${ext}` : '.bin'
  return [
    {
      description: mimeType,
      extensions: [extension],
    },
  ]
}

/**
 * Mappa `PickSavePathResult` su `ExportResult` (esclusa la write, gestita
 * separatamente per il caso SUCCESS).
 */
function mapPickResultToFailure(result: PickSavePathResult): ExportResult | null {
  switch (result.status) {
    case 'SUCCESS':
      return null
    case 'USER_CANCELLED':
      return { success: false, reason: 'CANCELLED' }
    case 'PICKER_UNAVAILABLE':
      return { success: false, reason: 'UNSUPPORTED_PLATFORM' }
    case 'INVALID_ARGUMENT':
      return { success: false, reason: 'UNKNOWN' }
    case 'INTERNAL_ERROR':
      return {
        success: false,
        reason: result.code === 'INVALID_FILENAME' ? 'INVALID_PATH' : 'UNKNOWN',
      }
    default: {
      // Esaustività: se in futuro il contratto aggiunge nuovi status,
      // questo blocco rivela il gap senza crash (INV-CONTRACT-5).
      const _exhaustive: never = result
      void _exhaustive
      return { success: false, reason: 'UNKNOWN' }
    }
  }
}

async function exportViaWindowsSavePicker(
  content: string,
  fileName: string,
  mimeType: string,
): Promise<ExportResult> {
  const options: PickSavePathOptions = {
    fileTypeChoices: buildFileTypeChoices(fileName, mimeType),
    suggestedFileName: fileName,
  }
  const ext = extractExtension(fileName)
  if (ext) {
    options.defaultExtension = `.${ext}`
  }

  let pickResult: PickSavePathResult
  try {
    pickResult = await WinRTSavePicker.pickSavePath(options)
  } catch {
    // Cintura ridondante: il binding TS già intercetta i reject del bridge
    // (BRIDGE_REJECT). Questo catch garantisce INV-4 anche in caso di
    // implementazione fallback difettosa.
    return { success: false, reason: 'UNKNOWN' }
  }

  const failure = mapPickResultToFailure(pickResult)
  if (failure) return failure

  // pickResult.status === 'SUCCESS' a questo punto.
  if (pickResult.status !== 'SUCCESS') {
    // Defensive: ridondante rispetto a mapPickResultToFailure ma serve al
    // type narrowing TypeScript per accedere a `pickResult.path`.
    return { success: false, reason: 'UNKNOWN' }
  }

  const fs = loadOptionalFsModule()
  if (!fs) {
    return { success: false, reason: 'UNSUPPORTED_PLATFORM' }
  }

  try {
    await fs.writeFile(pickResult.path, content, 'utf8')
    return { success: true }
  } catch (err) {
    return { success: false, reason: mapErrorToReason(err) }
  }
}

// ---------------------------------------------------------------------------
// API pubblica.
// ---------------------------------------------------------------------------

/**
 * Esporta `content` come file scaricabile/condivisibile dall'utente.
 * Non solleva mai eccezioni: ogni errore è incapsulato in `ExportResult`.
 *
 * @param content   Contenuto testuale del file (es. CSV, JSON, plain text).
 * @param fileName  Nome file proposto all'utente (incluso eventuale ext).
 * @param mimeType  MIME type generico (es. 'text/csv', 'application/json').
 */
export async function exportFile(
  content: string,
  fileName: string,
  mimeType: string,
): Promise<ExportResult> {
  switch (Platform.OS) {
    case 'ios':
    case 'android':
      return exportViaShareSheet(content, fileName, mimeType)
    case 'windows':
      return exportViaWindowsSavePicker(content, fileName, mimeType)
    default:
      return { success: false, reason: 'UNSUPPORTED_PLATFORM' }
  }
}
