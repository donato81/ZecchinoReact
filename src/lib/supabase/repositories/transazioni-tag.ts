import { supabase } from '../client';
import { RepositoryError, type DbTransactionTag } from '../types';
import { strings } from '@/locales';

export async function getTagsForTransaction(
  transactionId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('transazioni_tag')
    .select('tag_id')
    .eq('transazione_id', transactionId);

  if (error) throw new RepositoryError(strings['errors.tag.loadFailed']);
  return (data as DbTransactionTag[]).map(row => row.tag_id);
}

export async function getTagMapForTransactions(
  transactionIds: string[],
): Promise<Record<string, string[]>> {
  if (transactionIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('transazioni_tag')
    .select('transazione_id, tag_id')
    .in('transazione_id', transactionIds);

  if (error) throw new RepositoryError(strings['errors.tag.loadFailed']);

  const map = Object.fromEntries(
    transactionIds.map(transactionId => [transactionId, [] as string[]]),
  );
  for (const row of data as DbTransactionTag[]) {
    map[row.transazione_id]?.push(row.tag_id);
  }

  return map;
}

export async function setTagsForTransaction(
  transactionId: string,
  tagIds: string[],
): Promise<void> {
  const { error } = await supabase.rpc('set_transaction_tags', {
    p_transaction_id: transactionId,
    p_tag_ids: tagIds,
  });

  if (error) throw new RepositoryError(strings['errors.tag.setFailed']);
}

export async function addTag(
  transactionId: string,
  tagId: string,
): Promise<void> {
  const { error } = await supabase.rpc('add_tag_to_transaction', {
    p_transaction_id: transactionId,
    p_tag_id: tagId,
  });

  if (error)
    throw new RepositoryError(strings['errors.tag.addToTransactionFailed']);
}

export async function removeTag(
  transactionId: string,
  tagId: string,
): Promise<void> {
  const { error } = await supabase.rpc('remove_tag_from_transaction', {
    p_transaction_id: transactionId,
    p_tag_id: tagId,
  });

  if (error)
    throw new RepositoryError(
      strings['errors.tag.removeFromTransactionFailed'],
    );
}
