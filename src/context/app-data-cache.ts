// ============================================================================
// PLAN 007 — Modulo isolato: readCachedDomainSnapshotPure
// ============================================================================
// Estratto da AppDataContext.tsx per consentire test unitari diretti
// senza dover montare l'intero Provider (che trascina la catena di import
// React Native, AsyncStorage, accessibilità, ecc.).
//
// Funzione pura asincrona: legge tutte e 5 le cache in parallelo, valida
// strutturalmente i payload (Array.isArray && !Promise), calcola isStale.
// Ritorna null su cache miss o validazione fallita.
//
// INVARIANTE 2 (DESIGN §11): ogni chiamata a readCache/isCacheStale è
// obbligatoriamente awaited via Promise.all. Bug N9 era causato dalla
// mancanza di await: i Promise pendenti passavano truthy il guard e .data
// risultava undefined. La validazione strutturale aggiunta blocca
// definitivamente questa classe di regressioni.

import type { Account, Transaction, Category, Budget, SavingsGoal } from '@/lib/types'
import { CACHE_TTL_MS, isCacheStale, readCache } from '@/lib/supabase/cache'

export type DomainSnapshot = {
  accounts: Account[]
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  savingsGoals: SavingsGoal[]
}

export async function readCachedDomainSnapshotPure(
  userId: string,
): Promise<{ snapshot: DomainSnapshot; isStale: boolean } | null> {
  const [accounts, transactions, categories, budgets, savingsGoals] =
    await Promise.all([
      readCache<Account[]>(userId, 'conti'),
      readCache<Transaction[]>(userId, 'transazioni'),
      readCache<Category[]>(userId, 'categorie'),
      readCache<Budget[]>(userId, 'budget'),
      readCache<SavingsGoal[]>(userId, 'obiettivi_risparmio'),
    ])

  if (!accounts || !transactions || !categories || !budgets || !savingsGoals) {
    return null
  }

  const candidate: Array<unknown> = [
    accounts.data,
    transactions.data,
    categories.data,
    budgets.data,
    savingsGoals.data,
  ]
  for (const val of candidate) {
    const isArray = Array.isArray(val)
    const isPromise =
      typeof (val as unknown as Promise<unknown> | null)?.then === 'function'
    if (!isArray || isPromise) return null
  }

  const staleFlags = await Promise.all([
    isCacheStale(userId, 'conti', CACHE_TTL_MS),
    isCacheStale(userId, 'transazioni', CACHE_TTL_MS),
    isCacheStale(userId, 'categorie', CACHE_TTL_MS),
    isCacheStale(userId, 'budget', CACHE_TTL_MS),
    isCacheStale(userId, 'obiettivi_risparmio', CACHE_TTL_MS),
  ])

  return {
    snapshot: {
      accounts: accounts.data,
      transactions: transactions.data,
      categories: categories.data,
      budgets: budgets.data,
      savingsGoals: savingsGoals.data,
    },
    isStale: staleFlags.some(Boolean),
  }
}
