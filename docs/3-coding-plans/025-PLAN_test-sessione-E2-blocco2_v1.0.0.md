---
tipo: plan
titolo: Test Sessione E2 — Blocco 2: Contesti Base, Hook e Componenti (Parte 1)
versione: 1.0.0
data: 2026-06-30
stato: APPROVED
perimetro: src/context/UserSettingsContext.tsx, src/hooks/use-user-settings.ts, src/hooks/use-inactivity-timer.ts, src/hooks/use-haptic.ts, src/components/ActivityDetectorView.tsx, src/components/ui/button.tsx, src/context/NetworkStatusContext.tsx
ramo: main
---

# PLAN 025 — Test Sessione E2 — Blocco 2: Contesti Base, Hook e Componenti (Parte 1)

## Riepilogo Esecutivo

Questo Coding Plan definisce la pianificazione strategica per la Sessione E2 dei test del progetto ZecchinoReact, relativa al **Blocco 2 — Contesti e Hook (Parte 1)**. L'obiettivo è colmare i gap di copertura rilevati in `docs/1-reports/REPORT-analisi-copertura-test-completa_v1.0.0.md`, portando a completa copertura 7 moduli del codebase che gestiscono preferenze utente, inattività, feedback tattile e componenti di interfaccia di base.

- **Obiettivo della sessione:** Implementare tutti i test mancanti identificati per garantire robustezza su preferenze di accessibilità, timer di inattività, risposte di tastiera su Windows e componenti riutilizzabili.
- **Numero test stimati:** 38 test unitari ed integrati nuovi.

> **Riconciliazione conteggio E2 — 58 vs 38:**
> Il report Sessione D (`REPORT-analisi-copertura-test-completa_v1.0.0.md`)
> indica in sintesi 58 test per la Sessione E2. La somma analitica dei
> 7 moduli coperti da questo PLAN è pari a 38 test obbligatori.
> La differenza di 20 test corrisponde ad `AuthContext.tsx`, che nel
> report sorgente è esplicitamente assegnato alla Sessione E3 insieme
> ad `AppDataContext.tsx`.
> **PLAN 025 copre E2 Parte 1 con 38 test. AuthContext resta fuori
> perimetro e sarà trattato nella Sessione E3.**
- **Moduli coinvolti:** 7 moduli totali (suddivisi in 2 contesti, 3 hook e 2 componenti).
- **Nuove suite di test da creare (5):**
  - `__tests__/UserSettingsContext.test.tsx` (3 test per `src/context/UserSettingsContext.tsx`)
  - `__tests__/use-user-settings.test.ts` (16 test per `src/hooks/use-user-settings.ts`)
  - `__tests__/use-inactivity-timer.test.ts` (8 test per `src/hooks/use-inactivity-timer.ts`)
  - `__tests__/ActivityDetectorView.test.tsx` (3 test per `src/components/ActivityDetectorView.tsx`)
  - `__tests__/button.test.tsx` (4 test per `src/components/ui/button.tsx`)
- **Suite di test esistenti da integrare (2):**
  - `__tests__/haptic-system.test.tsx` (2 test per `src/hooks/use-haptic.ts`)
  - `__tests__/use-network-status.spec.ts` (2 test per `src/context/NetworkStatusContext.tsx`)

---

## 1. Strategia e Dettaglio Modulo per Modulo

