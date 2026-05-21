// src/announcements/ui.ts
// 26 funzioni generiche UI che costruiscono Announcement senza
// chiamare l'engine. Priority default 'polite'; 'assertive' solo per errori.
import type { Announcement } from './types'
import { t } from './_utils/t'

function build(text: string, priority: Announcement['priority'] = 'polite'): Announcement {
  return { text, priority }
}

export function modificatoConSuccesso(name: string): Announcement {
  return build(t('modificato_con_successo', { name }))
}

export function eliminatoConSuccesso(name: string): Announcement {
  return build(t('eliminato_con_successo', { name }))
}

export function creatoConSuccesso(name: string): Announcement {
  return build(t('creato_con_successo', { name }))
}

export function aggiuntoConSuccesso(name: string): Announcement {
  return build(t('aggiunto_con_successo', { name }))
}

export function salvatoConSuccesso(name: string): Announcement {
  return build(t('salvato_con_successo', { name }))
}

export function operazioneCompletata(): Announcement {
  return build(t('operazione_completata'))
}

export function operazioneAnnullata(): Announcement {
  return build(t('operazione_annullata'))
}

export function erroreGenerico(): Announcement {
  return build(t('errore_generico'), 'assertive')
}

export function erroreRete(): Announcement {
  return build(t('errore_rete'), 'assertive')
}

export function erroreValidazione(): Announcement {
  return build(t('errore_validazione'), 'assertive')
}

export function caricamentoInCorso(): Announcement {
  return build(t('caricamento_in_corso'))
}

export function caricamentoCompletato(): Announcement {
  return build(t('caricamento_completato'))
}

export function nessunDato(): Announcement {
  return build(t('nessun_dato'))
}

export function nessunRisultato(): Announcement {
  return build(t('nessun_risultato'))
}

export function confermaRichiesta(): Announcement {
  return build(t('conferma_richiesta'))
}

export function confermaEliminazione(name: string): Announcement {
  return build(t('conferma_eliminazione', { name }))
}

export function modificaNonSalvata(): Announcement {
  return build(t('modifica_non_salvata'), 'assertive')
}

export function modificheSalvate(): Announcement {
  return build(t('modifiche_salvate'))
}

export function campoObbligatorio(name: string): Announcement {
  return build(t('campo_obbligatorio', { name }), 'assertive')
}

export function formatoNonValido(name: string): Announcement {
  return build(t('formato_non_valido', { name }), 'assertive')
}

export function importoNonValido(): Announcement {
  return build(t('importo_non_valido'), 'assertive')
}

export function dataNonValida(): Announcement {
  return build(t('data_non_valida'), 'assertive')
}

export function selezioneRichiesta(name: string): Announcement {
  return build(t('selezione_richiesta', { name }), 'assertive')
}

export function schermataAperta(name: string): Announcement {
  return build(t('schermata_aperta', { name }))
}

export function dialogoAperto(name: string): Announcement {
  return build(t('dialogo_aperto', { name }))
}

export function dialogoChiuso(): Announcement {
  return build(t('dialogo_chiuso'))
}
