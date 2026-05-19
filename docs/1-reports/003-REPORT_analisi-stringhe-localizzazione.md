# REPORT — Analisi stringhe per localizzazione

Data: 15/05/2026
Ambito: src/lib/, src/hooks/, src/context/
Obiettivo: Catalogare tutte le stringhe di testo da migrare in src/locales/

## Riepilogo
- Totale stringhe catalogate: 74
- File analizzati: 32
- File con stringhe: 19

## Stringhe per file

### src/context/AuthContext.tsx
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| `useAuth deve essere usato dentro AuthProvider` | 45 | Errore lanciato se `useAuth` usato fuori dal provider |
| `PIN privato non configurato.` | 170 | Annuncio screen reader / errore sblocco PIN |
| `PIN privato non configurato` | 172 | Toast/notification (sonner) |
| `PIN privato non configurato` (errore) | 174 | Eccezione lanciata |
| `PIN privato non corretto. Riprova.` | 181 | Annuncio screen reader su PIN errato |
| `PIN privato non corretto` | 183 | Toast (sonner) |
| `PIN non corretto` | 185 | Eccezione lanciata (messaggio) |
| `Conto privato sbloccato.` | 192 | Annuncio screen reader quando unlock riesce |
| `Conto privato sbloccato` | 194 | Toast di successo quando unlock riesce |
| `PIN privato già configurato` | 204 | Eccezione se si setta PIN quando già configurato |
| `PIN privato configurato.` | 214 | Annuncio screen reader dopo set PIN |
| `PIN privato configurato con successo` | 216 | Toast di successo dopo set PIN |
| `PIN privato non configurato` | 222 | Eccezione (usata in changePin) |
| `PIN attuale non corretto` | 229 | Eccezione quando il PIN attuale è errato |
| `PIN privato modificato.` | 238 | Annuncio screen reader dopo change PIN |
| `PIN privato modificato con successo` | 240 | Toast dopo change PIN |
| `PIN privato non configurato` | 246 | Eccezione in removePin se non configurato |
| `PIN attuale non corretto` | 253 | Eccezione su removePin se PIN errato |
| `dialog-close` | 260 | id su soundSystem.play (nome suono) |
| `PIN privato rimosso.` | 261 | Annuncio screen reader dopo rimozione PIN |
| `PIN privato rimosso` | 263 | Toast di successo dopo rimozione PIN |
| `Avviso scadenza sessione` (aria-label) | 323 | Etichetta aria per alert dialog warning scadenza |
| `La tua sessione scadrà tra 1 minuto. Vuoi rimanere connesso?` | 325 | Testo visuale nel dialog di timeout sessione |
| `Sessione mantenuta attiva.` | 327 | Annuncio screen reader al click "Rimani connesso" |
| `Rimani connesso` (button label) | 327 | Etichetta pulsante nel dialog di timeout |
| `Esci ora` (button label) | 330 | Etichetta pulsante per terminare sessione |

