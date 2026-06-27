---
tipo: coding-plan
titolo: Sound System — Refactoring motore audio nativo
versione: 0.1.0
data: 2026-06-27
stato: bozza
design-ref: 022-DESIGN_sound-system_v0.1.0.md
blocco: AN-02
---

# PLAN 022 - Sound System — Refactoring motore audio nativo

Questo piano di coding fa riferimento al documento di design docs/2-projects/022-DESIGN_sound-system_v0.1.0.md. Il file sorgente modificato è src/lib/sound-system.ts. L'obiettivo principale è sostituire il motore audio basato sulle API del browser con la libreria nativa react-native-audio-api, garantendo la compatibilità con i consumer reali esistenti dell'applicazione tramite uno strato di mapping legacy.

## NOTA PRELIMINARE — Punto aperto da decidere prima del coding

Il valore 'lock' è presente in LegacySoundType ma non ha una riga dedicata nella tabella di mapping del documento di design. Attualmente ricade nel mapping predefinito 'click'. Prima di scrivere il metodo normalizeSoundType(), decidere esplicitamente se 'lock' deve mappare a 'navigation', 'success' o confermare 'click' come scelta intenzionale.

Questa decisione non blocca la stesura del piano ma deve essere risolta dal team prima dell'esecuzione del Task 2. Registrare la decisione come commento nel codice.

## Prerequisiti

* **PREREQ-01**: Il documento di design docs/2-projects/022-DESIGN_sound-system_v0.1.0.md è in stato "bozza" approvata, versione 0.1.1. Confermato dalla sessione corrente.
* **PREREQ-02**: Verifica compatibilità react-native-audio-api. Prima di installare la libreria, verificare sulla documentazione ufficiale che la versione ^1.0.0 sia compatibile con React Native 0.82.1 e New Architecture abilitata. Se la versione non è compatibile, identificare la versione compatibile più recente e usare quella. Questo gate è obbligatorio. Non installare la libreria senza aver completato questa verifica.
* **PREREQ-03**: I test esistenti per sound-system passano o sono stati aggiornati per riflettere lo stato attuale del file prima del refactoring.
* **PREREQ-04**: Il branch di lavoro è separato dal main. Non lavorare direttamente su main.

## File Coinvolti

### File Modificati:
* package.json (nuova dipendenza)
* src/lib/sound-system.ts (riscrittura)
* src/hooks/use-user-settings.ts (collegamento runtime)
* CHANGELOG.md (aggiornamento)

### File Creati:
* __tests__/sound-system.spec.ts (o aggiornamento del file di test esistente se già presente)

### File Non Modificati (esplicitamente fuori scope):
* src/context/AuthContext.tsx
* src/context/AppDataContext.tsx

Questi file usano soundSystem.play() con nomi legacy. Grazie al mapping introdotto in questo piano, continueranno a funzionare senza modifiche. La loro migrazione verso CanonicalSoundType è registrata in DT-022-05 e avverrà in una fase futura.

## Task e Subtask

### TASK-01 — Installazione e verifica dipendenza nativa
* **Obiettivo**: Aggiungere react-native-audio-api al progetto e verificare che la build non si rompa.
* **Subtask**:
  * 1.1 — Completare PREREQ-02: verifica compatibilità versione libreria con RN 0.82.1 + New Architecture. Se la versione ^1.0.0 non è compatibile, aggiorna PREREQ-02 con la versione corretta prima di procedere al punto 1.2.
  * 1.2 — Aggiungere la dipendenza a package.json.
  * 1.3 — Eseguire npm install.
  * 1.4 — Verificare che la build Android non si rompa: npx expo run:android (o npm run android).
  * 1.5 — Verificare che la build Windows non si rompa a livello di compilazione statica (G-022-WIN): il file sound-system.ts NON deve contenere import statici di react-native-audio-api al livello del modulo — l'import deve avvenire dinamicamente dentro ensureContext() con Platform.OS !== 'windows' come guard.
  * 1.6 — Eseguire npx tsc --noEmit e verificare che non ci siano nuovi errori TypeScript.
* **Condizione di accettazione**: Build Android passa. Build Windows non si rompe a livello statico. TypeScript senza errori.

