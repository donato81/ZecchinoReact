// src/announcements/_utils/currency.ts
// Formatter vocale: "1234.56" -> "1.234,56 euro" (it-IT).
// Per pluralizzazioni complesse usa pluralize() separato; qui sempre "euro".

const formatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrencyVocal(amount: number): string {
  return `${formatter.format(amount)} euro`
}
