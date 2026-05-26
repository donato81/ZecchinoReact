/**
 * react-native.config.js
 *
 * Configurazione autolinking React Native CLI.
 *
 * `react-native-share` viene escluso dalla build Windows perche su
 * Windows l'export file e gestito nativamente da
 * `windows/ZecchinoReact/WinRTSavePickerModule.{h,cpp}` via
 * `Windows.Storage.Pickers.FileSavePicker` (PLAN 009-native).
 * Inoltre il vcxproj di `react-native-share@12.3.1` linka
 * `Microsoft.ReactNative.Uwp` (old arch) ed e incompatibile con
 * `RnwNewArch=true` obbligatorio in react-native-windows ^0.82.5.
 *
 * La libreria resta disponibile su Android e iOS per uso futuro.
 *
 * `@react-native-community/netinfo` viene escluso dalla build Windows
 * perche il suo vcxproj (RNCNetInfoCPP) richiede
 * Microsoft.Windows.CppWinRT.2.0.210312.4, incompatibile con
 * react-native-windows ^0.82.5. Bug upstream aperto, nessuna fix
 * disponibile. Su Windows il NetworkStatusProvider attiva il
 * Fail-Safe Online-First (DESIGN 008 INV-4) dopo 1500 ms.
 *
 * Riferimenti:
 *  - DT-009-N-01 (docs/todo-master.md §7.1) — problema B
 *    react-native-share + RNW 0.82 new arch.
 *  - DESIGN 009-native §6 (Windows — implementazione reale).
 *  - DESIGN 008 §5 INV-4 (Fail-Safe Online-First).
 *  - https://github.com/react-native-netinfo/react-native-netinfo/issues/751
 */
module.exports = {
  dependencies: {
    'react-native-share': {
      platforms: {
        windows: null,
      },
    },
    '@react-native-community/netinfo': {
      platforms: {
        windows: null,
      },
    },
  },
};