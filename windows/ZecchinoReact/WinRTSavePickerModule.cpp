// WinRTSavePickerModule.cpp
//
// Implementazione del bridge C++/WinRT verso Windows.Storage.Pickers.FileSavePicker.
// Vedi WinRTSavePickerModule.h per il contratto e DESIGN 009-native §5/§8 per la
// tabella di mappatura status/code -> PickSavePathResult.
//
// Modello di threading (INV-THREAD):
//   - pickSavePath() viene invocato dal bridge RN su un worker thread.
//   - FileSavePicker richiede UI thread (su Win32 host serve anche HWND tramite
//     IInitializeWithWindow).
//   - Marshal via ReactContext.UIDispatcher().Post(...) -> coroutine fire_and_forget
//     che esegue il picker e risolve la promise.
//
// Mappatura errori (DESIGN 009-native §8):
//   options.fileTypeChoices vuoto                    -> INVALID_ARGUMENT, code=EMPTY_CHOICES
//   defaultExtension non in fileTypeChoices.extensions -> INVALID_ARGUMENT, code=INVALID_EXT
//   UIDispatcher() == nullptr                        -> INTERNAL_ERROR,   code=DISPATCHER_DETACHED
//   PickSaveFileAsync() ritorna nullptr (annullato)  -> USER_CANCELLED
//   hresult_error con code E_FAIL                    -> INTERNAL_ERROR,   code=HRESULT_E_FAIL
//   hresult_error con code E_INVALIDARG (filename)   -> INTERNAL_ERROR,   code=INVALID_FILENAME
//   altre hresult_error                              -> INTERNAL_ERROR,   code=HRESULT_<int>
//   eccezione std::                                   -> INTERNAL_ERROR,   code=STD_EXCEPTION
//   eccezione sconosciuta                             -> INTERNAL_ERROR,   code=UNKNOWN_EXCEPTION

#include "pch.h"

#include "WinRTSavePickerModule.h"

#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Foundation.Collections.h>
#include <winrt/Windows.Storage.h>
#include <winrt/Windows.Storage.Pickers.h>

#include <ShObjIdl.h>  // IInitializeWithWindow

#include <string>
#include <utility>

