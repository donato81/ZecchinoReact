/**
 * Dispatcher Metro per i moduli nativi del progetto.
 *
 * Riesporta `WinRTSavePicker` sfruttando la risoluzione per piattaforma
 * di Metro: l'import `./WinRTSavePicker/WinRTSavePicker` viene risolto
 * automaticamente in:
 *   - `WinRTSavePicker.windows.ts` su Windows;
 *   - `WinRTSavePicker.macos.ts`   su macOS;
 *   - `WinRTSavePicker.ts`          (fallback `PICKER_UNAVAILABLE`)
 *     su Android, iOS e ambiente test/Node.
 *
 * Riesporta inoltre i **tipi pubblici** del contratto per consentire
 * a `ExportService` (chiamante unico, P-N3) l'import unico
 * `from '@/native'`.
 */

export { WinRTSavePicker } from './WinRTSavePicker/WinRTSavePicker'
export type {
  FileTypeChoice,
  PickSavePathOptions,
  PickSavePathResult,
  WinRTSavePickerSpec,
} from './WinRTSavePicker/WinRTSavePicker'
