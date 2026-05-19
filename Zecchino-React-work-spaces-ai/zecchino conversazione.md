Il repository del mio progetto è:
https://github.com/donato81/ZecchinoReact

Rapporto di perplexity:
Ho letto tutti i documenti in profondità. Ora passo all'analisi.

***

## Analisi DESIGN 004 v1.0.0 — Nuova versione

La nuova versione ha risolto i problemi P1, P2, P4 e P5 che avevo trovato nella versione precedente. Il documento è ora significativamente più solido. Riporto solo i problemi reali rimasti. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/139933076/4d677c41-6b24-4d20-9209-c2bc930a2bcb/004-DESIGN_announcements-layer_v1_0_0.md?AWSAccessKeyId=ASIA2F3EMEYEUKJWJMZS&Signature=de2iLy6upclQ4WDvyk00yVHozAs%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEA8aCXVzLWVhc3QtMSJHMEUCIFB29LOkZMO6Vl%2BXqV5Ik5GeP2Zrdy0Icxq0%2FLCxRxYWAiEAnIXW9bhIG%2BJK98lCaK%2BlEt9OC%2BXhx2%2F3A5b9pPNbxVkq%2FAQI2P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDBahz5%2BBczxBZj8MRirQBPN3k9xY9QskspNH6%2FIGFlvC4b50G3H%2Bxh%2Fg51T8nposE%2BuEN2lBrxuMG9Df3Kr2EUZKh7h8xEpeJ0kYxM5EdKEzYiWBExORgLPi%2Bmv5ISbCjNPP8VUniTicV2v7qc%2BZKi6inCei7urDBF5Ou3RxIFH6sqISiuclDxGg3lchF5EYImy%2BCK0a7e4Zm7RZoefeImfhKkEIkEkaFL2hLD7LdxReBjRCfgzc7mrWYwcMW6tcl%2FNpZUml0E0fz0pCPGTm%2BETrdipD2vmVrmUTatdaOLR1B9%2FTTO1AKVZt498lTLKKogTRtAJl0jEawlKQL%2Ft%2BcY8iFaNdcXnZRiq0daQO5A1D8NkP0ANRIjUK93p03nrI9oMKgehQNAx20Wofdavhrkki3TTdJLW1QF1tG7hdCYHmfIIW4W57ewf8Azd0COrkioum%2BQtYvgUyo7RecYIMJcIVDaekbA%2B%2F7syTyQczN70fEAkE73BXzR38L2gkXJavUxskdZw2VgT9zcgmI5NnzklxMcC6OwISdPBdjbtwDrgWYIaEkG5xK7HfN3P%2BX52hwDAo4XO60YoCYISDfEANUnOdTnRG%2BM1uLc8xsbXvXmpDxD5CM%2Bth8wNRpVbz4Z%2BMVpxrHhvzw71viwxu6q0u1rYIjH2FZTBRKqQHppZv2LA9jXN2dOki5ra1DYpoY8nsml3n5KEyjneFlHPLS%2B4wu6DrD7SRWTFBljcCXSE%2Bg4o3GUzjeNe2yYdfmr6NRkKs0O6hSsXAjVMntunQXWjgPVX9xWN75lWulmu6aAPGEZwwk%2Bmx0AY6mAFyQcLRdn2qk7NYSw6SpYdxbMYGFbmfbvtP0fItutI1hsP%2Bco9%2Fw9cPMlSo24Txt4o5E267gQrBSLQAQzRbqaxbpmEeCmDpJ6QKq9nSgSNePkUW0xW3FGGuG5MMzTQ9YSYG5JLrFVC4VdpG3z72YZ%2Fw8yZ9gcp3Bj3CRaapqjBLIzbENx1CJ%2F0iPk4RbH83wdXb2MVkIqirvA%3D%3D&Expires=1779203396)

***

## Problemi che bloccherebbero l'implementazione

### P1 — Discrepanza sulle stringhe `export_single` e `export_plural` nella tabella di Sezione 3 del REPORT 004

Dove: Sezione 3.3 di `it.ts` nel DESIGN 004, e tabella Sezione 3.6 (`ui.ts`) del REPORT 004.

Il REPORT 004 nella tabella di `ui.ts` elenca `export_single` e `export_plural` come stringhe usate da `ui.ts`. Il DESIGN 004 invece le assegna correttamente ad `accounts.ts` e le mette fisicamente nella sezione 4 di `it.ts`. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/139933076/30fe5eec-2231-4ecf-9395-0f802ce01094/004-REPORT_perimetro-design-004.md)

