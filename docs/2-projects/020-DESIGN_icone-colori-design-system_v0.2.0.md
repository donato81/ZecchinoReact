# DESIGN 020 — Centralizzazione design tokens: colori e chiavi icone

**Versione:** 0.2.0
**Data creazione:** 2026-06-26
**Data revisione:** 2026-06-26
**Stato:** REVIEWED — approvato dal Consiglio AI
**Autore:** Donato 
**Revisori:** Consiglio AI (Claude, Gemini, GPT-4o)

***

## Registro delle versioni

| Versione | Data       | Autore          | Note                                                 |
|----------|------------|-----------------|------------------------------------------------------|
| 0.1.0    | 2026-06-26 | Donato Ferrara  | Prima stesura con domande aperte al Consiglio AI     |
| 0.2.0    | 2026-06-26 | Consiglio AI    | Revisione completa — tutte le domande aperte chiuse  |

***

## 1. Contesto e motivazione

### 1.1 Problema attuale

Il progetto ZecchinoReact contiene attualmente 16 valori colore definiti direttamente nel codice sorgente, tutti nel formato `oklch()`. Questo formato non è compatibile con React Native, che accetta solo colori in formato hex (`#rrggbb`), `rgb()`, `rgba()`, o stringhe nominali come `red`.

Il censimento eseguito con ricerca globale su `src/` ha individuato i colori in due soli file:

- `src/lib/budget-templates.ts` — 11 occorrenze di `oklch()` nella proprietà `color` dei template budget
- `src/lib/constants.ts` — 5 occorrenze di `oklch()` nella proprietà `color` delle categorie conto

Totale: 16 colori hardcoded da migrare.

### 1.2 Problema aggiuntivo: dipendenza da Phosphor Icons

Il file `src/lib/budget-templates.ts` importa direttamente componenti e tipi da `@phosphor-icons/react`. Questa dipendenza è incompatibile con React Native, che non può usare componenti web. Il campo `icon: Icon` nell'interfaccia `BudgetTemplate` punta al tipo della libreria Phosphor, che è un componente React DOM, non un dato di dominio.

### 1.3 Perché non basta convertire in hex senza centralizzare

La conversione semplice dei valori, lasciandoli nei file di dominio, risolverebbe il problema tecnico immediato ma consoliderebbe colori hardcoded sparsi in file diversi. Ogni modifica futura richiederebbe una ricerca manuale su più file. La centralizzazione è coerente con il principio già adottato in ZecchinoReact: una sola fonte di verità per ogni categoria di dato.

***

## 2. Obiettivi del DESIGN 020

1. Convertire tutti i 16 valori `oklch()` in valori hex compatibili con React Native.
2. Centralizzare tutti i token colore nel file `src/lib/design-tokens/colors.ts`.
3. Rimuovere la dipendenza diretta da `@phosphor-icons/react` nel dominio applicativo.
4. Sostituire il campo `icon: Icon` con `iconKey: BudgetTemplateIconKey` nell'interfaccia `BudgetTemplate`.
5. Definire le 11 chiavi semantiche per i template budget, in inglese, indipendenti da qualsiasi libreria grafica.
6. Documentare i debiti tecnici aperti per la fase UI futura.

***

## 3. Decisioni architetturali — Consiglio AI

Tutte le decisioni seguenti sono state approvate dal Consiglio AI nella revisione del 2026-06-26.

### Decisione A — Centralizzazione obbligatoria

**Approvata: Opzione B — Conversione oklch → hex con centralizzazione contestuale.**

Tutti i colori oggi definiti con `oklch()` vengono convertiti in valori hex e spostati in un unico file centrale di design tokens. I file di dominio o configurazione non devono più contenere direttamente valori `oklch()` né valori hex hardcoded relativi al design system. Ogni uso deve importare il token dal file centrale.

### Decisione B — Posizione del file centrale

**Approvata: Opzione B2 — `src/lib/design-tokens/colors.ts`.**

