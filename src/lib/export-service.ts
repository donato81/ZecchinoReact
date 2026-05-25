import { Platform } from 'react-native'
import Share from 'react-native-share'

export type ExportReason =
  | 'OK'
  | 'USER_CANCELLED'
  | 'UNSUPPORTED_PLATFORM'
  | 'IO_ERROR'
  | 'INVALID_CONTENT'
  | 'TIMEOUT'
  | 'UNKNOWN'

export type ExportResult = {
  success: boolean
  reason: ExportReason
  details?: string
}

export async function exportFile(
  content: string,
  fileName: string,
  mimeType = 'text/csv'
): Promise<ExportResult> {
  try {
    if (!content || typeof content !== 'string') {
      return { success: false, reason: 'INVALID_CONTENT' }
    }

    // iOS / Android: use react-native-share with base64 data URL
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const base64Data = `data:${mimeType};base64,${Buffer.from(
        content,
        'utf8'
      ).toString('base64')}`
      try {
        await Share.open({ url: base64Data, filename: fileName })
        return { success: true, reason: 'OK' }
      } catch (err: any) {
        if (err?.message === 'User did not share') {
          return { success: false, reason: 'USER_CANCELLED' }
        }
        return { success: false, reason: 'UNKNOWN', details: String(err) }
      }
    }

    // Windows: save-picker implementation pending (UNSUPPORTED for now)
    if (Platform.OS === 'windows') {
      return { success: false, reason: 'UNSUPPORTED_PLATFORM' }
    }

    return { success: false, reason: 'UNSUPPORTED_PLATFORM' }
  } catch (error: any) {
    return { success: false, reason: 'UNKNOWN', details: String(error) }
  }
}

export default { exportFile }
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
 * Windows: skeleton. L'implementazione reale è introdotta in T3-N3
 * dopo che T3-N1 e T3-N2 forniscono il modulo nativo `WinRTSavePicker`.
 * Per ora restituisce `UNSUPPORTED_PLATFORM` per mantenere il contratto
 * pubblico verificabile e non rompere la build TypeScript.
 */
async function exportViaWindowsSavePicker(
  _content: string,
  _fileName: string,
  _mimeType: string,
): Promise<ExportResult> {
  return { success: false, reason: 'UNSUPPORTED_PLATFORM' }
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
