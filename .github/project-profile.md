---
initialized: true
scf_protected: true
scf_file_role: "config"
scf_merge_priority: 10
scf_merge_strategy: "user_protected"
active_plugins: []
scf_version: "1.2.0"
framework_edit_mode: true
scf_owner: "spark-base"
spark: true
framework_version: "3.4.0"
project_name: "ZecchinoReact"
project_description: "App React Native di finanza personale per Android, iOS e Windows, integrata con Supabase."
primary_language: "TypeScript"
secondary_languages:
	- "JavaScript"
	- "C++"
	- "Ruby"
ui_framework: "React Native"
test_runner: "Jest"
build_system: "npm"
package_manager: "npm"
platforms:
	- "Android"
	- "iOS"
	- "Windows"
backend: "Supabase"
setup_source: "inferred_from_repository"

---

# Project Profile

Questo file e la source of truth del framework installato nel workspace.

## Profilo

- Nome: ZecchinoReact
- Descrizione: App React Native di finanza personale per Android, iOS e Windows, integrata con Supabase.
- Linguaggio primario: TypeScript
- Linguaggi secondari: JavaScript, C++, Ruby
- Framework UI: React Native
- Test runner: Jest
- Build system: npm
- Piattaforme: Android, iOS, Windows
- Backend: Supabase

## Note setup

- Profilo inizializzato in autonomia dai metadati gia presenti nel repository.
- I plugin installati aggiornano `active_plugins` senza sovrascrivere il resto.
