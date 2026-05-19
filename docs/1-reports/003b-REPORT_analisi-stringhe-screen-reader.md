# REPORT — Analisi stringhe screen-reader e talkback

Data: 15/05/2026
File analizzati: src/lib/screen-reader.ts, src/hooks/use-talkback.ts

---

## src/lib/screen-reader.ts

### Stringhe utente (annunci parlati)
| Stringa | Riga | Contesto d'uso |
|---------|------|----------------|
| `` `Navigazione a ${destination}` `` | 70 | `announceNavigation()` — annuncio polite di cambio schermata |
| `` `Errore: ${error}` `` | 78 | `announceError()` — prefisso + messaggio di errore, priority assertive |
| `` `Successo: ${message}` `` | 82 | `announceSuccess()` — prefisso + messaggio di successo, priority polite |
| `` `${count} ${plural}` `` | 87 | `announceCount()` — annuncio conteggio; plurale ricavato sostituendo `-i` finale con `-o` |
| `` `${accountName}, saldo ${formattedBalance}` `` | 95 | `announceBalance()` — annuncio saldo conto formattato in EUR it-IT |
| `` `Movimento ${type}: ${formattedAmount} su ${account}` `` | 104 | `announceTransaction()` — annuncio movimento base |
| `` `, categoria ${category}` `` | 106 | `announceTransaction()` — suffisso opzionale aggiunto al template precedente se `category` è valorizzato |
| `` `Finestra di dialogo aperta: ${title}` `` | 112 | `announceDialogOpen()` — annuncio apertura dialog |
| `'Finestra di dialogo chiusa'` | 116 | `announceDialogClose()` — annuncio chiusura dialog (stringa fissa) |
| `` `${label}: ${percentage}%. ${current} di ${total}` `` | 121 | `announceProgress()` — annuncio avanzamento generico |
| `` `superato di ${formattedRemaining}` `` | 139 | `announceBudgetStatus()` — sotto-stringa stato budget superato (percentage ≥ 100) |
| `` `attenzione, rimangono solo ${formattedRemaining}` `` | 141 | `announceBudgetStatus()` — sotto-stringa stato critico (percentage ≥ 90) |
| `` `rimangono ${formattedRemaining}` `` | 143 | `announceBudgetStatus()` — sotto-stringa stato warning (percentage ≥ 75) |
| `` `in corso, spesi ${formattedSpent} su ${formattedTarget}` `` | 145 | `announceBudgetStatus()` — sotto-stringa stato normale |
| `` `Budget ${name}: ${Math.round(percentage)}%, ${status}` `` | 148 | `announceBudgetStatus()` — annuncio finale che incorpora le sotto-stringhe precedenti |
| `` `Elemento ${position} di ${total}: ${itemDescription}` `` | 156 | `announceListNavigation()` — annuncio posizione in lista |
| `'attivato'` / `'disattivato'` | 160 | `announceFilter()` — valori inline per stato filtro |
| `` `Filtro ${filterName} ${stato}` `` | 161 | `announceFilter()` — annuncio attivazione/disattivazione filtro |
| `'crescente'` / `'decrescente'` | 165 | `announceSort()` — valori inline per direzione ordinamento |
| `` `Ordinamento per ${columnName}, ordine ${direzione}` `` | 166 | `announceSort()` — annuncio cambio ordinamento colonna |
| `` `Nuovo conto ${name} di tipo ${type} creato con saldo iniziale di ${formattedBalance}` `` | 177 | `announceAccountCreated()` — annuncio creazione conto |
| `` `Conto ${name} eliminato. Tutti i movimenti associati sono stati rimossi` `` | 181 | `announceAccountDeleted()` — annuncio eliminazione conto, priority assertive |
| `` `Nuovo budget ${name} creato. Importo target: ${formattedTarget} per periodo ${period}` `` | 191 | `announceBudgetCreated()` — annuncio creazione budget |
| `` `Budget ${name} eliminato` `` | 195 | `announceBudgetDeleted()` — annuncio eliminazione budget, priority assertive |
| `` `Nuovo obiettivo di risparmio ${name} creato. Target: ${formattedTarget}` `` | 205 | `announceSavingsGoalCreated()` — parte fissa annuncio creazione obiettivo |
| `` `, scadenza ${new Date(deadline).toLocaleDateString('it-IT')}` `` | 207 | `announceSavingsGoalCreated()` — suffisso opzionale aggiunto se `deadline` è valorizzato |
| `` `obiettivo raggiunto!` `` | 233 | `announceSavingsGoalProgress()` — sotto-stringa stato completato (percentage ≥ 100) |
| `` `quasi raggiunto, mancano ${formattedRemaining}` `` | 235 | `announceSavingsGoalProgress()` — sotto-stringa stato avanzato (percentage ≥ 75) |
| `` `progresso ${Math.round(percentage)}%, risparmiati ${formattedCurrent} su ${formattedTarget}` `` | 237 | `announceSavingsGoalProgress()` — sotto-stringa stato normale |
| `` `Obiettivo ${name}: ${status}` `` | 240 | `announceSavingsGoalProgress()` — annuncio finale che incorpora le sotto-stringhe precedenti |
| `` `Obiettivo di risparmio ${name} eliminato` `` | 244 | `announceSavingsGoalDeleted()` — annuncio eliminazione obiettivo, priority assertive |
| `'Audio disattivato'` | 249 | `announceVolumeChange()` — annuncio mute (stringa fissa) |
| `` `Volume impostato a ${level}%` `` | 251 | `announceVolumeChange()` — annuncio cambio volume |
| `` `Preset audio ${presetName} applicato` `` | 256 | `announcePresetApplied()` — annuncio preset audio selezionato |
| `` `Template ${templateName} selezionato. Campi compilati automaticamente` `` | 260 | `announceTemplateSelected()` — annuncio selezione template budget |
| `` `Errore nel campo ${fieldName}: ${error}` `` | 264 | `announceFormError()` — annuncio errore di validazione campo form, priority assertive |
| `` `Campo ${fieldName} impostato a ${value}` `` | 268 | `announceFormFieldFilled()` — annuncio compilazione campo form |
| `'attivato'` / `'disattivato'` | 272 | `announceToggleState()` — valori inline per stato toggle (duplicati di riga 160) |
| `` `${elementName} ${stato}` `` | 273 | `announceToggleState()` — annuncio cambio stato toggle |
| `'elemento esportato'` / `'elementi esportati'` | 281 | `announceExport()` — rami plurale/singolare per export |
| `` `${itemCount} ${...} in formato ${format}` `` | 281 | `announceExport()` — annuncio export completato |
| `` `Periodo cambiato a ${periodName}` `` | 285 | `announcePeriodChange()` — annuncio cambio periodo |
| `'Aiuto scorciatoie da tastiera aperto. Usa Tab per navigare, Escape per chiudere'` | 289 | `announceHelpOpened()` — annuncio apertura help (stringa fissa lunga) |
| `'Aiuto scorciatoie da tastiera chiuso'` | 293 | `announceHelpClosed()` — annuncio chiusura help (stringa fissa) |
| `'Conto privato bloccato. I dati privati non sono più visibili'` | 297 | `announcePrivateAccountLocked()` — annuncio blocco conto privato (stringa fissa) |
| `` `${dataType} cancellati completamente` `` | 301 | `announceDataCleared()` — annuncio cancellazione dati, priority assertive |
| `` `Importazione completata. ${itemCount} ${dataType} importati` `` | 305 | `announceImportComplete()` — annuncio import completato |

