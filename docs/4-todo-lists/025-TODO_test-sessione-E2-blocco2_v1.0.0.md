---
tipo: todo
titolo: "TODO — Test Sessione E2 — Blocco 2: Contesti Base, Hook e Componenti (Parte 1)"
riferimento-plan: docs/3-coding-plans/025-PLAN_test-sessione-E2-blocco2_v1.0.0.md
versione: 1.0.0
data-creazione: 2026-06-30
stato: PENDING
ramo: main
agente: Antigravity
---

# TODO 025 — Test Sessione E2 — Blocco 2: Contesti Base, Hook e Componenti (Parte 1)

## 1. Stato / Snapshot

| Campo | Valore |
|---|---|
| Ultimo Agente Attivo | Antigravity |
| Blocco in Carico | Sessione E2 test — Blocco 2 Contesti e Hook (Parte 1) |
| Last Completed Task | Redazione Coding Plan e Todo List per Sessione E2 |
| Next Action | Esecuzione dei test per il Blocco 2 (Parte 1) |
| Open Threads | — |

---

## 2. Checklist Test per Modulo (in ordine di commit consigliato)

### COMMIT 1 — Unit test per bottoni e ActivityDetectorView

#### 1. ActivityDetectorView.tsx (`src/components/ActivityDetectorView.tsx` → `__tests__/ActivityDetectorView.test.tsx`)
- [ ] **Test 1:** Rilevatore touch - `onStartShouldSetResponder` chiama `onActivity` e ritorna false [Normale]
- [ ] **Test 2:** Rilevatore touch - `onMoveShouldSetResponder` non chiama nulla e ritorna false [Normale]
- [ ] **Test 3:** Piattaforma Windows - `onKeyDown` registrato ed esegue `onActivity` alla pressione di tasti [Normale/Limite]

#### 2. button.tsx (`src/components/ui/button.tsx` → `__tests__/button.test.tsx`)
- [ ] **Test 4:** Rendering - renderizza correttamente il testo interno (children) [Normale]
- [ ] **Test 5:** Interazione - la pressione del pulsante chiama la callback `onPress` [Normale]
- [ ] **Test 6:** Fallback legacy - la pressione del pulsante chiama `onClick` se `onPress` è omesso [Normale/Limite]
- [ ] **Test 7:** Pass-through - passa trasparente proprietà extra (es. `disabled`, `accessibilityLabel`) al TouchableOpacity nativo [Normale]

---

### COMMIT 2 — Test per use-inactivity-timer e use-haptic

#### 3. use-inactivity-timer.ts (`src/hooks/use-inactivity-timer.ts` → `__tests__/use-inactivity-timer.test.ts`)
- [ ] **Test 8:** `timeoutMinutes <= 0` - nessun timer avviato e stato `showWarning` forzato a false [Limite]
- [ ] **Test 9:** `timeoutMinutes > 0` - timer di warning e timer finale pianificati correttamente [Normale]
- [ ] **Test 10:** Scadenza warning - il passare del tempo (`timeout - 1` min) attiva lo stato `showWarning` [Normale]
- [ ] **Test 11:** Scadenza timeout - il passare del tempo completo disattiva `showWarning` e chiama `onTimeout` [Normale]
- [ ] **Test 12:** `resetTimer` (disattivato) - pulisce tutti i timer attivi e imposta `showWarning` a false [Limite]
- [ ] **Test 13:** `resetTimer` (attivo) - resetta lo stato e ri-pianifica le scadenze [Normale]
- [ ] **Test 14:** Unmount - cancella tutti i timer attivi in corso per prevenire leak di memoria [Normale]
- [ ] **Test 15:** Modifica runtime - cambiare `timeoutMinutes` dinamicamente cancella i vecchi e rischedula i nuovi timer [Normale/Limite]

#### 4. use-haptic.ts (`src/hooks/use-haptic.ts` → `__tests__/haptic-system.test.tsx`)
- [ ] **Test 16:** Inizializzazione - carica correttamente lo stato iniziale di `isEnabled` e `isSupported` dal modulo centrale `hapticSystem` [Normale]
- [ ] **Test 17:** `setEnabled` - chiama `hapticSystem.setEnabled` e aggiorna lo stato React di conseguenza [Normale]