### TASK-02 — Riscrittura di sound-system.ts
* **Obiettivo**: Sostituire l'intero contenuto del file con l'implementazione nativa conforme al DESIGN 022.
* **Subtask**:
  * 2.1 — PRIMA DI SCRIVERE: rileggi src/lib/sound-system.ts e registra internamente:
    * Elenco completo dei metodi pubblici esistenti
    * Firma di AudioPersistCallbacks
    * Valore di volume di default
    * Elenco dei suoni presenti nell'union SoundType
    Non procedere finché non hai completato questo passo.
  * 2.2 — Definire i tipi pubblici in cima al file: CanonicalSoundType, LegacySoundType, SoundType usando esattamente i valori presenti nel documento di design (91 totali: 5 canonici + 86 legacy). Verificare che il conteggio dei valori in LegacySoundType corrisponda a 86 dopo la scrittura.
  * 2.3 — Implementare normalizeSoundType():
    * Usare una switch o una Map con tutti i mapping della tabella nel DESIGN 022.
    * Il ramo default restituisce 'click'.
    * Risolvere prima il punto aperto su 'lock' indicato nella Nota Preliminare.
    * Aggiungere un commento nel codice che documenta la decisione presa per 'lock'.
  * 2.4 — Implementare il costruttore del singleton:
    * Il costruttore è vuoto.
    * Non crea AudioContext.
    * Non chiama initialize().
    * Il metodo initialize() NON deve esistere nel nuovo file.
  * 2.5 — Implementare ensureContext():
    * Guard Platform.OS === 'windows': return early.
    * Guard !this.enabled: return early.
    * Creazione lazy di AudioContext dentro try/catch.
    * In caso di errore: this.enabled = false solo in runtime. Nessuna scrittura su Supabase.
    * Chiamata a registerAppStateListener() solo se AudioContext viene creato con successo.
  * 2.6 — Implementare registerAppStateListener():
    * Gestione background/inactive: suspend().
    * Gestione active con enabled===true: resume().
    * Usare AppState.addEventListener da react-native.
  * 2.7 — Implementare play(soundType: SoundType):
    * Prima chiamata a ensureContext().
    * Poi chiamata a normalizeSoundType(soundType).
    * Switch sul CanonicalSoundType normalizzato.
    * Ogni ramo chiama il metodo privato corrispondente.
  * 2.8 — Implementare i 5 metodi privati di sintesi usando i parametri fisici esatti del DESIGN 022:
    * playClick(): sine 800 Hz, 30-50 ms, ADSR: attack 0.001s, decay 0.02s, sustain 0.3, release 0.03s.
    * playSuccess(): sequenza sine ascendente 523.25 Hz -> 659.25 Hz -> 783.99 Hz, 80-120 ms per nota, delay 80 ms.
    * playError(): sawtooth discendente 300 Hz -> 250 Hz, 100-150 ms per nota, delay 100 ms.
    * playWarning(): square 440 Hz -> 440 Hz, totale 150-200 ms, pausa intermedia 150 ms.
    * playNavigation(): sine 600 Hz, 40 ms, ADSR: attack 0.001s, decay 0.01s, sustain 0.5, release 0.03s.
  * 2.9 — Implementare playSequence() per le sequenze di note (success, error, warning):
    * Usare audioContext.currentTime per scheduling.
    * oscillator.start(audioContext.currentTime + offset)
    * oscillator.stop(audioContext.currentTime + offset + duration)
    * setTimeout NON deve essere usato per la temporizzazione musicale.
  * 2.10 — Implementare i metodi pubblici di controllo mantenendo le stesse firme del file attuale:
    * initFromSettings(enabled, volume): void
    * configure(callbacks): void
    * setVolume(volume): Promise<void>
    * setEnabled(enabled): Promise<void>
    * getVolume(): number
    * getEnabled(): boolean
    * Volume deve essere clampato nel range 0-1.
  * 2.11 — Esportare il singleton: export const soundSystem = new SoundSystem();
* **Condizione di accettazione**: npx tsc --noEmit senza errori. Nessun metodo initialize() nel file. Nessun setTimeout per temporizzazione musicale. Tutti i metodi pubblici del file originale presenti con le stesse firme.