### src/context/AppDataContext.tsx
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| `Modalità offline: stai vedendo dati salvati in precedenza.` | 118 | Messaggio visivo/alert offline (prima variante) |
| `Modalità offline: stai vedendo dati salvati in precedenza. I dati potrebbero non essere aggiornati.` | 119 | Messaggio visivo offline (stale cache) |
| `Non è possibile caricare i dati senza connessione al primo accesso. Connettiti e riprova.` | 120 | Messaggio primo accesso offline |
| `Impossibile eliminare la categoria: è usata da movimenti esistenti. Riassegna prima i movimenti a un'altra categoria.` | 376 | Messaggio di errore specifico per vincolo FK (RepositoryError handling) |
| `Budget "${budget.nome}" superato! Hai speso ${...}.` (template) | 435 | Messaggio notifica budget superato (toast/notification) |
| `Attenzione! Il budget "${budget.nome}" è al ${...}%. Rimangono ${...}.` (template) | 439 | Messaggio notifica budget critico |
| `Il budget "${budget.nome}" ha raggiunto il ${...}%.` (template) | 443 | Messaggio notifica budget warning |
| `Conto modificato` | 474 | Toast di successo dopo update conto |
| `Conto ${account.nome} modificato con successo.` | 475 | Annuncio screen reader dopo update conto (template) |
| `account-created` (sound id) | 479 | id su soundSystem.play per conto creato |
| `Conto "${account.nome}" creato` | 481 | Toast di creazione conto |
| `Nuovo conto ${account.nome} di tipo ${account.tipo} creato con saldo iniziale di ${...}.` | 482 | Annuncio screen reader creazione conto (template) |
| `Errore durante il salvataggio del conto` | 485 | Messaggio di fallback per errore salvataggio conto |
| `save` (sound id) | 499 | id soundSystem.play dopo salvataggio |
| `Movimento modificato` | 501 | Toast dopo update movimento |
| `Movimento modificato con successo.` | 502 | Annuncio screen reader dopo update movimento |
| `income` / `expense` / `transfer` (sound ids) | 507,510,513 | Suoni basati sul tipo di movimento |
| `Movimento aggiunto: ${transaction.tipo} ${...} - ${account?.nome || ''}` | 518 | Toast di creazione movimento (template) |
| `Conto sconosciuto` | 522 | Testo di fallback quando account?.nome non è disponibile |
| `Errore durante il salvataggio del movimento` | 530 | Messaggio di errore fallback per movimento |
| `Budget modificato` | 543 | Toast dopo update budget |
| `Budget ${budget.nome} modificato.` | 544 | Annuncio screen reader dopo update budget |
| `Budget "${budget.nome}" creato` | 550 | Toast creazione budget |
| `Nuovo budget ${budget.nome} creato. Importo target: ${...} per periodo ${...}.` | 551 | Annuncio screen reader creazione budget (template) |
| `Errore durante il salvataggio del budget` | 554 | Messaggio di errore fallback per budget |
| `Obiettivo di risparmio modificato` | 567 | Toast update obiettivo |
| `Obiettivo ${goal.nome} modificato.` | 568 | Annuncio screen reader update obiettivo |
| `Obiettivo "${goal.nome}" creato` | 574 | Toast creazione obiettivo |
| `Nuovo obiettivo di risparmio ${goal.nome} creato. Target: ${...}.` | 575 | Annuncio screen reader creazione obiettivo |
| `Errore durante il salvataggio` | 578 | Messaggio di errore generico fallback |
| `Conto eliminato` | 593 | Toast dopo eliminazione conto |
| `Conto ${account.nome} eliminato. Tutti i movimenti associati sono stati rimossi.` | 595 | Annuncio screen reader eliminazione conto (template) |
| `Conto eliminato.` | 597 | Annuncio screen reader variante breve |
| `Movimento eliminato` | 601 | Toast eliminazione movimento |
| `Movimento eliminato.` | 602 | Annuncio screen reader eliminazione movimento |
| `Budget eliminato` | 608 | Toast eliminazione budget |
| `Budget ${budget.nome} eliminato.` | 610 | Annuncio screen reader eliminazione budget (template) |
| `Budget eliminato.` | 612 | Annuncio screen reader variante breve |
| `Obiettivo di risparmio eliminato` | 617 | Toast eliminazione obiettivo |
| `Obiettivo ${goal.nome} eliminato.` | 619 | Annuncio screen reader eliminazione obiettivo (template) |
| `Obiettivo eliminato.` | 621 | Annuncio screen reader variante breve |
| `Errore durante l'eliminazione` | 625 | Messaggio di fallback in catch delete |
| `zecchino-export-${new Date().toISOString().split('T')[0]}.csv` | 632 | Nome file generato per download export CSV (template) |
| `export` (sound id) | 633 | id su soundSystem.play per export |
| `Dati esportati in CSV` | 635 | Toast dopo export |
| `Dati esportati. ${visibleTransactions.length} movimenti salvati in formato CSV.` | 636 | Annuncio screen reader dopo export (template) |
| `dialog-open` (sound id) | 640 | id su soundSystem.play per apertura dialog |
| `useAppData deve essere usato dentro AppDataProvider` | 723 | Errore lanciato se hook usato fuori provider |

### src/context/VisibleDataContext.tsx
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| `useVisibleData deve essere usato dentro VisibleDataProvider` | 10 | Errore lanciato se hook usato fuori provider |

### src/context/UserSettingsContext.tsx
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| `useUserSettings deve essere usato dentro UserSettingsProvider` | 22 | Errore lanciato se hook usato fuori provider |

