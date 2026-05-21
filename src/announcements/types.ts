// src/announcements/types.ts
// Tipi pubblici e mapping ActionType -> StringKey per il layer announcements.
//
// REGOLA: questo file non importa @/accessibility/engine. Solo @/accessibility/types
// è ammesso (per le re-export di Announcement/AnnouncementPriority).
import type { Announcement, AnnouncementPriority } from '@/accessibility/types'
import type { StringKey } from '@/locales/it'

export type { Announcement, AnnouncementPriority }

export type ActionType =
  | 'modifica'
  | 'elimina'
  | 'crea'
  | 'aggiunge'
  | 'salva'

export const actionKeyMap: Record<ActionType, StringKey> = {
  modifica: 'azione_modifica',
  elimina: 'azione_elimina',
  crea: 'azione_crea',
  aggiunge: 'azione_aggiunge',
  salva: 'azione_salva',
}