### TASK-03 — Collegamento runtime con useUserSettings
* **Obiettivo**: Fare in modo che le preferenze audio caricate da Supabase vengano propagate a soundSystem.
* **Subtask**:
  * 3.1 — PRIMA DI MODIFICARE: rileggi src/hooks/use-user-settings.ts e registra internamente i nomi esatti delle variabili audio_enabled e audio_volume e i punti dove vengono caricate da Supabase.
  * 3.2 — All'idratazione iniziale (caricamento preferenze): aggiungere la chiamata: soundSystem.initFromSettings(audioEnabled, audioVolume). Questo va nel punto di caricamento identificato al punto 3.1, non in un useEffect aggiuntivo se già esiste un flusso di caricamento.
  * 3.3 — Nel setter setAudioEnabled(v): dopo la persistenza su Supabase, aggiungere: soundSystem.setEnabled(v).
  * 3.4 — Nel setter setAudioVolume(v): dopo la persistenza su Supabase, aggiungere: soundSystem.setVolume(v).
  * 3.5 — Verificare che initFromSettings NON chiami i callback di persistenza (evita cicli infiniti). Questo comportamento è già garantito dal DESIGN 022 ma va verificato nell'implementazione reale.
* **Condizione di accettazione**: npx tsc --noEmit senza errori. Le tre chiamate a soundSystem sono presenti. Nessun ciclo di persistenza infinito introdotto.

### TASK-04 — Stesura e verifica dei test
* **Obiettivo**: Creare o aggiornare il file di test per coprire i 20 test obbligatori T01-T20 definiti nel DESIGN 022.
* **Subtask**:
  * 4.1 — Verificare se esiste già un file di test per sound-system. Se non esiste, creare il file __tests__/sound-system.spec.ts.
  * 4.2 — Implementare i 20 test obbligatori descritti nel DESIGN 022 sezione 7:
    * **T01** — enabled=false interrompe ed inibisce immediatamente qualsiasi chiamata al generatore di suoni.
    * **T02** — Il valore del volume passato a setVolume o initFromSettings viene clampato matematicamente nel range 0-1.
    * **T03** — setEnabled invoca il callback di persistenza onEnabledChange se precedentemente configurato.
    * **T04** — setVolume invoca il callback di persistenza onVolumeChange se precedentemente configurato.
    * **T05** — initFromSettings allinea le proprietà in memoria senza attivare la catena dei callback di salvataggio (previene cicli infiniti).
    * **T06** — play('success') sintetizza 3 note sine ad altezza ascendente (523.25 Hz -> 659.25 Hz -> 783.99 Hz).
    * **T07** — play('error') genera 2 toni sawtooth discendenti (300 Hz -> 250 Hz).
    * **T08** — play('warning') produce il pattern warning specificato (doppio tono repeated: 440 Hz -> 440 Hz).
    * **T09** — play('click') produce un suono di click sine da 800 Hz e 30-50 ms.
    * **T10** — play('navigation') esegue il tono navigation specificato (sine 600 Hz, 40 ms).
    * **T11** — Il costruttore del singleton SoundSystem non crea AudioContext, non chiama initialize() e non invoca alcun metodo che crei AudioContext direttamente o indirettamente. Il metodo initialize() non deve esistere nel nuovo file. ensureContext() è il solo punto di creazione lazy dell'istanza AudioContext.
    * **T12** — Se l'inizializzazione di AudioContext nativo fallisce, play() degrada silenziosamente in no-op.
    * **T13** — Il passaggio di AppState a background/inactive sospende l'audio context se istanziato.
    * **T14** — Il passaggio di AppState ad active riesuma l'audio context solo se l'impostazione enabled è true.
    * **T15** — Il caricamento iniziale delle preferenze in useUserSettings chiama soundSystem.initFromSettings con i valori idratati.
    * **T16** — La funzione setAudioEnabled aggiorna l'istanza soundSystem dopo la persistenza su Supabase.
    * **T17** — La funzione setAudioVolume aggiorna l'istanza soundSystem dopo la persistenza su Supabase.
    * **T18** — playSequence() pianifica le note usando audioContext.currentTime con oscillator.start(startTime) e oscillator.stop(stopTime), dove startTime è espresso in secondi come offset su currentTime. setTimeout non viene usato per la temporizzazione musicale.
    * **T19** — Se AudioContext fallisce durante ensureContext(), la proprietà enabled viene impostata a false solo in memoria runtime. La preferenza Supabase audio_enabled non viene modificata. Un successivo initFromSettings() con enabled=true ripristina correttamente il comportamento.
    * **T20** — I SoundType legacy usati dai consumer reali attuali vengono normalizzati verso i 5 canonici tramite normalizeSoundType() senza errore di tipo TypeScript e senza ricadere nel ramo default. Consumer da coprire obbligatoriamente: pin-error, private-unlock, dialog-close, budget-exceeded, budget-critical, budget-warning, save, account-created, income, expense, transfer, delete, budget-deleted, export.
  * 4.3 — Configurare i mock per i test:
    * Mock di AudioContext e della libreria react-native-audio-api
    * Mock di AppState di react-native
    * Mock di Platform.OS di react-native
    * Mock di soundSystem.play per i test T06-T10
  * 4.4 — Per T11, verificare che initialize() non esista nel file. Utilizzare: expect(soundSystem['initialize']).toBeUndefined()
  * 4.5 — Per T18, verificare che playSequence usi currentTime e non setTimeout. Spiare audioContext.currentTime e verificare che oscillator.start sia chiamato con un offset.
  * 4.6 — Per T20, chiamare soundSystem.play() per ciascuno dei 14 suoni legacy obbligatori e verificare che nessuno lanci errori TypeScript e che normalizeSoundType non ricada nel default. I 14 suoni legacy obbligatori sono: pin-error, private-unlock, dialog-close, budget-exceeded, budget-critical, budget-warning, save, account-created, income, expense, transfer, delete, budget-deleted, export.