---

### COMMIT 3 — Copertura per UserSettingsContext e NetworkStatusContext

#### 5. UserSettingsContext.tsx (`src/context/UserSettingsContext.tsx` → `__tests__/UserSettingsContext.test.tsx`)
- [ ] **Test 18:** Provider mount - `UserSettingsProvider` monta correttamente i figli avvolgendoli con lo stato [Normale]
- [ ] **Test 19:** Hook consumo - `useUserSettings` restituisce i dati validi se consumato dentro il provider [Normale]
- [ ] **Test 20:** Errore fuori provider - `useUserSettings` solleva eccezione esplicita se consumato all'esterno del provider [Errore]

#### 6. use-user-settings.ts (`src/hooks/use-user-settings.ts` → `__tests__/use-user-settings.test.ts`)
- [ ] **Test 21:** Inizializzazione defaults - carica preferenze di default in assenza di impostazioni utente cloud [Normale/Limite]
- [ ] **Test 22:** Inizializzazione cloud - carica preferenze Supabase (audio, grafiche, screen reader) e inizializza i sistemi audio/haptic [Normale]
- [ ] **Test 23:** `setVisibleCategories` - aggiorna lo stato locale solo a seguito del completamento della scrittura a DB [Normale]
- [ ] **Test 24:** `dismissBudgetAlert` - aggiunge e persiste l'id del budget in locale e DB [Normale]
- [ ] **Test 25:** `dismissBudgetAlert` - esegue early return se il budget è già dismesso [Limite]
- [ ] **Test 26:** `resetDismissedAlerts` - resetta le esclusioni a DB e nello stato locale [Normale]
- [ ] **Test 27:** `setAudioEnabled` - persiste e aggiorna lo stato audio in locale e sul sound system [Normale]
- [ ] **Test 28:** `setAudioVolume` - persiste e aggiorna il volume in locale e sul sound system [Normale]
- [ ] **Test 29:** `setHapticEnabled` (locale) - se utente non autenticato, aggiorna solo stato locale e hapticSystem [Limite]
- [ ] **Test 30:** `setHapticEnabled` (remoto) - se utente autenticato, persiste a DB, aggiorna locale e hapticSystem [Normale]
- [ ] **Test 31:** `setDisplayPreference` - persiste e aggiorna le proprietà di visualizzazione a DB e in locale [Normale]
- [ ] **Test 32:** `setScreenReaderPreference` - persiste e aggiorna le preferenze dello screen reader a DB e in locale [Normale]
- [ ] **Test 33:** `setTalkBackAdaptations` - convalida ed aggiorna gli adattamenti su cloud e locale [Normale]
- [ ] **Test 34:** `setTalkBackAdaptations` (errore) - rifiuta dati non conformi valorizzando `settingsError` [Errore]
- [ ] **Test 35:** `setTalkBackManualOverride` - persiste e aggiorna lo stato di override manuale [Normale]
- [ ] **Test 36:** `resetScreenReaderPreferences` - esegue il reset atomico di tutte le opzioni ai default nativi [Normale]

#### 7. NetworkStatusContext.tsx (`src/context/NetworkStatusContext.tsx` → `__tests__/use-network-status.spec.ts`)
- [ ] **Test 37:** Errore inizializzazione - eccezione in `NetInfo.addEventListener` attiva immediatamente il fail-safe `FAIL_SAFE_ONLINE` [Errore]
- [ ] **Test 38:** Errore unmount - eccezione in `unsubscribe` viene catturata stampando un warning senza mandare in crash l'app [Errore]

---

## 3. Chiusura Sessione

- [ ] **Verifica Compilazione:** Eseguire `npx tsc --noEmit` per garantire la stabilità di TypeScript.
- [ ] **Verifica Test:** Eseguire la suite completa tramite `npx jest` e assicurarsi che tutti i test passino.
- [ ] **Changelog:** Aggiornare `CHANGELOG.md` registrando la Sessione E2 (coding plan e todo list prodotti).
- [ ] **Todo Master:** Aggiornare `docs/todo-master.md` aggiungendo i riferimenti a PLAN 025 e TODO 025.
- [ ] **Push:** Eseguire commit e push su `main` con messaggio coerente.
