import { supabase } from '../client'
import { RepositoryError, type DbUserSettings, type UserSettings, type UserPreferences } from '../types'

function toClient(row: DbUserSettings): UserSettings {
  return {
    nomeVisualizzato: row.nome_visualizzato,
    valutaDefault: row.valuta_default,
    pinPrivatoHash: row.pin_privato_hash,
    pinKdfSalt: row.pin_kdf_salt,
    preferences: row.preferences,
  }
}

const fieldMap: Record<keyof Omit<UserSettings, 'preferences'>, string> = {
  nomeVisualizzato: 'nome_visualizzato',
  valutaDefault: 'valuta_default',
  pinPrivatoHash: 'pin_privato_hash',
  pinKdfSalt: 'pin_kdf_salt',
}

async function getUid(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new RepositoryError('Utente non autenticato')
  return user.id
}

async function updateFields(
  campi: Partial<Record<keyof Omit<UserSettings, 'preferences'>, string | null>>
): Promise<UserSettings> {
  const uid = await getUid()
  const payload: Record<string, string | null> = {}

  for (const [campo, valore] of Object.entries(campi)) {
    if (valore !== undefined) {
      payload[fieldMap[campo as keyof typeof fieldMap]] = valore
    }
  }

  const response = await supabase
    .from('impostazioni_utente')
    .update(payload)
    .eq('user_id', uid)
    .select()
    .single()

  if (response.error) {
    throw new Error(`updateFields: aggiornamento fallito — ${response.error.message}`)
  }

  return toClient(response.data as DbUserSettings)
}

// Se il record esiste lo restituisce; altrimenti lo inserisce usando i default DB
// (il DEFAULT della colonna preferences contiene già le 28 chiavi P25 §3.4).
// Gestisce la race condition 23505 (unique violation) con retry select.
export async function getOrCreate(): Promise<UserSettings> {
  const uid = await getUid()

  const { data: existing, error: selectError } = await supabase
    .from('impostazioni_utente')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle()

  if (selectError) throw new RepositoryError(selectError)
  if (existing) return toClient(existing as DbUserSettings)

  const { data: created, error: insertError } = await supabase
    .from('impostazioni_utente')
    .insert({ user_id: uid })
    .select()
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: retry, error: retryError } = await supabase
        .from('impostazioni_utente')
        .select('*')
        .eq('user_id', uid)
        .single()
      if (retryError) throw new RepositoryError(retryError)
      return toClient(retry as DbUserSettings)
    }
    throw new RepositoryError(insertError)
  }

  return toClient(created as DbUserSettings)
}

export async function updateField(
  campo: keyof Omit<UserSettings, 'preferences'>,
  valore: string | null
): Promise<UserSettings> {
  return updateFields({ [campo]: valore })
}

// Merge JSONB atomico su singola chiave tramite RPC — non read-modify-write in JS.
// Richiede funzione PostgreSQL: update_impostazioni_preference(p_chiave text, p_valore jsonb)
// che esegue:
//   UPDATE impostazioni_utente
//   SET preferences = preferences || jsonb_build_object(p_chiave, p_valore),
//       updated_at = now()
//   WHERE user_id = auth.uid()
//   RETURNING *
export async function updatePreference(
  chiave: keyof UserPreferences,
  valore: boolean | number | string | object | null
): Promise<UserSettings> {
  const { data, error } = await supabase
    .rpc('update_impostazioni_preference', {
      p_chiave: String(chiave),
      p_valore: valore,
    })
  if (error) throw new RepositoryError(error)
  const rows = data as DbUserSettings[]
  if (!rows?.length) throw new RepositoryError('Impostazioni non trovate dopo il merge')
  return toClient(rows[0])
}

export async function updatePinHash(hash: string | null): Promise<void> {
  await updateField('pinPrivatoHash', hash)
}

/**
 * Aggiorna il salt PBKDF2 del PIN privato.
 * uso diretto vietato per impostare il PIN; usare esclusivamente updatePinHashAndSalt.
 */
export async function updatePinSalt(salt: string | null): Promise<void> {
  await updateField('pinKdfSalt', salt)
}

export async function updatePinHashAndSalt(
  hash: string | null,
  salt: string | null
): Promise<void> {
  if ((hash === null) !== (salt === null)) {
    throw new Error('updatePinHashAndSalt: hash e salt devono essere entrambi null o entrambi non-null')
  }

  await updateFields({
    pinPrivatoHash: hash,
    pinKdfSalt: salt,
  })
}
