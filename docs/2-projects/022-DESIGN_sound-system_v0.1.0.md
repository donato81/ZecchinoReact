---
tipo: design
titolo: Sound System — Refactoring motore audio nativo
versione: 0.1.1
data: 2026-06-27
stato: bozza
blocco: AN-02
perimetro:
  - src/lib/sound-system.ts
  - src/hooks/use-user-settings.ts
  - package.json
---

# DESIGN 022 — Sound System — Refactoring motore audio nativo

> **Scope**: Riorganizzare il modulo audio dell'applicazione per supportare l'esecuzione in ambiente React Native nativo (Android, iOS). Sostituire le API Web Audio del browser (`window.AudioContext`, ecc.) con la libreria nativa `react-native-audio-api`. Ridurre la superficie dei suoni a 5 feedback canonici supportati, gestendo i 91 valori totali nell'union SoundType, di cui 5 canonici mantenuti (click, success, error, warning, navigation) e 86 legacy da gestire tramite mapping verso i canonici. Stabilire la connessione mancante a runtime tra le impostazioni dell'utente (Supabase) e il Sound System.
>
> **Fuori scope**: Aggiunta di nuovi suoni complessi o specifici prima della progettazione delle relative interfacce grafiche; sostituzione dei suoni sintetici generati da codice con file audio preregistrati (MP3/WAV); risoluzione dei blocchi sulla compilazione Windows estranei al modulo audio.
>
> **Riferimento di debito tecnico**: **AN-02** (sound-system.ts).

---

## 1. Contesto e motivazione

L'attuale implementazione del Sound System (`src/lib/sound-system.ts`) è stata sviluppata per un ambiente browser web. Utilizza oggetti globali quali `window.AudioContext`, `webkitAudioContext`, `GainNode` e `OscillatorNode`. 

Tuttavia, React Native viene eseguito su motori JavaScript dedicati (come Hermes) privi delle API globali del browser. Su piattaforme native (Android, iOS) e desktop (Windows), il modulo audio fallisce silenziosamente, non riproducendo alcun suono. 

Inoltre, il file definisce un'unione di tipi `SoundType` contenente **91 valori totali nell'union SoundType, di cui 5 canonici mantenuti (click, success, error, warning, navigation) e 86 legacy da gestire tramite mapping verso i canonici** (verificati via analisi statica), aggiungendo complessità inutile al codice e bloccando la standardizzazione dei feedback. 

Infine, le preferenze dell'utente relative al volume e all'abilitazione audio caricate da Supabase tramite il hook `useUserSettings` non vengono propagate a runtime all'istanza del `soundSystem`, rendendo inerte il controllo utente sull'audio.

---

## 2. Decisioni approvate

Di seguito si formalizzano le 7 decisioni architetturalmente concordate e approvate.

### Decisione 1 — Cambio del motore audio
- **Descrizione**: Sostituzione completa di `window.AudioContext` con la libreria `react-native-audio-api`.
- **Motivazione**: `react-native-audio-api` implementa una specifica conforme al Web Audio API standard, ma basata su driver nativi React Native per Android e iOS. Questo permette di mantenere lo stesso modello di programmazione a oscillatori e nodi di guadagno senza dover riscrivere la logica di generazione musicale sintetica, fungendo da pura sostituzione del provider tecnologico.
- **Impatto sul codice**: Modifica degli import in `sound-system.ts` per recuperare `AudioContext`, `OscillatorNode`, `GainNode`, `OscillatorType` direttamente dalla libreria nativa.

> [!NOTE]
> **Nota compatibilità:**
> Il progetto usa React Native 0.82.1 con New Architecture abilitata. La libreria `react-native-audio-api` deve essere installata in una versione compatibile con questa configurazione. La compatibilità va verificata nel coding plan tramite la documentazione ufficiale della libreria e con un gate di build su Android e iOS prima di procedere.

