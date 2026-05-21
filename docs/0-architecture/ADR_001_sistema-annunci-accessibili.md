```markdown
---
tipo: architecture-decision-record
titolo: Sistema di annunci accessibili — separazione delle responsabilità
id: ADR_001
versione: 1.3.0
data: 2026-05-21
stato: APPROVATO
sostituisce: —
superseded-by: —
---

# ADR_001 — Sistema di annunci accessibili

## Contesto

Durante la revisione del documento di design 003 è emerso che il sistema
di screen reader esistente stava assumendo responsabilità che non gli
appartenevano. Il file `src/lib/screen-reader.ts` conteneva al suo interno
logica di dominio finanziario, costruzione di frasi, grammatica, tono
editoriale, rilevamento della piattaforma e chiamate alle API di React
Native — tutto mescolato insieme.

Questo produceva un sistema fragile, difficile da mantenere e impossibile
da localizzare in modo pulito. La decisione di riscrivere il sistema in
occasione della migrazione da web a React Native è il momento giusto per
correggere questa struttura alla radice.

---

## Decisione

Il sistema di annunci accessibili è diviso in layer con responsabilità
separate e non sovrapponibili. Ogni layer conosce solo ciò che deve
conoscere e ignora il resto.

---

## Struttura

```
src/
  accessibility/
    types.ts       ← tipi condivisi tra engine e detection
    engine.ts      ← annuncia
    detection.ts   ← osserva

  announcements/
    types.ts       ← tipo Announcement e AnnouncementPriority
    ui.ts          ← annunci di interfaccia: navigazione, dialoghi, errori generici
    auth.ts        ← annunci legati ad autenticazione e sessione
    accounts.ts    ← annunci legati ai conti
    budgets.ts     ← annunci legati a budget e obiettivi di risparmio
    index.ts       ← unico punto di accesso pubblico

  locales/
    it.ts          ← stringhe italiane
    index.ts       ← unico punto di accesso pubblico
```

---

## Responsabilità per layer

### `accessibility/engine.ts`
Annuncia testo già pronto. Conosce le API di React Native. Non conosce
il dominio, non costruisce frasi, non prende decisioni applicative.
Riceve un oggetto `Announcement` e lo pronuncia. Non sa niente di conti,
budget, autenticazione o timeout.

### `accessibility/detection.ts`
Osserva lo stato della piattaforma. Rileva se uno screen reader è attivo,
se reduced motion è abilitato, quali timeout sono consigliati, le
dimensioni dei touch target. Risponde a domande tecniche sulla piattaforma.
Non annuncia nulla, non prende decisioni applicative.

### `accessibility/types.ts`
Contiene i tipi condivisi tra `engine.ts` e `detection.ts`. Evita che i
due file ridefiniscano tipi comuni separatamente nel tempo.

### `announcements/`
Costruisce oggetti `Announcement` leggendo le stringhe da `src/locales/`.
Conosce il dominio applicativo e decide la priorità di ogni annuncio
seguendo i criteri definiti nella sezione dedicata.
Non importa mai da `src/accessibility/` — con la sola eccezione di
`announcements/index.ts` che importa `engine` per esporre la funzione
`announce()`.
Espone una funzione `announce()` che costruisce l'oggetto e chiama
il motore — è l'unico punto dove `engine` viene chiamato.

### `locales/`
Contiene le stringhe localizzate. È trasversale al sistema di annunci
ma non esclusivo — in futuro servirà anche alla UI. Il sistema di
annunci è il primo consumer, non l'unico.

---

## Tipo Announcement

Ogni funzione di `announcements/` restituisce un oggetto strutturato:

```ts
type AnnouncementPriority = 'polite' | 'assertive'

interface Announcement {
  text: string
  priority: AnnouncementPriority
}
```

La priorità è una decisione del layer `announcements/`, non del dominio
applicativo. Il dominio sa cosa è successo — il layer announcements sa
con quale urgenza comunicarlo.

---

## Criteri di priorità

Questi criteri sono il riferimento univoco per chiunque scriva un modulo
di `announcements/`. I casi specifici per ogni modulo vengono documentati
nel design del modulo corrispondente — non in questo documento.

**`polite`** — l'annuncio aspetta che lo screen reader finisca quello che
sta leggendo. Si usa per conferme di azioni riuscite, aggiornamenti
informativi, navigazione, stati non urgenti.

**`assertive`** — l'annuncio interrompe quello che lo screen reader sta
leggendo. Si usa per errori, avvisi critici, situazioni che richiedono
attenzione immediata.

**Criterio decisionale** — in caso di dubbio, la domanda da porsi è
questa: l'utente deve sapere questa cosa subito, interrompendo quello
che sta ascoltando? Se la risposta è sì, la priorità è `assertive`.
Se la risposta è no, la priorità è `polite`.

Ogni documento di design per i moduli di `announcements/` applica
questo criterio ai propri casi specifici e documenta le scelte fatte.

---

## Flusso obbligatorio

```
Dominio → announcements.announce(build...(data))
                    ↓
              engine.announce(announcement)

detection (risponde a domande, non partecipa al flusso di annuncio)
```

Il dominio chiama esclusivamente `announcements/index.ts`. Non conosce
`engine`, non costruisce frasi, non decide priorità.

`announcements/index.ts` espone una funzione `announce()` che:
1. riceve un oggetto `Announcement` già costruito da una funzione build
2. lo passa a `engine.announce()`

Questo è l'unico punto dell'app dove `engine` viene chiamato.
Il dominio non sa che `engine` esiste.

Esempio del pattern corretto:

```ts
// nel dominio applicativo
import { announce, accounts } from '@/announcements'

