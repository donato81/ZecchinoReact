---
tipo: design
titolo: Refactor Haptic System — sostituzione navigator.vibrate() con expo-haptics
versione: 0.1.0
data: 2026-06-26
stato: REVIEWED
data-revisione: 2026-06-26
revisore: Consiglio AI + donny-81
note-revisione: "9 punti corretti su indicazione Consiglio AI. Pronto per coding plan AN-01."
sorgente: docs/todo-master.md
perimetro:
  - src/lib/haptic-system.ts
  - src/hooks/use-haptic.ts
  - src/hooks/use-user-settings.ts
  - src/lib/supabase/types.ts
  - package.json
  - package-lock.json
precondizioni:
  - Verifica se expo è presente in package.json
  - Se expo non è presente, configurare Expo Modules con: npx install-expo-modules@latest
  - Solo dopo, installare: npx expo install expo-haptics
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

Riferimento al codice attuale: commit SHA [67eb32cf076e6ef443634d45db7f108b4a861718](src/lib/haptic-system.ts).

---

## 2. Analisi dello stato attuale

Il file attuale [src/lib/haptic-system.ts](src/lib/haptic-system.ts) definisce le seguenti strutture e comportamenti:
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
- **Motivazione**: Questi 7 feedback rappresentano il sottoinsieme atomico scelto per il primo refactor cross-platform. Non rappresentano l'intera superficie API di expo-haptics, che espone anche altri stili (Rigid, Soft) e API Android-specifiche.
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

## Precondizione — Expo Modules

Prima di introdurre expo-haptics, verificare se il progetto è già configurato per Expo Modules eseguendo:

  cat package.json | grep '"expo"'

Se expo non è presente in package.json, eseguire prima:

  npx install-expo-modules@latest

Verificare che il comando sia completato senza errori, quindi installare:

  npx expo install expo-haptics

Questa precondizione è obbligatoria perché expo-haptics è un modulo Expo SDK e richiede l'infrastruttura Expo Modules in un progetto React Native CLI esistente.

Nota Windows: l'integrazione Expo Modules deve essere verificata specificamente con react-native-windows. Tracciata come DT-021-02.

---

## 4. Analisi della dipendenza expo-haptics

Dall'analisi di [package.json](package.json), si è verificato che la dipendenza `expo-haptics` **non è presente** nelle dipendenze del progetto.

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
2. **Sincronizzazione Cloud (Supabase)**: Si estende l'interfaccia `UserPreferences` in [types.ts](src/lib/supabase/types.ts) aggiungendo il campo `haptic_enabled: boolean`.
3. **Allineamento nel Hook**: Il hook `useUserSettings` in [use-user-settings.ts](src/hooks/use-user-settings.ts) viene esteso per include `hapticEnabled` e `setHapticEnabled`. Quando lo stato di `useUserSettings` viene idratato dal cloud, invoca `hapticSystem.setEnabled(haptic_enabled)` per sincronizzare la preferenza locale con quella del profilo utente.

### Regola di precedenza — AsyncStorage vs Supabase

Il modello ibrido usa AsyncStorage come cache locale e Supabase come fonte autoritativa per l'utente autenticato.

Regole:

1. Se l'utente non è autenticato, il sistema usa solo la preferenza locale.
2. Se l'utente è autenticato ma il profilo cloud non è ancora idratato, il sistema non produce feedback aptici. Comportamento: fail-closed. Significato: in caso di dubbio, nessuna vibrazione.
3. Quando haptic_enabled viene letto da Supabase, il valore cloud sovrascrive sempre il valore locale.
4. Dopo l'allineamento, il valore cloud viene riscritto in AsyncStorage per coerenza ai successivi avvii.
5. Se Supabase dice haptic_enabled = false, nessun valore locale può riabilitare le vibrazioni.

Questa regola è necessaria per rispettare la scelta dell'utente su tutti i dispositivi, in particolare per chi ha disabilità sensoriali o neurologiche che rendono le vibrazioni indesiderate o fastidiose.

---

## 6. Interfaccia pubblica del nuovo modulo

Di seguito viene definito il contratto TypeScript del nuovo modulo [src/lib/haptic-system.ts](src/lib/haptic-system.ts).

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

| Metodo pubblico IHapticSystem | Chiamata expo-haptics |
|---|---|
| success() | Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) |
| error() | Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error) |
| warning() | Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning) |
| selection() | Haptics.selectionAsync() |
| impactLight() | Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) |
| impactMedium() | Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) |
| impactHeavy() | Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy) |

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

### Strategia di uscita dallo shim legacy

Lo shim legacy è introdotto esclusivamente per mantenere compilabili i consumer esistenti (AuthContext.tsx, AppDataContext.tsx, use-haptic.ts) durante il refactor AN-01.

Regole:

1. Tutti i metodi legacy nello shim devono essere marcati @deprecated.
2. Nessun nuovo codice può usare i metodi legacy.
3. I nuovi consumer usano solo i 7 metodi atomici del contratto pubblico.
4. Lo shim sarà rimosso quando AuthContext.tsx, AppDataContext.tsx e use-haptic.ts saranno riallineati ai 7 metodi atomici.
5. La rimozione è tracciata come sotto-task obbligatoria AN-01-Phase2, registrata come DT-021-01 nel registro debiti tecnici del documento.
6. Lo shim non deve sopravvivere al blocco UI/Impostazioni che introdurrà il controllo grafico per haptic_enabled.
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