Il file centrale dei token colore è `src/lib/design-tokens/colors.ts`. La cartella `design-tokens/` separa chiaramente i token visivi dalla logica di dominio e permette future estensioni come `typography.ts`, `spacing.ts`, `radius.ts` senza dover rinominare file esistenti. Nessun altro file deve definire valori colore del design system direttamente.

### Decisione C — Chiavi icone semantiche in inglese

**Approvato: stile semantico-descrittivo in inglese. Respinto: stile derivato dai nomi dei componenti Phosphor.**

Il principio architetturale è: il dominio descrive il significato, la UI decide come rappresentarlo. Le chiavi devono descrivere il concetto del template, non il glifo scelto da una libreria. La lingua è inglese perché il progetto usa già chiavi tecniche in inglese per le icone degli account (`bank`, `credit-card`, `money`, `lock` in `ACCOUNT_TYPE_ICONS`). Le stringhe visibili all'utente restano in italiano e passano sempre da `src/locales/it.ts`.

### Decisione D — Libreria icone non scelta ora

**Confermato: la scelta della libreria icone è rinviata alla fase UI.**

Non viene introdotta nessuna libreria icone nativa (né `react-native-vector-icons`, né `@expo/vector-icons`, né `react-native-svg`) in questo DESIGN. Quando esisterà una UI reale, la libreria scelta sarà incapsulata dietro un componente centralizzato che riceverà `iconKey`, `isDecorative`, `accessibilityLabelKey` e `accessibilityRole`. Nessun componente applicativo dovrà importare direttamente la libreria icone.

### Decisione E — Numero di chiavi: 11, non 10

Il codice reale contiene 11 template budget. Anche se le icone Phosphor distinte sono 10 (perché `ShoppingCart` è riutilizzata sia per `spesa-mensile` sia per `budget-totale`), i due template hanno significato autonomo e non devono condividere la stessa chiave semantica. `groceries` descrive la spesa alimentare; `overall-budget` descrive il budget complessivo mensile. Il tipo `BudgetTemplateIconKey` deve quindi contenere 11 chiavi.

***

## 4. Specifica tecnica — File `src/lib/design-tokens/colors.ts`

### 4.1 Struttura del file

```typescript
// src/lib/design-tokens/colors.ts
// File centrale dei design token colore per ZecchinoReact.
// Tutti i valori sono in formato hex compatibile con React Native.
// Nessun altro file deve definire valori colore hardcoded.

export const DESIGN_COLORS = {

  budget: {
    groceries:     '#...',  // oklch(0.65 0.15 140) — template Spesa Alimentare
    dining:        '#...',  // oklch(0.70 0.15 45)  — template Ristoranti e Bar
    transport:     '#...',  // oklch(0.60 0.15 230) — template Trasporti
    housing:       '#...',  // oklch(0.55 0.12 30)  — template Casa e Bollette
    entertainment: '#...',  // oklch(0.68 0.18 300) — template Svago e Intrattenimento
    health:        '#...',  // oklch(0.65 0.15 25)  — template Salute e Benessere
    subscriptions: '#...',  // oklch(0.58 0.15 280) — template Abbonamenti
    clothing:      '#...',  // oklch(0.62 0.12 320) — template Abbigliamento
    education:     '#...',  // oklch(0.55 0.15 250) — template Istruzione e Formazione
    pets:          '#...',  // oklch(0.70 0.14 60)  — template Animali Domestici
    overallBudget: '#...',  // oklch(0.35 0.08 250) — template Budget Totale Mensile
  },

  accountCategory: {
    banking:     '#...',  // oklch(0.35 0.08 250) — categoria Bancari
    digital:     '#...',  // oklch(0.65 0.15 190) — categoria Digitali
    savings:     '#...',  // oklch(0.75 0.12 85)  — categoria Risparmio
    investments: '#...',  // oklch(0.55 0.18 140) — categoria Investimenti
    private:     '#...',  // oklch(0.55 0.15 25)  — categoria Privato
  },

} as const;

export type BudgetColorToken = keyof typeof DESIGN_COLORS.budget;
export type AccountCategoryColorToken = keyof typeof DESIGN_COLORS.accountCategory;
```

### 4.2 Nota sulla coincidenza di valori