### Decisione 2 — Mantenimento dei suoni sintetici
- **Descrizione**: I suoni continueranno ad essere generati interamente a runtime via codice tramite oscillatori d'onda sintetici, senza caricare file di asset esterni (es. `.mp3`, `.wav`).
- **Motivazione**: L'applicazione non dispone ancora di una UI grafica stabile. Scegliere, ottimizzare e distribuire pacchetti di file audio pre-registrati aggiungerebbe peso al bundle e complessità di packaging nativo in una fase in cui i requisiti uditivi non sono finalizzati. La rivalutazione avverrà solo a interfaccia utente consolidata.

### Decisione 3 — Riduzione a 5 suoni canonici e mapping transitorio dei legacy
- **Descrizione**: Il tipo `SoundType` conterrà 91 valori totali nell'union SoundType, di cui 5 canonici mantenuti (click, success, error, warning, navigation) e 86 legacy da gestire tramite mapping verso i canonici.
- **Motivazione**: Esistono già consumer reali nell'applicazione che usano soundSystem.play() con nomi di suoni legacy:
  - AuthContext.tsx usa: pin-error, private-unlock, dialog-close
  - AppDataContext.tsx usa: budget-exceeded, budget-critical, budget-warning, save, account-created, income, expense, transfer, delete, budget-deleted, export, budget-created, goal-created

  La rimozione secca del tipo SoundType romperebbe la compilazione di questi file. La strategia corretta è il mapping temporaneo dei legacy verso i 5 canonici.

---
STRUTTURA DEL CONTRATTO PUBBLICO

Il tipo SoundType viene suddiviso in due livelli distinti:

```typescript
export type CanonicalSoundType =
  | 'success'
  | 'error'
  | 'warning'
  | 'click'
  | 'navigation';

export type LegacySoundType =
  | 'notification' | 'unlock' | 'lock' | 'income' | 'expense' | 'transfer'
  | 'focus' | 'hover' | 'delete' | 'save' | 'budget-warning' | 'budget-critical'
  | 'budget-exceeded' | 'milestone' | 'dialog-open' | 'dialog-close' | 'tab-change'
  | 'filter-toggle' | 'category-toggle' | 'export' | 'settings-change' | 'volume-change'
  | 'preset-applied' | 'account-created' | 'account-deleted' | 'goal-created'
  | 'goal-completed' | 'goal-progress' | 'budget-created' | 'budget-deleted'
  | 'chart-loaded' | 'data-refresh' | 'keyboard-shortcut' | 'pin-error' | 'pin-success'
  | 'private-unlock' | 'private-lock' | 'alert-dismissed' | 'period-change' | 'card-open'
  | 'card-close' | 'edit' | 'cancel' | 'confirm' | 'toggle-on' | 'toggle-off'
  | 'slider-change' | 'dropdown-open' | 'dropdown-close' | 'select-option' | 'form-submit'
  | 'form-error' | 'input-focus' | 'input-blur' | 'tooltip-show' | 'tooltip-hide'
  | 'account-edit' | 'transaction-edit' | 'budget-edit' | 'goal-edit' | 'category-created'
  | 'category-deleted' | 'category-edited' | 'import-start' | 'import-success' | 'import-error'
  | 'backup-created' | 'restore-complete' | 'list-scroll' | 'page-load' | 'refresh'
  | 'search-start' | 'search-complete' | 'filter-apply' | 'filter-clear' | 'sort-change'
  | 'menu-open' | 'menu-close' | 'submenu-open' | 'panel-expand' | 'panel-collapse'
  | 'test-sound' | 'preset-change' | 'settings-reset' | 'validation-error' | 'validation-success';

export type SoundType = CanonicalSoundType | LegacySoundType;
```

Il motore interno riproduce fisicamente solo i 5 suoni CanonicalSoundType. Il metodo play() riceve qualsiasi SoundType e lo normalizza tramite normalizeSoundType() prima di eseguire qualsiasi suono.

#### Tabella di mapping legacy -> canonico