Fin qui il DESIGN è coerente con la decisione P2 del REPORT. Il problema concreto è questo: il DESIGN 004 alla Sezione 3.3 dice che la sezione 1 dell'`it.ts` contiene "26 chiavi esclusive di `ui.ts`". Ma se contiamo fisicamente le chiavi nella sezione 1 del codice, troviamo effettivamente 26 chiavi. Tuttavia nella tabella della Sezione 3.6 del REPORT le chiavi `export_single` e `export_plural` compaiono anche elencate come usate da `ui.ts`. Un agente che verifica la coerenza tra il REPORT e il codice trovando quelle chiavi elencate in due posti diversi potrebbe aggiungere un import di `export_single` e `export_plural` in `ui.ts` pensando che le debba usare, rompendo la separazione prevista. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/139933076/4d677c41-6b24-4d20-9209-c2bc930a2bcb/004-DESIGN_announcements-layer_v1_0_0.md?AWSAccessKeyId=ASIA2F3EMEYEUKJWJMZS&Signature=de2iLy6upclQ4WDvyk00yVHozAs%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEA8aCXVzLWVhc3QtMSJHMEUCIFB29LOkZMO6Vl%2BXqV5Ik5GeP2Zrdy0Icxq0%2FLCxRxYWAiEAnIXW9bhIG%2BJK98lCaK%2BlEt9OC%2BXhx2%2F3A5b9pPNbxVkq%2FAQI2P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDBahz5%2BBczxBZj8MRirQBPN3k9xY9QskspNH6%2FIGFlvC4b50G3H%2Bxh%2Fg51T8nposE%2BuEN2lBrxuMG9Df3Kr2EUZKh7h8xEpeJ0kYxM5EdKEzYiWBExORgLPi%2Bmv5ISbCjNPP8VUniTicV2v7qc%2BZKi6inCei7urDBF5Ou3RxIFH6sqISiuclDxGg3lchF5EYImy%2BCK0a7e4Zm7RZoefeImfhKkEIkEkaFL2hLD7LdxReBjRCfgzc7mrWYwcMW6tcl%2FNpZUml0E0fz0pCPGTm%2BETrdipD2vmVrmUTatdaOLR1B9%2FTTO1AKVZt498lTLKKogTRtAJl0jEawlKQL%2Ft%2BcY8iFaNdcXnZRiq0daQO5A1D8NkP0ANRIjUK93p03nrI9oMKgehQNAx20Wofdavhrkki3TTdJLW1QF1tG7hdCYHmfIIW4W57ewf8Azd0COrkioum%2BQtYvgUyo7RecYIMJcIVDaekbA%2B%2F7syTyQczN70fEAkE73BXzR38L2gkXJavUxskdZw2VgT9zcgmI5NnzklxMcC6OwISdPBdjbtwDrgWYIaEkG5xK7HfN3P%2BX52hwDAo4XO60YoCYISDfEANUnOdTnRG%2BM1uLc8xsbXvXmpDxD5CM%2Bth8wNRpVbz4Z%2BMVpxrHhvzw71viwxu6q0u1rYIjH2FZTBRKqQHppZv2LA9jXN2dOki5ra1DYpoY8nsml3n5KEyjneFlHPLS%2B4wu6DrD7SRWTFBljcCXSE%2Bg4o3GUzjeNe2yYdfmr6NRkKs0O6hSsXAjVMntunQXWjgPVX9xWN75lWulmu6aAPGEZwwk%2Bmx0AY6mAFyQcLRdn2qk7NYSw6SpYdxbMYGFbmfbvtP0fItutI1hsP%2Bco9%2Fw9cPMlSo24Txt4o5E267gQrBSLQAQzRbqaxbpmEeCmDpJ6QKq9nSgSNePkUW0xW3FGGuG5MMzTQ9YSYG5JLrFVC4VdpG3z72YZ%2Fw8yZ9gcp3Bj3CRaapqjBLIzbENx1CJ%2F0iPk4RbH83wdXb2MVkIqirvA%3D%3D&Expires=1779203396)

Il DESIGN 004 dovrebbe aggiungere una nota esplicita nella Sezione 9 (dove si trova `ui.ts`) che dica chiaramente: "`export_single`, `export_plural`, `export_announce` e `import_complete` non sono usate da questo modulo nonostante compaiano nel REPORT 004 §3.6 — appartengono ad `accounts.ts` per decisione P2. Non aggiungere import di queste chiavi in `ui.ts`."