Il token `budget.overallBudget` e il token `accountCategory.banking` hanno entrambi il valore originale `oklch(0.35 0.08 250)`. Questa è una coincidenza numerica, non una condivisione semantica. I due token devono rimanere separati con nomi distinti, perché rappresentano concetti diversi. Se il valore hex convertito risulterà identico, i nomi separati garantiscono comunque che una futura modifica di un token non impatti l'altro.

### 4.3 Conversione oklch → hex

I valori hex definitivi devono essere determinati con conversione verificata tramite strumento (ad esempio `culori` o convertitore online con profilo sRGB) e successiva verifica del contrasto WCAG AA nei contesti reali di utilizzo. I valori `#...` nel template sopra sono placeholder da sostituire prima del commit.

La Sezione 6 di questo documento riporta il catalogo completo con i valori oklch originali pronti per la conversione.

***

## 5. Specifica tecnica — Tipo `BudgetTemplateIconKey`

### 5.1 Tipo TypeScript definitivo

```typescript
export type BudgetTemplateIconKey =
  | 'groceries'
  | 'dining'
  | 'transport'
  | 'housing'
  | 'entertainment'
  | 'health'
  | 'subscriptions'
  | 'clothing'
  | 'education'
  | 'pets'
  | 'overall-budget';
```

### 5.2 Mappatura chiavi

| Template id       | Nome template            | Icona Phosphor attuale | iconKey approvata  | Tipo icona previsto   |
|-------------------|--------------------------|------------------------|--------------------|-----------------------|
| `spesa-mensile`   | Spesa Alimentare         | ShoppingCart           | `groceries`        | decorativa            |
| `ristoranti`      | Ristoranti e Bar         | ForkKnife              | `dining`           | decorativa            |
| `trasporti`       | Trasporti                | Car                    | `transport`        | decorativa            |
| `casa`            | Casa e Bollette          | House                  | `housing`          | decorativa            |
| `svago`           | Svago e Intrattenimento  | FilmSlate              | `entertainment`    | decorativa            |
| `salute`          | Salute e Benessere       | Heartbeat              | `health`           | decorativa            |
| `abbonamenti`     | Abbonamenti              | DeviceMobile           | `subscriptions`    | decorativa            |
| `abbigliamento`   | Abbigliamento            | TShirt                 | `clothing`         | decorativa            |
| `istruzione`      | Istruzione e Formazione  | GraduationCap          | `education`        | decorativa            |
| `animali`         | Animali Domestici        | PawPrint               | `pets`             | decorativa            |
| `budget-totale`   | Budget Totale Mensile    | ShoppingCart           | `overall-budget`   | decorativa            |

Tutte le icone dei template budget sono attualmente di tipo decorativa o informativa. Non sono elementi interattivi autonomi. Non richiedono `accessibilityLabel` immediata in `src/locales/it.ts`. Quando nascerà la UI, lo screen reader dovrà annunciare il nome del template e la sua descrizione, non il nome dell'icona.

### 5.3 Motivazione delle chiavi rifiutate

`shopping` è troppo generico per la spesa alimentare; `groceries` è preciso.
`food` è ambiguo tra spesa e ristorante; la distinzione corretta è `groceries` versus `dining`.
`home` è accettabile, ma `housing` copre meglio affitto, mutuo e utenze.
`phone` non è corretto per gli abbonamenti, che includono streaming e software; la chiave corretta è `subscriptions`.
`miscellaneous` non va usato per il budget totale; il concetto corretto è `overall-budget`.

***

## 6. Catalogo colori — fonte di verità per la conversione

Questo catalogo riporta tutti i 16 valori `oklch()` trovati nel codice sorgente, pronti per la conversione in hex. I valori hex e le verifiche contrasto devono essere compilati prima del commit.

### 6.1 Colori template budget — da `src/lib/budget-templates.ts`

