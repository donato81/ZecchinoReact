/**
 * WinRTSavePicker.stub — fallback `PICKER_UNAVAILABLE` per Android/iOS.
 *
 * DESIGN 009-native §6 (sezioni Android, iOS): non esiste un Save File
 * Picker nativo equivalente; l'export su queste piattaforme usa la
 * share sheet via `react-native-share` (ramo iOS/Android di
 * `ExportService`). Questo stub serve a garantire che, anche se per
 * errore il binding venisse importato fuori dal ramo Windows, il
 * contratto restasse rispettato.
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