| Suono Legacy | Suono Canonico |
| :--- | :--- |
| `pin-error` | `error` |
| `validation-error` | `error` |
| `form-error` | `error` |
| `import-error` | `error` |
| `budget-exceeded` | `error` |
| `account-deleted` | `error` |
| `budget-deleted` | `error` |
| `category-deleted` | `error` |
| `delete` | `error` |
| `budget-critical` | `warning` |
| `budget-warning` | `warning` |
| `notification` | `warning` |
| `alert-dismissed` | `warning` |
| `private-unlock` | `success` |
| `pin-success` | `success` |
| `save` | `success` |
| `account-created` | `success` |
| `goal-created` | `success` |
| `goal-completed` | `success` |
| `budget-created` | `success` |
| `import-success` | `success` |
| `backup-created` | `success` |
| `export` | `success` |
| `restore-complete` | `success` |
| `income` | `success` |
| `validation-success` | `success` |
| `expense` | `click` |
| `transfer` | `navigation` |
| `dialog-open` | `navigation` |
| `dialog-close` | `navigation` |
| `tab-change` | `navigation` |
| `navigation` | `navigation` (canonico, nessuna trasformazione) |

Per i suoni non elencati esplicitamente, il mapping predefinito è `click`.

> [!NOTE]
> Questa tabella è orientativa. Il mapping esatto verrà rifinito durante il coding plan ma non può essere lasciato indeciso in questa fase.

### Decisione 4 — Conservazione della struttura di gestione
- **Descrizione**: Vengono mantenute le firme pubbliche di controllo dello stato runtime e persistenza:
  - `initFromSettings(enabled: boolean, volume: number): void`
  - `configure(callbacks: AudioPersistCallbacks): void`
  - `setVolume(volume: number): Promise<void>`
  - `setEnabled(enabled: boolean): Promise<void>`
  - `getVolume(): number`
  - `getEnabled(): boolean`
  L'interfaccia `AudioPersistCallbacks` rimane inalterata.
- **Motivazione**: Questa interfaccia garantisce l'astrazione e il disaccoppiamento del modulo audio dalla specifica infrastruttura di persistenza (Supabase).

### Decisione 5 — Collegamento runtime con useUserSettings
- **Descrizione**: Correzione del collegamento tra il hook `useUserSettings` e il modulo `soundSystem` a runtime.
- **Dettagli di implementazione**:
  - All'idratazione iniziale o al caricamento delle preferenze da Supabase: invocare `soundSystem.initFromSettings(audioEnabled, audioVolume)`.
  - Nel setter `setAudioEnabled(v)`: dopo l'aggiornamento persistente su Supabase, invocare `soundSystem.setEnabled(v)`.
  - Nel setter `setAudioVolume(v)`: dopo l'aggiornamento persistente su Supabase, invocare `soundSystem.setVolume(v)`.
- **Regola di precedenza**: Supabase agisce come fonte autoritativa per l'utente autenticato; il `soundSystem` conserva solo lo stato a runtime sincronizzato in memoria.

### Decisione 6 — Inizializzazione lazy
- **Descrizione**: L'oggetto `AudioContext` non viene più creato nel costruttore del singleton.
- **Dettagli**: La creazione viene delegata al metodo privato `ensureContext()`, invocato solo al primo tentativo di riproduzione tramite `play()` e unicamente se `enabled === true`. Se l'inizializzazione nativa fallisce, il sistema digerisce l'errore registrandolo in sviluppo e procede come `no-op` silenzioso, senza lanciare eccezioni verso la UI.

> [!IMPORTANT]
> **ATTENZIONE AL CODING PLAN:**
> Il file attuale src/lib/sound-system.ts contiene il metodo privato `initialize()` chiamato direttamente dal costruttore. Questo metodo deve essere rimosso integralmente. Il costruttore nella nuova versione sarà vuoto. `ensureContext()` diventa l'unico punto di creazione lazy di AudioContext. Non devono coesistere `initialize()` e `ensureContext()` nel nuovo file.

