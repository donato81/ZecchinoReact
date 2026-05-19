# CHANGELOG

## [Unreleased]

### Docs — 2026-05-19

#### Aggiunto
- `docs/2-projects/005-DESIGN_sostituzione-crypto-N4_v0.3.0.md` (CREATED) — documento di design architetturale per N4: sostituzione di `crypto.subtle` con `@noble/ciphers` (pure-JS, compatibile con Hermes); include analisi payload, golden test vectors, tradeoff sicurezza, debolezza KDF documentata come rinviata
- `docs/3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md` (CREATED) — coding plan estratto da DESIGN 003, task T1-T8
- `docs/3-coding-plans/004-PLAN_announcements-layer_v1_0_0.md` (CREATED) — coding plan estratto da DESIGN 004, task T1-T14

#### Modificato
- `docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md` — rimosso contenuto tecnico-implementativo (code block, bash, gate di verifica); mantenuto contenuto logico-cognitivo §1–§7; PLAN 001 non richiede aggiornamenti
- `docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md` — rimosso contenuto tecnico-implementativo (code block, bash, gate di verifica); mantenuto contenuto logico-cognitivo §1–§5 incluse Opzione A/B per N6; PLAN 002 non richiede aggiornamenti
- `docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md` — sezioni implementative sostituite con riferimenti incrociati al coding plan 003
- `docs/2-projects/004-DESIGN_announcements-layer_v1_0_0.md` — sezioni implementative sostituite con riferimenti incrociati al coding plan 004
- `docs/todo-master.md` — Snapshot di Ripresa aggiornato; Reference Documents aggiunti a Fase P1 e P2


## [0.1.0] - 2026-05-13

### Origini del progetto
- App nata come applicazione web con GitHub

### Migrato
- Logica applicativa estratta dal file monolitico originale (1800+ righe)
  e suddivisa in file con responsabilità separate
- Salvataggio dati migrato da storage locale Spark a database Supabase
- Progetto migrato da applicazione web browser a React Native
- Componenti di interfaccia web rimossi; mantenuta solo la logica
  e il layer dati in preparazione alla riscrittura nativa

### Corretto
- Nessuna correzione ancora applicata in questa versione base
  (i fix B1-B6 saranno documentati nella versione 0.1.1)

### Noto
- B1: alias @/ non risolti da Metro (manca babel-plugin-module-resolver)
- B2: variabili ambiente Supabase non disponibili a runtime in RN
  (process.env non funziona in React Native, serve react-native-dotenv)
- B3: import sonner non compatibile con React Native
  (sonner è una libreria web)
- B4: componente Button importato da libreria DOM, non da React Native
- B5: versione AsyncStorage ^3.0.2 inesistente su npm
- B6: conseguenza diretta di B2, risolto quando B2 è risolto
