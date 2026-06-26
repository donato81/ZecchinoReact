---
tipo: design
titolo: Refactor Haptic System — sostituzione navigator.vibrate() con expo-haptics
versione: 0.1.0
data: 2026-06-26
stato: DRAFT
sorgente: docs/todo-master.md
perimetro: src/lib/haptic-system.ts, src/hooks/use-user-settings.ts
---

# DESIGN 021 — Refactor Haptic System — sostituzione navigator.vibrate() con expo-haptics

> **Scope**: Riorganizzare il sistema di feedback aptico dell'applicazione, sostituendo le API web `navigator.vibrate()` (non funzionanti su React Native nativo) con la libreria nativa `expo-haptics`. Risolvere la dipendenza da `localStorage` tramite un modello di persistenza ibrido (AsyncStorage per caricamento immediato all'avvio + Supabase per backup sul profilo utente). Semplificare l'interfaccia esposta riducendo l'accoppiamento semantico a favore dei 7 feedback nativi di `expo-haptics`, gestendo al contempo un'interfaccia di compatibilità temporanea per i consumatori esistenti.
>
> **Fuori scope**: Riscrittura del sistema audio (debito AN-02); modifiche dell'interfaccia grafica per abilitare/disabilitare la vibrazione (gestite in futuri sviluppi della UI); modifiche dirette ai moduli consumer non strettamente legate all'interfaccia di sblocco PIN o alla persistenza.
>
> **Riferimento di debito tecnico**: **AN-01** (haptic-system.ts).

---

## 1. Contesto e motivazione

Il report di diagnosi compatibilità React Native (ID debito **AN-01**) evidenzia che il file `src/lib/haptic-system.ts` utilizza `navigator.vibrate()` per generare vibrazioni e `localStorage` per persistere lo stato delle impostazioni.

Queste API sono esclusive dei browser web e non sono supportate nell'ambiente React Native nativo (in esecuzione su motore Hermes su Android/iOS o WinRT su Windows). Di conseguenza, su queste piattaforme l'app non esegue alcuna vibrazione reale e fallisce silenziosamente.

Questo documento definisce il piano di refactoring del modulo aptico per:
- Adottare `expo-haptics` come motore di vibrazione cross-platform (iOS/Android).
- Rimuovere la dipendenza da `localStorage` introducendo la persistenza nativa.
- Semplificare l'interfaccia esposta rimuovendo i metodi specifici per funzionalità non ancora definite.
- Gestire il fallback silenzioso per la piattaforma Windows.

