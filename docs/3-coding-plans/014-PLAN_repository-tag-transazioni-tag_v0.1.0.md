---
titolo: PLAN 014 - Repository Tag e Transazioni-Tag
versione: 0.1.0
data: 2026-05-28
stato: DRAFT
design_riferimento: docs/2-projects/014-DESIGN_repository-tag-transazioni-tag_v0.1.0.md
autore: Agent-Orchestrator
dipendenze: PLAN 013
---

# PLAN 014 - Repository Tag e Transazioni-Tag

## 1. Obiettivo del Piano

Introdurre i repository tag e transazioni-tag, i relativi tipi e l'integrazione applicativa per cache e AppDataContext, mantenendo invariata Transaction e garantendo atomicita tramite RPC idempotenti.

## 2. Perimetro (Scope)

File sorgente da creare o modificare:
- src/lib/supabase/types.ts
- src/lib/types.ts
- src/lib/supabase/cache.ts
- src/context/app-data-cache.ts
- src/lib/supabase/repositories/tag.ts
- src/lib/supabase/repositories/transazioni-tag.ts
- src/locales/it.ts
- src/context/AppDataContext.tsx
- __tests__/tag.repository.test.ts
- __tests__/transazioni-tag.repository.test.ts

Fuori perimetro:
- modificare l'interfaccia Transaction aggiungendo tags
- eseguire DELETE diretto in transazioni-tag.removeTag
- invalidare l'intera cache dopo modifica di un'associazione tag-transazione
- UI dedicate per CRUD tag o selezione tag nelle schermate [DA VERIFICARE]

## 3. Prerequisiti Bloccanti

- PLAN 013 completato e convalidato, come dipendenza dichiarata dal design 014.
- Verifica infrastrutturale obbligatoria: i file SQL per le tre RPC (`add_tag_to_transaction`, `set_transaction_tags`, `remove_tag_from_transaction`) devono essere creati in `docs/6-sql` e applicati sull'istanza Supabase di destinazione *prima* di avviare la codifica del T6. L'assenza o la mancata applicazione delle migrazioni è un blocco operativo per T6.
- Le funzioni PostgreSQL `add_tag_to_transaction`, `set_transaction_tags` e `remove_tag_from_transaction` devono esistere ed essere idempotenti; verificare accesso e permessi necessari per l'utente CI/developer che eseguirà i test di integrazione.

## 4. Architettura e Decisioni Chiave

- Decisione 1 - Transaction rimane invariata. Conseguenza pratica: i tag non entrano in Transaction e vivono in una struttura separata.
- Decisione 2 - transactionTagMap separato. Conseguenza pratica: aggiungere transactionTagMap a DomainSnapshot e caricarlo come sesta voce della cache pura.
- Decisione 3 - API ibrida di transazioni-tag basata solo su UUID. Conseguenza pratica: il repository espone getTagsForTransaction, setTagsForTransaction, addTag e removeTag senza oggetti arricchiti.
- Decisione 4 - Delete fisica consentita per tag.ts. Conseguenza pratica: tag.ts puo esporre remove() e affidarsi a ON DELETE CASCADE per i link.
- Decisione 5 - RPC obbligatoria per operazioni atomiche. Conseguenza pratica: addTag, setTagsForTransaction e removeTag devono passare da RPC idempotenti e non da mutazioni manuali concorrenti.
- Decisione 6 - Cache offline per tag e transazioni_tag. Conseguenza pratica: aggiungere entrambe le tabelle a CacheTable e CACHE_TABLES.
- Decisione 7 - Invalidazione cache selettiva. Conseguenza pratica: modificando le associazioni si invalida solo transazioni_tag.

## 5. Task Atomici

### T1
- Azione: Aggiungere DbTag e DbTransactionTag con campi snake_case del layer Supabase.
- File target: src/lib/supabase/types.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit compila i nuovi tipi DbTag e DbTransactionTag senza errori.
- Note operative: mantenere i tipi Db* confinati a src/lib/supabase/.

### T2
- Azione: Aggiungere l'interfaccia Tag e i campi applicativi necessari per transactionTagMap nel modello client.
- File target: src/lib/types.ts
- Dipende da: T1
- Metrica di successo: npx tsc --noEmit accetta Tag con campi id, nome, colore?, icona?, usatoNVolte senza modificare Transaction.
- Note operative: Transaction deve restare invariata come da Decisione 1.

