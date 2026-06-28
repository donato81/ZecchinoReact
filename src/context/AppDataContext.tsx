import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Account,
  Transaction,
  TransactionInput,
  Category,
  Budget,
  SavingsGoal,
  Recurrence,
  Tag,
  AppNotification,
  PrestitoMutuo,
  PrestitoRimborso,
} from '@/lib/types';
import { formatCurrency, exportToCSV } from '@/lib/helpers';
import { t } from '@/announcements/_utils/t';
import { soundSystem } from '@/lib/sound-system';
import { hapticSystem } from '@/lib/haptic-system';
import {
  announce,
  accounts as accountsAnn,
  budgets as budgetsAnn,
} from '@/announcements';
import { exportFile, type ExportResult } from '@/lib/export-service';
import { createNotificationService } from '@/lib/notification-service';
import { storageCleanupService } from '@/lib/storage-cleanup-service';
import { strings } from '@/locales';

// Shim temporaneo — rimpiazzare con react-native-toast-message nella fase UI.
// Lo shim e' callable: i call site usano sia `toast(title, opts)` (in
// checkBudgetNotifications) sia `toast.success / .error / .warning`.
type ToastOpts = { description?: string; duration?: number };
type ToastFn = ((message: string, opts?: ToastOpts) => void) & {
  success: (message: string, opts?: ToastOpts) => void;
  error: (message: string, opts?: ToastOpts) => void;
  warning: (message: string, opts?: ToastOpts) => void;
};
const toastBase: (message: string, opts?: ToastOpts) => void = (
  message,
  opts,
) => console.info('[toast]', message, opts?.description ?? '');
const toast = toastBase as ToastFn;
toast.success = (message, opts) =>
  console.info('[toast:success]', message, opts?.description ?? '');
toast.error = (message, opts) =>
  console.error('[toast:error]', message, opts?.description ?? '');
toast.warning = (message, opts) =>
  console.warn('[toast:warning]', message, opts?.description ?? '');
import {
  getAll as getAllConti,
  create as createConto,
  update as updateConto,
  remove as removeConto,
} from '@/lib/supabase/repositories/conti';
import {
  getAll as getAllTransazioni,
  create as createTransazione,
  update as updateTransazione,
  remove as removeTransazione,
} from '@/lib/supabase/repositories/transazioni';
import {
  getAll as getAllCategorie,
  create as createCategoria,
  update as updateCategoria,
  remove as removeCategoria,
} from '@/lib/supabase/repositories/categorie';
import {
  getAll as getAllBudget,
  create as createBudgetItem,
  update as updateBudgetItem,
  remove as removeBudgetItem,
} from '@/lib/supabase/repositories/budget';
import {
  getAll as getAllObiettivi,
  create as createObiettivo,
  update as updateObiettivo,
  remove as removeObiettivo,
  updateProgress as updateObiettivoProgress,
} from '@/lib/supabase/repositories/obiettivi-risparmio';
import { getAll as getAllRicorrenze } from '@/lib/supabase/repositories/ricorrenze';
import {
  getAll as getAllTag,
  create as createTagRepository,
  update as updateTagRepository,
  remove as removeTagRepository,
} from '@/lib/supabase/repositories/tag';
import {
  getTagMapForTransactions,
  setTagsForTransaction as setTransactionTagsRepository,
  addTag as addTagToTransactionRepository,
  removeTag as removeTagFromTransactionRepository,
} from '@/lib/supabase/repositories/transazioni-tag';
import {
  getAll as getAllPrestiti,
  create as createPrestitoDb,
  update as updatePrestitoDb,
  promote as promotePrestitoDb,
  close as closePrestitoDb,
  deleteSimulation as deleteSimulationDb,
} from '@/lib/supabase/repositories/prestiti';
import {
  addRimborso as addRimborsoDb,
  deleteRimborso as deleteRimborsoDb,
  getAll as getAllRimborsi,
} from '@/lib/supabase/repositories/prestiti-rimborsi';
import {
  CACHE_TTL_MS,
  getCacheTtlMs,
  isCacheStale,
  readCache,
  writeCache,
  type CacheTable,
} from '@/lib/supabase/cache';
import {
  readCachedDomainSnapshotPure,
  type DomainSnapshot,
} from '@/context/app-data-cache';
import { useAuth } from '@/context/AuthContext';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { RepositoryError } from '@/lib/supabase/types';