Riferimento al codice attuale: commit SHA [67eb32cf076e6ef443634d45db7f108b4a861718](file:///C:/Sviluppo/ZecchinoReact/src/lib/haptic-system.ts).

---

## 2. Analisi dello stato attuale

Il file attuale [src/lib/haptic-system.ts](file:///C:/Sviluppo/ZecchinoReact/src/lib/haptic-system.ts) definisce le seguenti strutture e comportamenti:
1. **Definizione di `HapticPattern` (righe 1-16)**: Un'unione di tipi di pattern di vibrazione che include vecchi tipi legacy (es. `'light'`, `'medium'`, `'heavy'`, `'rigid'`, `'soft'`) e tipi specifici (`'notification-success'`, ecc.).
2. **Interfaccia `HapticSettings` (righe 18-21)**: Definisce le proprietà `enabled` (boolean) e `intensity` (number).
3. **Persistenza sincrona via `localStorage` (righe 35-53)**: I metodi `loadSettings()` e `saveSettings()` leggono e scrivono sincronicamente su `localStorage`, che non esiste in React Native, sollevando eccezioni catturate in modo silenzioso via `catch` con `console.warn`.
4. **Rilevamento del supporto vibration (riga 31)**: `this.supportsVibration = 'vibrate' in navigator;` che in React Native nativo risulterà sempre `false`.
5. **Controllo dell'intensità (righe 68-71, 86-92)**: Il metodo `vibrate` adatta la durata dei pattern moltiplicandola per il fattore `intensity`.
6. **Metodo `play` (righe 98-165)**: Esegue uno switch su `HapticPattern` e invoca `vibrate` con millisecondi statici o array di millisecondi (es. `[10, 30, 10]` per `'success'`).
7. **~35 Metodi Specifici (righe 167-331)**: Espone metodi ad-hoc per vari casi d'uso applicativi (es. `pinSuccess`, `budgetExceeded`, `goalCompleted`, `dialogOpen`, ecc.), molti dei quali non sono ancora collegati a componenti UI o logiche validate e creano rumore nell'interfaccia.

---

## 3. Decisioni approvate

Di seguito si formalizzano le 6 decisioni architetturalmente concordate e approvate.

### Decisione 1 — Cambio della tecnologia di base
- **Descrizione**: Sostituzione completa di `navigator.vibrate()` con la libreria nativa `expo-haptics`.
- **Motivazione**: `navigator.vibrate()` fa parte delle Web API del browser e non ha alcun effetto in ambiente React Native. `expo-haptics` interagisce direttamente con i motori aptici dei dispositivi iOS (Taptic Engine) e Android (Vibrator Service).
- **Impatto sul codice**: Eliminazione di `navigator` e del metodo privato `vibrate(pattern)`.

### Decisione 2 — Contenuto della base iniziale
- **Descrizione**: L'interfaccia pubblica esporrà esclusivamente 7 metodi di feedback atomici mappati sulle API native di `expo-haptics`:
  - `success`: conferma operazioni completate correttamente (mappato su `NotificationFeedbackType.Success`)
  - `error`: segnala operazioni fallite o situazioni critiche (`NotificationFeedbackType.Error`)
  - `warning`: segnala situazioni che richiedono attenzione ma non bloccanti (`NotificationFeedbackType.Warning`)
  - `selection`: movimenti di navigazione tra elementi (`selectionAsync`)
  - `impactLight`: impatto fisico leggero (`ImpactFeedbackStyle.Light`)
  - `impactMedium`: impatto fisico medio (`ImpactFeedbackStyle.Medium`)
  - `impactHeavy`: impatto fisico pesante (`ImpactFeedbackStyle.Heavy`)
- **Motivazione**: Questi 7 feedback rappresentano le sole funzionalità native supportate sia da iOS che da Android attraverso `expo-haptics`.
- **Impatto sul codice**: Semplificazione di `HapticPattern` e rimozione di pattern numerici custom.

### Decisione 3 — Rinvio dei metodi specifici per funzionalità
- **Descrizione**: I circa 35 metodi semantici (come `pinSuccess`, `budgetExceeded`, `goalCompleted`, `privateUnlock`, ecc.) non saranno ricreati come metodi nativi diretti nella nuova versione. Verranno aggiunti in futuro in base alle necessità reali.
- **Motivazione**: Ridurre la complessità iniziale e rimandare la definizione dei pattern semantici a quando le singole funzionalità saranno implementate e testate su dispositivi fisici.
- **Impatto sul codice**: Rimozione di circa 30 metodi da `HapticSystem`.
- **Misure di compatibilità transitoria**: Per evitare di rompere la compilazione in file che non possono essere modificati in questa fase (come `AuthContext.tsx` e `AppDataContext.tsx`), il modulo conterrà uno strato di compatibilità temporaneo (shim) con i vecchi metodi marcati come `@deprecated` che reindirizzano internamente ai 7 nuovi feedback nativi (es. `pinError` chiama `error`, `save` chiama `success`).

### Decisione 4 — Eliminazione del controllo di intensità
- **Descrizione**: Il prima metro `intensity` (0.0 - 1.0) e i metodi `getIntensity`/`setIntensity` vengono completamente rimossi. Resta solo l'interruttore `enabled: boolean`.
- **Motivazione**: Le API native di `expo-haptics` non supportano la regolazione dell'intensità tramite un parametro numerico continuo. L'intensità e la durata sono predefinite a livello di sistema operativo.
- **Impatto sul codice**: Rimozione del campo `intensity` da `HapticSettings` e rimozione dei relativi getter/setter.

### Decisione 5 — Comportamento su Windows
- **Descrizione**: Rilevamento della piattaforma all'avvio tramite `Platform.OS`. Se l'app gira su Windows, tutte le chiamate al sistema aptico diventano silenziosamente no-op.
- **Motivazione**: Windows non supporta `expo-haptics` e non dispone di un motore aptico compatibile.
- **Impatto sul codice**: Aggiunta di un controllo `Platform.OS === 'windows'` per impostare `supportsVibration = false` e ignorare le chiamate.

### Decisione 6 — Compatibilità futura con iOS
- **Descrizione**: Il codice non conterrà ramificazioni specifiche per iOS.
- **Motivazione**: `expo-haptics` astrae internamente le differenze di piattaforma tra Android e iOS, garantendo lo stesso comportamento con la medesima interfaccia.

---

## 4. Analisi della dipendenza expo-haptics

Dall'analisi di [package.json](file:///C:/Sviluppo/ZecchinoReact/package.json), si è verificato che la dipendenza `expo-haptics` **non è presente** nelle dipendenze del progetto.

### Procedura di installazione e compatibilità:
Per garantire la stabilità su React Native 0.82.1, l'installazione dovrà seguire le linee guida di Expo:
```bash
npx expo install expo-haptics
```
Questo comando rileva automaticamente la versione corretta di `expo-haptics` compatibile con l'ambiente React Native 0.82.1 del progetto.

Per la piattaforma iOS (che fa parte delle piattaforme pianificate), sarà necessario effettuare il linking delle dipendenze native eseguendo:
```bash
npx pod-install
```
Per Android (piattaforma target attuale), la libreria richiede la permission `android.permission.VIBRATE` che viene iniettata automaticamente nel file `AndroidManifest.xml` compilato durante la build nativa.

---

## 5. Gestione persistenza delle impostazioni

Il file attuale utilizza `localStorage` per persistere lo stato delle impostazioni aptiche. Questa dipendenza va eliminata. Si analizzano le due opzioni di sostituzione:

### Opzione 1: AsyncStorage locale (`@react-native-async-storage/async-storage`)
- **Descrizione**: Memorizzazione dello stato `enabled` direttamente sul dispositivo tramite l'API asincrona di AsyncStorage.
- **Pro**: Isolamento del modulo; feedback aptico disponibile fin dall'avvio anche per utenti non autenticati.
- **Contro**: Mancanza di sincronizzazione cloud; disallineamento rispetto alla gestione delle preferenze audio.

### Opzione 2: Integrazione in `useUserSettings` / Supabase
- **Descrizione**: Memorizzazione della preferenza `haptic_enabled` nel database tramite la colonna `preferences` (JSONB) di `impostazioni_utente`.
- **Pro**: Coerenza con il sistema audio; backup cloud automatico; centralizzazione.
- **Contro**: Latenza di bootstrap (lo stato non è noto finché l'utente non si autentica e i dati non vengono scaricati da Supabase).

### Scelta Architetturale Adottata: Modello Ibrido
Per coniugare i vantaggi di entrambe le opzioni, si adotta un **modello ibrido**:
1. **Persistenza Locale Primaria**: `haptic-system.ts` utilizza `AsyncStorage` locale per caricare e salvare in modo asincrono lo stato `enabled` al mount, garantendo zero latenza durante la fase di bootstrap (es. inserimento del PIN nella schermata di sblocco).
2. **Sincronizzazione Cloud (Supabase)**: Si estende l'interfaccia `UserPreferences` in [types.ts](file:///C:/Sviluppo/ZecchinoReact/src/lib/supabase/types.ts) aggiungendo il campo `haptic_enabled: boolean`.
3. **Allineamento nel Hook**: Il hook `useUserSettings` in [use-user-settings.ts](file:///C:/Sviluppo/ZecchinoReact/src/hooks/use-user-settings.ts) viene esteso per includere `hapticEnabled` e `setHapticEnabled`. Quando lo stato di `useUserSettings` viene idratato dal cloud, invoca `hapticSystem.setEnabled(haptic_enabled)` per sincronizzare la preferenza locale con quella del profilo utente.

---

## 6. Interfaccia pubblica del nuovo modulo

Di seguito viene definito il contratto TypeScript del nuovo modulo [src/lib/haptic-system.ts](file:///C:/Sviluppo/ZecchinoReact/src/lib/haptic-system.ts).

```typescript
import { Platform } from 'react-native';

export type HapticFeedbackType =
  | 'success'
  | 'error'
  | 'warning'
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy';

export interface HapticSettings {
  enabled: boolean;
}

export interface IHapticSystem {
  isEnabled(): boolean;
  setEnabled(enabled: boolean): Promise<void>;
  getSettings(): HapticSettings;
  isSupported(): boolean;
  
  // 7 feedback nativi
  success(): Promise<void>;
  error(): Promise<void>;
  warning(): Promise<void>;
  selection(): Promise<void>;
  impactLight(): Promise<void>;
  impactMedium(): Promise<void>;
  impactHeavy(): Promise<void>;
}
```

### Strato di Compatibilità (Shim Deprecato)
Per evitare errori di compilazione TypeScript nei moduli `AuthContext.tsx` e `AppDataContext.tsx` senza espanderne lo scope di modifica, la classe `HapticSystem` manterrà le seguenti firme legacy come metodi deprecati:

```typescript
class HapticSystem implements IHapticSystem {
  // ... implementazione dei metodi principali ...

  /** @deprecated Usare impactLight() */
  click(): void { this.impactLight(); }
  /** @deprecated Usare impactMedium() */
  buttonPress(): void { this.impactMedium(); }
  /** @deprecated Usare success() */
  pinSuccess(): void { this.success(); }
  /** @deprecated Usare error() */
  pinError(): void { this.error(); }
  /** @deprecated Usare success() */
  unlock(): void { this.success(); }
  /** @deprecated Usare success() */
  privateUnlock(): void { this.success(); }
  /** @deprecated Usare success() */
  accountCreated(): void { this.success(); }
  /** @deprecated Usare error() */
  accountDeleted(): void { this.error(); }
  /** @deprecated Usare impactMedium() */
  transactionCreated(): void { this.impactMedium(); }
  /** @deprecated Usare impactLight() */
  income(): void { this.impactLight(); }
  /** @deprecated Usare impactLight() */
  expense(): void { this.impactLight(); }
  /** @deprecated Usare impactMedium() */
  transfer(): void { this.impactMedium(); }
  /** @deprecated Usare success() */
  save(): void { this.success(); }
  /** @deprecated Usare error() */
  delete(): void { this.error(); }
  /** @deprecated Usare success() */
  budgetCreated(): void { this.success(); }
  /** @deprecated Usare error() */
  budgetDeleted(): void { this.error(); }
  /** @deprecated Usare warning() */
  budgetWarning(): void { this.warning(); }
  /** @deprecated Usare error() */
  budgetCritical(): void { this.error(); }
  /** @deprecated Usare error() */
  budgetExceeded(): void { this.error(); }
  /** @deprecated Usare success() */
  goalCreated(): void { this.success(); }
  /** @deprecated Usare success() */
  goalCompleted(): void { this.success(); }
  /** @deprecated Usare success() */
  export(): void { this.success(); }
  /** @deprecated Usare selection() */
  dialogOpen(): void { this.selection(); }
  /** @deprecated Usare selection() */
  dialogClose(): void { this.selection(); }
  /** @deprecated Usare selection() */
  tabChange(): void { this.selection(); }
  /** @deprecated Usare selection() */
  filterToggle(): void { this.selection(); }
  /** @deprecated Usare selection() */
  categoryToggle(): void { this.selection(); }
  /** @deprecated Usare selection() */
  alertDismissed(): void { this.selection(); }
  /** @deprecated Usare selection() */
  navigation(): void { this.selection(); }
  /** @deprecated Usare selection() */
  focus(): void { this.selection(); }
  /** @deprecated Usare selection() */
  swipe(): void { this.selection(); }
  /** @deprecated Usare selection() */
  longPress(): void { this.selection(); }
  /** @deprecated Usare selection() */
  refresh(): void { this.selection(); }
  /** @deprecated Usare success() o impactMedium() */
  custom(duration: number | number[]): void { this.impactMedium(); }
}
```

---

## 7. Comportamento per piattaforma

Di seguito viene descritto il comportamento atteso per ciascun feedback aptico sulle piattaforme target:

| Tipo di Feedback | Comportamento su Android | Comportamento su iOS | Comportamento su Windows |
|---|---|---|---|
| `success` | Vibrazione a pattern di conferma (doppio impulso rapido) | Taptic Engine: Notification Success pattern | No-op silenzioso |
| `error` | Vibrazione a pattern di errore (impulsi prolungati o ripetuti) | Taptic Engine: Notification Error pattern | No-op silenzioso |
| `warning` | Vibrazione a pattern di avviso (impulso medio seguito da pausa) | Taptic Engine: Notification Warning pattern | No-op silenzioso |
| `selection` | Vibrazione leggerissima (singolo micro-impulso) | Taptic Engine: Selection feedback | No-op silenzioso |
| `impactLight` | Impatto leggero | Taptic Engine: Impact Light style | No-op silenzioso |
| `impactMedium` | Impatto medio | Taptic Engine: Impact Medium style | No-op silenzioso |
| `impactHeavy` | Impatto forte | Taptic Engine: Impact Heavy style | No-op silenzioso |

---

## 8. Compatibilità con il motore di accessibilità

Il feedback aptico è parte dell'esperienza sensoriale accessibile definita in ADR_001. Il refactoring deve rispettare le seguenti regole di compatibilità:
1. **Integrazione con AppDataContext**: I consumer in `AppDataContext.tsx` continuano a chiamare l'interfaccia di compatibilità shim senza subire crash.
2. **Priorità delle Impostazioni di Sistema**: Se l'utente ha disabilitato il feedback tattile nelle impostazioni globali del sistema operativo del dispositivo (Android/iOS Settings > Accessibility > Vibration), le chiamate a `expo-haptics` verranno ignorate a livello di sistema operativo senza generare errori o crash nell'applicazione.
3. **Disattivazione Applicativa**: Se l'utente disabilita l'opzione aptica nell'app (tramite l'impostazione persista `haptic_enabled = false`), il metodo `isEnabled()` del modulo deve restituire `false`, e tutte le funzioni di feedback devono bloccarsi immediatamente all'inizio per evitare chiamate inutili alle API native.

---

## 9. Gate di validazione

Prima di considerare completata l'implementazione del refactoring del sistema aptico (a valle di questo design doc), dovranno essere soddisfatti i seguenti criteri di accettazione:

### Automated Tests
1. **Compilation Gate**: Il comando `npx tsc --noEmit` non deve produrre alcun errore TypeScript relativo a `src/lib/haptic-system.ts` o ai suoi consumer (`use-haptic.ts`, `AuthContext.tsx`, `AppDataContext.tsx`).
2. **Jest Suite**: La suite di test per `useHaptic` (da implementare o aggiornare) deve passare con successo simulando le risposte di `expo-haptics` e verificando che lo stato locale `enabled` venga salvato e letto correttamente tramite AsyncStorage.

### Manual Verification
1. **Verification on Android Device/Emulator**:
   - Avviare l'app su un dispositivo Android fisico o su un emulatore che supporti la vibrazione.
   - Verificare che le operazioni di successo (es. salvataggio transazione) generino un feedback aptico avvertibile.
   - Verificare che gli errori di sblocco PIN generino il pattern di errore.
   - Disabilitare i feedback tattili dalle impostazioni dell'app e verificare che le vibrazioni cessino immediatamente.
2. **Verification on Windows**:
   - Avviare l'app su Windows tramite `npm run windows`.
   - Verificare che non si verifichino crash all'avvio o durante l'esecuzione di azioni che innescano feedback aptici (es. sblocco, transazioni).

---

## 10. Scope e vincoli

### Fuori scope per questo refactor:
1. **Nessun cambio UI**: Nessuna modifica grafica ai pulsanti o alle impostazioni all'interno di questo blocco (l'interruttore delle impostazioni UI fa parte dei design successivi).
2. **Nessuna modifica ad altri consumer**: Nessun riallineamento manuale delle chiamate semantiche in `AppDataContext.tsx` o `AuthContext.tsx` (risolto tramite lo shim di compatibilità).
3. **Sound System**: La riscrittura di `sound-system.ts` fa parte del debito tecnico separato **AN-02** ed è del tutto fuori perimetro per questo documento.
