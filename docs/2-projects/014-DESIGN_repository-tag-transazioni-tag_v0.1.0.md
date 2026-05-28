---
Titolo: DESIGN 014 — Repository Tag e Transazioni-Tag
Versione: 0.1.0
Data: 2026-05-28
Stato: APPROVATO E VALIDATO
Prerequisiti: DESIGN 013 approvato
DebitiTecniciOriginati: nessuno
---

# DESIGN 014 — Repository Tag e Transazioni-Tag

Sezione 1 — Intestazione e metadati
- Titolo: DESIGN 014 — Repository Tag e Transazioni-Tag
- Versione: 0.1.0
- Data: 2026-05-28
- Stato: APPROVATO E VALIDATO
- Prerequisiti: DESIGN 013 approvato
- Debiti tecnici originati: nessuno da questo design

Sezione 2 — Obiettivo
Introdurre la gestione dei tag associabili alle transazioni. Il design
introduce due repository separati: `tag.ts` per le operazioni sulle etichette
e `transazioni-tag.ts` per la gestione delle associazioni tra tag e transazioni.

Sezione 3 — Decisioni architetturali specifiche

- Nessuna stringa visibile all'utente o annunciata dallo
  screen reader può essere scritta direttamente nel codice.
  Ogni testo passa obbligatoriamente da src/locales/it.ts.
  Senza eccezioni.

Decisione 1 — `Transaction` rimane invariata.
 - L'interfaccia `Transaction` non viene modificata; non si aggiunge `tags`.

Decisione 2 — `transactionTagMap`.
 - I tag delle transazioni vivono in una struttura separata `transactionTagMap: Record<string,string[]>`.
 - Va aggiunta a `DomainSnapshot` e caricata come sesta voce in `readCachedDomainSnapshotPure()`.

Decisione 3 — API ibrida `transazioni-tag.ts`.
 - Funzioni pubbliche: `getTagsForTransaction(transactionId)`, `setTagsForTransaction(transactionId, tagIds[])`,
   `addTag(transactionId, tagId)`, `removeTag(transactionId, tagId)`.
 - Il repository lavora solo con UUID.

Decisione 4 — Delete fisica consentita per `tag.ts`.
 - Lo schema ha `ON DELETE CASCADE` su `transazioni_tag`; eliminare un tag cancella i suoi link.

Decisione 5 — RPC obbligatoria per operazioni atomiche.
 - Funzioni PostgreSQL richieste: `add_tag_to_transaction(p_transaction_id UUID, p_tag_id UUID)`,
   `set_transaction_tags(p_transaction_id UUID, p_tag_ids UUID[])` e
   `remove_tag_from_transaction(p_transaction_id UUID, p_tag_id UUID)`.
   Devono essere idempotenti. Il decremento del contatore `usatoNVolte` avviene
   dentro la funzione per garantire atomicità e assenza di race condition.

Decisione 6 — Cache offline per `transazioni_tag`.
 - Aggiungere `tag` e `transazioni_tag` a `CacheTable` e a `CACHE_TABLES`.

Decisione 7 — Invalidazione cache selettiva.
 - Invalida solo `transazioni_tag` quando si modifica l'associazione, non l'intera cache.

Sezione 4 — File da modificare
- `src/lib/supabase/types.ts` — aggiungere `DbTag` e `DbTransactionTag`.
- `src/lib/types.ts` — aggiungere interfaccia `Tag` con campi: `id`, `nome`, `colore?`, `icona?`, `usatoNVolte`.
- `src/lib/supabase/cache.ts` — aggiungere `tag` e `transazioni_tag`.
- `src/context/app-data-cache.ts` — aggiungere `transactionTagMap`.
- `src/context/AppDataContext.tsx` — aggiungere `tags` e `transactionTagMap`, caricamento fail-soft,
  azioni `addTag/updateTag/removeTag/addTagToTransaction/removeTagFromTransaction/setTagsForTransaction`, reset al logout, pipeline `writeCache`.
- `src/locales/it.ts` — aggiungere le seguenti chiavi:
  - errors.tag.loadFailed
  - errors.tag.createFailed
  - errors.tag.updateFailed
  - errors.tag.deleteFailed
  - errors.tag.addToTransactionFailed
  - errors.tag.removeFromTransactionFailed
  - errors.tag.setFailed
  - confirm.tag.created
  - confirm.tag.updated
  - confirm.tag.deleted

Sezione 5 — File da creare
- `src/lib/supabase/repositories/tag.ts` — funzioni: `getAll`, `getById`, `create`, `update`, `remove`.
-- `src/lib/supabase/repositories/transazioni-tag.ts` — funzioni: `getTagsForTransaction`,
  `setTagsForTransaction`, `addTag`, `removeTag`.
  La funzione `removeTag` deve richiamare la RPC `remove_tag_from_transaction`
  e non eseguire un DELETE diretto per garantire atomicità del contatore.
- `__tests__/tag.repository.test.ts` e `__tests__/transazioni-tag.repository.test.ts` (test concorrenza `addTag`).

Sezione 6 — Rischi residui
R1 — Crescita cache proporzionale alle transazioni taggate (>1000 movimenti da monitorare).
R2 — Complessità RPC.
R3 — Invalidazione cache selettiva da presidiare.
