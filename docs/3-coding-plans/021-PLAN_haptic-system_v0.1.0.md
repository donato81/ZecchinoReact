---
tipo: coding-plan
titolo: Refactor Haptic System — sostituzione navigator.vibrate() con expo-haptics
versione: 0.1.0
data: 2026-06-26
stato: DRAFT
design-sorgente: docs/2-projects/021-DESIGN_haptic-system_v0.1.0.md
debito-tecnico: AN-01
revisore: 
---

# PLAN 021 - Refactor Haptic System — sostituzione navigator.vibrate() con expo-haptics

## 1. Obiettivo del Piano

Sostituire il sistema di feedback aptico basato sull'API web `navigator.vibrate()` con la libreria nativa `expo-haptics` per garantire il funzionamento reale su dispositivi fisici Android e iOS. Eliminare la persistenza sincrona di `localStorage` e adottare un modello di persistenza ibrido (AsyncStorage locale per avvio immediato a bootstrap + Supabase `UserPreferences` con il flag `haptic_enabled` per backup su profilo utente). Semplificare l'interfaccia pubblica a favore di 7 metodi atomici di feedback nativo di `expo-haptics` e fornire una classe di compatibilità deprecata (shim) per consentire la compilazione transitoria senza modificare i file consumer non relativi alle impostazioni.

## 2. Perimetro (Scope)

File da modificare:
- `src/lib/haptic-system.ts` (riscrittura completa e shim di compatibilità)
- `src/hooks/use-haptic.ts` (modifica firma e rimozione intensità)
- `src/hooks/use-user-settings.ts` (estensione con preferenza `hapticEnabled`)
- `src/lib/supabase/types.ts` (aggiunta `haptic_enabled` a `UserPreferences`)
- `package.json` (aggiunta dipendenza `expo-haptics`)
- `package-lock.json` (aggiornamento dipendenze)

Fuori perimetro:
- Modifica a `AuthContext.tsx` o `AppDataContext.tsx` (risolto tramite shim legacy)
- Modifica a interfacce grafiche/UI delle impostazioni (rimandato a fase UI)
- Riscrittura del Sound System (debito AN-02)

## 3. Precondizioni Obbligatorie

1. **Step 0 — Verifica Expo Modules**: Verificare se il progetto è configurato per Expo Modules controllando la presenza di `"expo"` in `package.json`. Se assente, eseguire `npx install-expo-modules@latest` per installarlo nel progetto React Native CLI esistente. Solo successivamente installare `expo-haptics` tramite `npx expo install expo-haptics`.

## 4. Fasi di Implementazione

### FASE-1: Installazione e configurazione expo-haptics
- **File coinvolti**: `package.json`, `package-lock.json`
- **Operazioni**:
  - Eseguire il controllo per verificare Expo Modules.
  - Se necessario, configurare Expo Modules.
  - Installare `expo-haptics` con `npx expo install expo-haptics`.
- **Gate di completamento**: `expo-haptics` è presente in `package.json` e `package-lock.json` è aggiornato correttamente.

### FASE-2: Refactoring haptic-system.ts
- **File coinvolti**: `src/lib/haptic-system.ts`
- **Operazioni**:
  - Riscrivere `haptic-system.ts` eliminando `navigator.vibrate()` e la dipendenza da `localStorage`.
  - Configurare l'importazione di `expo-haptics` ed integrarla secondo l'interfaccia `IHapticSystem` con i 7 metodi nativi (`success`, `error`, `warning`, `selection`, `impactLight`, `impactMedium`, `impactHeavy`).
  - Implementare il controllo `Platform.OS === 'windows'` per rendere tutte le chiamate no-op silenziose su Windows.
  - Implementare il caricamento e il salvataggio asincrono dello stato locale `enabled` tramite `AsyncStorage`.
  - Includere la classe di compatibilità shim con i circa 35 metodi legacy contrassegnati come `@deprecated` che delegano internamente ai nuovi feedback nativi.
- **Gate di completamento**: Il file esporta la classe `HapticSystem` con il nuovo contratto ed espone i metodi shim senza errori di sintassi.

### FASE-3: Aggiornamento use-haptic.ts
- **File coinvolti**: `src/hooks/use-haptic.ts`
- **Operazioni**:
  - Aggiornare il hook `useHaptic` per eliminare l'esposizione di `intensity` ed `setIntensity`.
  - Rimuovere i vecchi metodi `play`, `impact` e `notification` (salvo shim deprecato).
  - Esporre esclusivamente: `isEnabled`, `isSupported`, `setEnabled`, ed i 7 metodi atomici (`success`, `error`, `warning`, `selection`, `impactLight`, `impactMedium`, `impactHeavy`).
- **Gate di completamento**: Il hook `useHaptic` espone esclusivamente il nuovo contratto tipizzato.

### FASE-4: Aggiornamento types.ts
- **File coinvolti**: `src/lib/supabase/types.ts`
- **Operazioni**:
  - Estendere l'interfaccia `UserPreferences` aggiungendo il campo opzionale `haptic_enabled: boolean`.
- **Gate di completamento**: Il compilatore riconosce `haptic_enabled` all'interno di `UserPreferences`.

