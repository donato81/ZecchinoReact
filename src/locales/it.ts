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

const it = {} as const

export type Strings = typeof it
export type StringKey = keyof Strings

export default it