***

### P2 — `t()` accetta `params: Record<string, string | number>` ma `announceCount` passa un `number` e si aspetta un `string` in output senza conversione esplicita

Dove: Sezione 5.2, firma di `t()`, e Sezione 9.2, funzione `announceCount`.

La firma di `t()` accetta `string | number` come valori nei params. Nell'implementazione di `t()`, tutti i valori vengono convertiti con `String(value)` — quindi un numero diventa stringa automaticamente. Fin qui nessun problema.  [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/139933076/4d677c41-6b24-4d20-9209-c2bc930a2bcb/004-DESIGN_announcements-layer_v1_0_0.md?AWSAccessKeyId=ASIA2F3EMEYEUKJWJMZS&Signature=de2iLy6upclQ4WDvyk00yVHozAs%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEA8aCXVzLWVhc3QtMSJHMEUCIFB29LOkZMO6Vl%2BXqV5Ik5GeP2Zrdy0Icxq0%2FLCxRxYWAiEAnIXW9bhIG%2BJK98lCaK%2BlEt9OC%2BXhx2%2F3A5b9pPNbxVkq%2FAQI2P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDBahz5%2BBczxBZj8MRirQBPN3k9xY9QskspNH6%2FIGFlvC4b50G3H%2Bxh%2Fg51T8nposE%2BuEN2lBrxuMG9Df3Kr2EUZKh7h8xEpeJ0kYxM5EdKEzYiWBExORgLPi%2Bmv5ISbCjNPP8VUniTicV2v7qc%2BZKi6inCei7urDBF5Ou3RxIFH6sqISiuclDxGg3lchF5EYImy%2BCK0a7e4Zm7RZoefeImfhKkEIkEkaFL2hLD7LdxReBjRCfgzc7mrWYwcMW6tcl%2FNpZUml0E0fz0pCPGTm%2BETrdipD2vmVrmUTatdaOLR1B9%2FTTO1AKVZt498lTLKKogTRtAJl0jEawlKQL%2Ft%2BcY8iFaNdcXnZRiq0daQO5A1D8NkP0ANRIjUK93p03nrI9oMKgehQNAx20Wofdavhrkki3TTdJLW1QF1tG7hdCYHmfIIW4W57ewf8Azd0COrkioum%2BQtYvgUyo7RecYIMJcIVDaekbA%2B%2F7syTyQczN70fEAkE73BXzR38L2gkXJavUxskdZw2VgT9zcgmI5NnzklxMcC6OwISdPBdjbtwDrgWYIaEkG5xK7HfN3P%2BX52hwDAo4XO60YoCYISDfEANUnOdTnRG%2BM1uLc8xsbXvXmpDxD5CM%2Bth8wNRpVbz4Z%2BMVpxrHhvzw71viwxu6q0u1rYIjH2FZTBRKqQHppZv2LA9jXN2dOki5ra1DYpoY8nsml3n5KEyjneFlHPLS%2B4wu6DrD7SRWTFBljcCXSE%2Bg4o3GUzjeNe2yYdfmr6NRkKs0O6hSsXAjVMntunQXWjgPVX9xWN75lWulmu6aAPGEZwwk%2Bmx0AY6mAFyQcLRdn2qk7NYSw6SpYdxbMYGFbmfbvtP0fItutI1hsP%2Bco9%2Fw9cPMlSo24Txt4o5E267gQrBSLQAQzRbqaxbpmEeCmDpJ6QKq9nSgSNePkUW0xW3FGGuG5MMzTQ9YSYG5JLrFVC4VdpG3z72YZ%2Fw8yZ9gcp3Bj3CRaapqjBLIzbENx1CJ%2F0iPk4RbH83wdXb2MVkIqirvA%3D%3D&Expires=1779203396)

Il problema è nella Sezione 8.2 (`announceCount`), dove la funzione riceve `count: number` e `items: string` e li passa a `t('count_announce', { count, items })`. La chiave `count_announce` contiene il placeholder `{items}` — nel REPORT 004 la tabella di `plurals.ts` specifica che `announceCount` usa `_utils/plurals.ts` per pluralizzare `items`. Ma nel codice di `announceCount` nella Sezione 9.2 del DESIGN non viene chiamato `pluralize()`. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/139933076/30fe5eec-2231-4ecf-9395-0f802ce01094/004-REPORT_perimetro-design-004.md)

