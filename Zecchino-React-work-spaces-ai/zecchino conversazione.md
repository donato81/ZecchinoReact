Eccolo.



\---



\## Riepilogo completo delle decisioni architetturali



\---



\### Decisione 1 — Separazione motore / linguaggio



Il sistema di annunci è diviso in due responsabilità distinte e non sovrapponibili. Una parte sa \*\*come annunciare\*\* — conosce le piattaforme e le API di React Native. Una parte sa \*\*cosa annunciare\*\* — conosce il dominio e costruisce le frasi. Queste due parti non si mescolano mai.



\---



\### Decisione 2 — Il motore è cieco sul dominio



Il layer che annuncia non prende decisioni applicative. Non sa cosa è un conto, un budget, un timeout. Risponde solo a domande tecniche sulla piattaforma. Le decisioni applicative — come il timeout doppio con screen reader attivo — appartengono al dominio, che chiede allo stato di accessibilità le informazioni che gli servono e poi decide da solo.



\---



\### Decisione 3 — Il composer è centralizzato



Esiste un posto solo nell'app che sa costruire tutte le frasi. Il dominio non costruisce frasi da solo. Chiama sempre questo layer centralizzato, ottiene la frase già pronta, e la passa al motore.



\---



\### Decisione 4 — Il composer legge da locales



Il layer che costruisce le frasi non ha stringhe scritte al suo interno. Le legge sempre da `src/locales/`. Se un giorno cambia la lingua, si tocca solo `locales/` — il composer non cambia.



\---



\### Decisione 5 — Il composer vive in `src/announcements/`



Il layer centralizzato degli annunci ha una cartella dedicata — `src/announcements/` — perché è abbastanza importante da meritare il suo spazio e destinato a crescere in più file organizzati per area funzionale.



\---



\### Decisione 6 — Il rilevamento è separato dal motore



Il rilevamento dello stato della piattaforma — screen reader attivo, reduced motion, timeout consigliati — vive in `src/accessibility/detection.ts`, separato da `src/accessibility/engine.ts`. Il motore annuncia, il detection osserva. Sono due responsabilità distinte perché oggi pensiamo solo agli screen reader, ma domani arriveranno reduced motion, contrasto elevato, font scaling — e non devono sporcare il motore.



\---



\### Decisione 7 — Il composer restituisce un oggetto Announcement, non una stringa



Ogni funzione di `announcements/` restituisce un oggetto strutturato con `text` e `priority`, non una stringa nuda. La priorità — assertive o polite — è una decisione del composer, non del dominio. Il dominio sa cosa è successo, il composer sa con quale urgenza comunicarlo.



\---



\### Decisione 8 — Il dominio non gestisce priorità



Il dominio chiama `announcements/`, riceve un oggetto `Announcement` già completo, e lo passa al motore. Non decide mai se qualcosa è urgente o informativo — questa è responsabilità del composer.



\---



\### Decisione 9 — `announcements/` è organizzato per area funzionale



La cartella contiene file separati per area, non un unico file gigante:



\- `types.ts` — definisce `Announcement` e `AnnouncementPriority`

\- `ui.ts` — annunci di interfaccia: navigazione, dialoghi, errori generici

\- `auth.ts` — annunci legati ad autenticazione e sessione

\- `accounts.ts` — annunci legati ai conti

\- `budgets.ts` — annunci legati a budget e obiettivi

\- `index.ts` — unico punto di accesso pubblico



\---



\### Decisione 10 — `index.ts` è l'unico punto di import pubblico



Nessun file dell'app importa direttamente da un file interno di `announcements/`. Si importa sempre e solo da `@/announcements`. Stessa regola già applicata a `locales/`. Questo protegge da rotture durante i refactor futuri.



\---



\### Decisione 11 — La regola del punto di accesso unico è un'invariante globale



Si applica a tutti e tre i sistemi senza eccezioni:



\- `locales/index.ts` — nessuno importa `it.ts` direttamente

\- `announcements/index.ts` — nessuno importa i file interni direttamente

\- Il dominio non chiama `engine.ts` direttamente — passa sempre da `announcements/`



\---



\### Struttura finale



```

src/

&#x20; accessibility/

&#x20;   engine.ts

&#x20;   detection.ts



&#x20; announcements/

&#x20;   types.ts

&#x20;   ui.ts

&#x20;   auth.ts

&#x20;   accounts.ts

&#x20;   budgets.ts

&#x20;   index.ts



&#x20; locales/

&#x20;   it.ts

&#x20;   index.ts

```



\---



\### Impatto sui documenti esistenti



I documenti 001 e 002 restano validi nella sostanza — rimettono in piedi l'app. Cambia un solo punto: i placeholder `console.warn` lasciati aperti dal 002 in `AuthContext` e `AppDataContext` non verranno sostituiti con chiamate dirette al motore, ma con chiamate a `announcements/`, che poi chiama il motore.



Il documento 003 viene riscritto con scope ridotto e pulito: costruisce solo `src/accessibility/engine.ts`, `src/accessibility/detection.ts`, e l'infrastruttura minima di `src/locales/`. Non tocca `AppDataContext`. Lascia `announcements/` al documento successivo.



\---



La memoria è coerente dall'inizio alla fine. Possiamo procedere con il prompt per l'agente analista.

