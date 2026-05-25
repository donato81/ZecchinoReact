/**
 * WinRTSavePicker.macos — stub `PICKER_UNAVAILABLE` per macOS.
 *
 * DESIGN 009-native §6 (sezione macOS): l'API
 * `Windows.Storage.Pickers.FileSavePicker` non esiste su macOS;
 * il modulo restituisce sempre `PICKER_UNAVAILABLE` per consentire
 * a `ExportService` di mappare l'esito su `UNSUPPORTED_PLATFORM`.
 *
 * Non lancia mai eccezioni (INV-CONTRACT-4).
 */

import type {
  PickSavePathOptions,
  PickSavePathResult,
  WinRTSavePickerSpec,
} from './WinRTSavePicker'

export const WinRTSavePicker: WinRTSavePickerSpec = {
  pickSavePath(_options: PickSavePathOptions): Promise<PickSavePathResult> {
    return Promise.resolve({ status: 'PICKER_UNAVAILABLE' })
  },
}