### 1. UserSettingsContext.tsx
- **File target:** [UserSettingsContext.tsx](file:///c:/Sviluppo/ZecchinoReact/src/context/UserSettingsContext.tsx)
- **Test target:** `__tests__/UserSettingsContext.test.tsx` [NEW]
- **Obiettivo:** Testare il corretto montaggio del provider e l'accesso difensivo al hook per i consumer.
- **Stima test:** 3 test.
- **Dipendenze da mockare:** `@/hooks/use-user-settings` (hook privato).
- **Nota architetturale:** Il file `UserSettingsContext.tsx` importa il
  hook privato `useUserSettings` da `@/hooks/use-user-settings` e ne
  distribuisce il valore tramite React Context. Il test deve mockare
  questo hook privato per controllare il valore iniettato nel provider.
  **Non montare il hook reale in questa suite**: la logica interna del
  hook è coperta autonomamente da `__tests__/use-user-settings.test.ts`.
  Non mockare il hook pubblico `useUserSettings` esportato da
  `UserSettingsContext.tsx` stesso.
- **Test pianificati:**
  1. `UserSettingsProvider` monta correttamente i figli avvolgendoli con lo stato restituito da `useUserSettings`.
  2. `useUserSettings` consumato correttamente all'interno del provider restituisce il valore del contesto.
  3. `useUserSettings` invocato al di fuori del `UserSettingsProvider` solleva un errore di runtime esplicito.

### 2. use-user-settings.ts
- **File target:** [use-user-settings.ts](file:///c:/Sviluppo/ZecchinoReact/src/hooks/use-user-settings.ts)
- **Test target:** `__tests__/use-user-settings.test.ts` [NEW]
- **Obiettivo:** Coprire interamente l'inizializzazione delle preferenze utente, il caricamento dal cloud, i setter asincroni e i ripristini dei valori predefiniti nel rispetto del vincolo P29.
- **Stima test:** 16 test.
- **Dipendenze da mockare:** `@/context/AuthContext`, `@/lib/supabase/repositories/impostazioni-utente`, `@/lib/sound-system`, `@/lib/haptic-system`.
- **Nota dipendenza AuthContext:** Mockare esclusivamente `useAuth()`
  da `@/context/AuthContext` all'interno del file di test. Non montare
  `AuthProvider` reale e non dipendere dalla Sessione E3. I mock di
  `useAuth` devono coprire almeno questi scenari: utente non
  autenticato, utente autenticato senza preferenze cloud, utente
  autenticato con preferenze valide, preferenze incomplete o corrotte,
  `updatePreference` risolto con successo, `updatePreference` rigettato
  con errore.
- **Test pianificati:**
  1. Inizializzazione preferenze - carica i valori di default corretti in mancanza di preferenze salvate per l'utente loggato.
  2. Caricamento preferenze da cloud - inizializza correttamente lo stato dell'audio, feedback tattile, preferenze grafiche e di accessibilità scaricati da Supabase.
  3. `setVisibleCategories` - aggiorna lo stato locale dopo la corretta scrittura persistente sul database.
  4. `dismissBudgetAlert` - aggiunge e persiste l'id del budget dismesso nel DB e nello stato locale.
  5. `dismissBudgetAlert` - esegue early return se il budget è già dismesso.
  6. `resetDismissedAlerts` - svuota le notifiche dei budget a DB e azzera lo stato locale.
  7. `setAudioEnabled` - imposta l'abilitazione dell'audio a DB, aggiorna lo stato locale e propaga a `soundSystem`.
  8. `setAudioVolume` - persiste il livello del volume a DB, aggiorna lo stato locale e propaga a `soundSystem`.
  9. `setHapticEnabled` - gestisce l'aggiornamento quando l'utente non è autenticato (solo locale).
  10. `setHapticEnabled` - persiste e propaga l'abilitazione tattile a `hapticSystem` quando l'utente è autenticato.
  11. `setDisplayPreference` - gestisce la scrittura su DB e aggiorna localmente lo stato delle preferenze grafiche/visualizzazione.
  12. `setScreenReaderPreference` - gestisce la scrittura su DB e aggiorna localmente lo stato delle preferenze dello screen reader.
  13. `setTalkBackAdaptations` - convalida la struttura dati e aggiorna gli adattamenti su cloud e in locale.
  14. `setTalkBackAdaptations` - rifiuta e non persiste adattamenti non conformi o corrotti impostando un errore.
  15. `setTalkBackManualOverride` - persiste e aggiorna lo stato di override manuale dello screen reader.
  16. `resetScreenReaderPreferences` - esegue il reset atomico di tutte le chiavi dello screen reader e degli adattamenti ai default nativi.

### 3. use-inactivity-timer.ts
- **File target:** [use-inactivity-timer.ts](file:///c:/Sviluppo/ZecchinoReact/src/hooks/use-inactivity-timer.ts)
- **Test target:** `__tests__/use-inactivity-timer.test.ts` [NEW]
- **Obiettivo:** Testare l'orchestrazione dei timer di avviso e scadenza della sessione, con cleanup rigoroso al fine di prevenire leak di memoria.
- **Stima test:** 8 test.
- **Dipendenze da mockare:** Nessuna.
- **Test pianificati:**
  1. Inizializzazione con `timeoutMinutes <= 0` non avvia alcun timer e mantiene `showWarning` a false.
  2. Inizializzazione con `timeoutMinutes > 0` pianifica correttamente il timer di avviso warning (`timeout - 1` minuto) e il timer finale.
  3. Raggiungimento della scadenza di pre-avviso imposta `showWarning` a true.
  4. Raggiungimento della scadenza finale imposta `showWarning` a false ed esegue la callback `onTimeout`.
  5. `resetTimer` con `timeoutMinutes <= 0` cancella i timer attivi e imposta `showWarning` a false.
  6. `resetTimer` con `timeoutMinutes > 0` cancella i vecchi timer e rischedula le scadenze col tempo corrente.
  7. Unmount del hook cancella tutti i timer attivi (nessun timeout orfano in background).
  8. Modifica dinamica di `timeoutMinutes` durante il ciclo di vita cancella i precedenti timer e rischedula le nuove durate.

### 4. use-haptic.ts
- **File target:** [use-haptic.ts](file:///c:/Sviluppo/ZecchinoReact/src/hooks/use-haptic.ts)
- **Test target:** [haptic-system.test.tsx](file:///c:/Sviluppo/ZecchinoReact/__tests__/haptic-system.test.tsx) [MODIFY]
- **Obiettivo:** Integrare la suite esistente per coprire il hook che fa da ponte tra l'applicazione e la classe `HapticSystem`.
- **Stima test:** 2 test.
- **Dipendenze da mockare:** `@/lib/haptic-system`.
- **Test pianificati:**
  1. Inizializzazione del hook legge correttamente i valori correnti di `isEnabled` e `isSupported` dal modulo centrale `hapticSystem`.
  2. `setEnabled` del hook invoca correttamente `hapticSystem.setEnabled` e aggiorna lo stato React.

### 5. ActivityDetectorView.tsx
- **File target:** [ActivityDetectorView.tsx](file:///c:/Sviluppo/ZecchinoReact/src/components/ActivityDetectorView.tsx)
- **Test target:** `__tests__/ActivityDetectorView.test.tsx` [NEW]
- **Obiettivo:** Testare il rilevamento delle interazioni touch e la cattura degli eventi di tastiera sulla piattaforma Windows.
- **Stima test:** 3 test.
- **Dipendenze da mockare:** `react-native` (Platform).
- **Test pianificati:**
  1. Rilevatore touch `onStartShouldSetResponder` invoca `onActivity` e restituisce false (non cattura il focus).
  2. Rilevatore touch `onMoveShouldSetResponder` non invoca nulla e restituisce false.
  3. Piattaforma Windows: la pressione di un tasto (`onKeyDown`) invoca correttamente la callback `onActivity`.

### 6. button.tsx
- **File target:** [button.tsx](file:///c:/Sviluppo/ZecchinoReact/src/components/ui/button.tsx)
- **Test target:** `__tests__/button.test.tsx` [NEW]
- **Obiettivo:** Verificare la propagazione dei click, fallback su proprietà legacy e pass-through degli attributi.
- **Stima test:** 4 test.
- **Nota promozione:** Il test sul pass-through delle proprietà extra
  (`disabled`, `accessibilityLabel`) era classificato come opzionale
  nel report sorgente. Viene qui promosso a test operativo obbligatorio
  perché il componente `Button` usa `...props` per distribuire le
  proprietà a `TouchableOpacity`, rendendo questo comportamento
  critico per accessibilità e compatibilità con i consumer.
- **Dipendenze da mockare:** Nessuna.
- **Test pianificati:**
  1. Renderizzazione corretta del testo interno (children) all'interno del pulsante.
  2. Pressione del pulsante invoca correttamente `onPress` se fornito.
  3. Pressione del pulsante invoca il fallback legacy `onClick` se `onPress` è omesso (retrocompatibilità).
  4. Passaggio trasparente di proprietà extra (es. `disabled`, `accessibilityLabel`) al componente nativo sottostante.

### 7. NetworkStatusContext.tsx
- **File target:** [NetworkStatusContext.tsx](file:///c:/Sviluppo/ZecchinoReact/src/context/NetworkStatusContext.tsx)
- **Test target:** [use-network-status.spec.ts](file:///c:/Sviluppo/ZecchinoReact/__tests__/use-network-status.spec.ts) [MODIFY]
- **Obiettivo:** Integrare la suite per verificare la gestione degli errori sollevati da `@react-native-community/netinfo`.
- **Stima test:** 2 test.
- **Dipendenze da mockare:** `@react-native-community/netinfo`.
- **Test pianificati:**
  1. Eccezione in `NetInfo.addEventListener` durante l'inizializzazione attiva immediatamente il fail-safe `FAIL_SAFE_ONLINE` garantendo la continuazione.
  2. Eccezione sollevata da `unsubscribe` al momento dell'unmount del provider viene intercettata, stampando un warning in console senza bloccare o mandare in crash l'applicazione.

---

## 2. Ordine dei Commit e Flusso di Esecuzione Consigliato

Si raccomanda di implementare i test seguendo l'ordine dei 3 commit proposti per rispettare le dipendenze architetturali e isolare le modifiche:

### Commit 1: `test: aggiunge unit test per bottoni e ActivityDetectorView`
- **Moduli coperti:** `button.tsx`, `ActivityDetectorView.tsx`
- **File di test creati:** `__tests__/button.test.tsx`, `__tests__/ActivityDetectorView.test.tsx`
- **Test stimati:** 7 test.

### Commit 2: `test: implementa test per use-inactivity-timer e use-haptic`
- **Moduli coperti:** `use-inactivity-timer.ts`, `use-haptic.ts`
- **File di test creati/modificati:** `__tests__/use-inactivity-timer.test.ts`, `__tests__/haptic-system.test.tsx`
- **Test stimati:** 10 test.

### Commit 3: `test: completa copertura di UserSettingsContext e NetworkStatusContext`
- **Moduli coperti:** `UserSettingsContext.tsx`, `use-user-settings.ts`, `NetworkStatusContext.tsx`
- **File di test creati/modificati:** `__tests__/UserSettingsContext.test.tsx`, `__tests__/use-user-settings.test.ts`, `__tests__/use-network-status.spec.ts`
- **Test stimati:** 21 test.

---

## 3. Criteri di Validazione

1. Ogni singolo test deve essere verificato tramite:
   `npx jest --testPathPattern=<nome_test>`
2. La compilazione del codice e dei test deve essere validata prima di ogni commit con:
   `npx tsc --noEmit`
3. Nel caso in cui una suite di test rimanga bloccata per più di 10 tentativi consecutivi, si dovrà accodare a questo documento un **Diagnostic Report** dettagliato.

---

## Note Tecniche Critiche

### NT-1 — use-user-settings.ts: Vincolo P29 (Scrittura Non Ottimistica)
Tutti i test relativi ai setter asincroni (`setVisibleCategories`, `dismissBudgetAlert`, `setAudioEnabled`, ecc.) devono verificare rigorosamente che lo stato React locale *non* si aggiorni prima che la promessa di `updatePreference` sia risolta positivamente. In caso di errore nel database remoto (ovvero se `updatePreference` rigetta), lo stato locale deve rimanere invariato e l'errore deve essere memorizzato nella proprietà `settingsError`.

### NT-2 — use-inactivity-timer.ts: Gestione Fake Timers in Jest
I test sul timer di inattività richiedono l'uso intensivo dei timer fittizi di Jest:
- Abilitare i timer tramite `jest.useFakeTimers()` nel `beforeEach`.
- Controllare l'avanzamento temporale tramite `jest.advanceTimersByTime(ms)`.
- Nel `afterEach`, eseguire prima `jest.runOnlyPendingTimers()` per
  svuotare eventuali timer rimasti in sospeso al termine del test,
  poi ripristinare i timer reali tramite `jest.useRealTimers()`.
  Questo previene interferenze tra suite consecutive.

### NT-3 — ActivityDetectorView.tsx: Simulazione di Piattaforma Windows
Il file `ActivityDetectorView.tsx` usa `Platform.OS === 'windows'` per registrare la prop `onKeyDown`. Per testare questo ramo specifico:
- Eseguire il mock di `Platform.OS` impostando temporaneamente `'windows'`.
- Ripristinare il valore originale di `Platform.OS` al termine del test.
- Verificare che su Windows la prop `onKeyDown` sia passata al componente `View` nativo e invochi `onActivity`.