Immagina che il chiamante passi `announceCount('elemento', 3)`: lo screen reader direbbe "3 elemento" invece di "3 elementi". La tabella del REPORT alla riga `announceCount` nella colonna Note dice esplicitamente "Usa `_utils/plurals.ts`", ma il codice implementato nella Sezione 9.2 non importa né chiama `pluralize`. L'agente che implementa il codice da quella sezione non avrebbe motivo di aggiungere la chiamata da sola, e il risultato sarebbe grammaticalmente sbagliato. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/139933076/4d677c41-6b24-4d20-9209-c2bc930a2bcb/004-DESIGN_announcements-layer_v1_0_0.md?AWSAccessKeyId=ASIA2F3EMEYEUKJWJMZS&Signature=de2iLy6upclQ4WDvyk00yVHozAs%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEA8aCXVzLWVhc3QtMSJHMEUCIFB29LOkZMO6Vl%2BXqV5Ik5GeP2Zrdy0Icxq0%2FLCxRxYWAiEAnIXW9bhIG%2BJK98lCaK%2BlEt9OC%2BXhx2%2F3A5b9pPNbxVkq%2FAQI2P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDBahz5%2BBczxBZj8MRirQBPN3k9xY9QskspNH6%2FIGFlvC4b50G3H%2Bxh%2Fg51T8nposE%2BuEN2lBrxuMG9Df3Kr2EUZKh7h8xEpeJ0kYxM5EdKEzYiWBExORgLPi%2Bmv5ISbCjNPP8VUniTicV2v7qc%2BZKi6inCei7urDBF5Ou3RxIFH6sqISiuclDxGg3lchF5EYImy%2BCK0a7e4Zm7RZoefeImfhKkEIkEkaFL2hLD7LdxReBjRCfgzc7mrWYwcMW6tcl%2FNpZUml0E0fz0pCPGTm%2BETrdipD2vmVrmUTatdaOLR1B9%2FTTO1AKVZt498lTLKKogTRtAJl0jEawlKQL%2Ft%2BcY8iFaNdcXnZRiq0daQO5A1D8NkP0ANRIjUK93p03nrI9oMKgehQNAx20Wofdavhrkki3TTdJLW1QF1tG7hdCYHmfIIW4W57ewf8Azd0COrkioum%2BQtYvgUyo7RecYIMJcIVDaekbA%2B%2F7syTyQczN70fEAkE73BXzR38L2gkXJavUxskdZw2VgT9zcgmI5NnzklxMcC6OwISdPBdjbtwDrgWYIaEkG5xK7HfN3P%2BX52hwDAo4XO60YoCYISDfEANUnOdTnRG%2BM1uLc8xsbXvXmpDxD5CM%2Bth8wNRpVbz4Z%2BMVpxrHhvzw71viwxu6q0u1rYIjH2FZTBRKqQHppZv2LA9jXN2dOki5ra1DYpoY8nsml3n5KEyjneFlHPLS%2B4wu6DrD7SRWTFBljcCXSE%2Bg4o3GUzjeNe2yYdfmr6NRkKs0O6hSsXAjVMntunQXWjgPVX9xWN75lWulmu6aAPGEZwwk%2Bmx0AY6mAFyQcLRdn2qk7NYSw6SpYdxbMYGFbmfbvtP0fItutI1hsP%2Bco9%2Fw9cPMlSo24Txt4o5E267gQrBSLQAQzRbqaxbpmEeCmDpJ6QKq9nSgSNePkUW0xW3FGGuG5MMzTQ9YSYG5JLrFVC4VdpG3z72YZ%2Fw8yZ9gcp3Bj3CRaapqjBLIzbENx1CJ%2F0iPk4RbH83wdXb2MVkIqirvA%3D%3D&Expires=1779203396)

La Sezione 9.2 dovrebbe mostrare la chiamata a `pluralize(items, count)` dentro `announceCount`, oppure spiegare perché in questo caso la pluralizzazione viene gestita diversamente.

***

## Problemi che creerebbero confusione

### P3 — `announcements/index.ts` espone `announce()` ma il suo tipo di parametro non è dichiarato nel codice mostrato

Dove: Sezione 17.2, codice di `announcements/index.ts`.

Il codice di `index.ts` mostra:

```ts
export function announce(announcement: Announcement): void {
  engine.announce(announcement)
}
```

