// src/announcements/_utils/dates.ts
// Formatter vocale di data: ISO "2026-12-31" -> "31 dicembre 2026".
// Restituisce stringa vuota se la data non è valida.

const formatter = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatDateVocal(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return formatter.format(d)
}