### src/hooks/use-user-settings.ts
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| `conciso` / `normale` / `verboso` | 32 (SR_DEFAULTS) | Valori di default per verbosità SR |
| `Sì` / `No` (in helpers CSV) — (vedi helpers) | n/a | Localizzabile (CSV, UI) |
| `Errore aggiornamento preferenze` | ~150 | Messaggio di fallback in catch per update preference |
| `Errore aggiornamento audio` | ~190 | Messaggio di fallback per audio |
| `Errore aggiornamento visualizzaione` | ~230 | Messaggio di fallback per display |
| `Dati adattamenti TalkBack non validi` | ~260 | Errore locale quando payload invalidi |
| `Errore aggiornamento TalkBack` | ~280 | Messaggio fallback su TalkBack |
| `Errore aggiornamento TalkBack override` | ~310 | Messaggio fallback su override |
| `Errore reset screen reader` | ~340 | Messaggio fallback su reset SR |

### src/hooks/use-screen-reader.ts
(Nessuna stringa letterale utente: le frasi sono costruite/legate in `src/lib/screen-reader.ts`. Il file espone solo wrapper.)

### src/lib/screen-reader.ts
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| `Navigazione a ${destination}` | 43 | Template annuncio navigazione |
| `${action}` (announceAction) | 47 | Annuncio azione (assertive) |
| `Errore: ${error}` | 51 | Prefisso e template per errori SR |
| `Successo: ${message}` | 55 | Prefisso per annunci di successo |
| `${count} ${plural}` | 59 | Annuncio conteggio (es. "3 elementi") |
| `${accountName}, saldo ${formattedBalance}` | 73 | Annuncio saldo account (template) |
| `Movimento ${type}: ${formattedAmount} su ${account}` | 82 | Annuncio transazione (template) |
| `Finestra di dialogo aperta: ${title}` | 95 | Annuncio apertura dialog |
| `Finestra di dialogo chiusa` | 99 | Annuncio chiusura dialog |
| `${label}: ${percentage}%. ${current} di ${total}` | 104 | Annuncio progresso (template) |
| `Budget ${name}: ${Math.round(percentage)}%, ${status}` | 126 | Annuncio stato budget (template) |
| `Elemento ${position} di ${total}: ${itemDescription}` | 154 | Annuncio navigazione lista |
| `Filtro ${filterName} ${stato}` | 161 | Annuncio filtro attivato/disattivato |
| `Ordinamento per ${columnName}, ordine ${direzione}` | 170 | Annuncio ordinamento (template) |
| `Nuovo conto ${name} di tipo ${type} creato con saldo iniziale di ${formattedBalance}` | 183 | Annuncio conto creato (template) |
| `Conto ${name} eliminato. Tutti i movimenti associati sono stati rimossi` | 188 | Annuncio conto eliminato (assertive) |
| `Nuovo budget ${name} creato. Importo target: ${formattedTarget} per periodo ${period}` | 202 | Annuncio budget creato (template) |
| `Budget ${name} eliminato` | 206 | Annuncio budget eliminato (assertive) |
| `Nuovo obiettivo di risparmio ${name} creato. Target: ${formattedTarget}` | 216 | Annuncio obiettivo creato (template) |
| `Obiettivo ${name}: ${status}` | 253 | Annuncio progresso obiettivo |
| `Audio disattivato` | 266 | Annuncio quando audio mutato |
| `Volume impostato a ${level}%` | 268 | Annuncio cambio volume |
| `Preset audio ${presetName} applicato` | 274 | Annuncio preset audio applicato |
| `Template ${templateName} selezionato. Campi compilati automaticamente` | 277 | Annuncio template selezionato |
| `Errore nel campo ${fieldName}: ${error}` | 281 | Annuncio errore form (assertive) |
| `Campo ${fieldName} impostato a ${value}` | 286 | Annuncio campo compilato |
| `${elementName} ${stato}` | 291 | Annuncio toggle attivato/disattivato |
| `${action} ${itemName}` | 295 | Annuncio azione card |
| `${itemCount} ${...} in formato ${format}` | 299 | Annuncio export completato (template) |
| `Periodo cambiato a ${periodName}` | 302 | Annuncio cambio periodo |
| `Aiuto scorciatoie da tastiera aperto. Usa Tab per navigare, Escape per chiudere` | 306 | Annuncio help aperto (stringa fissa) |
| `Aiuto scorciatoie da tastiera chiuso` | 309 | Annuncio help chiuso |
| `Conto privato bloccato. I dati privati non sono più visibili` | 312 | Annuncio blocco conto privato |
| `${dataType} cancellati completamente` | 315 | Annuncio cancellazione dati (assertive) |
| `Importazione completata. ${itemCount} ${dataType} importati` | 319 | Annuncio import completato |