### T3
- Azione: Estendere la cache offline aggiungendo tag e transazioni_tag a CacheTable e CACHE_TABLES.
- File target: src/lib/supabase/cache.ts
- Dipende da: nessuno
- Metrica di successo: i test o controlli di cache riconoscono tag e transazioni_tag come tabelle cacheabili.
- Note operative: non invalidare altre tabelle oltre quelle richieste dal design.

### T4
- Azione: Aggiungere transactionTagMap a DomainSnapshot e al caricamento readCachedDomainSnapshotPure come sesta voce.
- File target: src/context/app-data-cache.ts
- Dipende da: T2, T3
- Metrica di successo: npx tsc --noEmit e i test del caching accettano transactionTagMap nel DomainSnapshot senza alterare l'ordine richiesto.
- Note operative: rispettare l'ordine esplicito imposto dal design per la sesta voce.

### T5
- Azione: Creare il repository tag con getAll, getById, create, update e remove.
- File target: src/lib/supabase/repositories/tag.ts
- Dipende da: T1, T2
- Metrica di successo: npx jest __tests__/tag.repository.test.ts --runInBand copre il CRUD del repository tag con esito verde quando implementato.
- Note operative: remove e consentito perche lo schema usa ON DELETE CASCADE.

### T6
- Azione: Creare il repository transazioni-tag con API ibrida su UUID e chiamate RPC atomiche per set/add/remove.
- File target: src/lib/supabase/repositories/transazioni-tag.ts
- Dipende da: T1, T5
- Metrica di successo: npx jest __tests__/transazioni-tag.repository.test.ts --runInBand dimostra uso di RPC idempotenti e test di concorrenza addTag superati quando implementato.
- Note operative: removeTag deve usare remove_tag_from_transaction e non un DELETE diretto.

### T7
- Azione: Aggiungere le chiavi di localizzazione per errori e conferme dei tag.
- File target: src/locales/it.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non segnala chiavi mancanti per errors.tag e confirm.tag.
- Note operative: includere loadFailed, createFailed, updateFailed, deleteFailed, addToTransactionFailed, removeFromTransactionFailed, setFailed, created, updated, deleted.

### T8
- Azione: Integrare tags e transactionTagMap in AppDataContext con caricamento fail-soft, azioni CRUD/associazione, reset logout e writeCache.
- File target: src/context/AppDataContext.tsx
- Dipende da: T2, T4, T5, T6, T7
- Metrica di successo: npx tsc --noEmit e i test del context confermano che tags e transactionTagMap sono caricati, azzerati al logout e serializzati nella cache.
- Note operative: invalidare selettivamente transazioni_tag quando cambiano le associazioni.
- Note operative aggiuntive: transactionTagMap deve essere incluso nella pipeline writeCache per garantire la simmetria con readCachedDomainSnapshotPure. La serializzazione nella cache è obbligatoria, non opzionale.

### T9
- Azione: Creare la suite di test del repository tag.
- File target: __tests__/tag.repository.test.ts
- Dipende da: T1, T2, T5
- Metrica di successo: npx jest __tests__/tag.repository.test.ts --runInBand termina con exit code 0 quando il repository e implementato.
- Note operative: coprire CRUD e gestione errori.

### T10
- Azione: Creare la suite di test del repository transazioni-tag, inclusa la concorrenza su addTag.
- File target: __tests__/transazioni-tag.repository.test.ts
- Dipende da: T1, T5, T6
- Metrica di successo: npx jest __tests__/transazioni-tag.repository.test.ts --runInBand termina con exit code 0 quando il repository e implementato.
- Note operative: verificare UUID-only API, idempotenza RPC e invalidazione selettiva della cache.

## 6. Test Obbligatori