### Costanti di configurazione DOM/CSS (non localizzabili)
| Stringa | Riga | Contesto d'uso |
|---------|------|----------------|
| `'status'` | 22 | `setAttribute('role', ...)` — ruolo ARIA regione polite |
| `'polite'` | 23 | `setAttribute('aria-live', ...)` — live region polite |
| `'alert'` | 30 | `setAttribute('role', ...)` — ruolo ARIA regione assertive |
| `'assertive'` | 31 | `setAttribute('aria-live', ...)` — live region assertive |
| `'sr-only'` | 25, 33 | `className` — classe CSS che nasconde visivamente il div mantenendolo per SR |

---

## src/hooks/use-talkback.ts

### Stringhe di log (non user-facing)
| Stringa | Riga | Contesto d'uso |
|---------|------|----------------|
| `'TalkBack detection error:'` | ~98 | `console.warn(...)` — messaggio di debug in catch del blocco di rilevamento TalkBack |
| `` `TalkBack detected with ${confidence} confidence - adaptations active` `` | ~130 | `console.log(...)` — messaggio di debug emesso quando TalkBack viene rilevato attivo |

### Chiavi sessionStorage (identificatori tecnici)
| Stringa | Riga | Contesto d'uso |
|---------|------|----------------|
| `'talkback-focus-pattern'` | ~84, ~140 | Chiave letta/scritta per rilevare pattern di focus tipici TalkBack |
| `'talkback-slow-nav'` | ~85, ~147 | Chiave letta/scritta per rilevare navigazione lenta (>1000 ms tra Tab) |
| `'talkback-active'` | ~130, ~137 | Chiave scritta/rimossa per segnalare TalkBack attivo nella sessione corrente |
| `'last-tab-time'` | ~144, ~148 | Timestamp dell'ultimo Tab per calcolare velocità navigazione |