type AppDataContextValue = {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  ricorrenze: Recurrence[];
  tags: Tag[];
  transactionTagMap: Record<string, string[]>;
  notifications: AppNotification[];
  notificationsHydrated: boolean;
  prestiti: PrestitoMutuo[];
  prestitiRimborsi: PrestitoRimborso[];
  isLoading: boolean;
  error: string | null;
  isDataReady: boolean;
  safeAccounts: Account[];
  safeTransactions: Transaction[];
  safeCategories: Category[];
  safeBudgets: Budget[];
  safeSavingsGoals: SavingsGoal[];
  safeRicorrenze: Recurrence[];
  safeTags: Tag[];
  safeTransactionTagMap: Record<string, string[]>;
  safeNotifications: AppNotification[];
  safePrestiti: PrestitoMutuo[];
  safePrestitiRimborsi: PrestitoRimborso[];
  // Repository actions
  addAccount: (data: Omit<Account, 'id'>) => Promise<void>;
  updateAccount: (
    id: string,
    data: Partial<Omit<Account, 'id'>>,
  ) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'cifrato'>) => Promise<void>;
  updateTransaction: (
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'cifrato'>>,
  ) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  addCategory: (data: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (
    id: string,
    data: Partial<Omit<Category, 'id'>>,
  ) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  addBudget: (data: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (
    id: string,
    data: Partial<Omit<Budget, 'id'>>,
  ) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
  addSavingsGoal: (data: Omit<SavingsGoal, 'id'>) => Promise<void>;
  updateSavingsGoal: (
    id: string,
    data: Partial<Omit<SavingsGoal, 'id'>>,
  ) => Promise<void>;
  updateSavingsGoalProgress: (
    id: string,
    importoCorrente: number,
  ) => Promise<void>;
  removeSavingsGoal: (id: string) => Promise<void>;
  addTag: (data: Omit<Tag, 'id' | 'usatoNVolte'>) => Promise<void>;
  updateTag: (
    id: string,
    data: Partial<Omit<Tag, 'id' | 'usatoNVolte'>>,
  ) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
  addTagToTransaction: (transactionId: string, tagId: string) => Promise<void>;
  removeTagFromTransaction: (
    transactionId: string,
    tagId: string,
  ) => Promise<void>;
  setTagsForTransaction: (
    transactionId: string,
    tagIds: string[],
  ) => Promise<void>;
  addPrestito: (data: Omit<PrestitoMutuo, 'id'>) => Promise<PrestitoMutuo>;
  updatePrestito: (
    id: string,
    data: Partial<Omit<PrestitoMutuo, 'id'>>,
  ) => Promise<PrestitoMutuo>;
  promotePrestito: (
    id: string,
    overrides?: Partial<
      Pick<
        PrestitoMutuo,
        'importoIniziale' | 'tassoAnnuo' | 'durataMesi' | 'dataInizio'
      >
    >,
  ) => Promise<PrestitoMutuo>;
  closePrestito: (id: string) => Promise<PrestitoMutuo>;
  deletePrestitoSimulazione: (id: string) => Promise<void>;
  addRimborso: (data: {
    prestitoId: string;
    importo: number;
    dataRimborso: string;
    quotaCapitale?: number;
    quotaInteressi?: number;
    note?: string;
  }) => Promise<PrestitoRimborso>;
  removeRimborso: (id: string) => Promise<void>;
  refreshAll: () => void;
  // Legacy handlers used by DialogsOverlay and other existing consumers
  handleSaveAccount: (account: Account) => void;
  handleSaveTransaction: (transaction: TransactionInput) => void;
  handleSaveBudget: (budget: Budget) => void;
  handleSaveSavingsGoal: (goal: SavingsGoal) => void;
  handleDeleteConfirm: () => void;
  handleExportCSV: (
    visibleTransactions: Transaction[],
    visibleAccounts: Account[],
  ) => Promise<void>;
  handleViewBudget: (
    budgetId: string,
    onNavigate: (budget: Budget) => void,
  ) => void;
  // Dialog transaction
  editingTransaction: Transaction | undefined;
  setEditingTransaction: (t: Transaction | undefined) => void;
  showTransactionDialog: boolean;
  setShowTransactionDialog: (v: boolean) => void;
  openNewTransactionDialog: () => void;
  openEditTransactionDialog: (tx: Transaction) => void;
  // Dialog delete (shared)
  deletingItem: {
    type: 'account' | 'transaction' | 'budget' | 'savingsGoal';
    id: string;
  } | null;
  setDeletingItem: (
    item: {
      type: 'account' | 'transaction' | 'budget' | 'savingsGoal';
      id: string;
    } | null,
  ) => void;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (v: boolean) => void;
  // Dialog account
  editingAccount: Account | undefined;
  setEditingAccount: (a: Account | undefined) => void;
  showAccountDialog: boolean;
  setShowAccountDialog: (v: boolean) => void;
  // Dialog budget
  showBudgetDialog: boolean;
  setShowBudgetDialog: (v: boolean) => void;
  editingBudget: Budget | undefined;
  setEditingBudget: (b: Budget | undefined) => void;
  // Dialog savings goal
  showSavingsGoalDialog: boolean;
  setShowSavingsGoalDialog: (v: boolean) => void;
  editingSavingsGoal: SavingsGoal | undefined;
  setEditingSavingsGoal: (g: SavingsGoal | undefined) => void;
  // Handler derivato
  handleAddFundsToGoal: (goal: SavingsGoal) => void;
  // Dialog keyboard shortcuts
  showKeyboardHelp: boolean;
  setShowKeyboardHelp: (v: boolean) => void;
  transitionTo?: (to: any, payload?: { error?: string | null }) => boolean;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

const NETWORK_INIT_FAILSAFE_TIMEOUT_MS = 3000;
const BOOTSTRAP_REMOTE_TIMEOUT_MS = 10_000;

type InternalBootstrapError = 'ERROR_NETWORK' | 'ERROR_DATA';

function createTimeoutError(): Error {
  return new Error('BOOTSTRAP_TIMEOUT');
}

function isBootstrapTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.message === 'BOOTSTRAP_TIMEOUT';
}

async function withBootstrapTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_resolve, reject) => {
        timeoutId = setTimeout(() => reject(createTimeoutError()), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
}

// ============================================================================
// T3 (PLAN 007): State machine esplicita del bootstrap
// ============================================================================
// 6 stati discreti (DESIGN §4). Tutti gli aggiornamenti dei flag React
// (isLoading, isDataReady, error) passano da transitionTo() in modo atomico.
type BootstrapState =
  | 'IDLE'
  | 'HYDRATING'
  | 'CACHE-READY'
  | 'REMOTE-SYNC'
  | 'READY'
  | 'ERROR';

// Matrice transizioni consentite (DESIGN §4)
const ALLOWED_TRANSITIONS: Readonly<
  Record<BootstrapState, ReadonlyArray<BootstrapState>>
> = {
  IDLE: ['HYDRATING'],
  HYDRATING: ['CACHE-READY', 'READY', 'ERROR', 'IDLE'],
  'CACHE-READY': ['REMOTE-SYNC', 'IDLE'],
  'REMOTE-SYNC': ['READY', 'ERROR', 'IDLE'],
  READY: ['REMOTE-SYNC', 'IDLE'],
  ERROR: ['HYDRATING', 'IDLE'],
};

function isTransitionAllowed(
  from: BootstrapState,
  to: BootstrapState,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

function updateTagUsageCounts(
  currentTags: Tag[],
  previousTagIds: string[],
  nextTagIds: string[],
): Tag[] {
  const deltas = new Map<string, number>();

  for (const tagId of nextTagIds) {
    if (!previousTagIds.includes(tagId)) {
      deltas.set(tagId, (deltas.get(tagId) ?? 0) + 1);
    }
  }

  for (const tagId of previousTagIds) {
    if (!nextTagIds.includes(tagId)) {
      deltas.set(tagId, (deltas.get(tagId) ?? 0) - 1);
    }
  }

  if (deltas.size === 0) {
    return currentTags;
  }

  return currentTags.map(tag => {
    const delta = deltas.get(tag.id);
    if (!delta) {
      return tag;
    }

    return {
      ...tag,
      usatoNVolte: Math.max(0, tag.usatoNVolte + delta),
    };
  });
}

function applyTagUsageDelta(
  currentTags: Tag[],
  tagIds: string[],
  delta: number,
): Tag[] {
  if (tagIds.length === 0 || delta === 0) {
    return currentTags;
  }

  const deltas = new Map<string, number>();
  for (const tagId of tagIds) {
    deltas.set(tagId, (deltas.get(tagId) ?? 0) + delta);
  }

  return currentTags.map(tag => {
    const tagDelta = deltas.get(tag.id);
    if (!tagDelta) {
      return tag;
    }

    return {
      ...tag,
      usatoNVolte: Math.max(0, tag.usatoNVolte + tagDelta),
    };
  });
}

async function loadDomainSnapshot(): Promise<DomainSnapshot> {
  const [
    accounts,
    transactions,
    categories,
    budgets,
    savingsGoals,
    ricorrenze,
    tags,
    prestiti,
    prestitiRimborsi,
  ] = await Promise.all([
    getAllConti(),
    getAllTransazioni(),
    getAllCategorie(),
    getAllBudget(),
    getAllObiettivi(),
    getAllRicorrenze(),
    getAllTag(),
    getAllPrestiti(),
    getAllRimborsi(),
  ]);

  return {
    accounts,
    transactions,
    categories,
    budgets,
    savingsGoals,
    ricorrenze,
    tags,
    prestiti,
    prestitiRimborsi,
    transactionTagMap: await getTagMapForTransactions(
      transactions.map((transaction: Transaction) => transaction.id),
    ),
  };
}

// ============================================================================
// PLAN 007 — T1: readCachedDomainSnapshotPure
// ============================================================================
// La funzione pura è definita in @/context/app-data-cache per consentire
// test unitari isolati (senza catena di import React Native). Qui la
// ri-esportiamo per back-compat con eventuali consumatori interni.
export { readCachedDomainSnapshotPure } from '@/context/app-data-cache';

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { isOffline, isInitialized: isNetworkInitialized } = useNetworkStatus();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [ricorrenze, setRicorrenze] = useState<Recurrence[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [transactionTagMap, setTransactionTagMap] = useState<
    Record<string, string[]>
  >({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsHydrated, setNotificationsHydrated] = useState(false);
  const [prestiti, setPrestiti] = useState<PrestitoMutuo[]>([]);
  const [prestitiRimborsi, setPrestitiRimborsi] = useState<PrestitoRimborso[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDataReady, setIsDataReady] = useState(false);

  // T3 (PLAN 007): stato esplicito del bootstrap + transizioni atomiche
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>('IDLE');
  const bootstrapStateRef = useRef<BootstrapState>('IDLE');

  // T4 (PLAN 007): generation counter per evitare race condition tra
  // hydration concorrenti (es. React 18 Strict Mode double-invoke,
  // refreshAll lanciato mentre il bootstrap è in volo, logout + relogin).
  const hydrationGen = useRef(0);
  const networkInitFallbackTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const tagsRef = useRef<Tag[]>([]);
  const transactionTagMapRef = useRef<Record<string, string[]>>({});
  const notificationServiceRef = useRef(createNotificationService());

  // T3: transitionTo aggiorna in modo atomico bootstrapState + flag derivati
  // (isLoading, isDataReady, error). Le transizioni vietate dalla matrice
  // ALLOWED_TRANSITIONS sono ignorate con warning diagnostico.
  const transitionTo = useCallback(
    (to: BootstrapState, payload?: { error?: string | null }): boolean => {
      const from = bootstrapStateRef.current;
      if (from === to) {
        // Idempotente: stessa fase, aggiorna solo payload se fornito
        if (payload && 'error' in payload) setError(payload.error ?? null);
        return true;
      }
      if (!isTransitionAllowed(from, to)) {
        console.warn(
          `[AppDataContext] Transizione vietata ${from} → ${to} (T3)`,
        );
        return false;
      }
      bootstrapStateRef.current = to;
      setBootstrapState(to);
      switch (to) {
        case 'IDLE':
          setIsLoading(false);
          setIsDataReady(false);
          setError(null);
          break;
        case 'HYDRATING':
          setIsLoading(true);
          setIsDataReady(false);
          setError(null);
          break;
        case 'CACHE-READY':
          setIsLoading(false);
          setIsDataReady(true);
          setError(payload?.error ?? null);
          break;
        case 'REMOTE-SYNC':
          setIsLoading(true);
          // isDataReady ed error preservati (background refresh)
          break;
        case 'READY':
          setIsLoading(false);
          setIsDataReady(true);
          setError(null);
          break;
        case 'ERROR':
          setIsLoading(false);
          setIsDataReady(false);
          setError(payload?.error ?? 'Errore sconosciuto');
          break;
      }
      return true;
    },
    [],
  );

  const [editingTransaction, setEditingTransaction] = useState<
    Transaction | undefined
  >(undefined);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{
    type: 'account' | 'transaction' | 'budget' | 'savingsGoal';
    id: string;
  } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(
    undefined,
  );
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(
    undefined,
  );
  const [showSavingsGoalDialog, setShowSavingsGoalDialog] = useState(false);
  const [editingSavingsGoal, setEditingSavingsGoal] = useState<
    SavingsGoal | undefined
  >(undefined);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const openNewTransactionDialog = useCallback(() => {
    setEditingTransaction(undefined);
    setShowTransactionDialog(true);
  }, []);

  const openEditTransactionDialog = useCallback((tx: Transaction) => {
    setEditingTransaction(tx);
    setShowTransactionDialog(true);
  }, []);

  const handleAddFundsToGoal = (goal: SavingsGoal) => {
    setEditingSavingsGoal(goal);
    setShowSavingsGoalDialog(true);
  };

  const safeAccounts = useMemo(() => accounts, [accounts]);
  const safeTransactions = useMemo(() => transactions, [transactions]);
  const safeCategories = useMemo(() => categories, [categories]);
  const safeBudgets = useMemo(() => budgets, [budgets]);
  const safeSavingsGoals = useMemo(() => savingsGoals, [savingsGoals]);
  const safeRicorrenze = useMemo(() => ricorrenze, [ricorrenze]);
  const safeTags = useMemo(() => tags, [tags]);
  const safeTransactionTagMap = useMemo(
    () => transactionTagMap,
    [transactionTagMap],
  );
  const safeNotifications = useMemo(() => notifications, [notifications]);
  const safePrestiti = useMemo(() => prestiti, [prestiti]);
  const safePrestitiRimborsi = useMemo(
    () => prestitiRimborsi,
    [prestitiRimborsi],
  );

  const applyDomainSnapshot = useCallback((snapshot: DomainSnapshot) => {
    setAccounts(snapshot.accounts);
    setTransactions(snapshot.transactions);
    setCategories(snapshot.categories);
    setBudgets(snapshot.budgets);
    setSavingsGoals(snapshot.savingsGoals);
    setRicorrenze(snapshot.ricorrenze);
    tagsRef.current = snapshot.tags;
    transactionTagMapRef.current = snapshot.transactionTagMap;
    setTags(snapshot.tags);
    setTransactionTagMap(snapshot.transactionTagMap);
    setPrestiti(snapshot.prestiti || []);
    setPrestitiRimborsi(snapshot.prestitiRimborsi || []);
    notificationServiceRef.current.reset();
  }, []);

  const readCachedDomainSnapshot = useCallback(
    (userId: string) => readCachedDomainSnapshotPure(userId),
    [],
  );

  const clearNetworkInitFallbackTimer = useCallback(() => {
    if (networkInitFallbackTimerRef.current !== null) {
      clearTimeout(networkInitFallbackTimerRef.current);
      networkInitFallbackTimerRef.current = null;
    }
  }, []);

  const reportBootstrapFailure = useCallback(
    (kind: InternalBootstrapError, message: string, gen: number) => {
      if (gen !== hydrationGen.current) return;
      console.warn('[AppDataContext] bootstrap failure', { kind, message });
      transitionTo('ERROR', { error: message });
    },
    [transitionTo],
  );

  const runOnlineBootstrap = useCallback(
    async (userId: string, gen: number) => {
      try {
        const snapshot = await withBootstrapTimeout(
          loadDomainSnapshot(),
          BOOTSTRAP_REMOTE_TIMEOUT_MS,
        );
        if (gen !== hydrationGen.current) return;
        applyDomainSnapshot(snapshot);
        transitionTo('READY');
      } catch (error) {
        const message = isBootstrapTimeoutError(error)
          ? t('bootstrap_timeout_error')
          : t('bootstrap_data_error');
        reportBootstrapFailure(
          isBootstrapTimeoutError(error) ? 'ERROR_NETWORK' : 'ERROR_DATA',
          message,
          gen,
        );
      }
    },
    [applyDomainSnapshot, reportBootstrapFailure, transitionTo],
  );

  const hydrateFromCache = useCallback(
    async (userId: string, gen: number): Promise<boolean> => {
      // T2 (PLAN 007): await sulla cache asincrona
      // T4 (PLAN 007): gen guard prima di ogni applyDomainSnapshot/transitionTo
      const cached = await readCachedDomainSnapshot(userId);
      if (gen !== hydrationGen.current) return false;
      if (!cached) {
        transitionTo('ERROR', { error: t('bootstrap_offline_error') });
        return false;
      }
      if (gen !== hydrationGen.current) return false;
      applyDomainSnapshot(cached.snapshot);
      transitionTo('CACHE-READY', {
        error: cached.isStale
          ? t('bootstrap_data_error')
          : t('bootstrap_offline_error'),
      });
      return true;
    },
    [applyDomainSnapshot, readCachedDomainSnapshot, transitionTo],
  );

  // Bootstrap: carica tutti i dati al login, resetta al logout
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      // T4: invalida qualsiasi hydration in volo
      hydrationGen.current += 1;
      clearNetworkInitFallbackTimer();
      setAccounts([]);
      setTransactions([]);
      setCategories([]);
      setBudgets([]);
      setSavingsGoals([]);
      setRicorrenze([]);
      tagsRef.current = [];
      transactionTagMapRef.current = {};
      notificationServiceRef.current.reset();
      setTags([]);
      setTransactionTagMap({});
      setNotifications([]);
      setNotificationsHydrated(false);
      setPrestiti([]);
      setPrestitiRimborsi([]);
      transitionTo('IDLE');
      return;
    }

    if (
      bootstrapStateRef.current === 'HYDRATING' ||
      bootstrapStateRef.current === 'REMOTE-SYNC'
    ) {
      return;
    }

    if (!isNetworkInitialized) {
      clearNetworkInitFallbackTimer();
      networkInitFallbackTimerRef.current = setTimeout(() => {
        if (
          bootstrapStateRef.current === 'HYDRATING' ||
          bootstrapStateRef.current === 'REMOTE-SYNC'
        ) {
          return;
        }
        const myGen = ++hydrationGen.current;
        transitionTo('HYDRATING');
        void runOnlineBootstrap(user.id, myGen);
      }, NETWORK_INIT_FAILSAFE_TIMEOUT_MS);

      return () => {
        clearNetworkInitFallbackTimer();
      };
    }

    clearNetworkInitFallbackTimer();

    const myGen = ++hydrationGen.current;
    transitionTo('HYDRATING');

    if (isOffline) {
      void hydrateFromCache(user.id, myGen);
      return;
    }

    void runOnlineBootstrap(user.id, myGen);

    return () => {
      clearNetworkInitFallbackTimer();
    };
  }, [
    clearNetworkInitFallbackTimer,
    hydrateFromCache,
    isAuthenticated,
    isNetworkInitialized,
    isOffline,
    runOnlineBootstrap,
    transitionTo,
    user?.id,
  ]);

  // T5 (PLAN 007): persistenza cache fail-soft. Ogni writeCache è isolato
  // in try/catch: un errore su una tabella non blocca le altre né propaga
  // a React state. Loggato come warning per diagnostica.
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !isDataReady) return;
    const userId = user.id;
    const targets: Array<[CacheTable, unknown]> = [
      ['conti', accounts],
      ['transazioni', transactions],
      ['categorie', categories],
      ['budget', budgets],
      ['obiettivi_risparmio', savingsGoals],
      ['ricorrenze', ricorrenze],
      ['tag', tags],
      ['transazioni_tag', transactionTagMap],
      ['notifiche', notifications.filter(notification => !notification.letta)],
      ['prestiti_attivi', prestiti.filter(p => p.stato !== 'simulazione')],
      ['prestiti_simulazioni', prestiti.filter(p => p.stato === 'simulazione')],
      ['prestiti_rimborsi', prestitiRimborsi],
    ];
    void (async () => {
      for (const [table, data] of targets) {
        try {
          await writeCache(userId, table, data);
        } catch (error) {
          console.warn('[AppDataContext] writeCache fallito', { table, error });
        }
      }
    })();
  }, [
    accounts,
    budgets,
    categories,
    isAuthenticated,
    isDataReady,
    notifications,
    prestiti,
    prestitiRimborsi,
    ricorrenze,
    savingsGoals,
    tags,
    transactionTagMap,
    transactions,
    user?.id,
  ]);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !user?.id ||
      bootstrapState !== 'READY' ||
      notificationsHydrated
    )
      return;

    let cancelled = false;

    void (async () => {
      try {
        const cached = await readCache<AppNotification[]>(user.id, 'notifiche');
        const stale = await isCacheStale(
          user.id,
          'notifiche',
          getCacheTtlMs('notifiche'),
        );
        if (
          !cancelled &&
          cached?.data &&
          Array.isArray(cached.data) &&
          !stale
        ) {
          setNotifications(
            cached.data.filter(notification => !notification.letta),
          );
        }
      } catch {
        // fail-soft: la cache notifiche non deve interrompere il bootstrap principale
      }

      try {
        const unreadNotifications =
          await notificationServiceRef.current.hydrateUnreadNotifications();
        if (!cancelled) {
          setNotifications(unreadNotifications);
        }
      } catch {
        // fail-soft: manteniamo eventuale cache valida o stato vuoto
      } finally {
        if (!cancelled) {
          setNotificationsHydrated(true);
        }
      }

      try {
        await notificationServiceRef.current.cleanupReadyNotifications();
      } catch {
        // cleanup post-hydration best effort
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bootstrapState, isAuthenticated, notificationsHydrated, user?.id]);

  const refreshAll = () => {
    if (!user?.id) return;
    // Blocca refresh se hydration iniziale ancora in corso
    if (bootstrapStateRef.current === 'HYDRATING') return;
    if (bootstrapStateRef.current === 'REMOTE-SYNC') return;

    // T4: nuova generazione anche per refresh manuale
    const myGen = ++hydrationGen.current;
    const fromReady =
      bootstrapStateRef.current === 'READY' ||
      bootstrapStateRef.current === 'CACHE-READY';

    if (fromReady) {
      transitionTo('REMOTE-SYNC');
    } else {
      transitionTo('HYDRATING');
    }

    setNotificationsHydrated(false);

    const userId = user.id;
    const reloadData = async () => {
      if (isOffline) {
        reportBootstrapFailure(
          'ERROR_NETWORK',
          t('bootstrap_offline_error'),
          myGen,
        );
        return;
      }

      try {
        const snapshot = await withBootstrapTimeout(
          loadDomainSnapshot(),
          BOOTSTRAP_REMOTE_TIMEOUT_MS,
        );
        if (myGen !== hydrationGen.current) return;
        applyDomainSnapshot(snapshot);
        transitionTo('READY');
      } catch (error) {
        const fromReadyState = bootstrapStateRef.current === 'REMOTE-SYNC';
        if (myGen !== hydrationGen.current) return;
        if (fromReadyState) {
          transitionTo('CACHE-READY', {
            error: isBootstrapTimeoutError(error)
              ? t('bootstrap_timeout_error')
              : t('bootstrap_data_error'),
          });
          return;
        }
        reportBootstrapFailure(
          isBootstrapTimeoutError(error) ? 'ERROR_NETWORK' : 'ERROR_DATA',
          isBootstrapTimeoutError(error)
            ? t('bootstrap_timeout_error')
            : t('bootstrap_data_error'),
          myGen,
        );
      }
    };

    void reloadData();
  };

  // --- Repository actions (pure, no UX side effects) ---

  const addAccount = async (data: Omit<Account, 'id'>): Promise<void> => {
    const saved = await createConto(data);
    setAccounts(prev => [...prev, saved]);
  };

  const updateAccount = async (
    id: string,
    data: Partial<Omit<Account, 'id'>>,
  ): Promise<void> => {
    const saved = await updateConto(id, data);
    setAccounts(prev => prev.map(a => (a.id === id ? saved : a)));
  };

  const removeAccount = async (id: string): Promise<void> => {
    const removedTransactions = transactions.filter(
      transaction =>
        transaction.contoId === id || transaction.contoDestinazioneId === id,
    );
    const removedTransactionIds = new Set(
      removedTransactions.map(transaction => transaction.id),
    );
    const removedTagIds = removedTransactions.flatMap(
      transaction => transactionTagMapRef.current[transaction.id] ?? [],
    );

    await removeConto(id);
    setAccounts(prev => prev.filter(a => a.id !== id));
    setTransactions(prev =>
      prev.filter(t => t.contoId !== id && t.contoDestinazioneId !== id),
    );
    transactionTagMapRef.current = Object.fromEntries(
      Object.entries(transactionTagMapRef.current).filter(
        ([transactionId]) => !removedTransactionIds.has(transactionId),
      ),
    );
    tagsRef.current = applyTagUsageDelta(tagsRef.current, removedTagIds, -1);
    setTransactionTagMap(transactionTagMapRef.current);
    setTags(tagsRef.current);
  };

  const addTransaction = async (
    data: Omit<Transaction, 'id' | 'cifrato'>,
  ): Promise<void> => {
    const saved = await createTransazione(data);
    setTransactions(prev => [...prev, saved]);
  };

  const updateTransaction = async (
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'cifrato'>>,
  ): Promise<void> => {
    const saved = await updateTransazione(id, data);
    setTransactions(prev => prev.map(t => (t.id === id ? saved : t)));
  };

  const removeTransaction = async (id: string): Promise<void> => {
    const removedTagIds = transactionTagMapRef.current[id] ?? [];

    await removeTransazione(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    const nextMap = { ...transactionTagMapRef.current };
    delete nextMap[id];
    transactionTagMapRef.current = nextMap;
    tagsRef.current = applyTagUsageDelta(tagsRef.current, removedTagIds, -1);
    setTransactionTagMap(nextMap);
    setTags(tagsRef.current);
    if (user?.id) {
      void storageCleanupService
        .cleanupTransactionOrphans(user.id, id)
        .catch(() => undefined);
    }
  };

  const addCategory = async (data: Omit<Category, 'id'>): Promise<void> => {
    const saved = await createCategoria(data);
    setCategories(prev => [...prev, saved]);
  };

  const updateCategory = async (
    id: string,
    data: Partial<Omit<Category, 'id'>>,
  ): Promise<void> => {
    const saved = await updateCategoria(id, data);
    setCategories(prev => prev.map(c => (c.id === id ? saved : c)));
  };

  const removeCategory = async (id: string): Promise<void> => {
    try {
      await removeCategoria(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      if (err instanceof RepositoryError && err.code === '23503') {
        const message =
          "Impossibile eliminare la categoria: è usata da movimenti esistenti. Riassegna prima i movimenti a un'altra categoria.";
        setError(message);
        throw new Error(message);
      }
      throw err;
    }
  };

  const addBudget = async (data: Omit<Budget, 'id'>): Promise<void> => {
    const saved = await createBudgetItem(data);
    setBudgets(prev => [...prev, saved]);
  };

  const updateBudget = async (
    id: string,
    data: Partial<Omit<Budget, 'id'>>,
  ): Promise<void> => {
    const saved = await updateBudgetItem(id, data);
    setBudgets(prev => prev.map(b => (b.id === id ? saved : b)));
  };

  const removeBudget = async (id: string): Promise<void> => {
    await removeBudgetItem(id);
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  const addSavingsGoal = async (
    data: Omit<SavingsGoal, 'id'>,
  ): Promise<void> => {
    const saved = await createObiettivo(data);
    setSavingsGoals(prev => [...prev, saved]);
  };

  const updateSavingsGoal = async (
    id: string,
    data: Partial<Omit<SavingsGoal, 'id'>>,
  ): Promise<void> => {
    const saved = await updateObiettivo(id, data);
    setSavingsGoals(prev => prev.map(g => (g.id === id ? saved : g)));
  };

  const updateSavingsGoalProgress = async (
    id: string,
    importoCorrente: number,
  ): Promise<void> => {
    const saved = await updateObiettivoProgress(id, importoCorrente);
    setSavingsGoals(prev => prev.map(g => (g.id === id ? saved : g)));
  };

  const removeSavingsGoal = async (id: string): Promise<void> => {
    await removeObiettivo(id);
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
  };

  const addTag = async (
    data: Omit<Tag, 'id' | 'usatoNVolte'>,
  ): Promise<void> => {
    const saved = await createTagRepository(data);
    tagsRef.current = [...tagsRef.current, saved];
    setTags(tagsRef.current);
  };

  const updateTag = async (
    id: string,
    data: Partial<Omit<Tag, 'id' | 'usatoNVolte'>>,
  ): Promise<void> => {
    const saved = await updateTagRepository(id, data);
    tagsRef.current = tagsRef.current.map(tag => (tag.id === id ? saved : tag));
    setTags(tagsRef.current);
  };

  const removeTag = async (id: string): Promise<void> => {
    await removeTagRepository(id);
    tagsRef.current = tagsRef.current.filter(tag => tag.id !== id);
    transactionTagMapRef.current = Object.fromEntries(
      Object.entries(transactionTagMapRef.current).map(
        ([transactionId, tagIds]) => [
          transactionId,
          tagIds.filter(tagId => tagId !== id),
        ],
      ),
    );
    setTags(tagsRef.current);
    setTransactionTagMap(transactionTagMapRef.current);
  };

  const addTagToTransaction = async (
    transactionId: string,
    tagId: string,
  ): Promise<void> => {
    await addTagToTransactionRepository(transactionId, tagId);
    const previousTagIds = transactionTagMapRef.current[transactionId] ?? [];
    const nextTagIds = previousTagIds.includes(tagId)
      ? previousTagIds
      : [...previousTagIds, tagId];
    transactionTagMapRef.current = {
      ...transactionTagMapRef.current,
      [transactionId]: nextTagIds,
    };
    tagsRef.current = updateTagUsageCounts(
      tagsRef.current,
      previousTagIds,
      nextTagIds,
    );
    setTransactionTagMap(transactionTagMapRef.current);
    setTags(tagsRef.current);
  };

  const removeTagFromTransaction = async (
    transactionId: string,
    tagId: string,
  ): Promise<void> => {
    await removeTagFromTransactionRepository(transactionId, tagId);
    const previousTagIds = transactionTagMapRef.current[transactionId] ?? [];
    const nextTagIds = previousTagIds.filter(
      currentTagId => currentTagId !== tagId,
    );
    transactionTagMapRef.current = {
      ...transactionTagMapRef.current,
      [transactionId]: nextTagIds,
    };
    tagsRef.current = updateTagUsageCounts(
      tagsRef.current,
      previousTagIds,
      nextTagIds,
    );
    setTransactionTagMap(transactionTagMapRef.current);
    setTags(tagsRef.current);
  };

  const setTagsForTransaction = async (
    transactionId: string,
    tagIds: string[],
  ): Promise<void> => {
    await setTransactionTagsRepository(transactionId, tagIds);
    const previousTagIds = transactionTagMapRef.current[transactionId] ?? [];
    const nextTagIds = [...new Set(tagIds)];
    transactionTagMapRef.current = {
      ...transactionTagMapRef.current,
      [transactionId]: nextTagIds,
    };
    tagsRef.current = updateTagUsageCounts(
      tagsRef.current,
      previousTagIds,
      nextTagIds,
    );
    setTransactionTagMap(transactionTagMapRef.current);
    setTags(tagsRef.current);
  };

  const addPrestito = async (
    data: Omit<PrestitoMutuo, 'id'>,
  ): Promise<PrestitoMutuo> => {
    // Le simulazioni non vengono persistite nel DB
    if (data.stato === 'simulazione') {
      const { calcolaSimulazione, calcolaDataFinePrevista } = await import(
        '@/lib/loan-calculator'
      );
      const simulazione = calcolaSimulazione({
        importo: data.importoIniziale,
        tassoAnnuo: data.tassoAnnuo ?? 0,
        durataMesi: data.durataMesi ?? 1,
        dataInizio: data.dataInizio,
      });
      const id = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const nuovoPrestito: PrestitoMutuo = {
        ...data,
        id,
        rataMensile: simulazione.rataMensile,
        totaleInteressi: simulazione.totaleInteressi,
        dataFinePrevista: data.durataMesi
          ? calcolaDataFinePrevista(data.dataInizio, data.durataMesi)
          : undefined,
        saldoResiduo: data.importoIniziale,
      };
      setPrestiti(prev => [...prev, nuovoPrestito]);
      return nuovoPrestito;
    }
    const saved = await createPrestitoDb(data);
    setPrestiti(prev => [...prev, saved]);
    return saved;
  };

  const updatePrestito = async (
    id: string,
    data: Partial<Omit<PrestitoMutuo, 'id'>>,
  ): Promise<PrestitoMutuo> => {
    if (id.startsWith('sim-')) {
      // Aggiorna simulazione locale
      const prestito = prestiti.find(p => p.id === id);
      if (!prestito) throw new Error('Simulazione non trovata');

      const nextData = { ...prestito, ...data };
      const { calcolaSimulazione, calcolaDataFinePrevista } = await import(
        '@/lib/loan-calculator'
      );
      const simulazione = calcolaSimulazione({
        importo: nextData.importoIniziale,
        tassoAnnuo: nextData.tassoAnnuo ?? 0,
        durataMesi: nextData.durataMesi ?? 1,
        dataInizio: nextData.dataInizio,
      });

      const aggiornato: PrestitoMutuo = {
        ...nextData,
        rataMensile: simulazione.rataMensile,
        totaleInteressi: simulazione.totaleInteressi,
        dataFinePrevista: nextData.durataMesi
          ? calcolaDataFinePrevista(nextData.dataInizio, nextData.durataMesi)
          : undefined,
      };
      setPrestiti(prev => prev.map(p => (p.id === id ? aggiornato : p)));
      return aggiornato;
    }

    const prestitoDaAggiornare = prestiti.find(p => p.id === id);
    const saved = await updatePrestitoDb(id, data, prestitoDaAggiornare);
    setPrestiti(prev => prev.map(p => (p.id === id ? saved : p)));
    return saved;
  };

  const promotePrestito = async (
    id: string,
    overrides?: Partial<
      Pick<
        PrestitoMutuo,
        'importoIniziale' | 'tassoAnnuo' | 'durataMesi' | 'dataInizio'
      >
    >,
  ): Promise<PrestitoMutuo> => {
    if (id.startsWith('sim-')) {
      const simulazione = prestiti.find(p => p.id === id);
      if (!simulazione) throw new Error('Simulazione non trovata');

      const payload: Omit<PrestitoMutuo, 'id'> = {
        ...simulazione,
        ...overrides,
        stato: 'attivo',
      };

      const saved = await createPrestitoDb(payload);
      setPrestiti(prev => prev.map(p => (p.id === id ? saved : p)));
      return saved;
    }

    const saved = await promotePrestitoDb(id, overrides);
    setPrestiti(prev => prev.map(p => (p.id === id ? saved : p)));
    return saved;
  };

  const closePrestito = async (id: string): Promise<PrestitoMutuo> => {
    if (id.startsWith('sim-')) {
      throw new Error(
        'Impossibile chiudere una simulazione locale. Eliminala invece.',
      );
    }
    const saved = await closePrestitoDb(id);
    setPrestiti(prev => prev.map(p => (p.id === id ? saved : p)));
    return saved;
  };

  const deletePrestitoSimulazione = async (id: string): Promise<void> => {
    if (id.startsWith('sim-')) {
      setPrestiti(prev => prev.filter(p => p.id !== id));
      return;
    }
    await deleteSimulationDb(id);
    setPrestiti(prev => prev.filter(p => p.id !== id));
  };

  const addRimborso = async (data: {
    prestitoId: string;
    importo: number;
    dataRimborso: string;
    quotaCapitale?: number;
    quotaInteressi?: number;
    note?: string;
  }): Promise<PrestitoRimborso> => {
    if (data.prestitoId.startsWith('sim-')) {
      throw new Error('Impossibile rimborsare una simulazione.');
    }

    const saved = await addRimborsoDb(data);
    setPrestitiRimborsi(prev => [...prev, saved]);

    // Aggiorna in locale il saldo residuo del prestito
    setPrestiti(prev =>
      prev.map(p => {
        if (p.id !== data.prestitoId) return p;
        const amountDeducted = data.quotaCapitale ?? data.importo;
        const nuovoSaldo = Math.max(0, p.saldoResiduo - amountDeducted);
        return {
          ...p,
          saldoResiduo: nuovoSaldo,
          stato: nuovoSaldo <= 0 ? 'chiuso' : p.stato,
        };
      }),
    );
    return saved;
  };

  const removeRimborso = async (id: string): Promise<void> => {
    const rimborso = prestitiRimborsi.find(r => r.id === id);
    if (!rimborso) return;

    await deleteRimborsoDb(id);
    setPrestitiRimborsi(prev => prev.filter(r => r.id !== id));

    // Ripristina in locale il saldo residuo del prestito
    setPrestiti(prev =>
      prev.map(p => {
        if (p.id !== rimborso.prestitoId) return p;
        const amountAdded = rimborso.quotaCapitale ?? rimborso.importo;
        const nuovoSaldo = p.saldoResiduo + amountAdded;
        return {
          ...p,
          saldoResiduo: nuovoSaldo,
          stato: p.stato === 'chiuso' && nuovoSaldo > 0 ? 'attivo' : p.stato,
        };
      }),
    );
  };

  const showBudgetNotification = useCallback(
    (notification: AppNotification) => {
      const level =
        notification.livello || (notification.metadata as any)?.level || 'info';
      const title =
        strings[notification.titolo_key as keyof typeof strings] ||
        notification.titolo_key;
      const message = notification.messaggio_key
        ? strings[notification.messaggio_key as keyof typeof strings] ||
          notification.messaggio_key
        : '';

      if (level === 'exceeded') {
        soundSystem.play('budget-exceeded');
        hapticSystem.budgetExceeded();
        toast.error(title, { description: message, duration: 6000 });
        return;
      }

      if (level === 'critical') {
        soundSystem.play('budget-critical');
        hapticSystem.budgetCritical();
        toast.warning(title, { description: message, duration: 5000 });
        return;
      }

      soundSystem.play('budget-warning');
      hapticSystem.budgetWarning();
      toast(title, { description: message, duration: 4000 });
    },
    [],
  );

  const processBudgetNotifications = useCallback(
    async (updatedTransactions: Transaction[]) => {
      const createdNotifications =
        await notificationServiceRef.current.processBudgetNotifications({
          budgets: safeBudgets,
          transactions: updatedTransactions,
        });

      if (createdNotifications.length === 0) {
        return;
      }

      setNotifications(prev => {
        const next = [
          ...createdNotifications,
          ...prev.filter(notification => {
            if (
              createdNotifications.some(
                created => created.id === notification.id,
              )
            ) {
              return false;
            }

            return !createdNotifications.some(
              created =>
                notification.entitaId === created.entitaId &&
                notification.metadata?.budgetPeriodKey ===
                  created.metadata?.budgetPeriodKey,
            );
          }),
        ];
        return next.filter(notification => !notification.letta);
      });

      createdNotifications.forEach(showBudgetNotification);
    },
    [safeBudgets, showBudgetNotification],
  );

  // --- Legacy handlers (thin wrappers, kept for DialogsOverlay compatibility) ---

  const handleSaveAccount = async (account: Account) => {
    try {
      const existing = accounts.find(a => a.id === account.id);
      if (existing) {
        const { id, ...data } = account;
        await updateAccount(id, data);
        soundSystem.play('save');
        hapticSystem.save();
        toast.success('Conto modificato');
        announce(accountsAnn.announceAccountModified(account.nome));
      } else {
        const { id: _id, ...data } = account;
        await addAccount(data);
        soundSystem.play('account-created');
        hapticSystem.accountCreated();
        toast.success(`Conto "${account.nome}" creato`);
        announce(
          accountsAnn.announceAccountCreated(
            account.nome,
            account.tipo,
            account.saldoIniziale,
          ),
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Errore durante il salvataggio del conto';
      toast.error(message);
    }
  };

  const handleSaveTransaction = async (transaction: TransactionInput) => {
    try {
      const transactionData = transaction;
      const existing = transaction.id
        ? transactions.find(t => t.id === transaction.id)
        : undefined;
      if (transaction.id && existing) {
        const { id, ...updateData } = transactionData;
        await updateTransaction(transaction.id, updateData);
        soundSystem.play('save');
        hapticSystem.save();
        toast.success('Movimento modificato');
        announce(accountsAnn.announceTransactionModified());
      } else {
        const { id: _id, ...createData } = transactionData;
        await addTransaction(createData);
        if (transaction.tipo === 'entrata') {
          soundSystem.play('income');
          hapticSystem.income();
        } else if (transaction.tipo === 'uscita') {
          soundSystem.play('expense');
          hapticSystem.expense();
        } else {
          soundSystem.play('transfer');
          hapticSystem.transfer();
        }
        const account = accounts.find(a => a.id === transaction.contoId);
        const category = categories.find(c => c.id === transaction.categoriaId);
        void category;
        toast.success(
          `Movimento aggiunto: ${transaction.tipo} ${formatCurrency(
            transaction.importo,
          )} - ${account?.nome || ''}`,
        );
        announce(
          accountsAnn.announceTransaction(
            transaction.tipo,
            transaction.importo,
            account?.nome || 'Conto sconosciuto',
          ),
        );
        if (transaction.tipo === 'uscita') {
          await processBudgetNotifications([
            ...transactions,
            { ...transaction, cifrato: false, id: transaction.id ?? '' },
          ]);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Errore durante il salvataggio del movimento';
      toast.error(message);
    }
  };

  const handleSaveBudget = async (budget: Budget) => {
    try {
      const existing = budgets.find(b => b.id === budget.id);
      if (existing) {
        const { id, ...data } = budget;
        await updateBudget(id, data);
        soundSystem.play('save');
        hapticSystem.save();
        toast.success('Budget modificato');
        announce(budgetsAnn.announceBudgetModified(budget.nome));
      } else {
        const { id: _id, ...data } = budget;
        await addBudget(data);
        soundSystem.play('budget-created');
        hapticSystem.budgetCreated();
        toast.success(`Budget "${budget.nome}" creato`);
        announce(
          budgetsAnn.announceBudgetCreated(
            budget.nome,
            budget.importoTarget,
            budget.periodo,
          ),
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Errore durante il salvataggio del budget';
      toast.error(message);
    }
  };

  const handleSaveSavingsGoal = async (goal: SavingsGoal) => {
    try {
      const existing = savingsGoals.find(g => g.id === goal.id);
      if (existing) {
        const { id, ...data } = goal;
        await updateSavingsGoal(id, data);
        soundSystem.play('save');
        hapticSystem.save();
        toast.success('Obiettivo di risparmio modificato');
        announce(budgetsAnn.announceSavingsGoalModified(goal.nome));
      } else {
        const { id: _id, ...data } = goal;
        await addSavingsGoal(data);
        soundSystem.play('goal-created');
        hapticSystem.goalCreated();
        toast.success(`Obiettivo "${goal.nome}" creato`);
        announce(
          budgetsAnn.announceSavingsGoalCreated(goal.nome, goal.importoTarget),
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Errore durante il salvataggio';
      toast.error(message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    soundSystem.play('delete');
    hapticSystem.delete();
    try {
      if (deletingItem.type === 'account') {
        const account = accounts.find(a => a.id === deletingItem.id);
        await removeAccount(deletingItem.id);
        soundSystem.play('account-deleted');
        hapticSystem.accountDeleted();
        toast.success('Conto eliminato');
        if (account) {
          announce(accountsAnn.announceAccountDeleted(account.nome, true));
        } else {
          announce(accountsAnn.announceAccountDeletedGeneric());
        }
      } else if (deletingItem.type === 'transaction') {
        await removeTransaction(deletingItem.id);
        toast.success('Movimento eliminato');
        announce(accountsAnn.announceTransactionDeleted());
      } else if (deletingItem.type === 'budget') {
        const budget = budgets.find(b => b.id === deletingItem.id);
        await removeBudget(deletingItem.id);
        soundSystem.play('budget-deleted');
        hapticSystem.budgetDeleted();
        toast.success('Budget eliminato');
        if (budget) {
          announce(budgetsAnn.announceBudgetDeleted(budget.nome));
        } else {
          announce(budgetsAnn.announceBudgetDeletedGeneric());
        }
      } else if (deletingItem.type === 'savingsGoal') {
        const goal = savingsGoals.find(g => g.id === deletingItem.id);
        await removeSavingsGoal(deletingItem.id);
        toast.success('Obiettivo di risparmio eliminato');
        if (goal) {
          announce(budgetsAnn.announceSavingsGoalDeleted(goal.nome));
        } else {
          announce(budgetsAnn.announceSavingsGoalDeletedGeneric());
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore durante l'eliminazione";
      toast.error(message);
    }
  };

  const handleExportCSV = useCallback(
    async (
      visibleTransactions: Transaction[],
      visibleAccounts: Account[],
    ): Promise<void> => {
      const csv = exportToCSV(
        visibleTransactions,
        visibleAccounts,
        safeCategories,
      );
      const fileName = `zecchino-export-${Date.now()}.csv`;
      const result: ExportResult = await exportFile(csv, fileName, 'text/csv');

      if (result.success) {
        soundSystem.play('export');
        hapticSystem.export();
        toast.success(t('export_success_toast'));
        announce(accountsAnn.announceExportFile(visibleTransactions.length));
        return;
      }

      switch (result.reason) {
        case 'CANCELLED':
          return;
        case 'ALREADY_IN_PROGRESS':
          toast.error(t('export_already_in_progress_toast'));
          announce(accountsAnn.exportError('ALREADY_IN_PROGRESS'));
          return;
        case 'PERMISSION_DENIED':
          toast.error(t('export_permission_denied_toast'));
          announce(accountsAnn.exportError('PERMISSION_DENIED'));
          return;
        case 'FILESYSTEM_ERROR':
          toast.error(t('export_filesystem_error_toast'));
          announce(accountsAnn.exportError('FILESYSTEM_ERROR'));
          return;
        case 'UNSUPPORTED_PLATFORM':
          toast.error(t('export_unsupported_platform_toast'));
          announce(accountsAnn.exportError('UNSUPPORTED_PLATFORM'));
          return;
        case 'INVALID_PATH':
          toast.error(t('export_invalid_path_toast'));
          announce(accountsAnn.exportError('INVALID_PATH'));
          return;
        case 'INSUFFICIENT_SPACE':
          toast.error(t('export_insufficient_space_toast'));
          announce(accountsAnn.exportError('INSUFFICIENT_SPACE'));
          return;
        case 'UNKNOWN':
        default:
          toast.error(t('export_unknown_error_toast'));
          announce(accountsAnn.exportError('UNKNOWN'));
      }
    },
    [safeCategories],
  );

  const handleViewBudget = (
    budgetId: string,
    onNavigate: (budget: Budget) => void,
  ) => {
    soundSystem.play('dialog-open');
    hapticSystem.dialogOpen();
    const budget = safeBudgets.find(b => b.id === budgetId);
    if (budget) {
      onNavigate(budget);
    }
  };

  const contextValue = useMemo(
    () => ({
      accounts: safeAccounts,
      transactions: safeTransactions,
      categories: safeCategories,
      budgets: safeBudgets,
      savingsGoals: safeSavingsGoals,
      ricorrenze: safeRicorrenze,
      tags: safeTags,
      transactionTagMap: safeTransactionTagMap,
      notifications: safeNotifications,
      notificationsHydrated,
      prestiti: safePrestiti,
      prestitiRimborsi: safePrestitiRimborsi,
      isLoading,
      error,
      isDataReady,
      safeAccounts,
      safeTransactions,
      safeCategories,
      safeBudgets,
      safeSavingsGoals,
      safeRicorrenze,
      safeTags,
      safeTransactionTagMap,
      safeNotifications,
      safePrestiti,
      safePrestitiRimborsi,
      addAccount,
      updateAccount,
      removeAccount,
      addTransaction,
      updateTransaction,
      removeTransaction,
      addCategory,
      updateCategory,
      removeCategory,
      addBudget,
      updateBudget,
      removeBudget,
      addSavingsGoal,
      updateSavingsGoal,
      updateSavingsGoalProgress,
      removeSavingsGoal,
      addTag,
      updateTag,
      removeTag,
      addTagToTransaction,
      removeTagFromTransaction,
      setTagsForTransaction,
      addPrestito,
      updatePrestito,
      promotePrestito,
      closePrestito,
      deletePrestitoSimulazione,
      addRimborso,
      removeRimborso,
      refreshAll,
      handleSaveAccount,
      handleSaveTransaction,
      handleSaveBudget,
      handleSaveSavingsGoal,
      handleDeleteConfirm,
      handleExportCSV,
      handleViewBudget,
      editingTransaction,
      setEditingTransaction,
      showTransactionDialog,
      setShowTransactionDialog,
      openNewTransactionDialog,
      openEditTransactionDialog,
      deletingItem,
      setDeletingItem,
      showDeleteDialog,
      setShowDeleteDialog,
      editingAccount,
      setEditingAccount,
      showAccountDialog,
      setShowAccountDialog,
      showBudgetDialog,
      setShowBudgetDialog,
      editingBudget,
      setEditingBudget,
      showSavingsGoalDialog,
      setShowSavingsGoalDialog,
      editingSavingsGoal,
      setEditingSavingsGoal,
      handleAddFundsToGoal,
      showKeyboardHelp,
      setShowKeyboardHelp,
      transitionTo,
    }),
    [
      accounts,
      addAccount,
      addBudget,
      addPrestito,
      addRimborso,
      addSavingsGoal,
      addTag,
      addTagToTransaction,
      budgets,
      categories,
      closePrestito,
      deletePrestitoSimulazione,
      deletingItem,
      editingAccount,
      editingBudget,
      editingSavingsGoal,
      editingTransaction,
      error,
      handleAddFundsToGoal,
      handleDeleteConfirm,
      handleExportCSV,
      handleSaveAccount,
      handleSaveBudget,
      handleSaveSavingsGoal,
      handleSaveTransaction,
      handleViewBudget,
      isDataReady,
      isLoading,
      notifications,
      notificationsHydrated,
      openEditTransactionDialog,
      openNewTransactionDialog,
      prestiti,
      prestitiRimborsi,
      promotePrestito,
      refreshAll,
      removeAccount,
      removeBudget,
      removeCategory,
      removeRimborso,
      removeSavingsGoal,
      removeTag,
      removeTagFromTransaction,
      removeTransaction,
      ricorrenze,
      safeAccounts,
      safeBudgets,
      safeCategories,
      safeNotifications,
      safePrestiti,
      safePrestitiRimborsi,
      safeRicorrenze,
      safeSavingsGoals,
      safeTags,
      safeTransactionTagMap,
      safeTransactions,
      savingsGoals,
      setDeletingItem,
      setEditingAccount,
      setEditingBudget,
      setEditingSavingsGoal,
      setEditingTransaction,
      setShowAccountDialog,
      setShowBudgetDialog,
      setShowDeleteDialog,
      setShowKeyboardHelp,
      setShowSavingsGoalDialog,
      setShowTransactionDialog,
      setTagsForTransaction,
      showAccountDialog,
      showBudgetDialog,
      showDeleteDialog,
      showKeyboardHelp,
      showSavingsGoalDialog,
      transitionTo,
      showTransactionDialog,
      tags,
      transactionTagMap,
      transactions,
      updateAccount,
      updateBudget,
      updateCategory,
      updatePrestito,
      updateSavingsGoal,
      updateSavingsGoalProgress,
      updateTag,
      updateTransaction,
    ],
  );

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData deve essere usato dentro AppDataProvider');
  }

  return context;
}
