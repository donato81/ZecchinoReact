---
tipo: todo-list
titolo: Sound System — Refactoring motore audio nativo
versione: 0.1.0
data: 2026-06-27
stato: in-lavorazione
plan-ref: 022-PLAN_sound-system_v0.1.0.md
design-ref: 022-DESIGN_sound-system_v0.1.0.md
blocco: AN-02
---

# TODO 022 - Sound System — Refactoring motore audio nativo

Questo file contiene l'elenco operativo delle attività (TODO) necessarie per implementare il refactoring del Sound System in ambiente nativo React Native, in conformità con il piano di coding PLAN 022 ed il documento di design DESIGN 022.

## File Coinvolti

### File Modificati:
* `package.json`
* `src/lib/sound-system.ts`
* `src/hooks/use-user-settings.ts`
* `CHANGELOG.md`

### File Creati:
* `__tests__/sound-system.spec.ts`

### File Fuori Scope (esplicitamente non modificati):
* `src/context/AuthContext.tsx`
* `src/context/AppDataContext.tsx`

Questi file usano soundSystem.play() con nomi legacy. Grazie al mapping introdotto in questo piano, continueranno a funzionare senza modifiche. La loro migrazione verso CanonicalSoundType è registrata in DT-022-05 e avverrà in una fase futura.

## Prerequisiti

* [ ] **PREREQ-01**: Il documento di design `docs/2-projects/022-DESIGN_sound-system_v0.1.0.md` è in stato "bozza" approvata, versione 0.1.1. Confermato dalla sessione corrente.
* [ ] **PREREQ-02**: Verifica compatibilità react-native-audio-api. Prima di installare la libreria, verificare sulla documentazione ufficiale che la versione ^1.0.0 sia compatibile con React Native 0.82.1 e New Architecture abilitata. Se la versione non è compatibile, identificare la versione compatibile più recente e usare quella. Questo gate è obbligatorio. Non installare la libreria senza aver completato questa verifica.
* [ ] **PREREQ-03**: I test esistenti per sound-system passano o sono stati aggiornati per riflettere lo stato attuale del file prima del refactoring.
* [ ] **PREREQ-04**: Il branch di lavoro è separato dal main (es. `feature/022-sound-system-plan`). Non lavorare direttamente su main.

## TODO per Sistema Operativo

### 5A — TODO Trasversali (Tutti i sistemi)
* [ ] **TS-01**: Eseguire il type-checking generale con `npx tsc --noEmit` ad ogni completamento di task.
* [ ] **TS-02**: Riscrivere la logica di mapping legacy-to-canonical `normalizeSoundType()` coprendo tutti i 91 valori totali.
* [ ] **TS-03**: Strutturare i 20 casi di test unitari T01-T20 in Jest per validare in memoria ogni aspetto runtime.

### 5B — TODO Specifici Android
* [ ] **AND-01**: Aggiungere `"react-native-audio-api": "^1.0.0"` in `package.json` ed eseguire `npm install`.
* [ ] **AND-02**: Eseguire la build Android (`npx expo run:android` o `npm run android`) per accertare che i moduli nativi si colleghino correttamente.

### 5C — TODO Specifici Windows
* [ ] **WIN-01**: Verificare che `src/lib/sound-system.ts` non contenga import statici di `react-native-audio-api` al livello top-level del modulo.
* [ ] **WIN-02**: Implementare il fallback early return condizionale per Platform.OS === 'windows' dentro `ensureContext()`.
* [ ] **WIN-03**: Eseguire il comando di verifica cross-platform Node per convalidare il gate statico G-022-WIN.

## TODO Task per Task

### TASK-01 — Installazione e verifica dipendenza nativa
* [ ] **Subtask 1.1**: Verificare la compatibilità di `react-native-audio-api` con React Native 0.82.1 ed Expo New Architecture.
* [ ] **Subtask 1.2**: Inserire la dipendenza nativa `"react-native-audio-api": "^1.0.0"` in `package.json` sotto `dependencies`.
* [ ] **Subtask 1.3**: Lanciare `npm install` per allineare package-lock.json.
* [ ] **Subtask 1.4**: Eseguire la compilazione Android tramite `npx expo run:android` per verificare l'integrità del build nativo.
* [ ] **Subtask 1.5**: Convalidare che non vi siano import statici in `sound-system.ts` tramite il comando del gate G-022-WIN.
* [ ] **Subtask 1.6**: Lanciare `npx tsc --noEmit` per verificare l'assenza di errori statici di compilazione TypeScript.
* **Condizione di Accettazione**: Build Android passa. Build Windows non si rompe a livello statico. TypeScript senza errori.