namespace winrt::ZecchinoReact {

using winrt::Microsoft::ReactNative::JSValueObject;
using winrt::Microsoft::ReactNative::ReactContext;
using winrt::Microsoft::ReactNative::ReactPromise;

void WinRTSavePickerModule::Initialize(ReactContext const &reactContext) noexcept {
  m_reactContext = reactContext;
}

namespace {

// Costruttori di risultato (mantengono shape stabile per INV-CONTRACT-5).
JSValueObject MakeStatus(std::string status) noexcept {
  JSValueObject r;
  r["status"] = std::move(status);
  return r;
}

JSValueObject MakeStatusWithCode(std::string status, std::string code) noexcept {
  JSValueObject r;
  r["status"] = std::move(status);
  r["code"] = std::move(code);
  return r;
}

JSValueObject MakeSuccess(std::string path) noexcept {
  JSValueObject r;
  r["status"] = "SUCCESS";
  r["path"] = std::move(path);
  return r;
}

std::string Narrow(winrt::hstring const &h) noexcept {
  if (h.empty()) return {};
  std::wstring_view wv{h};
  int len = ::WideCharToMultiByte(
      CP_UTF8, 0, wv.data(), static_cast<int>(wv.size()), nullptr, 0, nullptr, nullptr);
  std::string s(static_cast<size_t>(len), '\0');
  ::WideCharToMultiByte(
      CP_UTF8, 0, wv.data(), static_cast<int>(wv.size()), s.data(), len, nullptr, nullptr);
  return s;
}

// Confronto case-insensitive ".csv" == "csv" == ".CSV" ecc.
bool ExtensionMatches(std::string const &needle, std::vector<FileTypeChoice> const &choices) noexcept {
  std::string a = needle;
  if (!a.empty() && a[0] != '.') a.insert(a.begin(), '.');
  for (auto const &c : choices) {
    for (auto const &e : c.extensions) {
      std::string b = e;
      if (!b.empty() && b[0] != '.') b.insert(b.begin(), '.');
      if (_stricmp(a.c_str(), b.c_str()) == 0) return true;
    }
  }
  return false;
}

// Coroutine eseguita sul UI thread. Cattura tutto per copia (promise è
// move-only friendly grazie a ReactPromise<T> copy semantics interno).
winrt::fire_and_forget RunPickerOnUiThread(
    PickSavePathOptions options,
    ReactPromise<JSValueObject> promise) noexcept {
  // INV-CONTRACT-4: nessuna eccezione attraversa il bridge.
  try {
    winrt::Windows::Storage::Pickers::FileSavePicker picker;

    // Win32 host: senza IInitializeWithWindow il picker fallisce con E_FAIL.
    HWND hwnd = ::GetActiveWindow();
    if (hwnd == nullptr) {
      hwnd = ::GetForegroundWindow();
    }
    if (hwnd != nullptr) {
      auto init = picker.as<::IInitializeWithWindow>();
      init->Initialize(hwnd);
    }

    // Popolazione FileTypeChoices (estensioni normalizzate con leading dot).
    for (auto const &choice : options.fileTypeChoices) {
      auto exts = winrt::single_threaded_vector<winrt::hstring>();
      for (auto const &e : choice.extensions) {
        std::string normalized = e;
        if (!normalized.empty() && normalized[0] != '.') {
          normalized.insert(normalized.begin(), '.');
        }
        exts.Append(winrt::to_hstring(normalized));
      }
      picker.FileTypeChoices().Insert(winrt::to_hstring(choice.description), exts);
    }

    if (options.suggestedFileName && !options.suggestedFileName->empty()) {
      // INV-FILENAME: pass-through opaco.
      picker.SuggestedFileName(winrt::to_hstring(*options.suggestedFileName));
    }
    if (options.defaultExtension && !options.defaultExtension->empty()) {
      std::string ext = *options.defaultExtension;
      if (!ext.empty() && ext[0] != '.') ext.insert(ext.begin(), '.');
      picker.DefaultFileExtension(winrt::to_hstring(ext));
    }

    auto file = co_await picker.PickSaveFileAsync();

    if (file == nullptr) {
      // INV-CANCEL: status, non errore.
      promise.Resolve(MakeStatus("USER_CANCELLED"));
      co_return;
    }

    promise.Resolve(MakeSuccess(Narrow(file.Path())));
    co_return;
  } catch (winrt::hresult_canceled const &) {
    promise.Resolve(MakeStatus("USER_CANCELLED"));
    co_return;
  } catch (winrt::hresult_error const &hre) {
    std::string code;
    const int32_t hr = hre.code().value;
    switch (hr) {
      case E_FAIL:
        code = "HRESULT_E_FAIL";
        break;
      case E_INVALIDARG:
        code = "INVALID_FILENAME";
        break;
      default:
        code = "HRESULT_" + std::to_string(hr);
        break;
    }
    promise.Resolve(MakeStatusWithCode("INTERNAL_ERROR", std::move(code)));
    co_return;
  } catch (std::exception const &) {
    promise.Resolve(MakeStatusWithCode("INTERNAL_ERROR", "STD_EXCEPTION"));
    co_return;
  } catch (...) {
    promise.Resolve(MakeStatusWithCode("INTERNAL_ERROR", "UNKNOWN_EXCEPTION"));
    co_return;
  }
}

}  // namespace

void WinRTSavePickerModule::pickSavePath(
    PickSavePathOptions options,
    ReactPromise<JSValueObject> promise) noexcept {
  // Validazione input (INVALID_ARGUMENT, DESIGN §8).
  if (options.fileTypeChoices.empty()) {
    promise.Resolve(MakeStatusWithCode("INVALID_ARGUMENT", "EMPTY_CHOICES"));
    return;
  }
  if (options.defaultExtension && !options.defaultExtension->empty() &&
      !ExtensionMatches(*options.defaultExtension, options.fileTypeChoices)) {
    promise.Resolve(MakeStatusWithCode("INVALID_ARGUMENT", "INVALID_EXT"));
    return;
  }

  // INV-THREAD: marshal su UI thread tramite ReactDispatcher.
  auto dispatcher = m_reactContext.UIDispatcher();
  if (dispatcher == nullptr) {
    promise.Resolve(MakeStatusWithCode("INTERNAL_ERROR", "DISPATCHER_DETACHED"));
    return;
  }

  // Cattura per copia / move per evitare dangling reference attraverso il Post.
  dispatcher.Post([opts = std::move(options), p = promise]() mutable {
    RunPickerOnUiThread(std::move(opts), p);
  });
}

}  // namespace winrt::ZecchinoReact