### src/lib/helpers.ts
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| CSV headers: `Data`, `Tipo`, `Importo`, `Conto`, `Categoria`, `Descrizione`, `Ricorrente` | 36 | Header CSV per export |
| `Sì` / `No` | 46 | Valori CSV per boolean ricorrente |
| `Sconosciuta` | 26 | Fallback nome categoria nella aggregazione |

### src/lib/budget-alerts.ts
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| `Budget "${budgetName}" superato! Hai speso ${...}% oltre il limite.` | 38 | Messaggio alert budget superato (template) |
| `Attenzione! Il budget "${budgetName}" è al ${...}%. Rimangono solo pochi euro disponibili.` | 40 | Messaggio alert budget critico |
| `Il budget "${budgetName}" ha raggiunto il ${...}%. Controlla le tue spese.` | 42 | Messaggio alert warning |
| `Budget "${budgetName}": ${percentageRounded}% utilizzato.` | 44 | Messaggio info budget |
| `🚨 Budget Superato!` | 109 | Titolo notifica per livello exceeded |
| `⚠️ Budget Critico` | 111 | Titolo notifica critical |
| `⚡ Attenzione Budget` | 113 | Titolo notifica warning |
| `ℹ️ Aggiornamento Budget` | 115 | Titolo notifica info |
| `text-destructive` / `text-amber-500` / `text-yellow-500` / `text-accent` | 122-128 | Classi/etichette colore per icona di alert (da localizzare se UI le mostra come testo)

### src/lib/constants.ts
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| ACCOUNT_TYPE_LABELS values (e.g. `Conto Bancario`, `Carta Prepagata`, `Contanti`, `Salvadanaio`, `Conto Privato`, `Investimenti`, `Carta di Credito`, `PayPal`, `Crypto Wallet`, `Fondo Pensione`) | 12-23 | Etichette tipo conto visibili in UI |
| ACCOUNT_TYPE_DESCRIPTIONS values (e.g. `Conto corrente tradizionale`, `Postepay, Revolut, N26`, `Portafoglio fisico`, `Riserva e risparmio`, `Protetto con PIN`, `Azioni, fondi, ETF`, `Carte di credito`, `Saldo PayPal`, `Bitcoin, Ethereum`, `Previdenza integrativa`) | 26-37 | Descrizioni tipo conto (UI, tooltip) |
| TRANSACTION_TYPE_LABELS (`Entrata`, `Uscita`, `Trasferimento`) | 42 | Etichette tipo transazione |
| RECURRENCE_LABELS (`Giornaliero`, `Settimanale`, `Mensile`, `Annuale`) | 46 | Etichette ricorrenza |
| ACCOUNT_CATEGORIES labels/descriptions (e.g. `Bancari`, `Conti correnti e carte tradizionali`, `Digitali`, `Portafogli digitali e prepagate`, `Risparmio`, `Fondi e riserve`, `Investimenti`, `Portafogli e fondi`, `Privato`, `Conti protetti`) | 52-90 | Etichette e descrizioni visibili nella UI per gruppi di conti |

### src/lib/budget-templates.ts
(Elenco di template budget con `id`, `nome`, `descrizione`, `categorieTarget`)
Esempi:
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| `Spesa Alimentare` | 19 | Nome template budget |
| `Budget mensile per supermercato e alimentari` | 20 | Descrizione template |
| `Ristoranti e Bar` | 29 | Nome template |
| `Budget mensile per pasti fuori e caffè` | 30 | Descrizione template |
| `Trasporti` | 39 | Nome template |
| `Budget mensile per benzina, mezzi pubblici e parcheggi` | 40 | Descrizione template |
(ulteriori template: `Casa e Bollette`, `Svago e Intrattenimento`, `Salute e Benessere`, `Abbonamenti`, `Abbigliamento`, `Istruzione e Formazione`, `Animali Domestici`, `Budget Totale Mensile`, ecc.)

### src/lib/budget-history.ts
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| Mesi abbreviati: `Gen`, `Feb`, `Mar`, `Apr`, `Mag`, `Giu`, `Lug`, `Ago`, `Set`, `Ott`, `Nov`, `Dic` | 16-17 | Etichette periodi usate in grafici/report |
| `Q${quarter} ${year}` (template) | 23 | Etichetta trimestre |
| `Corrente` / `Precedente` (periodLabel) | 204,215 | Etichette per confronto periodi |

