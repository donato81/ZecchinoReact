$path = "c:\Users\forbi\OneDrive\Documenti\GitHub\ZecchinoReact\docs\2-projects\004-DESIGN_announcements-layer_v1_0_0.md"
$planRef = "../3-coding-plans/004-PLAN_announcements-layer_v1_0_0.md"
$planName = "004-PLAN_announcements-layer_v1_0_0.md"
$dash = [char]0x2014
$c = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
$orig = $c.Length
Write-Host "Originale: $orig"
function Rep($content, $pattern, $replacement) {
  $opts = [System.Text.RegularExpressions.RegexOptions]::Singleline
  $result = [regex]::Replace($content, $pattern, $replacement, $opts)
  $d = $content.Length - $result.Length
  Write-Host "  delta=$d"
  return $result
}
# TS blocks 3.2-13.2 (ogni sezione ha heading univoco)
$tsTasks = @(
  @{ heading="3.2 Codice TypeScript completo"; task="004.T1" },
  @{ heading="4.2 Codice TypeScript completo"; task="004.T2" },
  @{ heading="5.2 Codice TypeScript completo"; task="004.T3" },
  @{ heading="6.2 Codice TypeScript completo"; task="004.T4" },
  @{ heading="7.2 Codice TypeScript completo"; task="004.T5" },
  @{ heading="8.2 Codice TypeScript completo"; task="004.T6" },
  @{ heading="9.2 Codice TypeScript completo"; task="004.T7" },
  @{ heading="10.2 Codice TypeScript completo"; task="004.T8" },
  @{ heading="11.2 Codice TypeScript completo"; task="004.T9" },
  @{ heading="12.2 Codice TypeScript completo"; task="004.T10" },
  @{ heading="13.2 Codice TypeScript completo"; task="004.T11" }
)
foreach ($t in $tsTasks) {
  $h = [regex]::Escape("### $($t.heading)")
  $pattern = "(?s)($h\r?\n\r?\n)``````ts.*?``````(\r?\n)"
  $ref = "> **Implementazione estratta nel coding plan:** [$planName]($planRef) $dash Task **$($t.task)**"
  Write-Host "§$($t.heading.Substring(0,3)) $($t.task):"
  $c = Rep $c $pattern "`${1}$ref`${2}"
}
# §14.3 import code block (AuthContext)
Write-Host "§14.3:"
$c = Rep $c '(?s)(### 14\.3 Import da aggiungere\r?\n\r?\n)``````ts\r?\n.*?``````(\r?\n)' "`${1}> **Import estratti nel coding plan:** [$planName]($planRef) $dash Task **004.T12**`${2}"
# §14.5 code block in lockPrivate
Write-Host "§14.5:"
$c = Rep $c '(?s)(In ``lockPrivate``.*?:\r?\n\r?\n)``````ts\r?\n.*?``````(\r?\n)' "`${1}> **Codice estratto nel coding plan:** [$planName]($planRef) $dash Task **004.T12**`${2}"
# §15.3 import code block (AppDataContext)
Write-Host "§15.3:"
$c = Rep $c '(?s)(### 15\.3 Import da aggiungere\r?\n\r?\n)``````ts\r?\n.*?``````(\r?\n)' "`${1}> **Import estratti nel coding plan:** [$planName]($planRef) $dash Task **004.T13**`${2}"
# §16: replace bash blocks within section 16
$s16start = $c.IndexOf("## 16. Eliminazione file legacy")
$s17start = $c.IndexOf("## 17. Gate di validazione")
if ($s16start -ge 0 -and $s17start -gt $s16start) {
  Write-Host "§16 (bash blocks):"
  $s16 = $c.Substring($s16start, $s17start - $s16start)
  $s16new = [regex]::Replace($s16, '(?s)``````bash\r?\n.*?``````(\r?\n)', "> **Comandi estratti nel coding plan:** [$planName]($planRef) $dash Task **004.T14**`${1}", [System.Text.RegularExpressions.RegexOptions]::Singleline)
  Write-Host "  delta=$($s16.Length - $s16new.Length)"
  $c = $c.Substring(0, $s16start) + $s16new + $c.Substring($s17start)
}
# §17 gates: replace entire section with compact version
$s17start2 = $c.IndexOf("## 17. Gate di validazione")
$s18start = $c.IndexOf("## 18. Cosa NON viene affrontato")
if ($s17start2 -ge 0 -and $s18start -gt $s17start2) {
  Write-Host "§17 (gates):"
  $s17old = $c.Substring($s17start2, $s18start - $s17start2)
  $s17new = @"
## 17. Gate di validazione
> **Comandi di validazione completi estratti nel coding plan:** [$planName]($planRef) $dash Sezione **§4 Gate di completamento**
I gate verificano nell'ordine (tutti bloccanti):
1. **Gate 1** $dash ``locales/it.ts`` (STEP 1): compilazione TypeScript, conteggio entry oggetto.
2. **Gate 2** $dash ``announcements/types.ts`` (STEP 2): compilazione TypeScript, grep import ``engine`` assente.
3. **Gate 3** $dash ``announcements/_utils/*`` (STEP 3): compilazione TypeScript, grep import ``engine`` assente.
4. **Gate 4** $dash ``announcements/{ui,auth,accounts,budgets}.ts`` (STEP 4): compilazione TypeScript, grep import ``engine`` assente nei moduli di dominio.
5. **Gate 5** $dash ``announcements/index.ts`` (STEP 5): compilazione TypeScript, esattamente 1 import ``engine`` in tutto ``src/announcements/``.
6. **Gate 6** $dash patch context (STEP 6): compilazione TypeScript, grep residui ``useScreenReader``/``isScreenReaderActive`` (0 risultati).
7. **Gate 7** (finale) $dash eliminazione legacy (STEP 7): file assenti, build pulita.
---
"@
  Write-Host "  delta=$($s17old.Length - $s17new.Length)"
  $c = $c.Substring(0, $s17start2) + $s17new + $c.Substring($s18start)
}
# §20 commit sequence code block
Write-Host "§20 commit sequence:"
$c = Rep $c '(?s)(### Sequenza commit raccomandata\r?\n\r?\n)``````\r?\n.*?``````(\r?\n)' "`${1}> **Sequenza commit estratta nel coding plan:** [$planName]($planRef) $dash Sezione **§5 Sequenza commit**`${2}"
Write-Host "Finale: $($c.Length) (delta totale: $($orig - $c.Length))"
[System.IO.File]::WriteAllText($path, $c, [System.Text.Encoding]::UTF8)
Write-Host "SALVATO"
