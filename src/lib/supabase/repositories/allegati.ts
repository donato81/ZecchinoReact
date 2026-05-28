import { strings } from '@/locales'
import type { Allegato, AttachmentFileInput } from '../../types'
import { deleteAttachment, uploadAttachment } from '../storage'
import { supabase } from '../client'
import { RepositoryError, type DbAllegato } from '../types'

export interface AllegatoCreateInput {
  transazioneId: string
  file: AttachmentFileInput
  descrizione?: string
}

function toClient(row: DbAllegato): Allegato {
  return {
    id: row.id,
    transazioneId: row.transazione_id,
    nomeFile: row.nome_file,
    storagePath: row.storage_path,
    mimeType: row.mime_type as Allegato['mimeType'],
    dimensioneBytes: row.dimensione_bytes ?? undefined,
    descrizione: row.descrizione ?? undefined,
    miniaturaPath: row.miniatura_path ?? undefined,
    createdAt: row.created_at,
  }
}

async function getUid(errorMessage: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new RepositoryError(errorMessage)
  }

  return user.id
}

export async function getAll(transazioneId: string): Promise<Allegato[]> {
  const { data, error } = await supabase
    .from('allegati_transazioni')
    .select('*')
    .eq('transazione_id', transazioneId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new RepositoryError(strings['errors.allegati.loadFailed'])
  }

  return (data as DbAllegato[]).map(toClient)
}

export async function getById(id: string): Promise<Allegato> {
  const { data, error } = await supabase
    .from('allegati_transazioni')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new RepositoryError(strings['errors.allegati.loadFailed'])
  }

  return toClient(data as DbAllegato)
}

export async function create(input: AllegatoCreateInput): Promise<Allegato> {
  const userId = await getUid(strings['errors.allegati.uploadFailed'])
  const uploaded = await uploadAttachment(userId, input.transazioneId, input.file)

  const { data, error } = await supabase
    .from('allegati_transazioni')
    .insert({
      user_id: userId,
      transazione_id: input.transazioneId,
      nome_file: input.file.name,
      storage_path: uploaded.storagePath,
      mime_type: uploaded.mimeType,
      dimensione_bytes: uploaded.sizeBytes,
      descrizione: input.descrizione ?? null,
      miniatura_path: null,
    })
    .select()
    .single()

  if (error) {
    try {
      await deleteAttachment(uploaded.storagePath)
    } catch {
      // Best-effort compensating transaction: il rollback storage non deve mascherare il fail DB.
    }

    throw new RepositoryError(strings['errors.allegati.uploadFailed'])
  }

  return toClient(data as DbAllegato)
}

export async function remove(id: string): Promise<void> {
  const allegato = await getById(id)
  await deleteAttachment(allegato.storagePath)

  const { error } = await supabase
    .from('allegati_transazioni')
    .delete()
    .eq('id', id)

  if (error) {
    throw new RepositoryError(strings['errors.allegati.deleteFailed'])
  }
}