### TASK-02 — Riscrittura di sound-system.ts
* [ ] **Subtask 2.1**: Censire i metodi pubblici esistenti, la firma di AudioPersistCallbacks, il valore di volume di default e l'unione SoundType da preservare.
* [ ] **Subtask 2.2**: Definire i tipi pubblici `CanonicalSoundType`, `LegacySoundType` (86 valori) e `SoundType` (91 valori totali) conformemente al design.
* [ ] **Subtask 2.3**: Implementare `normalizeSoundType()` inserendo i mapping specifici deliberati dal Consiglio AI (delibera PA-01):
  * `lock` -> `navigation`
  * `private-lock` -> `navigation`
  * `unlock` -> `success`
  * Ramo default -> `click`
  * Inserire il commento delibera PA-01 nel codice di `normalizeSoundType()`.
* [ ] **Subtask 2.4**: Implementare il costruttore della classe `SoundSystem` come blocco vuoto. **Il metodo initialize() deve essere rimosso integralmente.**
* [ ] **Subtask 2.5**: Implementare `ensureContext()` con:
  * Early exit per `Platform.OS === 'windows'` (G-WIN).
  * Early exit per `!this.enabled`.
  * Inizializzazione lazy di `AudioContext` nativo protetta da try/catch.
  * In caso di errore: `this.enabled = false` solo in memoria a runtime (nessuna scrittura Supabase).
  * Chiamata a `registerAppStateListener()` in caso di successo.
* [ ] **Subtask 2.6**: Implementare `registerAppStateListener()` per sospendere l'audio context in `background` / `inactive` e riprenderlo in `active` (solo se enabled).
* [ ] **Subtask 2.7**: Implementare `play(soundType: SoundType)` in modo che esegua `ensureContext()`, normalizzi il tipo e distribuisca la chiamata al rispettivo metodo privato.
* [ ] **Subtask 2.8**: Creare i 5 metodi privati di sintesi audio con i parametri fisici esatti del DESIGN 022:
  * `playClick()`: sine 800 Hz, durata 30-50 ms, ADSR (attack 0.001s, decay 0.02s, sustain 0.3, release 0.03s).
  * `playSuccess()`: pattern sine a 3 note ascendenti 523.25 Hz -> 659.25 Hz -> 783.99 Hz, durata 80-120 ms per nota, delay interazione 80 ms.
  * `playError()`: pattern sawtooth a 2 note discendenti 300 Hz -> 250 Hz, durata 100-150 ms per nota, delay 100 ms.
  * `playWarning()`: pattern square doppio tono 440 Hz -> 440 Hz, durata 150-200 ms totali, delay pausa intermedia 150 ms.
  * `playNavigation()`: sine 600 Hz, durata 40 ms, ADSR (attack 0.001s, decay 0.01s, sustain 0.5, release 0.03s).
* [ ] **Subtask 2.9**: Sviluppare `playSequence()` usando `audioContext.currentTime` per temporizzare le note melodiche. **L'uso di setTimeout è vietato per lo scheduling musicale.**
* [ ] **Subtask 2.10**: Implementare le funzioni pubbliche di controllo runtime `initFromSettings`, `configure`, `setVolume`, `setEnabled`, `getVolume`, `getEnabled` garantendo che il volume sia clampato in range 0-1.
* [ ] **Subtask 2.11**: Esportare il singleton: `export const soundSystem = new SoundSystem();`.
* **Condizione di Accettazione**: npx tsc --noEmit senza errori. Nessun metodo initialize() nel file. Nessun setTimeout per temporizzazione musicale. Tutti i metodi pubblici del file originale presenti con le stesse firme.