* **Condizione di accettazione**: npx jest sound-system (o equivalente) con tutti i test T01-T20 che passano. Nessun test in stato skip o pending.

## Gate di Validazione Finale

* **G-022-TS**: Esecuzione del type-checking tramite npx tsc --noEmit senza alcun errore. Eseguire dopo ogni task, non solo alla fine.
* **G-022-ANDROID**: La build Android compila senza errori: npx expo run:android (o npm run android). Eseguire dopo TASK-01 e dopo TASK-02.
* **G-022-WIN**: Il file sound-system.ts non contiene import statici di react-native-audio-api al livello del modulo. Verifica tramite comando statico che non ci siano import globali non condizionali.
* **G-022-TESTS**: Tutti i test T01-T20 passano con successo. Eseguire dopo TASK-04.

## Debiti Tecnici Registrati

* **DT-022-01 — Verifica runtime React Native Windows**: Esecuzione e verifica del comportamento runtime del modulo audio su piattaforma Windows non appena sbloccati i conflitti delle librerie native di sistema.
* **DT-022-02 — Futuri suoni specifici per funzionalità UI**: Estensione controllata dell'unione SoundType per allineare suoni personalizzati a specifiche esigenze grafiche delle schede della UI.
* **DT-022-03 — Test percettivo accessibilità audio**: Validazione congiunta dei 5 suoni in combinazione con screen reader attivi (NVDA su Windows, TalkBack su Android, VoiceOver su iOS) per certificare che non si verifichino mascheramenti acustici.
* **DT-022-04 — Eventuale libreria asset audio**: Eventuale transizione ad asset digitali statici preregistrati solo a seguito del completamento e della stabilizzazione dell'esperienza utente visuale.
* **DT-022-05 — Rimozione progressiva di LegacySoundType e normalizeSoundType**: Dopo che tutti i consumer reali (AuthContext.tsx, AppDataContext.tsx e futuri file UI) saranno stati aggiornati per usare direttamente i 5 CanonicalSoundType, rimuovere: LegacySoundType, normalizeSoundType(), e il tipo unione SoundType = CanonicalSoundType | LegacySoundType. A quel punto il contratto pubblico esporrà solo CanonicalSoundType. Nota architetturale: i suoni attualmente presenti in AuthContext.tsx e AppDataContext.tsx sono temporanei. Appartengono al livello di business logic e non al livello UI. Quando i componenti grafici corrispondenti verranno costruiti, le chiamate a soundSystem.play() dovranno spostarsi nel componente UI che rappresenta quell'azione. I context non dovrebbero contenere chiamate audio a regime.

## Invarianti da Rispettare

* **INV-01**: Le firme pubbliche di soundSystem devono rimanere identiche a quelle del file attuale. Chi chiama soundSystem.play() non deve subire modifiche.
* **INV-02**: AuthContext.tsx e AppDataContext.tsx NON vengono modificati in questo piano. Devono continuare a funzionare grazie al mapping.
* **INV-03**: expo-haptics e haptic-system non vengono toccati in alcun modo.
* **INV-04**: Il tipo SoundType rimane compatibile con tutti i nomi di suoni usati attualmente in AuthContext e AppDataContext. Verifica esplicitamente che i seguenti nomi siano presenti in LegacySoundType: pin-error, private-unlock, dialog-close, budget-exceeded, budget-critical, budget-warning, save, account-created, income, expense, transfer, delete, budget-deleted, export, budget-created, goal-created.
