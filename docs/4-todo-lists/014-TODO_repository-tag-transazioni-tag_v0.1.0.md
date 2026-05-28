---
titolo: TODO 014 - Repository Tag e Transazioni-Tag
versione: 0.1.0
data: 2026-05-28
stato: PENDING
piano_riferimento: docs/3-coding-plans/014-PLAN_repository-tag-transazioni-tag_v0.1.0.md
design_riferimento: docs/2-projects/014-DESIGN_repository-tag-transazioni-tag_v0.1.0.md
autore: Agent-Orchestrator
---

# TODO 014 - Repository Tag e Transazioni-Tag

## 1. Stato e Gate Bloccante

- Gate bloccante: PLAN 013 completato e convalidato.
- Verifica infrastrutturale obbligatoria: prima del T6 verificare che i file SQL per add_tag_to_transaction, set_transaction_tags e remove_tag_from_transaction esistano in docs/6-sql e siano stati applicati su Supabase.
- Stato corrente: PENDING

## 2. Stato Task (panoramica)

| ID task | Titolo | Stato | Note |
| --- | --- | --- | --- |
| T1 | Aggiungere DbTag e DbTransactionTag | TODO | Tipi DB in snake_case |
| T2 | Aggiungere interfaccia Tag | TODO | Transaction resta invariata |
| T3 | Estendere cache offline | TODO | tag e transazioni_tag |
| T4 | Aggiungere transactionTagMap al caching | TODO | Sesta voce di snapshot |
| T5 | Creare repository tag | TODO | CRUD con remove fisico |
| T6 | Creare repository transazioni-tag | TODO | RPC atomiche e UUID-only |
| T7 | Aggiungere chiavi locali tag | TODO | Errori e conferme |
| T8 | Integrare tag in AppDataContext | TODO | Fail-soft, reset, cache |
| T9 | Creare test repository tag | TODO | CRUD e error handling |
| T10 | Creare test repository transazioni-tag | TODO | RPC, concorrenza, invalidazione |

## 3. Task Atomici

### T1
- Azione: Aggiungere DbTag e DbTransactionTag con campi snake_case del layer Supabase.
- File target: src/lib/supabase/types.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit compila i nuovi tipi DbTag e DbTransactionTag senza errori.
- Task Status: [ ] TODO

### T2
- Azione: Aggiungere l'interfaccia Tag e i campi applicativi necessari per transactionTagMap nel modello client.
- File target: src/lib/types.ts
- Dipende da: T1
- Metrica di successo: npx tsc --noEmit accetta Tag con campi id, nome, colore?, icona?, usatoNVolte senza modificare Transaction.
- Task Status: [ ] TODO

### T3
- Azione: Estendere la cache offline aggiungendo tag e transazioni_tag a CacheTable e CACHE_TABLES.
- File target: src/lib/supabase/cache.ts
- Dipende da: nessuno
- Metrica di successo: i test o controlli di cache riconoscono tag e transazioni_tag come tabelle cacheabili.
- Task Status: [ ] TODO

### T4
- Azione: Aggiungere transactionTagMap a DomainSnapshot e al caricamento readCachedDomainSnapshotPure come sesta voce.
- File target: src/context/app-data-cache.ts
- Dipende da: T2, T3
- Metrica di successo: npx tsc --noEmit e i test del caching accettano transactionTagMap nel DomainSnapshot senza alterare l'ordine richiesto.
- Task Status: [ ] TODO

### T5
- Azione: Creare il repository tag con getAll, getById, create, update e remove.
- File target: src/lib/supabase/repositories/tag.ts
- Dipende da: T1, T2
- Metrica di successo: npx jest __tests__/tag.repository.test.ts --runInBand copre il CRUD del repository tag con esito verde quando implementato.
- Task Status: [ ] TODO

### T6
- Azione: Creare il repository transazioni-tag con API ibrida su UUID e chiamate RPC atomiche per set/add/remove.
- File target: src/lib/supabase/repositories/transazioni-tag.ts
- Dipende da: T1, T5
- Metrica di successo: npx jest __tests__/transazioni-tag.repository.test.ts --runInBand dimostra uso di RPC idempotenti e test di concorrenza addTag superati quando implementato.
- Task Status: [ ] TODO

