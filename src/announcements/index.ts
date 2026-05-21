// src/announcements/index.ts
// Entry point del layer announcements.
//
// QUESTO È L'UNICO FILE che importa @/accessibility/engine.
// Tutti gli altri file in src/announcements/ usano `import type` da ./types.
//
// USO CORRETTO:
//   import { announce, accounts, auth } from '@/announcements'
//   announce(accounts.announceAccountModified('Conto Principale'))
//
import { engine } from '@/accessibility/engine'
import type { Announcement } from './types'

export type { Announcement, AnnouncementPriority, ActionType } from './types'
export { actionKeyMap } from './types'

export function announce(announcement: Announcement): void {
  engine.announce(announcement)
}

export * as ui from './ui'
export * as auth from './auth'
export * as accounts from './accounts'
export * as budgets from './budgets'
