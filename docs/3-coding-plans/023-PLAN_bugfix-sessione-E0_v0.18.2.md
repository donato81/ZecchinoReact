---
tipo: plan
titolo: Bugfix sessione E0
versione: 0.18.2
data: 2026-06-29
stato: APPROVED
perimetro: src/context/AppDataContext.tsx, src/announcements/_utils/t.ts, src/announcements/_utils/plurals.ts, src/announcements/budgets.ts, src/context/AuthContext.tsx, src/accessibility/detection.ts
ramo: main
---

# PLAN 023 — Bugfix sessione E0

## Riepilogo Esecutivo

Questo Coding Plan definisce la strategia chirurgica per correggere i 7 bug identificati nel report di analisi della copertura dei test completato nella SESSIONE D (`REPORT-analisi-copertura-test-completa_v1.0.0.md`).

- **Obiettivo della sessione:** Risolvere i 7 bug architetturali e logici identificati e implementare un regression test per ciascuno di essi, portando la versione target del progetto a `0.18.2`.
- **Numero di bug:** 7 (1 Critico, 1 Alto, 3 Medi, 2 Bassi).
- **File coinvolti:**
  - `src/context/AppDataContext.tsx` (BUG-1, BUG-5)
  - `src/announcements/_utils/t.ts` (BUG-2)
  - `src/accessibility/detection.ts` (BUG-3)
  - `src/context/AuthContext.tsx` (BUG-4)
  - `src/announcements/_utils/plurals.ts` (BUG-6)
  - `src/announcements/budgets.ts` (BUG-7)
- **Regression test da scrivere:** 7 test specifici distribuiti nelle suite di test Jest corrispondenti ai file modificati.

> [!IMPORTANT]
> Nessun codice sorgente viene modificato in questa sessione. Questo documento descrive la pianificazione delle modifiche in modo che una sessione successiva possa implementarle senza ambiguità.

---

## 1. Dettaglio Bug per Bug

### BUG-1 — CRITICO — Perdita simulazioni locali al bootstrap online