> [!IMPORTANT]
> **ATTENZIONE AL CODING PLAN:**
> Il file attuale usa `setTimeout` in `playSequence()` per distanziare le note nelle sequenze melodiche. In React Native con motore Hermes, `setTimeout` non ha la precisione necessaria per la sintesi audio. La nuova implementazione deve usare lo scheduling nativo:
> ```typescript
> oscillator.start(audioContext.currentTime + delayInSeconds)
> oscillator.stop(audioContext.currentTime + delayInSeconds + durationInSeconds)
> ```
> `setTimeout` non deve essere usato per la temporizzazione musicale nel nouvo file.

### Decisione 7 — Windows: debito tecnico aperto non bloccante
- **Descrizione**: A causa di incompatibilità note dei driver nativi di terze parti con react-native-windows, la build Windows è temporaneamente bloccata ed esclusa dalle verifiche runtime.
- **Vincolo**: Il refactoring non deve compromettere lo stato preesistente: il codice di `sound-system.ts` non deve introdurre import statici bloccanti a tempo di compilazione su Windows. La compilazione del target Windows deve continuare a passare.

> [!NOTE]
> Il ramo `Platform.OS === 'windows'` è un fallback temporaneo legato al debito tecnico DT-022-01. Non rappresenta una decisione definitiva di disabilitare l'audio su Windows in modo permanente. Quando DT-022-01 sarà risolto, si valuterà se abilitare `react-native-audio-api` su Windows o introdurre un adapter dedicato. Questo ramo dovrà essere rimosso o aggiornato in quella fase.

---

## 3. Parametri dei 5 suoni canonici

Ciascuno dei 5 suoni canonici deve rispettare specifici parametri fisici di sintesi:

### click
- **Uso**: Feedback generico immediato al tocco di pulsanti ed elementi interattivi.
- **Forma d'onda**: sine (sinusoidale).
- **Frequenza**: 800 Hz.
- **Durata**: 30-50 ms.
- **ADSR**: Attacco istantaneo (0.001 s), decadimento rapido (0.02 s), sustain basso (0.3), rilascio rapido (0.03 s).
- **Accessibilità**: Volume discreto, non deve essere recepito come segnale di avvertimento.

### success
- **Uso**: Conferma di un'operazione completata con successo (es. salvataggio, PIN corretto).
- **Forma d'onda**: sine (sinusoidale).
- **Pattern**: Sequenza ascendente a 3 note: 523.25 Hz (C5) -> 659.25 Hz (E5) -> 783.99 Hz (G5).
- **Durata**: 80-120 ms per nota (delay di interazione di circa 80 ms).
- **Carattere**: Positivo, armonico, chiaramente ascendente.

### error
- **Uso**: Errore bloccante, transazione fallita, o inserimento PIN errato.
- **Forma d'onda**: sawtooth (a dente di sega) per generare frizione acustica.
- **Pattern**: Sequenza discendente a 2 note: 300 Hz -> 250 Hz.
- **Durata**: 100-150 ms per nota (delay di circa 100 ms).
- **Carattere**: Dissociativo, cupo, chiaramente discendente.
- **Accessibilità**: Breve, non deve ostacolare la lettura ad alta voce dello screen reader.

### warning
- **Uso**: Avviso non bloccante, superamento soglia budget.
- **Forma d'onda**: square (onda quadra).
- **Pattern**: Doppio tono ripetuto: 440 Hz (A4) -> 440 Hz.
- **Durata**: 150-200 ms complessivi (delay di pausa intermedia di 150 ms).
- **Carattere**: Neutro, finalizzato ad attirare l'attenzione.

### navigation
- **Uso**: Feedback all'apertura/chiusura di dialog, cambi di tab o passaggi di schermata.
- **Forma d'onda**: sine (sinusoidale).
- **Frequenza**: 600 Hz.
- **Durata**: 40 ms.
- **ADSR**: Attack: 0.001 s, Decay: 0.01 s, Sustain: 0.5, Release: 0.03 s.
- **Carattere**: Estremamente trasparente e leggero, quasi impercettibile.