### TASK-03 — Collegamento runtime con useUserSettings
* [ ] **Subtask 3.1**: Individuare nel hook `src/hooks/use-user-settings.ts` il caricamento di `audio_enabled` e `audio_volume` da Supabase e i setter associati.
* [ ] **Subtask 3.2**: All'idratazione iniziale delle preferenze utente, invocare `soundSystem.initFromSettings(audioEnabled, audioVolume)`.
* [ ] **Subtask 3.3**: Nel setter `setAudioEnabled()`, aggiungere la chiamata `soundSystem.setEnabled(v)` dopo la persistenza su Supabase.
* [ ] **Subtask 3.4**: Nel setter `setAudioVolume()`, aggiungere la chiamata `soundSystem.setVolume(v)` dopo la persistenza su Supabase.
* [ ] **Subtask 3.5**: Verificare che `initFromSettings` non attivi i callback di salvataggio per prevenire loop infiniti di persistenza.
* **Condizione di Accettazione**: npx tsc --noEmit senza errori. Le tre chiamate a soundSystem sono presenti. Nessun ciclo di persistenza infinito introdotto.

### TASK-04 — Stesura e verifica dei test
* [ ] **Subtask 4.1**: Creare il file di test unitario `__tests__/sound-system.spec.ts`.
* [ ] **Subtask 4.2**: Definire i mock necessari all'interno del file di test:
  * Mock globale per `AudioContext` nativo, `OscillatorNode`, `GainNode` da `react-native-audio-api`.
  * Mock di `AppState` di `react-native`.
  * Mock di `Platform.OS` di `react-native`.
  * Mock della funzione `soundSystem.play` per i test legati a useUserSettings (T15-T17).