Ma `Announcement` non è importato esplicitamente nel codice mostrato. Per compilare, il file deve importare `Announcement` da qualche parte. L'ADR_001 stabilisce che l'unica eccezione per importare da `accessibility/` è `index.ts` che importa `engine` — non i tipi. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/139933076/8621c36e-ff2d-4b32-b2e7-bd9e4efe16ab/ADR_001_sistema-annunci-accessibili.md)

Il tipo `Announcement` è però già re-esportato da `announcements/types.ts`. Quindi la soluzione corretta è importarlo da `'./types'`, non da `@/accessibility/types`. Il codice mostrato nella Sezione 17.2 non include questo import, il che significa che come scritto non compilerebbe. Un agente che copia quel codice otterrebbe un errore TypeScript immediato sulla firma di `announce()`. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/139933076/4d677c41-6b24-4d20-9209-c2bc930a2bcb/004-DESIGN_announcements-layer_v1_0_0.md?AWSAccessKeyId=ASIA2F3EMEYEUKJWJMZS&Signature=de2iLy6upclQ4WDvyk00yVHozAs%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEA8aCXVzLWVhc3QtMSJHMEUCIFB29LOkZMO6Vl%2BXqV5Ik5GeP2Zrdy0Icxq0%2FLCxRxYWAiEAnIXW9bhIG%2BJK98lCaK%2BlEt9OC%2BXhx2%2F3A5b9pPNbxVkq%2FAQI2P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDBahz5%2BBczxBZj8MRirQBPN3k9xY9QskspNH6%2FIGFlvC4b50G3H%2Bxh%2Fg51T8nposE%2BuEN2lBrxuMG9Df3Kr2EUZKh7h8xEpeJ0kYxM5EdKEzYiWBExORgLPi%2Bmv5ISbCjNPP8VUniTicV2v7qc%2BZKi6inCei7urDBF5Ou3RxIFH6sqISiuclDxGg3lchF5EYImy%2BCK0a7e4Zm7RZoefeImfhKkEIkEkaFL2hLD7LdxReBjRCfgzc7mrWYwcMW6tcl%2FNpZUml0E0fz0pCPGTm%2BETrdipD2vmVrmUTatdaOLR1B9%2FTTO1AKVZt498lTLKKogTRtAJl0jEawlKQL%2Ft%2BcY8iFaNdcXnZRiq0daQO5A1D8NkP0ANRIjUK93p03nrI9oMKgehQNAx20Wofdavhrkki3TTdJLW1QF1tG7hdCYHmfIIW4W57ewf8Azd0COrkioum%2BQtYvgUyo7RecYIMJcIVDaekbA%2B%2F7syTyQczN70fEAkE73BXzR38L2gkXJavUxskdZw2VgT9zcgmI5NnzklxMcC6OwISdPBdjbtwDrgWYIaEkG5xK7HfN3P%2BX52hwDAo4XO60YoCYISDfEANUnOdTnRG%2BM1uLc8xsbXvXmpDxD5CM%2Bth8wNRpVbz4Z%2BMVpxrHhvzw71viwxu6q0u1rYIjH2FZTBRKqQHppZv2LA9jXN2dOki5ra1DYpoY8nsml3n5KEyjneFlHPLS%2B4wu6DrD7SRWTFBljcCXSE%2Bg4o3GUzjeNe2yYdfmr6NRkKs0O6hSsXAjVMntunQXWjgPVX9xWN75lWulmu6aAPGEZwwk%2Bmx0AY6mAFyQcLRdn2qk7NYSw6SpYdxbMYGFbmfbvtP0fItutI1hsP%2Bco9%2Fw9cPMlSo24Txt4o5E267gQrBSLQAQzRbqaxbpmEeCmDpJ6QKq9nSgSNePkUW0xW3FGGuG5MMzTQ9YSYG5JLrFVC4VdpG3z72YZ%2Fw8yZ9gcp3Bj3CRaapqjBLIzbENx1CJ%2F0iPk4RbH83wdXb2MVkIqirvA%3D%3D&Expires=1779203396)

La Sezione 17.2 deve aggiungere:
```ts
import type { Announcement } from './types'
```

***

### P4 — Sezione 18 (`AuthContext`): la tabella delle sostituzioni elenca `announcePrivateUnlocked()` con il nome sbagliato

Dove: Sezione 18.2, tabella delle sostituzioni `screenReader.*` → `announce(auth.*)`.