### Regola generale di accessibilità acustica:
> [!IMPORTANT]
> Tutti i suoni sintetici generati agiscono come canali di feedback secondari. Non devono mai sostituire o sovrapporsi cronologicamente agli annunci della sintesi vocale (Screen Reader / TalkBack / VoiceOver) coprendone la voce. Devono essere istantaneamente disattivabili tramite l'impostazione globale `audio_enabled = false`.

---

## 4. Struttura del nuovo file sound-system.ts

La nuova struttura del file [sound-system.ts](src/lib/sound-system.ts) dovrà implementare:

- **Importazione da libreria nativa**:
  ```typescript
  import { AudioContext, OscillatorNode, GainNode, OscillatorType } from 'react-native-audio-api';
  import { Platform, AppState, AppStateStatus } from 'react-native';
  ```
- **Suddivisione dei tipi (Contratto pubblico)**:
  ```typescript
  export type CanonicalSoundType = 'click' | 'success' | 'error' | 'warning' | 'navigation';
  export type LegacySoundType =
    | 'notification' | 'unlock' | 'lock' | 'income' | 'expense' | 'transfer'
    | 'focus' | 'hover' | 'delete' | 'save' | 'budget-warning' | 'budget-critical'
    | 'budget-exceeded' | 'milestone' | 'dialog-open' | 'dialog-close' | 'tab-change'
    | 'filter-toggle' | 'category-toggle' | 'export' | 'settings-change' | 'volume-change'
    | 'preset-applied' | 'account-created' | 'account-deleted' | 'goal-created'
    | 'goal-completed' | 'goal-progress' | 'budget-created' | 'budget-deleted'
    | 'chart-loaded' | 'data-refresh' | 'keyboard-shortcut' | 'pin-error' | 'pin-success'
    | 'private-unlock' | 'private-lock' | 'alert-dismissed' | 'period-change' | 'card-open'
    | 'card-close' | 'edit' | 'cancel' | 'confirm' | 'toggle-on' | 'toggle-off'
    | 'slider-change' | 'dropdown-open' | 'dropdown-close' | 'select-option' | 'form-submit'
    | 'form-error' | 'input-focus' | 'input-blur' | 'tooltip-show' | 'tooltip-hide'
    | 'account-edit' | 'transaction-edit' | 'budget-edit' | 'goal-edit' | 'category-created'
    | 'category-deleted' | 'category-edited' | 'import-start' | 'import-success' | 'import-error'
    | 'backup-created' | 'restore-complete' | 'list-scroll' | 'page-load' | 'refresh'
    | 'search-start' | 'search-complete' | 'filter-apply' | 'filter-clear' | 'sort-change'
    | 'menu-open' | 'menu-close' | 'submenu-open' | 'panel-expand' | 'panel-collapse'
    | 'test-sound' | 'preset-change' | 'settings-reset' | 'validation-error' | 'validation-success';
  export type SoundType = CanonicalSoundType | LegacySoundType;
  ```

- **Metodo privato di normalizzazione**:
  ```typescript
  private normalizeSoundType(soundType: SoundType): CanonicalSoundType
  ```
  Questo metodo mappa ogni suono legacy verso uno dei 5 canonici. Il metodo `play()` chiama `normalizeSoundType()` prima di eseguire la logica sonora.

- **Lazy Initialization**:
  ```typescript
  private ensureContext(): void {
    if (Platform.OS === 'windows') return;
    if (!this.enabled) return;
    
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.audioContext.destination);
        this.registerAppStateListener();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Fallback: impossibile inizializzare AudioContext nativo:', error);
      }
      this.enabled = false;
    }
  }
  ```
  > [!NOTE]
  > **Nota comportamento fail-soft:**
  > Se AudioContext fallisce durante la creazione, `enabled` viene impostato a `false` solo nella memoria runtime della sessione corrente. La preferenza Supabase `audio_enabled` non viene modificata. Al successivo avvio dell'applicazione, `initFromSettings()` ricaricherà il valore da Supabase e il sistema tenterà nuovamente la creazione del contesto.

- **Export del Singleton**:
  ```typescript
  export const soundSystem = new SoundSystem();
  ```

---