### FASE-5: Aggiornamento use-user-settings.ts
- **File coinvolti**: `src/hooks/use-user-settings.ts`
- **Operazioni**:
  - Aggiungere lo stato locale `hapticEnabled` nel hook `useUserSettings`.
  - Integrare la sincronizzazione bidirezionale: all'idratazione da Supabase, se `haptic_enabled` differisce dal valore locale del sistema aptico, chiamare `hapticSystem.setEnabled(haptic_enabled)`.
  - Implementare il setter `setHapticEnabled` che invoca `updatePreference('haptic_enabled', valore)` e aggiorna `hapticSystem`.
  - Mantenere la regola di precedenza (se Supabase indica `false`, la vibrazione applicativa è disattivata).
- **Gate di completamento**: `useUserSettings` espone `hapticEnabled` e `setHapticEnabled` correttamente collegati a Supabase.

### FASE-6: Verifica compilazione TypeScript
- **File coinvolti**: Tutto il codebase
- **Operazioni**:
  - Eseguire il controllo di compilazione generale.
- **Gate di completamento**: `npx tsc --noEmit` non produce alcun errore TypeScript nel codebase, in particolare su `haptic-system.ts`, `use-haptic.ts`, `use-user-settings.ts`, `types.ts`, `AuthContext.tsx` e `AppDataContext.tsx`.

### FASE-7: Scrittura e aggiornamento test unitari
- **File coinvolti**: File di test (es. `__tests__/haptic-system.test.ts` o suite esistenti)
- **Operazioni**:
  - Implementare o aggiornare i test unitari per coprire i 12 casi previsti:
    1. `enabled=false` blocca ogni chiamata nativa.
    2. Stato `unknown` durante bootstrap non produce vibrazioni (fail-closed).
    3. Supabase `haptic_enabled=false` sovrascrive AsyncStorage per utente autenticato.
    4. Il valore cloud viene riscritto in AsyncStorage dopo l'idratazione.
    5. `success()` chiama `notificationAsync` con `NotificationFeedbackType.Success`.
    6. `error()` chiama `notificationAsync` con `NotificationFeedbackType.Error`.
    7. `warning()` chiama `notificationAsync` con `NotificationFeedbackType.Warning`.
    8. `selection()` chiama `selectionAsync()`.
    9. `impactLight/Medium/Heavy` chiamano `impactAsync` con lo stile corretto.
    10. `Platform.OS === 'windows'` restituisce no-op silenzioso senza eccezioni.
    11. I metodi legacy `@deprecated` inoltrano ai 7 metodi atomici senza errori.
    12. `use-haptic.ts` non espone `intensity`, `setIntensity`, `play`, `impact`, `notification`.
- **Gate di completamento**: I test unitari passano tutti con successo.

### FASE-8: Gate sicurezza Windows
- **File coinvolti**: Configurazione build Windows
- **Operazioni**:
  - Verificare che `npm run windows` non fallisca per via dell'importazione o del bundling di `expo-haptics` e che tutte le chiamate rimangano no-op silenziose senza crash.
- **Gate di completamento**: Compilazione e avvio Windows stabili con funzionalità aptiche silenti.

### FASE-9: Gate manuale Android — BLOCCATO-UI
- **File coinvolti**: Nessuno (in attesa dell'interfaccia utente)
- **Operazioni**:
  - Verificare manualmente su dispositivo Android fisico o emulatore compatibile che:
    1. Avvio app → `success()` produce feedback tattile reale.
    2. Errore PIN → `error()` produce il pattern di errore.
    3. Disattivazione `haptic_enabled` → vibrazioni bloccate all'istante.
- **Gate di completamento**: **BLOCCATO-UI** — non eseguibile prima della realizzazione delle schermate grafiche delle impostazioni, da sbloccare nella fase UI successiva.

## 5. Regole di comportamento per l'agente di coding

1. **Lettura preventiva**: Leggere sempre interamente ogni file prima di modificarlo.
2. **Controllo incrementale**: Verificare la compilazione TypeScript dopo la modifica di ciascun file.
3. **Sbarramento dei Gate**: Non procedere alla fase successiva se la corrente presenta gate aperti (ad eccezione della FASE-9 che è BLOCCATA-UI).
4. **Strategia in caso di blocco**: Se un gate fallisce per 5 tentativi consecutivi, dichiarare HALT e produrre un report diagnostico dettagliato (file, gate fallito, errore ottenuto, tentativi).

## 6. Debiti Tecnici Generati

- **DT-021-01 — Rimozione shim legacy haptic**: Lo shim deprecated verrà rimosso in `AN-01-Phase2` dopo il riallineamento di `AuthContext.tsx`, `AppDataContext.tsx` e `use-haptic.ts` ai 7 metodi atomici.
- **DT-021-02 — Verifica Expo Modules su Windows**: L'integrazione Expo Modules deve essere verificata specificamente con `react-native-windows` prima della build Windows.
- **DT-021-03 — Preferenza haptic UI**: L'interruttore grafico per `haptic_enabled` è fuori scope in questo design. Sarà introdotto in un blocco UI successivo.
- **DT-021-04 — Test su dispositivo fisico Android**: La validazione finale del feedback aptico richiede almeno un test su dispositivo Android fisico o emulatore compatibile con vibrazione (BLOCCATO-UI).

## 7. Riferimenti

- `docs/2-projects/021-DESIGN_haptic-system_v0.1.0.md`