### T7
- Azione: Aggiungere le chiavi di localizzazione per errori e conferme dei tag.
- File target: src/locales/it.ts
- Dipende da: nessuno
- Metrica di successo: npx tsc --noEmit non segnala chiavi mancanti per errors.tag e confirm.tag.
- Task Status: [ ] TODO

### T8
- Azione: Integrare tags e transactionTagMap in AppDataContext con caricamento fail-soft, azioni CRUD/associazione, reset logout e writeCache.
- File target: src/context/AppDataContext.tsx
- Dipende da: T2, T4, T5, T6, T7
- Metrica di successo: npx tsc --noEmit e i test del context confermano che tags e transactionTagMap sono caricati, azzerati al logout e serializzati nella cache.
- Task Status: [ ] TODO
- Note operative aggiuntive: transactionTagMap deve essere incluso nella pipeline writeCache per garantire la simmetria con readCachedDomainSnapshotPure.
- Note verifica infrastrutturale: prima di avviare T6 verificare che i file SQL per le RPC siano presenti in `docs/6-sql` e applicati sull'istanza Supabase di destinazione; questa verifica è obbligatoria e blocca l'avvio di T6 se non soddisfatta.

### T9
- Azione: Creare la suite di test del repository tag.
- File target: __tests__/tag.repository.test.ts
- Dipende da: T1, T2, T5
- Metrica di successo: npx jest __tests__/tag.repository.test.ts --runInBand termina con exit code 0 quando il repository e implementato.
- Task Status: [ ] TODO

### T10
- Azione: Creare la suite di test del repository transazioni-tag, inclusa la concorrenza su addTag.
- File target: __tests__/transazioni-tag.repository.test.ts
- Dipende da: T1, T5, T6
- Metrica di successo: npx jest __tests__/transazioni-tag.repository.test.ts --runInBand termina con exit code 0 quando il repository e implementato.
- Task Status: [ ] TODO

## 4. Note Operative

- Transaction deve restare invariata; i tag per transazione vivono in transactionTagMap.
- addTag, setTagsForTransaction e removeTag devono usare RPC idempotenti e non mutazioni dirette concorrenti.
- removeTag non puo eseguire DELETE diretto; deve passare da remove_tag_from_transaction.
- L'invalidazione della cache sulle associazioni deve colpire solo transazioni_tag.
- Non introdurre stringhe utente inline: tutte le chiavi passano da src/locales/it.ts.

## 5. Log di Validazione

| Data | Task ID | Validato Da | Risultato | Note |
| --- | --- | --- | --- | --- |

## 6. Gate di Chiusura

- G-014-1 | Verifica: i nuovi tipi e la cache offline compilano senza alterare Transaction. | Comando: npx tsc --noEmit | Gate Status: [ ] OPEN
- G-014-2 | Verifica: il CRUD di tag e coperto dalla suite dedicata. | Comando: npx jest __tests__/tag.repository.test.ts --runInBand | Gate Status: [ ] OPEN
- G-014-3 | Verifica: le RPC di transazioni-tag sono usate in modo idempotente e il test di concorrenza addTag passa. | Comando: npx jest __tests__/transazioni-tag.repository.test.ts --runInBand | Gate Status: [ ] OPEN
- G-014-4 | Verifica: transactionTagMap entra in DomainSnapshot come sesta voce e AppDataContext gestisce load fail-soft, reset e writeCache. | Comando: npx jest __tests__/AppDataContext.spec.ts --runInBand | Gate Status: [ ] OPEN
- G-014-5 | Verifica: removeTag usa remove_tag_from_transaction e non un DELETE diretto. | Comando: verifica manuale su src/lib/supabase/repositories/transazioni-tag.ts | Gate Status: [ ] OPEN
- G-014-6 | Verifica: l'invalidazione cache dopo mutazioni di associazione colpisce solo transazioni_tag. | Comando: verifica manuale su src/context/AppDataContext.tsx e src/lib/supabase/cache.ts | Gate Status: [ ] OPEN

## 7. Riferimenti

- docs/3-coding-plans/014-PLAN_repository-tag-transazioni-tag_v0.1.0.md
- docs/2-projects/014-DESIGN_repository-tag-transazioni-tag_v0.1.0.md
- docs/3-coding-plans/013-PLAN_repository-ricorrenze_v0.1.0.md
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