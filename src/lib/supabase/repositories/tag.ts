import { supabase } from '../client';
import { RepositoryError, type DbTag } from '../types';
import type { Tag } from '../../types';
import { strings } from '@/locales';

type TagCreateInput = Omit<Tag, 'id' | 'usatoNVolte'> & {
  usatoNVolte?: number;
};
type TagUpdateInput = Partial<Omit<Tag, 'id' | 'usatoNVolte'>>;

function toClient(row: DbTag): Tag {
  return {
    id: row.id,
    nome: row.nome,
    colore: row.colore ?? undefined,
    icona: row.icona ?? undefined,
    usatoNVolte: row.usato_n_volte,
  };
}

function toDb(data: TagCreateInput | TagUpdateInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.nome !== undefined) out.nome = data.nome;
  if ('colore' in data) out.colore = data.colore ?? null;
  if ('icona' in data) out.icona = data.icona ?? null;
  return out;
}

async function getUid(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new RepositoryError(strings['errors.tag.createFailed']);
  return user.id;
}

export async function getAll(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tag')
    .select('*')
    .order('nome', { ascending: true });

  if (error) throw new RepositoryError(strings['errors.tag.loadFailed']);
  return (data as DbTag[]).map(toClient);
}

export async function getById(id: string): Promise<Tag> {
  const { data, error } = await supabase
    .from('tag')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new RepositoryError(strings['errors.tag.loadFailed']);
  return toClient(data as DbTag);
}

export async function create(input: TagCreateInput): Promise<Tag> {
  const uid = await getUid();
  const { data, error } = await supabase
    .from('tag')
    .insert({ ...toDb(input), user_id: uid, usato_n_volte: 0 })
    .select()
    .single();

  if (error) throw new RepositoryError(strings['errors.tag.createFailed']);
  return toClient(data as DbTag);
}

export async function update(id: string, input: TagUpdateInput): Promise<Tag> {
  const { data, error } = await supabase
    .from('tag')
    .update(toDb(input))
    .eq('id', id)
    .select()
    .single();

  if (error) throw new RepositoryError(strings['errors.tag.updateFailed']);
  return toClient(data as DbTag);
}

export async function remove(id: string): Promise<void> {
  const { error } = await supabase.from('tag').delete().eq('id', id);

  if (error) throw new RepositoryError(strings['errors.tag.deleteFailed']);
}
