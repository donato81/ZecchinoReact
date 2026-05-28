/**
 * Placeholder spec for DESIGN 015 and PLAN 015.
 * Implementation is intentionally deferred; only TODO scenarios are tracked here.
 */
import '../src/lib/supabase/repositories/notifiche';

describe('notifiche.repository', () => {
  it.todo('getAll restituisce le notifiche disponibili ordinate secondo il contratto del repository');
  it.todo('getUnreadCount conta solo notifiche non lette');
  it.todo('getUnreadByEntity restituisce solo notifiche non lette per entity e period key richiesti');
  it.todo('existsUnreadForEntityLevel distingue correttamente presenza e assenza di duplicati non letti');
  it.todo('markAsRead marca una singola notifica come letta');
  it.todo('markAllAsRead marca come lette tutte le notifiche pertinenti');
  it.todo('create salva metadata obbligatori level, percentage, threshold e budgetPeriodKey');
  it.todo('remove elimina la notifica richiesta');
  it.todo('removeExpired elimina le notifiche scadute solo quando richiesto dal lifecycle');
  it.todo('cleanupReadExpiredBefore elimina o pulisce notifiche lette antecedenti alla soglia');
});