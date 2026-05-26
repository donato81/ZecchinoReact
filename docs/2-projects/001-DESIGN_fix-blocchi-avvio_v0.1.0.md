---
tipo: design
titolo: Fix blocchi di avvio â€” Gruppo 1 (B1â€“B6)
versione: 0.1.0
data: 2026-05-13
stato: IMPLEMENTED
sorgente: docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md
perimetro: babel.config.js, package.json, src/context/AuthContext.tsx, src/context/AppDataContext.tsx, src/lib/supabase/client.ts, src/components/ui/button.tsx, src/env.d.ts
---

# DESIGN â€” Fix blocchi di avvio (v0.1.0)

> **Scope**: configurazione e dipendenze necessarie per rendere l'app
> avviabile. Nessuna UI, nessun componente definitivo, nessuna schermata.
>
> **Precondizione**: leggere
> [docs/1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md](../1-reports/REPORT_diagnosi-compatibilita-RN_v0.1.0.md)
> prima di procedere all'implementazione.

---

## 1. Grafo delle dipendenze e ordine obbligatorio

I sei blocchi non sono indipendenti. Le dipendenze logiche determinano
un ordine vincolante:

- B1 e B2 abilitano la risoluzione dei moduli da parte di Metro.
- B3 e B4 dipendono da B1 (richiedono che la risoluzione degli alias
  sia attiva prima di poter essere verificati).
- B5 Ã¨ necessario prima di qualsiasi installazione npm.
- B6 Ã¨ risolto automaticamente dalla soluzione di B2.

**Sequenza vincolante:**

1. **B1 + B2 + B5** possono essere applicati in un singolo commit perchÃ©
   toccano solo i file di configurazione (`babel.config.js` e
   `package.json`) e non si bloccano a vicenda.
2. **B3** â€” rimozione della dipendenza `sonner` â€” richiede B1 come
   precondizione.
3. **B4** â€” creazione del placeholder `Button` e fix JSX â€” richiede B1
   per la risoluzione degli alias.
4. **B6** Ã¨ risolto da B2 â€” non richiede azione aggiuntiva.

---

## 2. B1 â€” Alias `@/*` non risolto da Metro

### Stato attuale

La configurazione di Babel non include alcun plugin per la risoluzione
degli alias. Il file `tsconfig.json` definisce l'alias `@/*` â†’ `src/*`,
ma questa configurazione Ã¨ visibile solo al type-checker TypeScript;
Metro usa Babel come resolver a runtime e ignora `tsconfig.json`.

### Causa

Manca il plugin per la risoluzione degli alias in Babel. Ogni import con
prefisso `@/` â€” decine di occorrenze nei moduli di contesto, hook e
librerie â€” produce un errore Metro di risoluzione modulo.

### Soluzione

Aggiungere il plugin `module-resolver` a `babel.config.js` configurato
per risolvere l'alias `@/` verso la directory `src/`. Aggiungere
`babel-plugin-module-resolver` alle dipendenze di sviluppo in
`package.json`.

---

## 3. B2 + B6 â€” Variabili `.env` non iniettate

### Stato attuale

Il client Supabase legge le variabili di configurazione tramite
`process.env`. Il pacchetto `react-native-dotenv` Ã¨ presente nelle
dipendenze npm, ma non Ã¨ registrato in Babel: Metro non esegue mai la
sostituzione, le variabili risultano `undefined` e l'inizializzazione
del client genera un errore sincrono che si propaga a cascata su tutti
i moduli che lo importano.

### Causa

B2 e B6 hanno la stessa origine: `react-native-dotenv` Ã¨ inerte finchÃ©
non viene caricato come plugin Babel. Il crash Ã¨ immediato al primo
import del modulo client.

### Soluzione

Registrare `react-native-dotenv` come plugin Babel, configurato per
esporre le variabili tramite un modulo importabile (convenzionalmente
`@env`) invece di `process.env`. Il codice del client Supabase deve
essere aggiornato per importare le variabili dal nuovo modulo. Ãˆ
necessario aggiungere una dichiarazione TypeScript per il modulo `@env`
affinchÃ© il type-checker lo riconosca.

> **Nota di perimetro**: la modifica al client Supabase non era nel
> perimetro dichiarato, ma Ã¨ indispensabile perchÃ© B2 abbia effetto.
> Deve essere inclusa nello stesso commit di B2.

---

## 4. B5 â€” Versione AsyncStorage inesistente

### Stato attuale