In `auth.ts` (Sezione 10.2) la funzione si chiama `privateUnlocked()`. La tabella della Sezione 18.2 la indica come `auth.announcePrivateUnlocked()`. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/139933076/4d677c41-6b24-4d20-9209-c2bc930a2bcb/004-DESIGN_announcements-layer_v1_0_0.md?AWSAccessKeyId=ASIA2F3EMEYEUKJWJMZS&Signature=de2iLy6upclQ4WDvyk00yVHozAs%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEA8aCXVzLWVhc3QtMSJHMEUCIFB29LOkZMO6Vl%2BXqV5Ik5GeP2Zrdy0Icxq0%2FLCxRxYWAiEAnIXW9bhIG%2BJK98lCaK%2BlEt9OC%2BXhx2%2F3A5b9pPNbxVkq%2FAQI2P%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgw2OTk3NTMzMDk3MDUiDBahz5%2BBczxBZj8MRirQBPN3k9xY9QskspNH6%2FIGFlvC4b50G3H%2Bxh%2Fg51T8nposE%2BuEN2lBrxuMG9Df3Kr2EUZKh7h8xEpeJ0kYxM5EdKEzYiWBExORgLPi%2Bmv5ISbCjNPP8VUniTicV2v7qc%2BZKi6inCei7urDBF5Ou3RxIFH6sqISiuclDxGg3lchF5EYImy%2BCK0a7e4Zm7RZoefeImfhKkEIkEkaFL2hLD7LdxReBjRCfgzc7mrWYwcMW6tcl%2FNpZUml0E0fz0pCPGTm%2BETrdipD2vmVrmUTatdaOLR1B9%2FTTO1AKVZt498lTLKKogTRtAJl0jEawlKQL%2Ft%2BcY8iFaNdcXnZRiq0daQO5A1D8NkP0ANRIjUK93p03nrI9oMKgehQNAx20Wofdavhrkki3TTdJLW1QF1tG7hdCYHmfIIW4W57ewf8Azd0COrkioum%2BQtYvgUyo7RecYIMJcIVDaekbA%2B%2F7syTyQczN70fEAkE73BXzR38L2gkXJavUxskdZw2VgT9zcgmI5NnzklxMcC6OwISdPBdjbtwDrgWYIaEkG5xK7HfN3P%2BX52hwDAo4XO60YoCYISDfEANUnOdTnRG%2BM1uLc8xsbXvXmpDxD5CM%2Bth8wNRpVbz4Z%2BMVpxrHhvzw71viwxu6q0u1rYIjH2FZTBRKqQHppZv2LA9jXN2dOki5ra1DYpoY8nsml3n5KEyjneFlHPLS%2B4wu6DrD7SRWTFBljcCXSE%2Bg4o3GUzjeNe2yYdfmr6NRkKs0O6hSsXAjVMntunQXWjgPVX9xWN75lWulmu6aAPGEZwwk%2Bmx0AY6mAFyQcLRdn2qk7NYSw6SpYdxbMYGFbmfbvtP0fItutI1hsP%2Bco9%2Fw9cPMlSo24Txt4o5E267gQrBSLQAQzRbqaxbpmEeCmDpJ6QKq9nSgSNePkUW0xW3FGGuG5MMzTQ9YSYG5JLrFVC4VdpG3z72YZ%2Fw8yZ9gcp3Bj3CRaapqjBLIzbENx1CJ%2F0iPk4RbH83wdXb2MVkIqirvA%3D%3D&Expires=1779203396)

Per un agente che legge la Sezione 18 e scrive la patch di `AuthContext`, il nome che vede nella tabella è `auth.announcePrivateUnlocked()`. Questo nome non esiste in `auth.ts`. Il codice compilato farebbe fallire TypeScript con un errore "property does not exist". La convenzione di naming senza prefisso `announce` è una decisione esplicita della Sezione 10.1 (P5 del REPORT), ma la tabella di migrazione non la rispetta. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/139933076/30fe5eec-2231-4ecf-9395-0f802ce01094/004-REPORT_perimetro-design-004.md)

La tabella della Sezione 18.2 deve usare il nome corretto: `auth.privateUnlocked()`.

***

### P5 — Sezione 19 (`AppDataContext`): conteggio sostituzioni dichiarato "16 chiamate" ma verifica interna non è presente

Dove: intestazione della Sezione 19 e Sezione 19.2.