| Token centrale              | Template id     | Valore oklch originale  | Hex convertito | Contrasto su bianco | Contrasto su scuro | WCAG AA | Note                  |
|-----------------------------|-----------------|-------------------------|----------------|---------------------|--------------------|---------|-----------------------|
| `budget.groceries`          | spesa-mensile   | `oklch(0.65 0.15 140)`  | da compilare   | da verificare       | da verificare      | —       | Verde medio           |
| `budget.dining`             | ristoranti      | `oklch(0.70 0.15 45)`   | da compilare   | da verificare       | da verificare      | —       | Arancio caldo         |
| `budget.transport`          | trasporti       | `oklch(0.60 0.15 230)`  | da compilare   | da verificare       | da verificare      | —       | Blu medio             |
| `budget.housing`            | casa            | `oklch(0.55 0.12 30)`   | da compilare   | da verificare       | da verificare      | —       | Marrone caldo         |
| `budget.entertainment`      | svago           | `oklch(0.68 0.18 300)`  | da compilare   | da verificare       | da verificare      | —       | Viola medio           |
| `budget.health`             | salute          | `oklch(0.65 0.15 25)`   | da compilare   | da verificare       | da verificare      | —       | Arancio rosato        |
| `budget.subscriptions`      | abbonamenti     | `oklch(0.58 0.15 280)`  | da compilare   | da verificare       | da verificare      | —       | Viola scuro           |
| `budget.clothing`           | abbigliamento   | `oklch(0.62 0.12 320)`  | da compilare   | da verificare       | da verificare      | —       | Rosa medio            |
| `budget.education`          | istruzione      | `oklch(0.55 0.15 250)`  | da compilare   | da verificare       | da verificare      | —       | Blu viola             |
| `budget.pets`               | animali         | `oklch(0.70 0.14 60)`   | da compilare   | da verificare       | da verificare      | —       | Giallo caldo          |
| `budget.overallBudget`      | budget-totale   | `oklch(0.35 0.08 250)`  | da compilare   | da verificare       | da verificare      | —       | Blu scuro — coincide con banking |

### 6.2 Colori categorie conto — da `src/lib/constants.ts`

| Token centrale                  | Categoria id | Valore oklch originale  | Hex convertito | Contrasto su bianco | Contrasto su scuro | WCAG AA | Note                  |
|---------------------------------|--------------|-------------------------|----------------|---------------------|--------------------|---------|-----------------------|
| `accountCategory.banking`       | banking      | `oklch(0.35 0.08 250)`  | da compilare   | da verificare       | da verificare      | —       | Blu scuro — coincide con overallBudget |
| `accountCategory.digital`       | digital      | `oklch(0.65 0.15 190)`  | da compilare   | da verificare       | da verificare      | —       | Verde acqua           |
| `accountCategory.savings`       | savings      | `oklch(0.75 0.12 85)`   | da compilare   | da verificare       | da verificare      | —       | Giallo verde chiaro   |
| `accountCategory.investments`   | investments  | `oklch(0.55 0.18 140)`  | da compilare   | da verificare       | da verificare      | —       | Verde scuro           |
| `accountCategory.private`       | private      | `oklch(0.55 0.15 25)`   | da compilare   | da verificare       | da verificare      | —       | Arancio scuro         |

***

## 7. Modifiche ai file esistenti

### 7.1 File da creare

```
src/lib/design-tokens/colors.ts
```

### 7.2 File da modificare

**`src/lib/budget-templates.ts`**

Prima:
```typescript
import {
  ShoppingCart, ForkKnife, Car, House, FilmSlate,
  Heartbeat, GraduationCap, PawPrint, TShirt, DeviceMobile,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

export interface BudgetTemplate {
  id: string;
  nome: string;
  descrizione: string;
  importoSuggerito: number;
  periodo: BudgetPeriod;
  categorieTarget: string[];
  icon: Icon;
  color: string;
}
```

Dopo:
```typescript
import { BudgetPeriod } from './types';
import { DESIGN_COLORS } from './design-tokens/colors';
import type { BudgetTemplateIconKey } from './design-tokens/colors';

export interface BudgetTemplate {
  id: string;
  nome: string;
  descrizione: string;
  importoSuggerito: number;
  periodo: BudgetPeriod;
  categorieTarget: string[];
  iconKey: BudgetTemplateIconKey;
  color: string;
}
```