* [ ] **Subtask 4.3**: Implementare i 20 test unitari T01-T20 come descritto:
  * [ ] **T01**: Verifica che `enabled=false` inibisca le chiamate sonore.
  * [ ] **T02**: Verifica che il volume sia matematicamente clampato tra 0 e 1.
  * [ ] **T03**: Verifica che `setEnabled` chiami `onEnabledChange`.
  * [ ] **T04**: Verifica che `setVolume` chiami `onVolumeChange`.
  * [ ] **T05**: Verifica che `initFromSettings` allinei le proprietà senza chiamare i callback di persistenza.
  * [ ] **T06**: Verifica che `play('success')` sintetizzi 3 note sine ad altezza ascendente (523.25 Hz -> 659.25 Hz -> 783.99 Hz).
  * [ ] **T07**: Verifica che `play('error')` generi 2 toni sawtooth discendenti (300 Hz -> 250 Hz).
  * [ ] **T08**: Verifica che `play('warning')` produca il pattern warning specificato (doppio tono repeated: 440 Hz -> 440 Hz).
  * [ ] **T09**: Verifica che `play('click')` produca un suono di click sine da 800 Hz e 30-50 ms.
  * [ ] **T10**: Verifica che `play('navigation')` esegua il tono navigation specificato (sine 600 Hz, 40 ms).
  * [ ] **T11**: Verifica che il costruttore non crei AudioContext e che `initialize()` non esista nel file (usare `expect(soundSystem['initialize']).toBeUndefined()`).
  * [ ] **T12**: Verifica che in caso di fallimento di `AudioContext` nativo, `play()` degradi in no-op silenzioso.
  * [ ] **T13**: Verifica che il passaggio di `AppState` a background/inactive sospenda l'audio context.
  * [ ] **T14**: Verifica che il passaggio di `AppState` ad active riesuma l'audio context solo se `enabled === true`.
  * [ ] **T15**: Verifica che `useUserSettings` chiami `soundSystem.initFromSettings` con i valori iniziali all'idratazione.
  * [ ] **T16**: Verifica che `setAudioEnabled` aggiorni l'istanza `soundSystem` dopo la persistenza su Supabase.
  * [ ] **T17**: Verifica che `setAudioVolume` aggiorni l'istanza `soundSystem` dopo la persistenza su Supabase.
  * [ ] **T18**: Verifica che `playSequence()` pianifichi le note usando `audioContext.currentTime` come offset temporale (spiare currentTime ed escludere l'uso di `setTimeout`).
  * [ ] **T19**: Verifica che in caso di fallimento runtime la proprietà `enabled` sia disabilitata temporaneamente in memoria, senza modificare Supabase.
  * [ ] **T20**: Verifica che tutti i 16 suoni legacy obbligatori siano normalizzati verso i 5 canonici senza errori di compilazione e senza default: `pin-error`, `private-unlock`, `dialog-close`, `budget-exceeded`, `budget-critical`, `budget-warning`, `save`, `account-created`, `income`, `expense`, `transfer`, `delete`, `budget-deleted`, `export`, `budget-created`, `goal-created`.
* **Condizione di Accettazione**: Tutti i test T01-T20 passano con successo (nessun skip o pending).

## Gate di Validazione Finale

* [ ] **G-022-TS**: Esecuzione del type-checking tramite `npx tsc --noEmit` senza alcun errore.
  * *Esito*: [ ] SUPERATO SI/NO
* [ ] **G-022-ANDROID**: Compilazione nativa dell'applicazione Android superata con successo (`npx expo run:android` o `npm run android`).
  * *Esito*: [ ] SUPERATO SI/NO
* [ ] **G-022-WIN**: Il file `src/lib/sound-system.ts` non contiene import statici top-level da `react-native-audio-api`.
  * *Comando di verifica Unix/Git Bash*:
    `grep "from 'react-native-audio-api'" src/lib/sound-system.ts`
  * *Comando di verifica cross-platform Node*:
    `node -e "const fs=require('fs'); const s=fs.readFileSync('src/lib/sound-system.ts','utf8'); const bad=/^import\s+.*from\s+['\"]react-native-audio-api['\"]/m.test(s); if(bad){console.error('ERRORE: import statico top-level trovato');process.exit(1)} console.log('OK: nessun import statico top-level da react-native-audio-api')"`
  * *Esito*: [ ] SUPERATO SI/NO (Accettazione: il comando stampa OK)
* [ ] **G-022-TESTS**: Tutti i test T01-T20 della suite unitaria vengono completati con successo.
  * *Esito*: [ ] SUPERATO SI/NO

## Debiti Tecnici Registrati

* **DT-022-01 — Verifica runtime React Native Windows**: Esecuzione e verifica del comportamento runtime del modulo audio su piattaforma Windows non appena sbloccati i conflitti delle librerie native di sistema.
* **DT-022-02 — Futuri suoni specifici per funzionalità UI**: Estensione controllata dell'unione `SoundType` per allineare suoni personalizzati a specifiche esigenze grafiche delle schede della UI.
* **DT-022-03 — Test percettivo accessibilità audio**: Validazione congiunta dei 5 suoni in combinazione con screen reader attivi (NVDA su Windows, TalkBack su Android, VoiceOver su iOS) per certificare che non si verifichino mascheramenti acustici.
* **DT-022-04 — Eventuale libreria asset audio**: Eventuale transizione ad asset digitali statici preregistrati solo a seguito del completamento e della stabilizzazione dell'esperienza utente visuale.
* **DT-022-05 — Rimozione progressiva di LegacySoundType e normalizeSoundType**: Dopo che tutti i consumer reali saranno stati aggiornati per usare direttamente i 5 CanonicalSoundType, rimuovere LegacySoundType, normalizeSoundType() e il tipo unione.

## Invarianti da Rispettare

* **INV-01**: Le firme pubbliche di soundSystem devono rimanere identiche a quelle del file attuale. Chi chiama soundSystem.play() non deve subire modifiche.
* **INV-02**: AuthContext.tsx e AppDataContext.tsx NON vengono modificati in questo piano. Devono continuare a funzionare grazie al mapping.
* **INV-03**: expo-haptics e haptic-system non vengono toccati in alcun modo.
* **INV-04**: Il tipo SoundType rimane compatibile con tutti i nomi di suoni usati attualmente in AuthContext e AppDataContext. Verifica esplicitamente che i seguenti nomi siano presenti in LegacySoundType: pin-error, private-unlock, dialog-close, budget-exceeded, budget-critical, budget-warning, save, account-created, income, expense, transfer, delete, budget-deleted, export, budget-created, goal-created.