## 5. Gestione dello stato dell'applicazione (AppState)

L'applicazione mobile può passare in background (es. chiamata in arrivo o blocco schermo). Per evitare spreco di risorse ed anomalie nei thread nativi:

1. **Sospensione**: Quando lo stato dell'applicazione cambia in `background` o `inactive`, se l'oggetto `audioContext` esiste, viene invocato `audioContext.suspend()`.
2. **Ripresa**: Quando lo stato ritorna `active`, se `audioContext` esiste ed `enabled === true`, viene chiamato `audioContext.resume()`.
3. **Sottoscrizione**: Il listener di `AppState` viene agganciato unicamente al momento dell'effettiva creazione lazy dell'istanza dell'audio context per evitare allocazioni preventive.

```typescript
private registerAppStateListener() {
  AppState.addEventListener('change', (nextStatus: AppStateStatus) => {
    if (this.audioContext) {
      if (nextStatus === 'background' || nextStatus === 'inactive') {
        this.audioContext.suspend().catch(() => {});
      } else if (nextStatus === 'active' && this.enabled) {
        this.audioContext.resume().catch(() => {});
      }
    }
  });
}
```

---

## 6. Dipendenze

La modifica del modulo audio introduce una nuova dipendenza nativa in [package.json](package.json):

```json
"dependencies": {
  "react-native-audio-api": "^1.0.0"
}
```

> [!WARNING]
> La dipendenza nativa `expo-haptics` ed i relativi moduli inseriti in **AN-01** (haptic-system) non devono essere alterati o rimossi.

> [!NOTE]
> **Nota compatibilità:**
> Il progetto usa React Native 0.82.1 con New Architecture abilitata. La libreria `react-native-audio-api` deve essere installata in una versione compatibile con questa configurazione. La compatibilità va verificata nel coding plan tramite la documentazione ufficiale della libreria e con un gate di build su Android e iOS prima di procedere.

---

## 7. Test obbligatori

La suite di test e le procedure di integrazione dovranno validare i seguenti comportamenti deterministici:

### Test unitari richiesti

- **T01** — `enabled=false` interrompe ed inibisce immediatamente qualsiasi chiamata al generatore di suoni.
- **T02** — Il valore del volume passato a `setVolume` o `initFromSettings` viene clampato matematicamente nel range 0-1.
- **T03** — `setEnabled` invoca il callback di persistenza `onEnabledChange` se precedentemente configurato.
- **T04** — `setVolume` invoca il callback di persistenza `onVolumeChange` se precedentemente configurato.
- **T05** — `initFromSettings` allinea le proprietà in memoria senza attivare la catena dei callback di salvataggio (previene cicli infiniti).
- **T06** — `play('success')` sintetizza 3 note sine ad altezza ascendente (523.25 Hz -> 659.25 Hz -> 783.99 Hz).
- **T07** — `play('error')` genera 2 toni sawtooth discendenti (300 Hz -> 250 Hz).
- **T08** — `play('warning')` produce il pattern warning specificato.
- **T09** — `play('click')` produce un suono di click sine da 800 Hz e 30-50 ms.
- **T10** — `play('navigation')` esegue il tono navigation specificato.
- **T11** — Il costruttore del singleton SoundSystem non crea AudioContext, non chiama initialize() e non invoca alcun metodo che crei AudioContext direttamente o indirettamente. Il metodo initialize() non deve esistere nel nuovo file. ensureContext() è il solo punto di creazione lazy dell'istanza AudioContext.
- **T12** — Se l'inizializzazione di `AudioContext` nativo fallisce, `play()` degrada silenziosamente in no-op.
- **T13** — Il passaggio di `AppState` a background/inactive sospende l'audio context se istanziato.
- **T14** — Il passaggio di `AppState` ad active riesuma l'audio context solo se l'impostazione `enabled` è `true`.
- **T15** — Il caricamento iniziale delle preferenze in `useUserSettings` chiama `soundSystem.initFromSettings` con i valori idratati.
- **T16** — La funzione `setAudioEnabled` aggiorna l'istanza `soundSystem` dopo la persistenza su Supabase.
- **T17** — La funzione `setAudioVolume` aggiorna l'istanza `soundSystem` dopo la persistenza su Supabase.
- **T18** — `playSequence()` pianifica le note usando `audioContext.currentTime` con `oscillator.start(startTime)` e `oscillator.stop(stopTime)`, dove `startTime` è espresso in secondi come offset su `currentTime`. `setTimeout` non viene usato per la temporizzazione musicale.
- **T19** — Se `AudioContext` fallisce durante `ensureContext()`, la proprietà `enabled` viene impostata a `false` solo in memoria runtime. La preferenza Supabase `audio_enabled` non viene modificata. Un successivo `initFromSettings()` con `enabled=true` ripristina correttamente il comportamento.
- **T20** — I `SoundType` legacy usati dai consumer reali attuali vengono normalizzati verso i 5 canonici tramite `normalizeSoundType()` senza errore di tipo TypeScript e senza ricadere nel ramo default. Consumer da coprire obbligatoriamente: pin-error, private-unlock, dialog-close, budget-exceeded, budget-critical, budget-warning, save, account-created, income, expense, transfer, delete, budget-deleted, export.

