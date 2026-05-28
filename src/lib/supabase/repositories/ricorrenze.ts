import { supabase } from '../client'
import { RepositoryError, type DbRecurrence } from '../types'
import type { Recurrence, RecurrenceFrequency, RecurrenceType } from '../../types'
import { strings } from '@/locales'

export interface RecurrenceFilters {
  attiva?: boolean
  contoId?: string
}

type RecurrenceInput = Omit<Recurrence, 'id'>
type RecurrenceUpdateInput = Partial<Omit<Recurrence, 'id'>>

function toClient(row: DbRecurrence): Recurrence {
  return {
    id: row.id,
    contoId: row.conto_id,
    categoriaId: row.categoria_id ?? undefined,
    tipo: row.tipo as RecurrenceType,
    importo: row.importo,
    descrizione: row.descrizione,
    frequenza: row.frequenza as RecurrenceFrequency,
    dataInizio: row.data_inizio,
    dataFine: row.data_fine ?? undefined,
    ultimaGenerazione: row.ultima_generazione ?? undefined,
    prossimaGenerazione: row.prossima_generazione,
    attiva: row.attiva,
  }
}

function toDb(data: RecurrenceUpdateInput): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (data.contoId !== undefined) out.conto_id = data.contoId
  if ('categoriaId' in data) out.categoria_id = data.categoriaId ?? null
  if (data.tipo !== undefined) out.tipo = data.tipo
  if (data.importo !== undefined) out.importo = data.importo
  if (data.descrizione !== undefined) out.descrizione = data.descrizione
  if (data.frequenza !== undefined) out.frequenza = data.frequenza
  if (data.dataInizio !== undefined) out.data_inizio = data.dataInizio
  if ('dataFine' in data) out.data_fine = data.dataFine ?? null
  if ('ultimaGenerazione' in data) out.ultima_generazione = data.ultimaGenerazione ?? null
  if (data.prossimaGenerazione !== undefined) out.prossima_generazione = data.prossimaGenerazione
  if (data.attiva !== undefined) out.attiva = data.attiva
  return out
}

async function getUid(errorMessage: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new RepositoryError(errorMessage)
  return user.id
}

function getLocalDateReference(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function getAll(filters?: RecurrenceFilters): Promise<Recurrence[]> {
  let query = supabase
    .from('ricorrenze')
    .select('*')
    .order('prossima_generazione', { ascending: true })

  if (filters?.attiva !== undefined) query = query.eq('attiva', filters.attiva)
  if (filters?.contoId) query = query.eq('conto_id', filters.contoId)

  const { data, error } = await query
  if (error) throw new RepositoryError(strings['errors.ricorrenze.loadFailed'])
  return (data as DbRecurrence[]).map(toClient)
}

export async function getById(id: string): Promise<Recurrence> {
  const { data, error } = await supabase
    .from('ricorrenze')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new RepositoryError(strings['errors.ricorrenze.notFound'])
    }
    throw new RepositoryError(strings['errors.ricorrenze.loadFailed'])
  }

  return toClient(data as DbRecurrence)
}

export async function getDue(dataRiferimento?: string): Promise<Recurrence[]> {
  const dateReference = dataRiferimento ?? getLocalDateReference()

  const { data, error } = await supabase
    .from('ricorrenze')
    .select('*')
    .lte('prossima_generazione', dateReference)
    .eq('attiva', true)
    .or(`data_fine.is.null,data_fine.gte.${dateReference}`)
    .order('prossima_generazione', { ascending: true })

  if (error) throw new RepositoryError(strings['errors.ricorrenze.loadFailed'])
  return (data as DbRecurrence[]).map(toClient)
}

export async function create(input: RecurrenceInput): Promise<Recurrence> {
  const uid = await getUid(strings['errors.ricorrenze.createFailed'])
  const { data, error } = await supabase
    .from('ricorrenze')
    .insert({
      ...toDb(input),
      user_id: uid,
    })
    .select()
    .single()

  if (error) throw new RepositoryError(strings['errors.ricorrenze.createFailed'])
  return toClient(data as DbRecurrence)
}

export async function update(id: string, input: RecurrenceUpdateInput): Promise<Recurrence> {
  const { data, error } = await supabase
    .from('ricorrenze')
    .update(toDb(input))
    .eq('id', id)
    .select()
    .single()

  if (error) throw new RepositoryError(strings['errors.ricorrenze.updateFailed'])
  return toClient(data as DbRecurrence)
}

export async function deactivate(id: string): Promise<Recurrence> {
  const { data, error } = await supabase
    .from('ricorrenze')
    .update({ attiva: false })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new RepositoryError(strings['errors.ricorrenze.deactivateFailed'])
  return toClient(data as DbRecurrence)
}