- File spec: __tests__/tag.repository.test.ts | Scenario: getAll restituisce tutti i tag dell'utente autenticato. | Tipo: unit
- File spec: __tests__/tag.repository.test.ts | Scenario: getById restituisce il tag richiesto quando presente. | Tipo: unit
- File spec: __tests__/tag.repository.test.ts | Scenario: create crea un tag con i campi opzionali colore e icona quando forniti. | Tipo: unit
- File spec: __tests__/tag.repository.test.ts | Scenario: update modifica parzialmente un tag esistente senza alterare i campi non presenti. | Tipo: unit
- File spec: __tests__/tag.repository.test.ts | Scenario: remove elimina fisicamente il tag e delega la rimozione dei link a ON DELETE CASCADE. | Tipo: unit
- File spec: __tests__/tag.repository.test.ts | Scenario: il repository tag propaga gli errori di lettura o scrittura con handling coerente. | Tipo: unit
- File spec: __tests__/transazioni-tag.repository.test.ts | Scenario: getTagsForTransaction restituisce gli id tag associati a una transazione. | Tipo: unit
- File spec: __tests__/transazioni-tag.repository.test.ts | Scenario: setTagsForTransaction usa la RPC set_transaction_tags e sostituisce l'insieme dei tag in modo idempotente. | Tipo: unit
- File spec: __tests__/transazioni-tag.repository.test.ts | Scenario: addTag usa la RPC add_tag_to_transaction e tratta input duplicati senza race condition osservabile. | Tipo: unit
- File spec: __tests__/transazioni-tag.repository.test.ts | Scenario: removeTag usa la RPC remove_tag_from_transaction e non esegue DELETE diretto. | Tipo: unit
- File spec: __tests__/transazioni-tag.repository.test.ts | Scenario: il test di concorrenza su addTag dimostra atomicita del contatore usatoNVolte. | Tipo: integration
- File spec: __tests__/AppDataContext.spec.ts | Scenario: AppDataContext carica tags e transactionTagMap in modalita fail-soft e invalida selettivamente transazioni_tag. | Tipo: integration

## 7. Gate di Chiusura

- G-014-1 | Verifica: i nuovi tipi e la cache offline compilano senza alterare Transaction. | Comando: npx tsc --noEmit | Stato iniziale: OPEN
- G-014-2 | Verifica: il CRUD di tag e coperto dalla suite dedicata. | Comando: npx jest __tests__/tag.repository.test.ts --runInBand | Stato iniziale: OPEN
- G-014-3 | Verifica: le RPC di transazioni-tag sono usate in modo idempotente e il test di concorrenza addTag passa. | Comando: npx jest __tests__/transazioni-tag.repository.test.ts --runInBand | Stato iniziale: OPEN
- G-014-4 | Verifica: transactionTagMap entra in DomainSnapshot come sesta voce e AppDataContext gestisce load fail-soft, reset e writeCache. | Comando: npx jest __tests__/AppDataContext.spec.ts --runInBand | Stato iniziale: OPEN
- G-014-5 | Verifica: removeTag usa remove_tag_from_transaction e non un DELETE diretto. | Comando: verifica manuale su src/lib/supabase/repositories/transazioni-tag.ts | Stato iniziale: OPEN
- G-014-6 | Verifica: l'invalidazione cache dopo mutazioni di associazione colpisce solo transazioni_tag. | Comando: verifica manuale su src/context/AppDataContext.tsx e src/lib/supabase/cache.ts | Stato iniziale: OPEN

## 8. Rollback

- src/lib/supabase/types.ts: ripristinare la versione precedente rimuovendo DbTag e DbTransactionTag.
- src/lib/types.ts: ripristinare la versione precedente rimuovendo Tag e ogni supporto applicativo collegato, lasciando Transaction invariata.
- src/lib/supabase/cache.ts: rimuovere tag e transazioni_tag dall'elenco cacheabile.
- src/context/app-data-cache.ts: ripristinare DomainSnapshot e il caricamento cache senza transactionTagMap.
- src/lib/supabase/repositories/tag.ts: eliminare il file se il repository non supera i gate.
- src/lib/supabase/repositories/transazioni-tag.ts: eliminare il file se le RPC o l'atomicita non superano i gate.
- src/locales/it.ts: rimuovere le chiavi errors.tag e confirm.tag aggiunte dal piano.
- src/context/AppDataContext.tsx: ripristinare stato, azioni, reset e writeCache allo stato pre-tag.
- __tests__/tag.repository.test.ts: eliminare la spec placeholder o implementata se il piano viene annullato.
- __tests__/transazioni-tag.repository.test.ts: eliminare la spec placeholder o implementata se il piano viene annullato.

## 9. Riferimenti

- docs/2-projects/014-DESIGN_repository-tag-transazioni-tag_v0.1.0.md
- docs/4-todo-lists/014-TODO_repository-tag-transazioni-tag_v0.1.0.md
- docs/3-coding-plans/013-PLAN_repository-ricorrenze_v0.1.0.md
- src/lib/supabase/types.ts
- src/lib/types.ts
- src/lib/supabase/cache.ts
- src/context/app-data-cache.ts
- src/lib/supabase/repositories/tag.ts
- src/lib/supabase/repositories/transazioni-tag.ts
- src/context/AppDataContext.tsx
- src/locales/it.ts
- __tests__/tag.repository.test.ts
- __tests__/transazioni-tag.repository.test.ts