### Gate di validazione obbligatori

- **G-022-TS**: Esecuzione del type-checking tramite `npx tsc --noEmit` senza alcun errore.
- **G-022-ANDROID**: Compilazione nativa dell'applicazione per piattaforma Android (`npm run android`) superata.
- **G-022-WIN**: Il file `sound-system.ts` non contiene import di librerie native incompatibili che rompono la compilazione di `react-native-windows` a livello statico.

---

## 8. Debiti tecnici registrati

- **DT-022-01 — Verifica runtime React Native Windows**: Esecuzione e verifica del comportamento runtime del modulo audio su piattaforma Windows non appena sbloccati i conflitti delle librerie native di sistema.
- **DT-022-02 — Futuri suoni specifici per funzionalità UI**: Estensione controllata dell'unione `SoundType` per allineare suoni personalizzati a specifiche esigenze grafiche delle schede della UI.
- **DT-022-03 — Test percettivo accessibilità audio**: Validazione congiunta dei 5 suoni in combinazione con screen reader attivi (NVDA su Windows, TalkBack su Android, VoiceOver su iOS) per certificare che non si verifichino mascheramenti acustici.
- **DT-022-04 — Eventuale libreria asset audio**: Eventuale transizione ad asset digitali statici preregistrati solo a seguito del completamento e della stabilizzazione dell'esperienza utente visuale.
- **DT-022-05 — Rimozione progressiva di LegacySoundType e normalizeSoundType**: Dopo che tutti i consumer reali (AuthContext.tsx, AppDataContext.tsx e futuri file UI) saranno stati aggiornati per usare direttamente i 5 CanonicalSoundType, rimuovere: LegacySoundType, normalizeSoundType(), e il tipo unione SoundType = CanonicalSoundType | LegacySoundType. A quel punto il contratto pubblico esporrà solo CanonicalSoundType. Nota architetturale: i suoni attualmente presenti in AuthContext.tsx e AppDataContext.tsx sono temporanei. Appartengono al livello di business logic e non al livello UI. Quando i componenti grafici corrispondenti verranno costruiti, le chiamate a soundSystem.play() dovranno spostarsi nel componente UI che rappresenta quell'azione. I context non dovrebbero contenere chiamate audio a regime.

---

## 9. Precedente metodologico

L'architettura proposta segue fedelmente il design e le convenzioni stabilite per il sistema aptico (**AN-01** / **DESIGN 021** `haptic-system`). Le analogie implementative comprendono:
- Pattern d'accesso Singleton esportato direttamente come istanza configurata.
- Architettura fail-soft con degradazione silenziosa in no-op in caso di guasto nativo o esecuzione su Windows.
- Sincronizzazione dinamica dello stato a runtime innescata dai cicli di caricamento e scrittura del hook `useUserSettings`.