Esempio di template aggiornato:
```typescript
{
  id: 'spesa-mensile',
  nome: 'Spesa Alimentare',
  descrizione: 'Budget mensile per supermercato e alimentari',
  importoSuggerito: 400,
  periodo: 'mensile',
  categorieTarget: ['Spesa alimentare'],
  iconKey: 'groceries',
  color: DESIGN_COLORS.budget.groceries,
},
```

Esempio del template `budget-totale` aggiornato:
```typescript
{
  id: 'budget-totale',
  nome: 'Budget Totale Mensile',
  descrizione: 'Budget complessivo per tutte le spese del mese',
  importoSuggerito: 2000,
  periodo: 'mensile',
  categorieTarget: [],
  iconKey: 'overall-budget',
  color: DESIGN_COLORS.budget.overallBudget,
},
```

**`src/lib/constants.ts`**

Prima:
```typescript
color: 'oklch(0.35 0.08 250)',
```

Dopo:
```typescript
import { DESIGN_COLORS } from './design-tokens/colors';

// ...nella definizione di ACCOUNT_CATEGORIES:
color: DESIGN_COLORS.accountCategory.banking,
```

Lo stesso pattern si applica a tutte e 5 le categorie.

**`package.json` e `package-lock.json`**

La dipendenza `@phosphor-icons/react` deve essere rimossa dopo la modifica di `budget-templates.ts`. Verificare con grep globale che non sia importata in nessun altro file prima della rimozione.

### 7.3 File da non modificare ora

```
src/components/
src/screens/
src/locales/it.ts
```

Motivo: non esistono ancora componenti UI reali che renderizzano icone comunicative o interattive. Le label accessibili delle icone verranno aggiunte quando nascerà la UI.

***

## 8. Regole per l'accessibilità futura delle icone

Queste regole non generano lavoro immediato. Sono documentate qui perché il DESIGN 020 è il luogo corretto dove tenerle come riferimento per la fase UI.

Se l'icona è decorativa ed è affiancata da testo visibile, la UI futura la nasconderà allo screen reader tramite `accessibilityElementsHidden` (iOS) o `importantForAccessibility="no"` (Android/Windows).

Se l'icona è comunicativa o interattiva senza testo affiancato, la UI futura userà una label localizzata proveniente da `src/locales/it.ts`. Nessuna label sarà hardcoded in lingua nel codice dei componenti.

Lo screen reader dovrà annunciare il contenuto semantico del template, non il nome dell'icona grafica. Esempio corretto: "Spesa Alimentare. Budget mensile per supermercato e alimentari." Esempio errato: "icona carrello della spesa."

***

## 9. Chiavi icone account — già conformi

Le icone degli account sono già definite come stringhe semantiche in `ACCOUNT_TYPE_ICONS` all'interno di `constants.ts`. Non richiedono modifica in questo DESIGN. Il pattern adottato è già corretto:

```typescript
export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  bancario:    'bank',
  prepagata:   'credit-card',
  contanti:    'money',
  salvadanaio: 'piggy-bank',
  privato:     'lock',
  investimenti:'trend-up',
  credito:     'credit-card',
  paypal:      'wallet',
  crypto:      'currency-btc',
  pensione:    'coins',
};
```

Le chiavi dei template budget seguiranno lo stesso stile.

***

## 10. Test obbligatori

I seguenti test devono essere eseguiti e superati prima di considerare il DESIGN 020 completato.

1. Grep globale su `src/`: nessun import residuo da `@phosphor-icons/react`.
2. Grep globale su `src/`: nessun valore `oklch(` residuo nel codice sorgente.
3. Grep globale su `src/`: nessun valore hex hardcoded fuori da `src/lib/design-tokens/colors.ts`.
4. `package.json`: la dipendenza `@phosphor-icons/react` è assente.
5. TypeScript: `BudgetTemplate` usa `iconKey: BudgetTemplateIconKey` e compila senza errori.
6. TypeScript: `budget-templates.ts` e `constants.ts` importano i colori da `design-tokens/colors.ts`.
7. Suite di test unitari esistenti: tutti verdi.
8. Build Windows: da eseguire quando il blocker DT-009-N-01 sarà risolto.
9. Build Android: da eseguire quando l'ambiente Android sarà configurato.

