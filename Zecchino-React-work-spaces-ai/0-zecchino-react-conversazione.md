primo comando:
PS C:\Users\forbi\OneDrive\Documenti\GitHub\ZecchinoReact> findstr /n "DESIGN 001 DESIGN 002" docs\todo-master.md
8:- **Ultimo Agente Attivo:** Agent-Code (implementazione DESIGN 004 completata ÔÇö layer `src/announcements/` operativo)
9:- **Blocco in Carico:** Nessuno ÔÇö DESIGN 001, 002, 003, 004 implementati.
14:- **Active Phase:** P0/P1/P2 completate. DESIGN 004 implementato:
18:- **Active Block:** Nessuno ÔÇö implementazione DESIGN 004 completata.
24:    `src/context/AppDataContext.tsx`. Dipendenza upstream: DESIGN 001 e 002
30:    al completamento di DESIGN 001 e DESIGN 002 su main (gate bloccante ┬º2).
47:- **Last Completed Task:** Implementazione DESIGN 003 ÔÇö Fix accessibility engine.
51:  ADR_001 aggiornato a v1.3.0 con eccezione 1.bis.
52:  DESIGN 001, 002, 003 tutti implementati e chiusi.
53:- **Last Validated Block:** DESIGN 001, 002, 003 ÔÇö implementazione completata
72:  dopo rimozione di "types": ["node"] in DESIGN 002.
73:  Non intervenire fuori dal perimetro dei DESIGN
81:- **Next Action:** Avviare validazione DESIGN 004 con il Consiglio AI.
83:  - `docs/2-projects/004-DESIGN_announcements-layer_v1_0_0.md`
86:  Procedura: identica ai cicli DESIGN 001/002/003
102:> (stato DRAFT) a partire da DESIGN 007. Copre i sei stati della
106:> `navigator.onLine` esplicitamente esclusa (competenza DESIGN 008).
114:> PLAN 001, DESIGN 002, PLAN 002, TODO 002 aggiornati. A2a su DESIGN 002 saltata (nessun riferimento riga presente).
115:> Prossimo passo: analisi gruppo DESIGN 003 e DESIGN 004.
117:> **Nota sessione analisi 2026-05-20:** Report analisi coerenza DESIGN 001 + DESIGN 002 generato (`docs/1-reports/REPORT_analisi-coerenza_DESIGN-001-002_v1.0.0.md`). In attesa di revisione da donny-81 e consiglio AI. Prossimo passo: revisione report e identificazione azioni correttive se necessarie. Punti critici da valutare: (C1) aggiornamento `App.test.tsx` con mock prima di procedere con DESIGN 002 PRE-3; (C2) rivalutazione Risk R5 in `screen-reader.ts` e aggiunta guard in `initializeLiveRegions`. Azioni documentali raccomandate: (A1) correzione riferimento stale "sezione 10 DESIGN" in PLAN 001; (A2) correzione offset righe 63-65ÔåÆ61-63 in DESIGN 002 e TODO 002; (A3) correzione ordine N6/N8/N11ÔåÆN11/N8/N6 nel titolo frontmatter DESIGN 002.
122:> - DESIGN 003 e 004 ripuliti da sezioni implementative.
173:- **Reference Documents:** docs/2-projects/003-DESIGN_fix-accessibility-engine_v1.0.0.md, docs/3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md
185:- **Reference Documents:** docs/2-projects/004-DESIGN_announcements-layer_v1_0_0.md, docs/3-coding-plans/004-PLAN_announcements-layer_v1_0_0.md
232:- **Reference Documents:** docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md, docs/3-coding-plans/001-PLAN_fix-blocchi-avvio_v0.1.0.md
246:- **Action:** Aggiungere il plugin module-resolver al campo plugins di babel.config.js con root ['./src'] e alias { '@': './src' } seguendo docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md sezione 2.
253:- **Action:** Aggiungere il plugin react-native-dotenv al campo plugins di babel.config.js con moduleName '@env' e path '.env' seguendo docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md sezione 2.
276:- **Reference Documents:** docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md, docs/3-coding-plans/001-PLAN_fix-blocchi-avvio_v0.1.0.md
290:- **Action:** In package.json modificare la versione di @react-native-async-storage/async-storage da ^3.0.2 a ^2.1.0 seguendo docs/2-projects/001-DESIGN_fix-blocchi-avvio_v0.1.0.md.
311:- **Reference Documents:** docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md, docs/3-coding-plans/002-PLAN_fix-provider-bootstrap_v0.2.0.md, docs/1-reports/REPORT_implementazione_STEP-002_v1.0.0.md
313:- **Block Status:** [~] IN PROGRESS (STEP 002 commit N11/N8/N6 eseguiti; gate runtime DIFFERITI per D3 ÔÇö `App.tsx` non monta `AuthProvider`)
325:- **Action:** Rimuovere l'import di sonner da AuthContext.tsx e sostituire ogni chiamata toast(...) con console.warn(...) come placeholder temporaneo, seguendo docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md.
332:- **Action:** Rimuovere l'import di @/components/ui/button da AuthContext.tsx e sostituire ogni utilizzo del componente Button con TouchableOpacity di React Native, seguendo docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md.
339:- **Action:** Rimuovere tutte le occorrenze di document.addEventListener, document.removeEventListener e qualsiasi riferimento all'oggetto document in AuthContext.tsx. Sostituire con commenti TODO che indicano la sostituzione futura con AppState in P2, seguendo docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md.
360:- **Reference Documents:** docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md, docs/3-coding-plans/002-PLAN_fix-provider-bootstrap_v0.2.0.md
374:- **Action:** Rimuovere l'import di sonner da AppDataContext.tsx e sostituire ogni chiamata toast(...) con console.warn(...) come placeholder temporaneo, seguendo docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md.
381:- **Action:** Aggiungere await davanti a tutte le chiamate a readCache e isCacheStale in AppDataContext.tsx che attualmente le invocano come sincrone, seguendo docs/2-projects/002-DESIGN_fix-provider-bootstrap_v0.2.0.md.
454:| P2.B2 | Riscrittura use-online-status.ts per RN (rif. DESIGN 008) | [ ] TODO | [ ] OPEN |
456:| P1.B3-PARZIALE | Avvio fix accessibility engine (DESIGN 003) ÔÇö creati types.ts, engine.ts, detection.ts | [x] DONE (parziale ÔÇö screen-reader.ts ancora da coprire in DESIGN specifico) | [~] DEFERRED |
459:| P3.B2-EXT | Stesura DESIGN 009 ÔÇö Export File Nativo | [X] DONE | [X] PASSED |
463:| P1.B4 | Documentazione DESIGN 004 completata (PLAN + TODO creati) | [x] DONE | [x] DONE |
464:| P1.B5 | Documentazione DESIGN 005 ÔÇö TODO 005 creato (PLAN 005 pronto per implementazione) | [x] DONE | [x] DONE |
466:| P1.B6 | Documentazione DESIGN 006 ÔÇö TODO 006 creato (PLAN 006 v1.1.0 pronto per implementazione a valle di PLAN 005) | [x] DONE | [x] DONE |
472:| 2026-05-22 | P0.B1 | Agent-Orchestrator | DONE | DESIGN 001 ÔÇö babel.config.js |
473:| 2026-05-22 | P0.B2 | Agent-Orchestrator | DONE | DESIGN 001 ÔÇö package.json |
474:| 2026-05-22 | P0.B3 | Agent-Orchestrator | DONE | DESIGN 001+002 ÔÇö AuthContext |
475:| 2026-05-22 | P0.B4 | Agent-Orchestrator | DONE | DESIGN 001+002 ÔÇö AppDataContext |
DESIGN 002 ÔÇö use-inactivity-timer.ts |
477:| 2026-05-22 | P2.B3 | Agent-Orchestrator | DONE | DESIGN 003 ÔÇö use-talkback.ts eliminato |
478:| 2026-05-22 | P1.B3-PARZIALE | Agent-Orchestrator | DONE (parziale) | DESIGN 003 ÔÇö accessibility engine |
480:| 2026-05-22 | P1.B4-IMPL | Agent-Code | DONE | DESIGN 004 ÔÇö `src/announcements/` operativo, AuthContext+AppDataContext migrati, legacy SR eliminati |
490:### Decision ID: ADR-001
500:### Decision ID: ADR-002
PS C:\Users\forbi\OneDrive\Documenti\GitHub\ZecchinoReact> 

secondo comando: 
PS C:\Users\forbi\OneDrive\Documenti\GitHub\ZecchinoReact> node -p "require('./package.json').dependencies['@react-native-async-storage/async-storage']"
^2.1.2
PS C:\Users\forbi\OneDrive\Documenti\GitHub\ZecchinoReact> 

esito comando 3: 
PS C:\Users\forbi\OneDrive\Documenti\GitHub\ZecchinoReact> npx tsc --noEmit 2>&1 | find /c "error TS"
8
PS C:\Users\forbi\OneDrive\Documenti\GitHub\ZecchinoReact> 