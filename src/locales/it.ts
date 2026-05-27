// src/locales/it.ts
// Stringhe localizzate in italiano per ZecchinoReact.
//
// File predisposto per future espansioni: le chiavi verranno aggiunte
// progressivamente nelle prossime fasi di sviluppo (DESIGN 004+).
// Al momento non contiene chiavi per evitare dipendenze da stringhe
// non ancora approvate. Usare StringKey per i type check.
//
// USO CORRETTO:
//   import { strings } from '@/locales'
//   const label = strings.accessibility.screenReaderEnabled
//
// NON IMPORTARE questo file direttamente da fuori src/locales/:
//   ❌ import { it } from '@/locales/it'
//   ✅ import { strings } from '@/locales'

export const it = {
  // --- UI generic (26) ---
  modificato_con_successo: '{name} modificato con successo.',
  eliminato_con_successo: '{name} eliminato con successo.',
  creato_con_successo: '{name} creato con successo.',
  aggiunto_con_successo: '{name} aggiunto con successo.',
  salvato_con_successo: '{name} salvato con successo.',
  operazione_completata: 'Operazione completata.',
  operazione_annullata: 'Operazione annullata.',
  errore_generico: 'Si è verificato un errore. Riprova.',
  errore_rete: 'Errore di rete. Controlla la connessione.',
  errore_validazione: 'Dati non validi. Controlla i campi inseriti.',
  caricamento_in_corso: 'Caricamento in corso.',
  caricamento_completato: 'Caricamento completato.',
  nessun_dato: 'Nessun dato disponibile.',
  nessun_risultato: 'Nessun risultato trovato.',
  conferma_richiesta: 'Conferma richiesta.',
  conferma_eliminazione: 'Confermi l\u2019eliminazione di {name}?',
  modifica_non_salvata: 'Modifica non salvata.',
  modifiche_salvate: 'Modifiche salvate.',
  campo_obbligatorio: 'Il campo {name} è obbligatorio.',
  formato_non_valido: 'Formato non valido per {name}.',
  importo_non_valido: 'Importo non valido.',
  data_non_valida: 'Data non valida.',
  selezione_richiesta: 'Selezione richiesta per {name}.',
  schermata_aperta: 'Schermata {name} aperta.',
  dialogo_aperto: 'Dialogo {name} aperto.',
  dialogo_chiuso: 'Dialogo chiuso.',

  // --- azione_* shorthand (5) ---
  azione_modifica: '{name} modificato.',
  azione_elimina: '{name} eliminato.',
  azione_crea: '{name} creato.',
  azione_aggiunge: '{name} aggiunto.',
  azione_salva: '{name} salvato.',

  // --- accounts (11) ---
  conto_creato: 'Nuovo conto {name} di tipo {type} creato con saldo iniziale di {amount}.',
  conto_modificato: 'Conto {name} modificato con successo.',
  conto_eliminato: 'Conto {name} eliminato.',
  conto_eliminato_con_movimenti: 'Conto {name} eliminato. Tutti i movimenti associati sono stati rimossi.',
  conto_eliminato_generico: 'Conto eliminato.',
  movimento_aggiunto: 'Movimento aggiunto: {type} {amount} sul conto {name}.',
  movimento_modificato: 'Movimento modificato con successo.',
  movimento_eliminato: 'Movimento eliminato.',
  trasferimento_completato: 'Trasferimento di {amount} da {from} a {to} completato.',
  saldo_conto: 'Saldo del conto {name}: {amount}.',
  movimenti_recenti: '{count} {plural_movimento} recenti.',

  // --- export/import shared (4) ---
  export_csv_completato: 'Dati esportati. {count} {plural_movimento} salvati in formato CSV.',
  export_completato: 'Esportazione completata. {count} {plural_elemento} esportati.',
  import_completato: 'Importazione completata. {count} {plural_elemento} importati.',
  export_in_corso: 'Esportazione in corso.',
  export_success_toast: 'Export completato',
  export_success_sr: 'Esportazione completata',
  export_already_in_progress_toast: 'Esportazione già in corso. Attendi il completamento.',
  export_already_in_progress_sr: 'Esportazione già in corso',
  export_permission_denied_toast: 'Permesso negato: concedi accesso allo storage',
  export_permission_denied_sr: 'Permesso negato',
  export_filesystem_error_toast: 'Errore di scrittura, riprova',
  export_filesystem_error_sr: 'Errore di scrittura',
  export_unsupported_platform_toast: 'Funzionalità non disponibile su questa piattaforma',
  export_unsupported_platform_sr: 'Funzionalità non disponibile',
  export_invalid_path_toast: 'Percorso non valido, scegline un altro',
  export_invalid_path_sr: 'Percorso non valido',
  export_insufficient_space_toast: 'Spazio insufficiente sul dispositivo',
  export_insufficient_space_sr: 'Spazio insufficiente',
  export_unknown_error_toast: "Errore durante l'esportazione",
  export_unknown_error_sr: 'Errore di esportazione',

  // --- budgets (18) ---
  budget_creato: 'Nuovo budget {name} creato. Importo target: {amount} per periodo {period}.',
  budget_modificato: 'Budget {name} modificato.',
  budget_eliminato: 'Budget {name} eliminato.',
  budget_eliminato_generico: 'Budget eliminato.',
  budget_superato: 'Attenzione: il budget {name} è stato superato. Hai speso {spent} su {target}.',
  budget_critico: 'Budget {name} al {percent} percento. Restano {remaining}.',
  budget_attenzione: 'Budget {name} al {percent} percento. Restano {remaining}.',
  budget_normale: 'Budget {name} al {percent} percento.',
  obiettivo_creato: 'Nuovo obiettivo di risparmio {name} creato. Target: {amount}.',
  obiettivo_modificato: 'Obiettivo {name} modificato.',
  obiettivo_eliminato: 'Obiettivo {name} eliminato.',
  obiettivo_eliminato_generico: 'Obiettivo eliminato.',
  obiettivo_completato: 'Obiettivo {name} completato. Hai raggiunto il 100 percento.',
  obiettivo_quasi_completato: 'Obiettivo {name} al {percent} percento. Mancano {remaining}.',
  obiettivo_progresso: 'Obiettivo {name} al {percent} percento.',
  notifica_budget_attenzione: 'Attenzione! Il budget {name} è al {percent} percento. Rimangono {remaining}.',
  notifica_budget_superato: 'Budget {name} superato! Hai speso {spent} su {target}.',
  categoria_creata: 'Nuova categoria {name} creata.',

  // --- auth / sessione (8) ---
  pin_non_configurato: 'PIN privato non configurato.',
  pin_non_valido: 'PIN privato non corretto. Riprova.',
  pin_gia_configurato: 'PIN privato già configurato.',
  conto_privato_sbloccato: 'Conto privato sbloccato.',
  conto_privato_bloccato: 'Conto privato bloccato.',
  pin_configurato: 'PIN privato configurato.',
  pin_modificato: 'PIN privato modificato.',
  pin_rimosso: 'PIN privato rimosso.',
  sessione_mantenuta: 'Sessione mantenuta attiva.',
  sessione_scadenza_avviso: 'Avviso scadenza sessione.',
  sessione_scadenza_testo: 'La tua sessione scadrà tra 1 minuto. Vuoi rimanere connesso?',
  sessione_rimani_connesso: 'Rimani connesso',
  sessione_esci_ora: 'Esci ora',
  bootstrap_offline_error: 'Connessione non disponibile. Effettua di nuovo il caricamento quando torni online.',
  bootstrap_timeout_error: 'Il caricamento iniziale dei dati ha richiesto troppo tempo. Riprova.',
  bootstrap_data_error: 'Errore durante il caricamento dei dati. Riprova.',
} as const

export type Strings = typeof it
export type StringKey = keyof Strings

export default it
