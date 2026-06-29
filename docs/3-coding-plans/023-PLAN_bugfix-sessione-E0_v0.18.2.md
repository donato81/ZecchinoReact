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
  In `runOnlineBootstrap` e nella funzione interna `reloadData` di `refreshAll`, prima di chiamare `applyDomainSnapshot`, dobbiamo recuperare le simulazioni locali presenti nella cache e fonderle nello snapshot remoto:
  ```ts
  let mergedPrestiti = [...(snapshot.prestiti || [])];
  try {
    const cachedSimulazioni = await readCache<PrestitoMutuo[]>(
      userId,
      'prestiti_simulazioni',
    );
    if (gen !== hydrationGen.current) return; // verifica hydrationGen prima di procedere
    if (cachedSimulazioni && Array.isArray(cachedSimulazioni.data)) {
      const simulazioni = cachedSimulazioni.data.filter(
        p => p.stato === 'simulazione' || p.id.startsWith('sim-'),
      );
      const remoteIds = new Set(mergedPrestiti.map(p => p.id));
      const uniqueSimulazioni = simulazioni.filter(p => !remoteIds.has(p.id));
      mergedPrestiti = [...mergedPrestiti, ...uniqueSimulazioni];
    }
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
- **Regression test atteso:**
  In `__tests__/AppDataContext.spec.ts`, creare un test che:
  - Mocki `loadDomainSnapshot` per restituire prestiti dal DB remoto (senza simulazioni).
  - Mocki `readCache` per la tabella `prestiti_simulazioni` per restituire almeno una simulazione con id `sim-1`.
  - Esegua `runOnlineBootstrap` e verifichi che `applyDomainSnapshot` riceva lo snapshot con entrambi i prestiti remoti e le simulazioni locali fusi.

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

---

## 3. Aggiornamento Versione Target

Al termine della sessione di implementazione (Sessione E0), la versione del progetto in `package.json` deve essere aumentata da `0.18.0` a `0.18.2`. La versione `0.18.1` è già stata utilizzata nella documentazione della SESSIONE D.
