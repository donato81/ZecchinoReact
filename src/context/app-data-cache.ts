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

import type {
  Account,
  Transaction,
  Category,
  Budget,
  SavingsGoal,
  Recurrence,
  Tag,
  PrestitoMutuo,
  PrestitoRimborso,
} from '@/lib/types';
import {
  CACHE_TTL_MS,
  isCacheStale,
  readCache,
  getCacheTtlMs,
} from '@/lib/supabase/cache';

export type DomainSnapshot = {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  ricorrenze: Recurrence[];
  tags: Tag[];
  transactionTagMap: Record<string, string[]>;
  prestiti: PrestitoMutuo[];
  prestitiRimborsi: PrestitoRimborso[];
};

export async function readCachedDomainSnapshotPure(
  userId: string,
): Promise<{ snapshot: DomainSnapshot; isStale: boolean } | null> {
  const [
    accounts,
    transactions,
    categories,
    budgets,
    savingsGoals,
    ricorrenze,
    tags,
    transactionTagMap,
  ] = await Promise.all([
    readCache<Account[]>(userId, 'conti'),
    readCache<Transaction[]>(userId, 'transazioni'),
    readCache<Category[]>(userId, 'categorie'),
    readCache<Budget[]>(userId, 'budget'),
    readCache<SavingsGoal[]>(userId, 'obiettivi_risparmio'),
    readCache<Recurrence[]>(userId, 'ricorrenze'),
    readCache<Tag[]>(userId, 'tag'),
    readCache<Record<string, string[]>>(userId, 'transazioni_tag'),
  ]);

  if (
    !accounts ||
    !transactions ||
    !categories ||
    !budgets ||
    !savingsGoals ||
    !ricorrenze ||
    !tags ||
    !transactionTagMap
  ) {
    return null;
  }

  const candidate: Array<unknown> = [
    accounts.data,
    transactions.data,
    categories.data,
    budgets.data,
    savingsGoals.data,
    ricorrenze.data,
    tags.data,
  ];
  for (const val of candidate) {
    const isArray = Array.isArray(val);
    const isPromise =
      typeof (val as unknown as Promise<unknown> | null)?.then === 'function';
    if (!isArray || isPromise) return null;
  }

  // Dominio prestiti: fail-soft, non blocca il bootstrap se manca
  let prestitiData: PrestitoMutuo[] = [];
  let prestitiRimborsiData: PrestitoRimborso[] = [];
  try {
    const [
      prestitiAttiviCache,
      prestitiSimulazioniCache,
      prestitiRimborsiCache,
    ] = await Promise.all([
      readCache<PrestitoMutuo[]>(userId, 'prestiti_attivi'),
      readCache<PrestitoMutuo[]>(userId, 'prestiti_simulazioni'),
      readCache<PrestitoRimborso[]>(userId, 'prestiti_rimborsi'),
    ]);
    const attivi = prestitiAttiviCache?.data;
    const simulazioni = prestitiSimulazioniCache?.data;
    if (Array.isArray(attivi) && Array.isArray(simulazioni)) {
      prestitiData = [...attivi, ...simulazioni];
    } else if (Array.isArray(attivi)) {
      prestitiData = attivi;
    } else if (Array.isArray(simulazioni)) {
      prestitiData = simulazioni;
    }
    if (
      prestitiRimborsiCache?.data &&
      Array.isArray(prestitiRimborsiCache.data)
    ) {
      prestitiRimborsiData = prestitiRimborsiCache.data;
    }
  } catch {
    // fail-soft: prestiti non devono bloccare il bootstrap
  }

  const staleFlags = await Promise.all([
    isCacheStale(userId, 'conti', CACHE_TTL_MS),
    isCacheStale(userId, 'transazioni', CACHE_TTL_MS),
    isCacheStale(userId, 'categorie', CACHE_TTL_MS),
    isCacheStale(userId, 'budget', CACHE_TTL_MS),
    isCacheStale(userId, 'obiettivi_risparmio', CACHE_TTL_MS),
    isCacheStale(userId, 'ricorrenze', CACHE_TTL_MS),
    isCacheStale(userId, 'tag', CACHE_TTL_MS),
    isCacheStale(userId, 'transazioni_tag', CACHE_TTL_MS),
  ]);

  return {
    snapshot: {
      accounts: accounts.data,
      transactions: transactions.data,
      categories: categories.data,
      budgets: budgets.data,
      savingsGoals: savingsGoals.data,
      ricorrenze: ricorrenze.data,
      tags: tags.data,
      transactionTagMap: transactionTagMap.data,
      prestiti: prestitiData,
      prestitiRimborsi: prestitiRimborsiData,
    },
    isStale: staleFlags.some(Boolean),
  };
}
