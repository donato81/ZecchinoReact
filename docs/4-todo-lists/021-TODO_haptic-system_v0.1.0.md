---
tipo: todo-specifico
titolo: Refactor Haptic System — sostituzione navigator.vibrate() con expo-haptics
versione: 0.1.0
data: 2026-06-26
stato: TODO
coding-plan: docs/3-coding-plans/021-PLAN_haptic-system_v0.1.0.md
design-sorgente: docs/2-projects/021-DESIGN_haptic-system_v0.1.0.md
debito-tecnico: AN-01
---

# TODO 021 - Refactor Haptic System — sostituzione navigator.vibrate() con expo-haptics

## 1. Stato e Gate Bloccante

- **Gate bloccante**: Eseguire il controllo e l'eventuale configurazione di Expo Modules (T01) prima dell'installazione del pacchetto.
- **Stato corrente**: [ ] TODO

## 2. Stato Task (Panoramica)

| ID task | Titolo | Stato | Note |
|---|---|---|---|
| T01 | Verifica ed eventuale configurazione Expo Modules | [ ] TODO | FASE-1 |
| T02 | Installazione expo-haptics | [ ] TODO | FASE-1 |
| T03 | Verifica package.json | [ ] TODO | FASE-1 |
| T04 | Rilascio di navigator.vibrate() | [ ] TODO | FASE-2 |
| T05 | Implementazione 7 metodi atomici | [ ] TODO | FASE-2 |
| T06 | Supporto Platform.OS Windows no-op | [ ] TODO | FASE-2 |
| T07 | Integrazione persistenza AsyncStorage | [ ] TODO | FASE-2 |
| T08 | Aggiornamento interfaccia IHapticSystem | [ ] TODO | FASE-2 |
| T09 | Inserimento shim legacy @deprecated | [ ] TODO | FASE-2 |
| T10 | Aggiornamento use-haptic.ts | [ ] TODO | FASE-3 |
| T11 | Aggiornamento types.ts | [ ] TODO | FASE-4 |
| T12 | Aggiornamento use-user-settings.ts | [ ] TODO | FASE-5 |
| T13 | Verifica tsc --noEmit | [ ] TODO | FASE-6 |
| T14 | Test unitario 1 - enabled=false | [ ] TODO | FASE-7 |
| T15 | Test unitario 2 - bootstrap unknown | [ ] TODO | FASE-7 |
| T16 | Test unitario 3 - Supabase false | [ ] TODO | FASE-7 |
| T17 | Test unitario 4 - cloud to AsyncStorage | [ ] TODO | FASE-7 |
| T18 | Test unitario 5 - success() | [ ] TODO | FASE-7 |
| T19 | Test unitario 6 - error() | [ ] TODO | FASE-7 |
| T20 | Test unitario 7 - warning() | [ ] TODO | FASE-7 |
| T21 | Test unitario 8 - selection() | [ ] TODO | FASE-7 |
| T22 | Test unitario 9 - impactLight/Medium/Heavy | [ ] TODO | FASE-7 |
| T23 | Test unitario 10 - Platform Windows no-op | [ ] TODO | FASE-7 |
| T24 | Test unitario 11 - legacy @deprecated shim | [ ] TODO | FASE-7 |
| T25 | Test unitario 12 - use-haptic.ts contract | [ ] TODO | FASE-7 |
| T26 | Gate sicurezza Windows (npm run windows) | [ ] TODO | FASE-8 |
| T27 | Gate manuale Android | [ ] TODO | FASE-9 (BLOCCATO-UI) |

---

## 3. Task Atomici

### FASE-1: Installazione e configurazione expo-haptics

#### T01
- **Azione**: Verificare se il progetto è già configurato per Expo Modules eseguendo `cat package.json | grep '"expo"'`. Se assente, eseguire `npx install-expo-modules@latest`.
- **Fase**: FASE-1
- **Stato**: [ ] TODO
- **Success Metric**: Comando completato senza errori di build.

#### T02
- **Azione**: Installare `expo-haptics` tramite `npx expo install expo-haptics`.
- **Fase**: FASE-1
- **Stato**: [ ] TODO
- **Depends On**: T01
- **Success Metric**: Comando completato con successo.

#### T03
- **Azione**: Verificare che `expo-haptics` sia aggiunto alle dipendenze in `package.json`.
- **Fase**: FASE-1
- **Stato**: [ ] TODO
- **Depends On**: T02
- **File coinvolto**: `package.json`
- **Success Metric**: Dipendenza presente con la corretta versione.

---

### FASE-2: Refactoring haptic-system.ts

#### T04
- **Azione**: Rimuovere l'utilizzo di `navigator.vibrate()` e la dipendenza da `localStorage`.
- **Fase**: FASE-2
- **Stato**: [ ] TODO
- **File coinvolto**: `src/lib/haptic-system.ts`
- **Success Metric**: `navigator.vibrate` e `localStorage` rimossi dal file.