I test visivi e screen reader sulle icone sono rinviati alla fase UI, perché oggi non esistono icone renderizzate in componenti.

***

## 11. Debiti tecnici aperti

**DT-020-01 — Scelta futura libreria icone**
La libreria icone verrà scelta solo quando esisterà una UI reale. Dovrà supportare Windows, Android e iOS. La scelta sarà documentata in un DESIGN dedicato.

**DT-020-02 — Componente AppIcon accessibile**
In fase UI verrà creato un componente `AppIcon` centralizzato che riceve `iconKey` e gestisce accessibilità e mapping verso la libreria scelta. Nessun componente applicativo importerà direttamente la libreria icone.

**DT-020-03 — Script lint: no oklch nel codice sorgente**
Aggiungere uno script o regola lint che fallisce se trova `oklch(` nel codice sorgente di `src/`. Questo impedisce regressioni future.

**DT-020-04 — Script lint: no Phosphor nel codice sorgente**
Aggiungere uno script o regola lint che fallisce se trova `@phosphor-icons/react` nel codice sorgente di `src/`. Questo impedisce regressioni future.

**DT-020-05 — Validazione contrasto colori**
I token hex convertiti devono essere verificati con soglie WCAG AA nei contesti reali di utilizzo, sia su sfondo chiaro che su sfondo scuro. La Sezione 6 contiene la griglia pronta per essere compilata.

***

## 12. Precondizioni prima di iniziare la codifica

Prima di aprire qualsiasi file di codice, verificare che tutte le precondizioni seguenti siano soddisfatte.

**P-020-01** — I 16 valori oklch della Sezione 6 sono stati convertiti in hex con strumento verificato.
**P-020-02** — I valori hex convertiti sono stati controllati per contrasto WCAG AA nei contesti di utilizzo.
**P-020-03** — La coincidenza di valore tra `budget.overallBudget` e `accountCategory.banking` è stata valutata consapevolmente e documentata nella Sezione 6.
**P-020-04** — È stata verificata la lista completa dei file che importano `budget-templates.ts` o `constants.ts`, per valutare l'impatto della modifica del campo `icon` → `iconKey`.

***

## 13. Ordine consigliato di esecuzione

1. Convertire i 16 valori oklch in hex e compilare la Sezione 6.
2. Creare la cartella `src/lib/design-tokens/` e il file `colors.ts` con tutti i token.
3. Aggiungere l'export di `BudgetTemplateIconKey` in `colors.ts`.
4. Modificare l'interfaccia `BudgetTemplate` in `budget-templates.ts`: rimuovere `icon: Icon`, aggiungere `iconKey: BudgetTemplateIconKey`.
5. Aggiornare tutti gli 11 oggetti in `BUDGET_TEMPLATES`: sostituire `icon: ComponentePhosphor` con `iconKey: 'chiave-semantica'` e `color: 'oklch(...)'` con `color: DESIGN_COLORS.budget.nomeToken`.
6. Rimuovere tutti gli import da `@phosphor-icons/react` in `budget-templates.ts`.
7. Aggiornare `constants.ts`: sostituire i 5 valori `oklch()` con `DESIGN_COLORS.accountCategory.nomeToken`.
8. Verificare con grep che nessun file importi ancora `@phosphor-icons/react`.
9. Rimuovere `@phosphor-icons/react` da `package.json` e aggiornare `package-lock.json`.
10. Eseguire tutti i test della Sezione 10.

***

## 14. Dichiarazione di completamento

Il DESIGN 020 è considerato completato quando:

- Tutti i test della Sezione 10 sono superati.
- La Sezione 6 è completamente compilata con valori hex verificati.
- Nessun valore `oklch()` è presente nel codice sorgente.
- Nessun import da `@phosphor-icons/react` è presente nel codice sorgente.
- Il CHANGELOG.md è aggiornato con la release corrispondente.