### Attributi DOM e classi CSS (identificatori tecnici)
| Stringa | Riga | Contesto d'uso |
|---------|------|----------------|
| `'data-talkback'` | ~119, ~134 | Attributo `data-*` impostato su `document.body` quando TalkBack è attivo |
| `'data-talkback-confidence'` | ~120, ~135 | Attributo `data-*` che porta il livello di confidenza rilevato |
| `'talkback-enhanced-targets'` | ~123, ~136 | Classe CSS aggiunta a `body` per target touch ingranditi (56 px) |
| `'talkback-high-contrast'` | ~126, ~136 | Classe CSS aggiunta a `body` per alta visibilità contrasto |
| `'talkback-reduced-motion'` | ~129, ~136 | Classe CSS aggiunta a `body` per riduzione animazioni |

### Identificatori di eventi/API (non localizzabili)
| Stringa | Riga | Contesto d'uso |
|---------|------|----------------|
| `'Tab'` | ~142 | `e.key === 'Tab'` — comparazione tasto per rilevare navigazione da tastiera |

---

## Osservazioni

### Prefissi hardcoded
- `'Errore: '` (riga 78) e `'Successo: '` (riga 82) sono prefissi fissi in `announceError` / `announceSuccess`. Se il testo del parametro è già localizzato in it.json, questi prefissi rimarrebbero in italiano hardcoded. Vanno estratti come chiavi distinte (es. `sr.prefix.error`, `sr.prefix.success`) e concatenati lato i18n.
- `'Errore nel campo ...: '` (riga 264) è un secondo template con prefisso "Errore" — stessa problematica.

### Duplicati esatti
- `'attivato'` / `'disattivato'` compaiono identici sia in `announceFilter()` (riga 160) che in `announceToggleState()` (riga 272). Una singola chiave di localizzazione `sr.state.enabled` / `sr.state.disabled` può coprire entrambi.

### Template con sotto-stringhe composte
- `announceBudgetStatus()` e `announceSavingsGoalProgress()` costruiscono il messaggio finale concatenando una stringa fissa con una sotto-stringa scelta in un `if/else`. Nella migrazione i18n, ogni sotto-stringa dovrà avere una chiave propria (es. `sr.budget.exceeded`, `sr.budget.critical`, ecc.) e la chiave finale conterrà solo `{name}: {percentage}%, {status}`.

### Stringa lunga a singola responsabilità
- `'Aiuto scorciatoie da tastiera aperto. Usa Tab per navigare, Escape per chiudere'` (riga 289) è una stringa fissa con istruzione d'uso incorporata. Nelle versioni future potrebbe necessitare di essere spezzata in due chiavi (`sr.help.opened` + `sr.help.instructions`) per gestire varianti di piattaforma.

### use-talkback.ts — nessuna stringa utente
- Tutte le stringhe presenti in `use-talkback.ts` sono identificatori tecnici (sessionStorage keys, attributi DOM, classi CSS, messaggi di console). Nessuna stringa richiede localizzazione.
- I valori `'high'`, `'medium'`, `'low'` (livelli di confidenza) sono costanti interne al tipo `TalkBackState` e non vengono mai mostrate direttamente all'utente.