#### T05
- **Azione**: Implementare i 7 metodi atomici di vibrazione nativa (`success`, `error`, `warning`, `selection`, `impactLight`, `impactMedium`, `impactHeavy`) delegando a `expo-haptics`.
- **Fase**: FASE-2
- **Stato**: [ ] TODO
- **File coinvolto**: `src/lib/haptic-system.ts`
- **Success Metric**: I metodi invocano correttamente le relative chiamate di `expo-haptics`.

#### T06
- **Azione**: Aggiungere il controllo `Platform.OS === 'windows'` per disabilitare silenziosamente (no-op) il modulo su Windows.
- **Fase**: FASE-2
- **Stato**: [ ] TODO
- **File coinvolto**: `src/lib/haptic-system.ts`
- **Success Metric**: Su Windows il sistema non esegue chiamate native e non genera errori.

#### T07
- **Azione**: Implementare il caricamento e il salvataggio asincrono dello stato `enabled` tramite `AsyncStorage`.
- **Fase**: FASE-2
- **Stato**: [ ] TODO
- **File coinvolto**: `src/lib/haptic-system.ts`
- **Success Metric**: Lo stato delle impostazioni viene caricato/salvato in modo asincrono.

#### T08
- **Azione**: Aggiornare l'interfaccia `IHapticSystem` e conformare la classe `HapticSystem` al nuovo contratto TypeScript.
- **Fase**: FASE-2
- **Stato**: [ ] TODO
- **File coinvolto**: `src/lib/haptic-system.ts`
- **Success Metric**: TypeScript compila senza errori sul contratto del file.

#### T09
- **Azione**: Inserire i circa 35 metodi legacy contrassegnati come `@deprecated` come shim di compatibilità, mappandoli internamente ai 7 metodi nativi.
- **Fase**: FASE-2
- **Stato**: [ ] TODO
- **Depends On**: T05
- **File coinvolto**: `src/lib/haptic-system.ts`
- **Success Metric**: I metodi legacy sono esportati e non generano errori di tipo per i vecchi consumer.

---

### FASE-3: Aggiornamento use-haptic.ts

#### T10
- **Azione**: Aggiornare il hook `useHaptic` in `src/hooks/use-haptic.ts` rimuovendo `intensity`, `setIntensity`, `play`, `impact`, `notification` (salvo shim deprecati) ed esponendo solo `isEnabled`, `isSupported`, `setEnabled` ed i 7 metodi atomici.
- **Fase**: FASE-3
- **Stato**: [ ] TODO
- **Depends On**: T08
- **File coinvolto**: `src/hooks/use-haptic.ts`
- **Success Metric**: Il hook espone solo la nuova interfaccia semplificata.

---

### FASE-4: Aggiornamento types.ts

#### T11
- **Azione**: Aggiungere `haptic_enabled?: boolean` nell'interfaccia `UserPreferences` di Supabase.
- **Fase**: FASE-4
- **Stato**: [ ] TODO
- **File coinvolto**: `src/lib/supabase/types.ts`
- **Success Metric**: Il tipo `UserPreferences` include `haptic_enabled`.

---

### FASE-5: Aggiornamento use-user-settings.ts

#### T12
- **Azione**: Estendere `useUserSettings` per includere `hapticEnabled` e `setHapticEnabled`. Implementare la sincronizzazione ibrida (AsyncStorage locale + Supabase cloud) e la precedenza del valore cloud su quello locale per l'utente autenticato.
- **Fase**: FASE-5
- **Stato**: [ ] TODO
- **Depends On**: T07, T11
- **File coinvolto**: `src/hooks/use-user-settings.ts`
- **Success Metric**: La preferenza viene allineata tra il cloud, lo stato locale ed AsyncStorage.

---

### FASE-6: Verifica compilazione TypeScript

#### T13
- **Azione**: Eseguire `npx tsc --noEmit` per validare la compilazione di tutto il perimetro di refactoring.
- **Fase**: FASE-6
- **Stato**: [ ] TODO
- **Depends On**: T09, T10, T12
- **Success Metric**: Nessun errore TypeScript riscontrato.

---

### FASE-7: Scrittura e aggiornamento test unitari

#### T14
- **Azione**: Implementare test unitario: `enabled=false` blocca ogni chiamata nativa.
- **Fase**: FASE-7
- **Stato**: [ ] TODO

#### T15
- **Azione**: Implementare test unitario: lo stato `unknown` durante bootstrap non produce vibrazioni (fail-closed).
- **Fase**: FASE-7
- **Stato**: [ ] TODO

#### T16
- **Azione**: Implementare test unitario: Supabase `haptic_enabled=false` sovrascrive AsyncStorage per utente autenticato.
- **Fase**: FASE-7
- **Stato**: [ ] TODO

