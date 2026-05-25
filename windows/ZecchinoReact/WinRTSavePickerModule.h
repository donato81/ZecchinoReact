// WinRTSavePickerModule.h
//
// TurboModule C++/WinRT che implementa il contratto WinRTSavePickerSpec
// definito in src/native/WinRTSavePicker/WinRTSavePicker.ts (DESIGN 009-native §5).
//
// Registrato via attributi REACT_MODULE; viene raccolto automaticamente da
// AddAttributedModules(packageBuilder, true) in ZecchinoReact.cpp.
//
// Invarianti (DESIGN 009-native §6, §7, §8):
//   INV-CONTRACT-1   single-method: pickSavePath è l'UNICO metodo esposto.
//   INV-CONTRACT-2   firma generica: nessun riferimento a CSV/budget/Zecchino.
//   INV-CONTRACT-3   codici di errore opachi (stringhe stabili, no UI text).
//   INV-CONTRACT-4   no throw verso il bridge: ogni eccezione è catturata e
//                    mappata a PickSavePathResult.
//   INV-CONTRACT-5   shape stabile: status è discriminante; campi opzionali
//                    coerenti con il contratto TS.
//   INV-L10          il modulo non genera stringhe localizzabili user-facing.
//                    description/extensions sono opaque pass-through.
//   INV-NVDA         nessuna logica di annuncio screen reader nel nativo.
//   INV-FILENAME     suggestedFileName trattato come opaco pass-through.
//   INV-CANCEL       USER_CANCELLED è uno status, mai un errore.
//   INV-THREAD       FileSavePicker invocato sempre su UI thread tramite
//                    ReactContext.UIDispatcher().

#pragma once

#include "pch.h"

#include <NativeModules.h>
#include <winrt/Microsoft.ReactNative.h>
#include <optional>
#include <string>
#include <vector>

namespace winrt::ZecchinoReact {

// Mirror C++ di TS FileTypeChoice (DESIGN 009-native §5).
REACT_STRUCT(FileTypeChoice)
struct FileTypeChoice {
  REACT_FIELD(description)
  std::string description;

  REACT_FIELD(extensions)
  std::vector<std::string> extensions;
};

// Mirror C++ di TS PickSavePathOptions (DESIGN 009-native §5).
REACT_STRUCT(PickSavePathOptions)
struct PickSavePathOptions {
  REACT_FIELD(fileTypeChoices)
  std::vector<FileTypeChoice> fileTypeChoices;

  REACT_FIELD(suggestedFileName)
  std::optional<std::string> suggestedFileName;

  REACT_FIELD(defaultExtension)
  std::optional<std::string> defaultExtension;
};

// TurboModule: il name è "WinRTSavePickerModule" e DEVE corrispondere alla
// stringa passata a TurboModuleRegistry.get<Spec>() in
// src/native/WinRTSavePicker/WinRTSavePicker.windows.ts.
REACT_MODULE(WinRTSavePickerModule)
struct WinRTSavePickerModule {
  REACT_INIT(Initialize)
  void Initialize(winrt::Microsoft::ReactNative::ReactContext const &reactContext) noexcept;

  // Unico metodo esposto. Il risultato è sempre una PickSavePathResult
  // serializzata come JSValueObject (status + campi accessori).
  REACT_METHOD(pickSavePath)
  void pickSavePath(
      PickSavePathOptions options,
      winrt::Microsoft::ReactNative::ReactPromise<winrt::Microsoft::ReactNative::JSValueObject> promise) noexcept;

 private:
  winrt::Microsoft::ReactNative::ReactContext m_reactContext{nullptr};
};

}  // namespace winrt::ZecchinoReact