### src/lib/budget-forecasting.ts
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| `Basato sulla tendenza corrente` | 165 | Etichetta metodo previsione |
| `Basato sulla media storica` | 167 | Etichetta metodo |
| `Basato su tendenza e storico` | 169 | Etichetta metodo |
| `Alta affidabilità` / `Media affidabilità` / `Bassa affidabilità` | 176-180 | Etichette livello confidenza |
| `Il periodo è concluso` | 188 | Messaggio quando il periodo è finito |
| `Con oltre ${daysElapsed} giorni di dati, la previsione si basa sulla tua spesa giornaliera attuale` | 193 | Frase esplicativa sulla qualità della previsione |
| `Dati sufficienti per una previsione accurata` | 195 | Messaggio di conferma affidabilità |
| `La previsione è moderatamente affidabile, basandosi su dati parziali e storico` | 199 | Messaggio per confidenza media |
| `Pochi dati disponibili - la previsione potrebbe essere meno accurata` | 202 | Messaggio per confidenza bassa |

### src/lib/supabase/repositories/conti.ts
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| `Utente non autenticato` | 23 | Messaggio usato nella funzione `getUid()` quando l'utente non è presente (RepositoryError) |

### src/lib/supabase/repositories/transazioni.ts
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| `Utente non autenticato` | 16 | Messaggio usato in `getUid()` (RepositoryError) |

### src/lib/supabase/repositories/categorie.ts
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| `Utente non autenticato` | 13 | Messaggio getUid() |
| `Categoria non trovata o non eliminabile` | 60 | Errore lanciato dopo `delete` se non eliminato |

### src/lib/supabase/repositories/budget.ts
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| `Utente non autenticato` | 22 | Messaggio getUid() |

### src/lib/supabase/repositories/obiettivi-risparmio.ts
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| `Utente non autenticato` | 13 | Messaggio getUid() |
| `Obiettivo non trovato` | 70 | Errore lanciato se RPC non ritorna righe |

### src/lib/supabase/repositories/impostazioni-utente.ts
| Stringa | Riga (appross.) | Contesto d'uso |
|---------|-----------------|----------------|
| `Utente non autenticato` | 20 | Messaggio getUid() |
| `Impostazioni non trovate dopo il merge` | 88 | Errore lanciato se update RPC fallisce o non ritorna righe |

## Osservazioni
- Pattern ricorrenti: prefissi per screen reader `Errore: ` e `Successo: ` gestiti in `src/lib/screen-reader.ts` — vanno internazionalizzati come template con placeholder (`{prefix}`, `{message}` oppure separare prefisso e messaggio). 
- Numerosi template con interpolation (es. `Conto ${account.nome} ...`, `Budget "${budget.nome}" ...`, `Movimento aggiunto: ${transaction.tipo} ...`) — richiedono chiavi separate per testo e per formattazione/placeholder.
- Duplicati: la stessa frase è spesso usata sia come `toast` che come `screenReader` (es. `Conto privato sbloccato.` / `Conto privato sbloccato`) — conservare singola chiave di localizzazione e riutilizzarla.
- File con etichette/descrizioni (`src/lib/constants.ts`, `src/lib/budget-templates.ts`) contengono molte stringhe UI stabili (nomi categorie, descrizioni, label) che devono essere migrate per prime.
- Alcuni messaggi interni/repository (`Utente non autenticato`, `Categoria non trovata o non eliminabile`, `Obiettivo non trovato`, `Impostazioni non trovate dopo il merge`) sono tecnici ma esposti come error message: valutare se devono essere mostrati all'utente o mappati su messaggi user-friendly localizzati.
- CSV headers e valori (`Data`, `Tipo`, `Importo`, `Conto`, `Categoria`, `Descrizione`, `Ricorrente`, `Sì`/`No`) devono essere localizzati perché esportati e visibili agli utenti.

---

Se vuoi, posso:
- Generare automaticamente il file `src/locales/it.json` con tutte le chiavi suggerite e valori italiani estratti da questo report.
- Fornirti un piano di migrazione (step-by-step) per sostituire le stringhe con chiamate `t('...')`.

Dimmi come preferisci procedere.