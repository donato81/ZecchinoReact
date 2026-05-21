// src/locales/index.ts
// Entry point per il sistema di localizzazione di ZecchinoReact.
//
// Esporta le stringhe della lingua attiva (it) e i tipi derivati.
// Aggiungere qui import di altre lingue quando il supporto multi-lingua
// sarà richiesto.
//
// NOTA: src/locales/it.ts non deve essere importato direttamente
// al di fuori di questa cartella.
import it from './it'

export type { Strings, StringKey } from './it'

export const strings = it