La versione di `@react-native-async-storage/async-storage` dichiarata
in `package.json` appartiene a una major non ancora pubblicata su npm.
L'installazione fallisce con un errore di versione non trovata, rendendo
`node_modules` incompleto e impedendo qualsiasi build.

### Causa

Probabile errore di pinning manuale. La serie stabile pubblicata Ã¨ la
2.x, compatibile con React Native 0.82.

### Soluzione

Correggere la versione in `package.json` portandola alla serie 2.x
stabile.

---

## 5. B3 â€” Dipendenza `sonner` assente e incompatibile con React Native

### Stato attuale

Due file di contesto (`AuthContext.tsx` e `AppDataContext.tsx`)
importano la libreria `sonner` per le notifiche toast. `sonner` non Ã¨
presente in `package.json` e â€” anche se lo fosse â€” richiede il DOM del
browser e non funziona in React Native.

### Causa

`sonner` non compare nelle dipendenze npm. Metro non riesce a risolvere
il modulo e il bundle non viene generato.

### Soluzione

Rimuovere gli import di `sonner` e sostituirli con uno shim locale
minimo che mantenga invariata la firma usata dai call site esistenti.
Lo shim Ã¨ temporaneo: nella fase UI sarÃ  sostituito da una libreria
toast nativa per React Native.

La scelta di uno shim basato su `console.*` (e non su componenti UI
visivi come `Alert.alert`) Ã¨ deliberata: questa fase non introduce UI
definitiva.

---

## 6. B4 â€” Componente `Button` inesistente e JSX DOM-only

### Stato attuale

`AuthContext.tsx` importa un componente `Button` da una directory che
non esiste. Il dialog di avviso inattivitÃ  nello stesso file usa elementi
JSX DOM (`div`, `p`, `className`, `onClick`) non validi in React Native.

### Cause

Due problemi sovrapposti:

1. Il file del componente `Button` non esiste â€” Metro produce un errore
   di risoluzione dopo che B1 Ã¨ stato corretto.
2. Il JSX del dialog usa costrutti web-only che TypeScript segnala come
   errori in un progetto React Native puro.

### Soluzione

**Parte A â€” placeholder `Button`**: creare un componente `Button`
minimo funzionante in React Native. Il componente accetta i prop giÃ 
usati nei call site esistenti (`variant`, `children`, `onClick`) senza
introdurre stili definitivi. Il parametro `variant` Ã¨ accettato ma
ignorato in questa fase; sarÃ  gestito nella fase UI. Il parametro
`onClick` Ã¨ un alias transitorio di `onPress` per compatibilitÃ  con il
codice esistente: al termine del commit, ogni occorrenza di `onClick`
sui `Button` deve essere sostituita con `onPress`.

**Parte B â€” conversione dialog inattivitÃ **: convertire il JSX DOM-only
in primitivi React Native. Gli attributi di accessibilitÃ  web (`role`,
`aria-live`, `aria-label`) vanno tradotti nei corrispondenti attributi
React Native. Il valore corretto per `accessibilityRole` Ã¨ `"alert"`,
non `"alertdialog"`: quest'ultimo Ã¨ valido in HTML ma non Ã¨ incluso
nell'insieme dei valori supportati da React Native.

Gli annunci screen reader sono rimossi temporaneamente perchÃ© il modulo
`screen-reader.ts` non Ã¨ ancora migrato a React Native; la chiamata
sarÃ  ripristinata in un design dedicato.

---

## 7. Riepilogo modifiche per file

| File | Operazione | Blocco/i |
|------|-----------|---------|
| `babel.config.js` | Aggiungere plugin `module-resolver` e `react-native-dotenv` | B1, B2, B6 |
| `package.json` | Aggiungere `babel-plugin-module-resolver` a devDeps; correggere versione AsyncStorage | B1, B5 |
| `src/context/AuthContext.tsx` | Rimuovere import `sonner`; aggiungere shim locale; rimuovere import `Button` DOM; convertire dialog JSX da DOM a React Native | B3, B4 |
| `src/context/AppDataContext.tsx` | Rimuovere import `sonner`; aggiungere shim locale | B3 |
| `src/components/ui/button.tsx` | **CREARE** â€” placeholder `Button` con `TouchableOpacity` | B4 |
| `src/lib/supabase/client.ts` | Cambio da `process.env.*` a import da `@env` (**fuori perimetro originale, indispensabile per B2**) | B2 |
| `src/env.d.ts` | **CREARE** â€” dichiarazione del modulo `@env` per TypeScript | B2 |