- **Priorità:** CRITICO
- **File target:** [AppDataContext.tsx](file:///c:/Sviluppo/ZecchinoReact/src/context/AppDataContext.tsx)
- **Righe esatte:**
  - `loadDomainSnapshot`: righe ~421-458
  - `runOnlineBootstrap`: righe ~655-675
  - `applyDomainSnapshot`: righe ~618-632
- **Descrizione del problema:**
  Il bootstrap online recupera i dati solo da database remoto tramite `loadDomainSnapshot()`.
  La successiva chiamata ad `applyDomainSnapshot()` sovrascrive lo stato React azzerando le simulazioni locali (che iniziano con `sim-`).
  Infine, l'effetto di persistenza rileva lo stato modificato e cancella permanentemente la cache locale `prestiti_simulazioni`.
- **Codice corretto da implementare:**
  Estrarre la logica di fusione delle simulazioni in una funzione pura esportata separata, con questa firma:
  ```ts
  export function mergePrestitiWithLocalSimulations(
    remotePrestiti: PrestitoMutuo[],
    cachedSimulazioni: PrestitoMutuo[] | null | undefined,
  ): PrestitoMutuo[]
  ```
  Questa funzione deve essere l'unico punto dove avviene il filtro per `stato === 'simulazione'` o `id.startsWith('sim-')` e la deduplicazione per ID. Sia `runOnlineBootstrap` che `refreshAll` devono chiamare questa funzione, non duplicare la logica inline. Vietato duplicare questa sequenza in due punti separati del codice.

  In `runOnlineBootstrap` e nella funzione interna `reloadData` di `refreshAll`, prima di chiamare `applyDomainSnapshot`, dobbiamo recuperare le simulazioni locali presenti nella cache e fonderle nello snapshot remoto tramite la funzione centralizzata:
  ```ts
  let mergedPrestiti = [...(snapshot.prestiti || [])];
  try {
    const cachedSimulazioni = await readCache<PrestitoMutuo[]>(
      userId,
      'prestiti_simulazioni',
    );
    if (gen !== hydrationGen.current) return; // verifica hydrationGen prima di procedere
    mergedPrestiti = mergePrestitiWithLocalSimulations(
      snapshot.prestiti || [],
      cachedSimulazioni?.data,
    );
  } catch (cacheError) {
    console.warn('[AppDataContext] errore lettura simulazioni da cache', cacheError);
  }

  const mergedSnapshot: DomainSnapshot = {
    ...snapshot,
    prestiti: mergedPrestiti,
  };
  ```
- **Vincoli da rispettare:**
  - Caricare lo snapshot remoto completo.
  - Leggere dalla cache solo `prestiti_simulazioni`.
  - Filtrare esclusivamente elementi con `stato === 'simulazione'` oppure `id.startsWith('sim-')`.
  - Deduplificare rispetto agli ID dello snapshot remoto.
  - Chiamare `applyDomainSnapshot()` una sola volta con lo snapshot fuso.
  - Verificare `hydrationGen` prima dell'applicazione finale.
  - Non fare due chiamate consecutive ad `applyDomainSnapshot`.
  - Non sostituire mai l'intero snapshot remoto con la cache.
  - Se la lettura della cache `prestiti_simulazioni` fallisce (eccezione nel blocco try/catch), il bootstrap deve proseguire applicando lo snapshot remoto puro senza simulazioni locali. L'errore va registrato con `console.warn` ma non deve bloccare il bootstrap né portare lo stato dell'applicazione in ERROR.
- **Regression test atteso:**
  Il regression test di BUG-1 deve essere un test unitario su una funzione pura.
  Testare direttamente `mergePrestitiWithLocalSimulations` esportata.

  Casi da coprire:
  - lista remota con prestiti validi + cache con simulazioni distinte: verifica che il risultato li contenga tutti;
  - lista remota con un prestito e cache con un elemento con lo stesso ID: verifica che l'elemento non compaia due volte;
  - cache null o undefined: verifica che la funzione restituisca la sola lista remota senza errori;
  - cache con un elemento non simulazione (privo di prefisso sim- e stato diverso da simulazione): verifica che venga escluso dal risultato;
  - cache che genera un'eccezione al momento della lettura: verifica che il bootstrap continui con snapshot remoto puro.

  Non testare funzioni private non esportate. Non testare `runOnlineBootstrap` direttamente.

---

### BUG-2 — ALTO — Crash su chiave traduzione mancante

- **Priorità:** ALTO
- **File target:** [t.ts](file:///c:/Sviluppo/ZecchinoReact/src/announcements/_utils/t.ts)
- **Righe esatte:** righe ~11-16 (dentro la funzione `t`).
- **Descrizione del problema:**
  La funzione `t` accede a `strings[key]` per recuperare la traduzione.
  Se la chiave `key` non esiste nel file di traduzione, `result` sarà `undefined`.
  In presenza di parametri `params`, la chiamata `result.split(...)` provocherà un crash immediato dell'applicazione.
- **Codice corretto da implementare:**
  ```ts
  let result = strings[key];

  if (typeof result !== 'string') {
    return String(key);
  }

  if (!params) return result;
  ```
- **Vincoli da rispettare:**
  - Utilizzare la guardia `typeof result !== 'string'` anziché `!result` o `result === undefined`.
- **Regression test atteso:**
  In `__tests__/t.test.ts` (o suite equivalente), verificare:
  - Chiave esistente con parametri.
  - Chiave esistente senza parametri.
  - Chiave inesistente (deve restituire la chiave stessa come stringa, senza sollevare eccezioni).

---

### BUG-3 — MEDIO — Pattern fragile su subscription in detection.ts

- **Priorità:** MEDIO
- **File target:** [detection.ts](file:///c:/Sviluppo/ZecchinoReact/src/accessibility/detection.ts)
- **Righe esatte:** riga ~99 (all'interno del cleanup del `useEffect`).
- **Descrizione del problema:**
  Nel cleanup del hook `useAccessibilityDetection`, viene invocato `subscription.remove()`.
  L'esistenza della funzione `remove` è protetta dal controllo `typeof subscription.remove === 'function'`.
  Tuttavia, se `subscription` stessa è `null` o `undefined`, il controllo solleverà un `TypeError: Cannot read property 'remove' of undefined`.
- **Codice corretto da implementare:**
  ```ts
  if (subscription && typeof subscription.remove === 'function') {
    subscription.remove();
  }
  ```
- **Vincoli da rispettare:**
  - Includere la verifica di esistenza di `subscription` prima di testare il tipo del metodo `.remove`.
- **Regression test atteso:**
  In `src/accessibility/__tests__/detection.test.ts`, verificare che:
  - L'unmount del hook non provochi eccezioni qualora la sottoscrizione restituita da `AccessibilityInfo.addEventListener` sia `undefined` o `null`.

Analisi manual=false:
La funzione enableTalkBack(false) e disableTalkBack(false) modificano esclusivamente lo stato locale React senza scrivere l'override persistente. Questo comportamento è progettato intenzionalmente: il parametro manual=false serve a modifiche temporanee che possono essere sovrascritte in qualsiasi momento dal listener nativo screenReaderChanged o da una nuova lettura di AccessibilityInfo.isScreenReaderEnabled().

Non si tratta di un bug né di una doppia sottoscrizione. Il codice non crea nuove sottoscrizioni quando manual=false, perché l'effetto useEffect dipende da manualOverride e manual=false non modifica manualOverride.

Questa sessione E0 NON deve correggere il comportamento manual=false. Documenta solo il cleanup fragile della subscription (già pianificato sopra).

---

### BUG-4 — MEDIO — Pattern fragile su subscription in AuthContext

- **Priorità:** MEDIO
- **File target:** [AuthContext.tsx](file:///c:/Sviluppo/ZecchinoReact/src/context/AuthContext.tsx)
- **Righe esatte:** riga ~249 (all'interno del cleanup del `useEffect` dello screen reader).
- **Descrizione del problema:**
  Similmente a BUG-3, all'interno del cleanup del provider di autenticazione viene invocato `subscription.remove()`.
  Non è presente alcun controllo preventivo sull'esistenza dell'oggetto `subscription`.
  Se `subscription` è `undefined` o `null`, si verificherà un crash dell'applicazione all'unmount del provider.
- **Codice corretto da implementare:**
  ```ts
  if (subscription && typeof subscription.remove === 'function') {
    subscription.remove();
  }
  ```
- **Vincoli da rispettare:**
  - Applicare la stessa guardia difensiva descritta per BUG-3.
- **Regression test atteso:**
  In `__tests__/AuthContext.test.tsx` (o suite equivalente), verificare che:
  - L'unmount di `AuthProvider` non provochi eccezioni qualora la sottoscrizione restituita da `AccessibilityInfo.addEventListener` sia `undefined`.

---

### BUG-5 — MEDIO — hadTransactions fisso a true

- **Priorità:** MEDIO
- **File target:** [AppDataContext.tsx](file:///c:/Sviluppo/ZecchinoReact/src/context/AppDataContext.tsx)
- **Righe esatte:** riga ~1601 (in `handleDeleteConfirm`).
- **Descrizione del problema:**
  Durante l'eliminazione di un conto, viene vocalizzato l'annuncio tramite `announceAccountDeleted(account.nome, true)`.
  Il secondo parametro `hadTransactions` è cablato staticamente al valore booleano `true`.
  Questo causa una vocalizzazione errata che dichiara l'eliminazione del conto e di tutti i movimenti anche per conti privi di transazioni.
- **Codice corretto da implementare:**
  Calcolare dinamicamente la presenza di transazioni collegate al conto prima della rimozione dello stesso:
  ```ts
  const hadTransactions = transactions.some(
    t => t.contoId === deletingItem.id || t.contoDestinazioneId === deletingItem.id
  );
  ```
  Eseguire questo calcolo *prima* della riga `await removeAccount(deletingItem.id);`.
  Passare `hadTransactions` alla chiamata:
  ```ts
  announce(accountsAnn.announceAccountDeleted(account.nome, hadTransactions));
  ```
- **Vincoli da rispettare:**
  - Il calcolo deve essere effettuato prima dell'invocazione di `removeAccount()`.
- **Regression test atteso:**
  In `__tests__/AppDataContext.spec.ts`, testare due scenari:
  - Eliminazione di un conto avente transazioni collegate: deve chiamare `announceAccountDeleted` con il parametro `hadTransactions = true`.
  - Eliminazione di un conto senza transazioni collegate: deve chiamare `announceAccountDeleted` con il parametro `hadTransactions = false`.

---

### BUG-6 — BASSO — Perdita maiuscola nei plurali irregolari

- **Priorità:** BASSO
- **File target:** [plurals.ts](file:///c:/Sviluppo/ZecchinoReact/src/announcements/_utils/plurals.ts)
- **Righe esatte:** righe ~18-19 (in `pluralize`).
- **Descrizione del problema:**
  La funzione `pluralize` converte la parola in minuscolo prima di cercarla nel dizionario delle eccezioni irregolari.
  Se la parola originale iniziava con una maiuscola (es. "Movimento"), la ricerca in `IRREGULAR` restituisce la stringa interamente in minuscolo (es. "movimenti").
  In questo modo viene persa l'iniziale maiuscola originaria, creando discrepanze negli annunci vocali.
- **Codice corretto da implementare:**
  ```ts
  const wasCapitalized = word.length > 0 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
  const plural = IRREGULAR[lower];

  if (plural) {
    return wasCapitalized
      ? plural.charAt(0).toUpperCase() + plural.slice(1)
      : plural;
  }
  ```
- **Vincoli da rispettare:**
  - Preservare la capitalizzazione verificando se l'iniziale è una lettera maiuscola (`word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()`).
- **Regression test atteso:**
  In `__tests__/plurals.test.ts` (o suite equivalente), verificare:
  - Parola minuscola irregolare (es. "conto" -> "conti").
  - Parola maiuscola irregolare (es. "Conto" -> "Conti").
  - Parola regolare maiuscola (es. "Nota" -> "Note").
  - Parola non nel dizionario irregolare (es. "casa" -> "case").

---

### BUG-7 — BASSO — Budget con target zero annunciato come normale

- **Priorità:** BASSO
- **File target:** [budgets.ts](file:///c:/Sviluppo/ZecchinoReact/src/announcements/budgets.ts)
- **Righe esatte:** righe ~53-55 (in `announceBudgetStatus`).
- **Descrizione del problema:**
  Se un budget ha un `target` impostato a zero, la percentuale calcolata viene forzata a 0.
  Questo fa sì che la logica ignori il superamento del budget e restituisca `"budget normale, speso 0%"`.
  In questo modo l'utente non viene avvisato dello sforamento anche se le spese effettive sono superiori a zero (`spent > 0`).
- **Codice corretto da implementare:**
  All'inizio di `announceBudgetStatus`, aggiungere un ramo dedicato:
  ```ts
  if (target <= 0 && spent > 0) {
    return build(
      t('budget_superato', {
        name,
        spent: formatCurrencyVocal(spent),
        target: formatCurrencyVocal(target),
      }),
      'assertive',
    );
  }
  ```
- **Vincoli da rispettare:**
  - Intercettare esplicitamente la combinazione `target <= 0 && spent > 0` con priorità `'assertive'`.
- **Regression test atteso:**
  In `__tests__/budgets.test.ts` (o suite equivalente), verificare:
  - Target zero con spesa positiva (deve annunciare superato con priorità `assertive`).
  - Target zero con spesa zero (deve essere gestito come budget normale).
  - Target positivo normale.

---

## 2. Ordine di Esecuzione Consigliato

L'ordine di implementazione consigliato è impostato per iniziare dai moduli a logica pura e privi di dipendenze complesse, salendo gradualmente verso i contesti che governano lo stato dell'applicazione. Questo minimizza i rischi di interferenze e regressioni:

1. **BUG-2** (Traduzioni `t.ts` — logica pura)
2. **BUG-6** (Plurali `plurals.ts` — logica pura)
3. **BUG-7** (Budget `budgets.ts` — logica pura)
4. **BUG-4** (Cleanup `AuthContext.tsx` — semplice lifecycle)
5. **BUG-3** (Cleanup `detection.ts` — semplice lifecycle)
6. **BUG-5** (Conto eliminato in `AppDataContext.tsx` — calcolo stato)
7. **BUG-1** (Persistenza simulazioni in `AppDataContext.tsx` — ciclo di vita asincrono del bootstrap)

## 4. Validazione e Cicli di Convergenza

Per ogni bug, nell'ordine di esecuzione indicato nella sezione precedente, la sessione di implementazione deve seguire questo ciclo obbligatorio:

1. Implementare la correzione del codice.
2. Implementare o aggiornare il regression test specifico del bug.
3. Eseguire il regression test specifico con npx jest --testPathPattern=<file>.
4. Se il test fallisce, correggere e ripetere dal punto 1.
5. Massimo 10 tentativi per bug.
6. Se dopo 10 tentativi il test non passa, fermarsi immediatamente su quel bug e produrre un Diagnostic Report prima di procedere al bug successivo.

Il Diagnostic Report deve contenere:
- ID del bug bloccato;
- comando eseguito e output completo dell'errore;
- stack trace se disponibile;
- lista dei file modificati;
- elenco delle ipotesi già tentate;
- diff sintetico delle modifiche effettuate;
- richiesta esplicita di intervento del Consiglio AI.

La verifica finale globale con npx jest e npx tsc --noEmit rimane obbligatoria, ma avviene solo dopo che tutti i cicli locali sono stati completati.

---

## 5. Aggiornamento Versione Target

Al termine della sessione di implementazione (Sessione E0), la versione del progetto in `package.json` deve essere aumentata da `0.18.0` a `0.18.2`. La versione `0.18.1` è già stata utilizzata nella documentazione della SESSIONE D.