Il REPORT 004 Sezione 4.2 dice "Sostituisce 16 chiamate `screenReader.*`". La Sezione 19 del DESIGN lo ripete. Tuttavia la tabella delle sostituzioni nella Sezione 19.2 elenca meno di 16 righe: le righe visibili coprono conti (5), movimenti (4), budget (4), obiettivi (3) — totale 16, ma nella sezione budget compare `announceBudgetStatus` che accetta 4 parametri mentre nel codice REPORT appare con firma diversa. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/139933076/30fe5eec-2231-4ecf-9395-0f802ce01094/004-REPORT_perimetro-design-004.md)

Questo non è un blocco, ma è un punto dove un agente potrebbe chiedersi se il conteggio è corretto e procedere in modo incerto. Il DESIGN dovrebbe confermare esplicitamente il conteggio totale alla fine della tabella o aggiungere una nota "totale verificato: 16 sostituzioni".

***

## Piccole incoerenze minori

### P6 — Discrepanza "67+" vs "72" ancora non risolta nella Sezione 21

Dove: Sezione 3.3 nota e Sezione 21.

La Sezione 3.3 spiega la discrepanza 72 vs 77. La Sezione 21 registra C1 per la contraddizione 77 vs 72. Nessuna delle due menziona però la dicitura "67+" che compare nel REPORT 004 Sezione 1 riga 1 e nel suo STEP 1 del grafo. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/139933076/30fe5eec-2231-4ecf-9395-0f802ce01094/004-REPORT_perimetro-design-004.md)

Per chi legge i due documenti in sequenza, troverà tre numeri diversi per lo stesso concetto: "67+", "77" e "72". La Sezione 21 spiega bene perché 77 diventa 72, ma non spiega da dove viene "67+". Un agente che controlla la coerenza tra il REPORT e il DESIGN potrebbe segnalarlo come errore. La Sezione 21 dovrebbe aggiungere una riga che spiega: "Il '67+' del REPORT indica le stringhe di dominio puro (escluse le 5 azioni), prima che il conteggio finale fosse stabilizzato a 72."

***

In sintesi: il documento è implementabile con le correzioni a P2 e P3, che sono le due più concrete. P2 produce output grammaticalmente sbagliato senza errori visibili. P3 produce un errore di compilazione immediato. P4 produce un errore di compilazione nella patch di `AuthContext`. P1 e P5 sono rischi di confusione durante l'implementazione. P6 è una piccola pulizia documentale. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/139933076/8621c36e-ff2d-4b32-b2e7-bd9e4efe16ab/ADR_001_sistema-annunci-accessibili.md)


Analisi di chat gpt:
Ho analizzato attentamente il rapporto e, nel complesso, la valutazione di Perplexity è molto buona.
La qualità dell’analisi è superiore alle precedenti che avevi mostrato: questa volta distingue abbastanza bene tra:

* problemi realmente bloccanti
* incoerenze documentali
* semplici rischi di ambiguità per implementatori automatici

Ti confermo però che non tutti i punti hanno lo stesso peso reale. Alcuni sono corretti e importanti, altri sono soprattutto “lint documentale”.

Di seguito la validazione tecnica punto per punto.

---

# Validazione generale

La nuova versione del DESIGN 004 sembra effettivamente molto più stabile rispetto alle iterazioni precedenti.

In particolare:

* il perimetro è finalmente coerente
* il layer `announcements` è separato bene
* la distinzione dominio/UI/accessibility è molto più pulita
* il naming è quasi completamente consolidato
* la dipendenza da `AccessibilityInfo` appare finalmente confinata

Quindi la direzione architetturale è corretta.

Perplexity ha individuato soprattutto:

* problemi di coerenza tra documenti
* rischi di implementazione automatica
* piccoli mismatch tra esempi di codice e specifica

Questo è esattamente il tipo di review utile in questa fase.

---

# P1 — `export_single` / `export_plural`

## Valutazione: CORRETTO ma NON bloccante

Questo problema esiste davvero.

Hai:

* REPORT che ancora cita quelle chiavi in `ui.ts`
* DESIGN che le sposta correttamente in `accounts.ts`

Architetturalmente il DESIGN è corretto.

Il problema è documentale:
un implementatore automatico potrebbe reintrodurre import sbagliati.

Quindi Perplexity ha ragione sul rischio.

## Gravità reale

Non è un blocco implementativo.

È:

* rischio di regressione
* rischio di reinquinamento del boundary tra moduli

## La soluzione proposta è giusta

La nota esplicita suggerita è sensata.

Ti consiglio addirittura qualcosa di ancora più forte:

```md
IMPORTANTE:
Le chiavi:
- export_single
- export_plural
- export_announce
- import_complete

appartengono esclusivamente al dominio accounts.ts.

NON devono essere importate o usate da ui.ts.
La loro presenza nel REPORT 004 §3.6 è storica/documentale.
```

Questo elimina ambiguità future.

---

# P2 — `announceCount` non pluralizza

# Valutazione: CORRETTO e IMPORTANTE

Questo è il problema più concreto dell’intera review.

Perplexity qui ha perfettamente ragione.

Se:

```ts
announceCount('elemento', 3)
```

produce:

```txt
3 elemento
```

allora:

* il DESIGN
* il REPORT
* il codice mostrato

sono incoerenti tra loro.

E soprattutto:
la responsabilità grammaticale è già stata assegnata a `_utils/plurals.ts`.

Quindi il codice mostrato nella sezione implementativa è incompleto.

---

## Gravità reale

Alta.

Perché:

* non produce errori TS
* non produce crash
* ma produce output SBAGLIATO

Questi sono i bug peggiori nei sistemi accessibility.

---

## Validazione soluzione

Correttissima.

La funzione dovrebbe mostrare chiaramente:

```ts
const label = pluralize(items, count)

return t('count_announce', {
  count,
  items: label
})
```

oppure equivalente.

Questo punto va corretto.

---

# P3 — `Announcement` non importato

# Valutazione: CORRETTO

Questo è un errore tecnico reale.

Il codice mostrato:

```ts
export function announce(announcement: Announcement): void
```

non compila senza import.

Quindi Perplexity ha ragione.

---

## Gravità reale

Media.

Perché:

* errore immediato
* facile da correggere
* ma reale

---

## Soluzione proposta

Corretta:

```ts
import type { Announcement } from './types'
```

ed è anche coerente con ADR_001.

---

# P4 — `announcePrivateUnlocked()` naming errato

# Valutazione: CORRETTO

Questo è un classico problema da refactor incompleto.

Hai:

* naming finale senza prefisso `announce`
* una tabella che usa ancora il vecchio naming

Perplexity ha ragione.

---

## Gravità reale

Media.

Perché:

* rompe TypeScript
* ma solo nell’implementazione guidata dalla tabella

---

## Correzione

Sì:

```ts
auth.privateUnlocked()
```

e basta.

---

# P5 — conteggio “16 sostituzioni”

# Valutazione: PARZIALMENTE CORRETTO

Qui Perplexity sta entrando nel territory “document consistency linting”.

Non c’è un problema tecnico reale.

Il conteggio torna:

* 5
* 4
* 4
* 3

= 16.

Quindi il documento è già coerente.

Il dubbio nasce perché:

* alcune firme funzione cambiano
* il REPORT è più vecchio del DESIGN

Ma non vedo rischio implementativo concreto.

---

## Gravità reale

Bassa.

---

## Vale la pena aggiungere nota?

Sì, perché riduce rumore future-review.

Una semplice riga:

```md
Totale verificato: 16 sostituzioni.
```

chiude definitivamente la questione.

---

# P6 — 67+ / 72 / 77

# Valutazione: CORRETTO ma MINORE

Qui Perplexity ha ragione:
ci sono tre numeri storici non riconciliati.

Ma questo è:

* un problema editoriale
* non architetturale

---

## Gravità reale

Molto bassa.

---

## Però conviene correggerlo?

Sì.

Perché questi mismatch:

* attirano review inutili
* consumano tempo
* fanno sembrare il documento instabile

La spiegazione suggerita è buona.

---

# Conclusione finale

## Problemi REALMENTE da correggere

Questi sì:

| ID | Gravità | Motivo                                       |
| -- | ------- | -------------------------------------------- |
| P2 | Alta    | output accessibility grammaticalmente errato |
| P3 | Media   | errore compilazione TS                       |
| P4 | Media   | errore compilazione/refactor incoerente      |
| P1 | Media   | rischio regressione boundary                 |

---

## Problemi utili ma non critici

| ID | Gravità     |
| -- | ----------- |
| P5 | Bassa       |
| P6 | Molto bassa |

---

# Giudizio sul DESIGN 004 dopo questa review

Direi che il documento:

* NON ha più problemi architetturali seri
* NON mostra più incoerenze sistemiche
* è ormai in fase di hardening finale

I problemi rimasti sono:

* dettagli implementativi
* allineamenti documentali
* residue incoerenze di naming

Questa è una differenza enorme rispetto alle versioni precedenti, dove c’erano ancora problemi di perimetro e responsabilità.
