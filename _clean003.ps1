$path = "c:\Users\forbi\OneDrive\Documenti\GitHub\ZecchinoReact\docs\2-projects\003-DESIGN_fix-accessibility-engine_v1.0.0.md"
$planRef = "../3-coding-plans/003-PLAN_fix-accessibility-engine_v1.0.0.md"
$planName = "003-PLAN_fix-accessibility-engine_v1.0.0.md"
$dash = [char]0x2014
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
Write-Host "Lunghezza originale: $($content.Length)"
function DoReplace($cnt, $pattern, $repl) {
  $opts = [System.Text.RegularExpressions.RegexOptions]::Singleline
  $result = [regex]::Replace($cnt, $pattern, $repl, $opts)
  $delta = $cnt.Length - $result.Length
  Write-Host "Pattern OK, delta = $delta"
  return $result
}
$ref1 = "> **Implementazione estratta nel coding plan:** [$planName]($planRef) $dash Task **003.T1**"
$ref2 = "> **Implementazione estratta nel coding plan:** [$planName]($planRef) $dash Task **003.T2**"
$ref3 = "> **Implementazione estratta nel coding plan:** [$planName]($planRef) $dash Task **003.T3**"
$ref4 = "> **Implementazione estratta nel coding plan:** [$planName]($planRef) $dash Task **003.T4**"
$ref5 = "> **Implementazione estratta nel coding plan:** [$planName]($planRef) $dash Task **003.T5**"
$ref67 = "> **Comandi e gate estratti nel coding plan:** [$planName]($planRef) $dash Tasks **003.T6**, **003.T7**"
$ref8 = "> **Comandi e gate estratti nel coding plan:** [$planName]($planRef) $dash Task **003.T8**"
$ref8s = "> **Comandi di validazione estratti nel coding plan:** [$planName]($planRef) $dash Sezione **Sezione 4 (Gate di completamento)**"
$ref11 = "> **Sequenza commit estratta nel coding plan:** [$planName]($planRef) $dash Sezione **Sezione 5 (Sequenza commit)**"
$content = DoReplace $content '(?s)(### 3\.2 Codice TypeScript completo\r?\n\r?\n)```ts.*?```(\r?\n)' "`${1}$ref1`${2}"
$content = DoReplace $content '(?s)(### 4\.2 Codice TypeScript completo\r?\n\r?\n)```ts.*?```(\r?\n)' "`${1}$ref2`${2}"
$content = DoReplace $content '(?s)(### 5\.4 Codice TypeScript completo\r?\n\r?\n)```ts.*?```(\r?\n)' "`${1}$ref3`${2}"
$content = DoReplace $content '(?s)(### 6\.2 `src/locales/it\.ts`\r?\n\r?\n)```ts.*?```(\r?\n)' "`${1}$ref4`${2}"
$content = DoReplace $content '(?s)(### 6\.3 `src/locales/index\.ts`\r?\n\r?\n)```ts.*?```(\r?\n)' "`${1}$ref5`${2}"
$content = DoReplace $content '(?s)(### Sequenza commit raccomandata\r?\n\r?\n)```\r?\n.*?```(\r?\n)' "`${1}$ref11`${2}"
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "Lunghezza finale: $($content.Length)"
Write-Host "DONE"
