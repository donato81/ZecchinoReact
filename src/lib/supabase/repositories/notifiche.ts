import { supabase } from '../client';
import { RepositoryError, type DbNotification } from '../types';
import type {
  AppNotification,
  NotificationMetadata,
  NotificationChannel,
  NotificationEntityType,
  NotificationType,
  NotificationLevel,
} from '../../types';
import { strings } from '@/locales';

export interface NotificationEntityFilters {
  entitaTipo: NotificationEntityType;
  entitaId: string;
  budgetPeriodKey?: string;
}

export interface NotificationCreateInput {
  tipo: NotificationType;
  titolo_key: string;
  messaggio_key?: string;
  letta?: boolean;
  canale?: NotificationChannel;
  schedulataPer?: string;
  entitaTipo?: NotificationEntityType;
  entitaId?: string;
  livello?: NotificationLevel;
  metadata: NotificationMetadata;
}

function toClient(row: DbNotification): AppNotification {
  return {
    id: row.id,
    tipo: row.tipo as NotificationType,
    titolo_key: row.titolo,
    messaggio_key: row.messaggio ?? undefined,
    letta: row.letta,
    canale: row.canale as NotificationChannel,
    schedulataPer: row.schedulata_per ?? undefined,
    entitaTipo: row.entita_tipo as NotificationEntityType | undefined,
    entitaId: row.entita_id ?? undefined,
    livello: (row.livello as NotificationLevel) ?? undefined,
    metadata: (row.metadata as NotificationMetadata) ?? undefined,
    createdAt: row.created_at,
  };
}

function toDb(input: NotificationCreateInput): Record<string, unknown> {
  return {
    tipo: input.tipo,
    titolo: input.titolo_key,
    messaggio: input.messaggio_key ?? null,
    letta: input.letta ?? false,
    canale: input.canale ?? 'inapp',
    schedulata_per: input.schedulataPer ?? null,
    entita_tipo: input.entitaTipo ?? null,
    entita_id: input.entitaId ?? null,
    livello: input.livello ?? null,
    metadata: input.metadata as Record<string, unknown>,
  };
}

async function getUid(errorMessage: string): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new RepositoryError(errorMessage);
  return user.id;
}

export async function getAll(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifiche')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new RepositoryError(strings['errors.notifiche.loadFailed']);
  return (data as DbNotification[]).map(toClient);
}

export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifiche')
    .select('*', { count: 'exact', head: true })
    .eq('letta', false);

  if (error) throw new RepositoryError(strings['errors.notifiche.loadFailed']);
  return count ?? 0;
}

export async function getUnreadByEntity(
  filters: NotificationEntityFilters,
): Promise<AppNotification[]> {
  let query = supabase
    .from('notifiche')
    .select('*')
    .eq('letta', false)
    .eq('entita_tipo', filters.entitaTipo)
    .eq('entita_id', filters.entitaId)
    .order('created_at', { ascending: false });

  if (filters.budgetPeriodKey) {
    query = query.contains('metadata', {
      budgetPeriodKey: filters.budgetPeriodKey,
    });
  }

  const { data, error } = await query;
  if (error) throw new RepositoryError(strings['errors.notifiche.loadFailed']);
  return (data as DbNotification[]).map(toClient);
}

export async function existsUnreadForEntityLevel(
  filters: NotificationEntityFilters & { level: NotificationLevel },
): Promise<boolean> {
  let query = supabase
    .from('notifiche')
    .select('*', { count: 'exact', head: true })
    .eq('letta', false)
    .eq('entita_tipo', filters.entitaTipo)
    .eq('entita_id', filters.entitaId)
    .contains('metadata', { level: filters.level });

  if (filters.budgetPeriodKey) {
    query = query.contains('metadata', {
      budgetPeriodKey: filters.budgetPeriodKey,
    });
  }

  const { count, error } = await query;
  if (error) throw new RepositoryError(strings['errors.notifiche.loadFailed']);
  return (count ?? 0) > 0;
}

export async function updateMetadata(
  id: string,
  metadata: NotificationMetadata,
): Promise<void> {
  const uid = await getUid('Impossibile aggiornare i metadata');
  const { error } = await supabase
    .from('notifiche')
    .update({ metadata: metadata as Record<string, unknown> })
    .eq('id', id)
    .select()
    .single();

  if (error)
    throw new RepositoryError(strings['errors.notifiche.markReadFailed']);
}

export async function markAsRead(id: string): Promise<AppNotification> {
  const { data, error } = await supabase
    .from('notifiche')
    .update({ letta: true })
    .eq('id', id)
    .select()
    .single();

  if (error)
    throw new RepositoryError(strings['errors.notifiche.markReadFailed']);
  return toClient(data as DbNotification);
}

export async function markAllAsRead(
  filters?: Partial<NotificationEntityFilters>,
): Promise<void> {
  let query = supabase
    .from('notifiche')
    .update({ letta: true })
    .eq('letta', false);

  if (filters?.entitaTipo) {
    query = query.eq('entita_tipo', filters.entitaTipo);
  }
  if (filters?.entitaId) {
    query = query.eq('entita_id', filters.entitaId);
  }
  if (filters?.budgetPeriodKey) {
    query = query.contains('metadata', {
      budgetPeriodKey: filters.budgetPeriodKey,
    });
  }

  const { error } = await query;
  if (error)
    throw new RepositoryError(strings['errors.notifiche.markAllReadFailed']);
}

export async function create(
  input: NotificationCreateInput,
): Promise<AppNotification> {
  const uid = await getUid(strings['errors.notifiche.createFailed']);
  const { data, error } = await supabase
    .from('notifiche')
    .insert({
      ...toDb(input),
      user_id: uid,
    })
    .select()
    .single();

  if (error)
    throw new RepositoryError(strings['errors.notifiche.createFailed']);
  return toClient(data as DbNotification);
}

export async function remove(id: string): Promise<void> {
  const { error } = await supabase.from('notifiche').delete().eq('id', id);

  if (error)
    throw new RepositoryError(strings['errors.notifiche.removeFailed']);
}

export async function removeExpired(
  referenceDate = new Date().toISOString(),
): Promise<void> {
  const { error } = await supabase
    .from('notifiche')
    .delete()
    .eq('letta', true)
    .lt('schedulata_per', referenceDate);

  if (error)
    throw new RepositoryError(strings['errors.notifiche.cleanupFailed']);
}

export async function cleanupReadExpiredBefore(
  cutoffDate: string,
): Promise<void> {
  const { error } = await supabase
    .from('notifiche')
    .delete()
    .eq('letta', true)
    .lt('created_at', cutoffDate);

  if (error)
    throw new RepositoryError(strings['errors.notifiche.cleanupFailed']);
}