#### T17
- **Azione**: Implementare test unitario: il valore cloud viene riscritto in AsyncStorage dopo l'idratazione.
- **Fase**: FASE-7
- **Stato**: [ ] TODO

#### T18
- **Azione**: Implementare test unitario: `success()` chiama `notificationAsync` con `NotificationFeedbackType.Success`.
- **Fase**: FASE-7
- **Stato**: [ ] TODO

#### T19
- **Azione**: Implementare test unitario: `error()` chiama `notificationAsync` con `NotificationFeedbackType.Error`.
- **Fase**: FASE-7
- **Stato**: [ ] TODO

#### T20
- **Azione**: Implementare test unitario: `warning()` chiama `notificationAsync` con `NotificationFeedbackType.Warning`.
- **Fase**: FASE-7
- **Stato**: [ ] TODO

#### T21
- **Azione**: Implementare test unitario: `selection()` chiama `selectionAsync()`.
- **Fase**: FASE-7
- **Stato**: [ ] TODO

#### T22
- **Azione**: Implementare test unitario: `impactLight/Medium/Heavy` chiamano `impactAsync` con lo stile corretto.
- **Fase**: FASE-7
- **Stato**: [ ] TODO

#### T23
- **Azione**: Implementare test unitario: `Platform.OS === 'windows'` restituisce no-op silenzioso.
- **Fase**: FASE-7
- **Stato**: [ ] TODO

#### T24
- **Azione**: Implementare test unitario: i metodi legacy `@deprecated` dello shim inoltrano ai 7 metodi atomici senza errori.
- **Fase**: FASE-7
- **Stato**: [ ] TODO

#### T25
- **Azione**: Implementare test unitario: `use-haptic.ts` non espone più `intensity`, `setIntensity`, `play`, `impact`, `notification`.
- **Fase**: FASE-7
- **Stato**: [ ] TODO

---

### FASE-8: Gate sicurezza Windows

#### T26
- **Azione**: Avviare la build ed esecuzione su Windows (`npm run windows`) e verificare che la dipendenza `expo-haptics` non causi errori di compilazione o crash e che tutte le chiamate rimangano no-op silenziose.
- **Fase**: FASE-8
- **Stato**: [ ] TODO
- **Success Metric**: Windows compilato e funzionante con feedback aptici silenti.

---

### FASE-9: Gate manuale Android

#### T27
- **Azione**: Eseguire la verifica manuale su dispositivo fisico Android o emulatore con vibrazione attiva:
  1. Avvio app → `success()` produce feedback.
  2. Errore PIN → `error()` produce feedback di errore.
  3. Disattivazione `haptic_enabled` → feedback tattile bloccato all'istante.
- **Fase**: FASE-9
- **Stato**: [ ] BLOCCATO-UI
- **Depends On**: Realizzazione della UI delle impostazioni (fase UI successiva)
- **Success Metric**: Feedback aptico avvertibile e controllabile da impostazioni su dispositivo fisico.

---

## 4. Note Operative

- Durante l'inizializzazione del sistema aptico, lo stato di `supportsVibration` deve essere impostato a `false` se `Platform.OS === 'windows'` per bloccare le chiamate all'avvio.
- Lo shim deprecato è temporaneo e deve essere preservato per non rompere `AuthContext` ed `AppDataContext`.

---

## 5. Log di Validazione

| Data | Task ID | Eseguito Da | Risultato | Note |
|---|---|---|---|---|
| 2026-06-26 | — | DUSU-PLAN | CREATO | Todo list iniziale |

---

## 6. Gate di Chiusura

- **G-021-1**: `npx tsc --noEmit` non riporta alcun errore nel codebase. (Gate Status: [ ] OPEN)
- **G-021-2**: La suite di test unitari (test T14-T25) viene eseguita con esito 100% PASS. (Gate Status: [ ] OPEN)
- **G-021-3**: `npm run windows` si avvia con successo senza crash da `expo-haptics`. (Gate Status: [ ] OPEN)
- **G-021-4**: Verifica manuale su dispositivo Android fisica (T27) completata. (Gate Status: [ ] BLOCCATO-UI)

---

## 7. Riferimenti

- `docs/2-projects/021-DESIGN_haptic-system_v0.1.0.md`
- `docs/3-coding-plans/021-PLAN_haptic-system_v0.1.0.md`

---

## 8. Debiti Tecnici Aperti Generati

- **DT-021-01 — Rimozione shim legacy haptic**: Stato: `OPEN`
- **DT-021-02 — Verifica Expo Modules su Windows**: Stato: `OPEN`
- **DT-021-03 — Preferenza haptic UI**: Stato: `OPEN`
- **DT-021-04 — Test su dispositivo fisico Android**: Stato: `OPEN` (BLOCCATO-UI)