Il feedback aptico è parte dell'esperienza sensoriale accessibile coerente con docs/0-architecture/ADR_001_sistema-annunci-accessibili.md, che definisce il principio di separazione delle responsabilità nel sistema di accessibilità. Il refactoring deve rispettare le seguenti regole di compatibilità:
1. **Integrazione con AppDataContext**: I consumer in `AppDataContext.tsx` continuano a chiamare l'interfaccia di compatibilità shim senza subire crash.
2. **Priorità delle Impostazioni di Sistema**: Se l'utente ha disabilitato il feedback tattile nelle impostazioni globali del sistema operativo del dispositivo (Android/iOS Settings > Accessibility > Vibration), le chiamate a `expo-haptics` verranno ignorate a livello di sistema operativo senza generare errori o crash nell'applicazione.
3. **Disattivazione Applicativa**: Se l'utente disabilita l'opzione aptica nell'app (tramite l'impostazione persista `haptic_enabled = false`), il metodo `isEnabled()` del modulo deve restituire `false`, e tutte le funzioni di feedback devono bloccarsi immediatamente all'inizio per evitare chiamate inutili alle API native.

---

## 9. Gate di validazione

Prima di considerare completata l'implementazione del refactoring del sistema aptico (a valle di questo design doc), dovranno essere soddisfatti i seguenti criteri di accettazione:

### Gate di compilazione
- `npx tsc --noEmit` deve passare senza errori sui file:
  - `src/lib/haptic-system.ts`
  - `src/hooks/use-haptic.ts`
  - `src/hooks/use-user-settings.ts`
  - `src/lib/supabase/types.ts`
  - `src/context/AuthContext.tsx`
  - `src/context/AppDataContext.tsx`

### Gate test unitari obbligatori (creare o aggiornare)
1. `enabled=false` blocca ogni chiamata nativa.
2. Stato `unknown` durante bootstrap non produce vibrazioni (fail-closed).
3. Supabase `haptic_enabled=false` sovrascrive AsyncStorage per utente autenticato.
4. Il valore cloud viene riscritto in AsyncStorage dopo l'idratazione.
5. `success()` chiama `notificationAsync` con `NotificationFeedbackType.Success`.
6. `error()` chiama `notificationAsync` con `NotificationFeedbackType.Error`.
7. `warning()` chiama `notificationAsync` with `NotificationFeedbackType.Warning`.
8. `selection()` chiama `selectionAsync()`.
9. `impactLight/Medium/Heavy` chiamano `impactAsync` con lo stile corretto.
10. `Platform.OS === 'windows'` restituisce no-op silenzioso senza eccezioni.
11. I metodi legacy `@deprecated` inoltrano ai 7 metodi atomici senza errori.
12. Aggiornare `src/hooks/use-haptic.ts` affinché non esponga più: `intensity`, `setIntensity`, `play`, `impact`, `notification` salvo shim esplicitamente documentato con `@deprecated`. Il nuovo hook deve esporre esclusivamente: `isEnabled`, `isSupported`, `setEnabled`, `success`, `error`, `warning`, `selection`, `impactLight`, `impactMedium`, `impactHeavy`. Creare o aggiornare la suite di test relativa e verificare che i metodi rimossi non siano più accessibili dal contratto pubblico del hook.

### Gate dipendenze
1. `package.json` contiene `expo-haptics` solo dopo aver configurato Expo Modules.
2. `package-lock.json` è aggiornato coerentemente.

### Gate sicurezza import Windows
- `npm run windows` non fallisce per import di `expo-haptics`.
- Tutte le chiamate aptiche su Windows sono no-op silenziose.
- Azioni che chiamano lo shim legacy non producono crash su Windows.

### Gate manuale Android (da eseguire su dispositivo fisico o emulatore con vibrazione)
1. Avvio app → `success()` produce feedback aptico.
2. Errore PIN → `error()` produce feedback di errore.
3. Disattivazione `haptic_enabled` → feedback bloccato immediatamente.

---

## 10. Scope e vincoli

### Fuori scope per questo refactor:
1. **Nessun cambio UI**: Nessuna modifica grafica ai pulsanti o alle impostazioni all'interno di questo blocco (l'interruttore delle impostazioni UI fa parte dei design successivi).
2. **Nessuna modifica ad altri consumer**: Nessun riallineamento manuale delle chiamate semantiche in `AppDataContext.tsx` o `AuthContext.tsx` (risolto tramite lo shim di compatibilità).
3. **Sound System**: La riscrittura di `sound-system.ts` fa parte del debito tecnico separato **AN-02** ed è del tutto fuori perimetro per questo documento.

---

## 11. Debiti tecnici

- **DT-021-01 — Rimozione shim legacy haptic**: Lo shim deprecated verrà rimosso in `AN-01-Phase2` dopo il riallineamento di `AuthContext.tsx`, `AppDataContext.tsx` e `use-haptic.ts` ai 7 metodi atomici.
- **DT-021-02 — Verifica Expo Modules su Windows**: L'integrazione Expo Modules deve essere verificata specificamente con `react-native-windows` prima della build Windows.
- **DT-021-03 — Preferenza haptic UI**: L'interruttore grafico per `haptic_enabled` è fuori scope in questo design. Sarà introdotto in un blocco UI successivo.
- **DT-021-04 — Test su dispositivo fisico Android**: La validazione finale del feedback aptico richiede almeno un test su dispositivo Android fisico o emulatore compatibile con vibrazione.
