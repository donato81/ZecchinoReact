/**
 * WinRTSavePicker.windows — binding TurboModule lato JS per Windows.
 *
 * Adattatore puro: nessuna logica di dominio, nessuna trasformazione
 * degli `status`/`code` (DESIGN 009-native §5, §6).
 *
 * Il TurboModule nativo è registrato lato C++/WinRT in
 * `windows/ZecchinoReact/WinRTSavePickerModule.cpp` (T3-N2) e
 * pubblicato dal `ReactPackageProvider` esistente.
 *
 * In RNW 0.82.x con la New Architecture il modulo è esposto come
 * TurboModule via `TurboModuleRegistry.get<Spec>(NAME)`. Se la
 * registrazione nativa è assente (es. build senza il bridge
 * compilato, oppure forks senza recompile), il modulo restituisce
 * un risultato `PICKER_UNAVAILABLE` per preservare INV-CONTRACT-4.
 */

import { TurboModuleRegistry, type TurboModule } from 'react-native';
import type {
  PickSavePathOptions,
  PickSavePathResult,
  WinRTSavePickerSpec,
} from './WinRTSavePicker';

interface Spec extends TurboModule {
  pickSavePath(options: PickSavePathOptions): Promise<PickSavePathResult>;
}

const NativeModule = TurboModuleRegistry.get<Spec>('WinRTSavePickerModule');

export const WinRTSavePicker: WinRTSavePickerSpec = {
  pickSavePath(options: PickSavePathOptions): Promise<PickSavePathResult> {
    if (!NativeModule) {
      return Promise.resolve({ status: 'PICKER_UNAVAILABLE' });
    }
    // INV-CONTRACT-4: anche un eventuale reject del bridge va incapsulato
    // in un risultato conforme. Il modulo C++/WinRT non deve rigettare
    // (mappa internamente tutto su `status`), ma cintura di sicurezza:
    return NativeModule.pickSavePath(options).catch(
      (): PickSavePathResult => ({
        status: 'INTERNAL_ERROR',
        code: 'BRIDGE_REJECT',
      }),
    );
  },
};
