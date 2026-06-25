// src/announcements/auth.ts
// 8 funzioni di dominio per autenticazione e PIN privato.
// NESSUN prefisso "announce" nei nomi.
import type { Announcement } from './types';
import { t } from './_utils/t';

function build(
  text: string,
  priority: Announcement['priority'] = 'polite',
): Announcement {
  return { text, priority };
}

export function pinNotConfigured(): Announcement {
  return build(t('pin_non_configurato'), 'assertive');
}

export function pinInvalid(): Announcement {
  return build(t('pin_non_valido'), 'assertive');
}

export function privateUnlocked(): Announcement {
  return build(t('conto_privato_sbloccato'));
}

export function privateAccountLocked(): Announcement {
  return build(t('conto_privato_bloccato'));
}

export function pinSet(): Announcement {
  return build(t('pin_configurato'));
}

export function pinChanged(): Announcement {
  return build(t('pin_modificato'));
}

export function pinRemoved(): Announcement {
  return build(t('pin_rimosso'));
}

export function sessionKept(): Announcement {
  return build(t('sessione_mantenuta'));
}