announce(accounts.accountDeleted(data))
```

```ts
// in announcements/index.ts
import { engine } from '@/accessibility/engine'

export function announce(announcement: Announcement): void {
  engine.announce(announcement)
}
```

---

## Regole di dipendenza — invarianti del progetto

Queste regole non hanno eccezioni. Qualsiasi violazione va corretta
prima di procedere con la codifica.

1. `announcements/` non importa mai da `accessibility/`
   Il layer che costruisce dati non conosce il layer che esegue effetti.
   La sola eccezione strutturale è `announcements/index.ts` che importa
   `engine` per esporre la funzione `announce()`.

   **Eccezione 1.bis (introdotta con DESIGN 003, formalizzata in ADR_001 v1.3.0):**
   `announcements/types.ts` può importare da `accessibility/types.ts`
   **esclusivamente** con la sintassi `import type` — mai import di valore.
   Questo import è consentito perché `announcements/types.ts` deve
   condividere la definizione di `Announcement` e `AnnouncementPriority`
   con il motore senza creare una dipendenza runtime sul layer
   `accessibility/`. L'eccezione è limitata al singolo file
   `announcements/types.ts`: ogni altro file di `announcements/`
   non può importare da `accessibility/` in nessuna forma, né come
   tipo né come valore.

2. Il dominio non chiama `engine.ts` direttamente
   Il dominio passa sempre da `announcements/index.ts`.

3. Il dominio non chiama `engine.announce()` direttamente
   Anche quando ha già un oggetto `Announcement` pronto, il dominio
   usa sempre `announce()` di `announcements/index.ts`.

4. Nessun file importa direttamente da file interni di `announcements/`
   Si importa sempre e solo da `@/announcements`.

5. Nessun file importa direttamente da `locales/it.ts`
   Si importa sempre e solo da `@/locales`.

6. `detection.ts` non annuncia nulla
   Il rilevamento dello stato non produce effetti vocali.

7. `engine.ts` non conosce il dominio
   Non esistono metodi come `announceAccountDeleted` o
   `announceBudgetStatus` nel motore. Quelli appartengono ad
   `announcements/`.

---

## Decisioni applicative adattive

Le decisioni che dipendono dallo stato della piattaforma — come il
timeout doppio quando uno screen reader è attivo — appartengono al
dominio applicativo. Il dominio interroga `detection.ts` per sapere
lo stato, poi decide da solo cosa farne. Né il motore né il layer
announcements prendono queste decisioni.

---

## Impatto sui documenti esistenti

| Documento | Impatto |
|-----------|---------|
| 001-DESIGN | Nessun impatto — fix blocchi di avvio, invariato |
| 002-DESIGN | Impatto minore — i placeholder `console.warn` aperti in `AuthContext` e `AppDataContext` verranno chiusi nel documento di design per `announcements/`, non nel 003 |
| 003-DESIGN | Riscritto con scope ridotto: costruisce solo `accessibility/` e l'infrastruttura minima di `locales/`. Introduce inoltre l'eccezione architetturale 1.bis (import type da `accessibility/types` in `announcements/types`), formalizzata in ADR_001 v1.3.0. |

---

## Aggiornamento di `architettura.md`

Il file `docs/architettura.md` viene aggiornato dopo la codifica di
ogni gruppo, non dopo la stesura dei design. Finché il codice non
esiste, `architettura.md` descrive il sistema precedente. Gli ADR
sono la fonte di verità durante la fase di design e codifica.

---

## Alternative scartate

**Mantenere tutto in `screen-reader.ts`**
Scartato. Il file stava diventando un layer applicativo completo —
conosceva il dominio, costruiva frasi, gestiva grammatica. Non
scalabile e non mantenibile.

**Un unico file `announcements.ts`**
Scartato. Il sistema è destinato a crescere con molte aree funzionali.
Un file unico sarebbe diventato ingestibile rapidamente.

**`announcements/` che importa da `accessibility/` ovunque**
Scartato. L'unico punto di contatto tra i due layer è la funzione
`announce()` in `announcements/index.ts`. Tutto il resto di
`announcements/` non conosce `accessibility/`.

**Il dominio chiama `engine` direttamente dopo aver ricevuto l'oggetto**
Scartato. Avrebbe creato una dipendenza diretta tra dominio e motore,
violando il principio che il dominio non sa che `engine` esiste.

**Criteri di priorità definiti caso per caso senza regola generale**
Scartato. Senza un criterio univoco ogni modulo avrebbe interpretato
la distinzione polite/assertive in modo arbitrario, producendo
comportamenti incoerenti tra le diverse aree dell'app.
```

---

## Storia del documento

| Versione | Data | Modifica |
|----------|------|----------|
| 1.0.0 | 2026-05-15 | Prima formalizzazione dell'ADR. |
| 1.2.0 | 2026-05-18 | Allineamento con DESIGN 003 v1.0.0 (scope ridotto). |
| 1.3.0 | 2026-05-21 | Aggiunta eccezione 1.bis: `announcements/types.ts` può importare `Announcement` e `AnnouncementPriority` da `accessibility/types.ts` esclusivamente come `import type`. Aggiornata Regola 1 e tabella "Impatto sui documenti esistenti" riga 003-DESIGN. Approvata con DESIGN 003 v1.0.0. |