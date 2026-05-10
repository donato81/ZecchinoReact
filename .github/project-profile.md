---
initialized: true
scf_protected: true
scf_file_role: "config"
scf_merge_priority: 10
scf_merge_strategy: "user_protected"
active_plugins:
  - scf-master-codecrafter
scf_version: "1.2.0"
framework_edit_mode: false
scf_owner: "spark-base"
spark: true
framework_version: ""
project_name: "ZecchinoReact"
description: "App React Native per finanza personale con backend Supabase."
primary_language: "TypeScript"
secondary_languages:
  - "JavaScript"
ui_framework: "React Native"
test_runner: "Jest"
build_system: "npm"
architecture: "layered"

---

# Profilo del progetto

`ZecchinoReact` è un'app per finanza personale sviluppata in React Native con TypeScript. Il progetto supporta Android, iOS e Windows, usa Supabase come backend e adotta una struttura a livelli con cartelle `src/lib`, `src/hooks`, `src/context` e `src/components`.

Questo file è la source of truth del framework installato nel workspace e attesta che il progetto è stato inizializzato da Agent-Welcome.

> Nota: `framework_edit_mode` rimane `false` perché in questa fase Agent-Welcome modifica solo il profilo progetto e non altri file protetti del framework.
