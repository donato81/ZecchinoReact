import { deleteAttachment } from '@/lib/supabase/storage'
import { supabase } from '@/lib/supabase/client'

const ATTACHMENTS_BUCKET = 'allegati-transazioni'

export const CLEANUP_RECENCY_HOURS = 48
export const MAX_FILES_PER_SCAN = 100
export const MIN_CLEANUP_INTERVAL_MS = 900_000
export const CLEANUP_SAFETY_WINDOW_MS = 180_000
export const CLEANUP_LOGOUT_TIMEOUT_MS = 1_500

export type CleanupResult = {
  scanned: number
  orphanFound: number
  deleted: number
  failed: number
}

type StorageCandidateFile = {
  path: string
  createdAt?: string
}

type StorageCleanupDeps = {
  listCandidateFiles: (userId: string, options: { transazioneId?: string; limit: number }) => Promise<StorageCandidateFile[]>
  listKnownPaths: (userId: string, pathPrefix?: string) => Promise<Set<string>>
  deleteFile: (storagePath: string) => Promise<void>
  warn: (...args: unknown[]) => void
  now: () => number
}

type StorageListItem = {
  name: string
  created_at?: string
}

const EMPTY_RESULT: CleanupResult = {
  scanned: 0,
  orphanFound: 0,
  deleted: 0,
  failed: 0,
}

function isFileEntry(item: StorageListItem): boolean {
  return item.name.includes('.')
}

async function listStoragePrefix(prefix: string, limit: number): Promise<StorageListItem[]> {
  const { data, error } = await supabase
    .storage
    .from(ATTACHMENTS_BUCKET)
    .list(prefix, { limit })

  if (error) {
    throw error
  }

  return (data ?? []) as StorageListItem[]
}

async function listCandidateFilesDefault(
  userId: string,
  options: { transazioneId?: string; limit: number },
): Promise<StorageCandidateFile[]> {
  if (options.transazioneId) {
    const files = await listStoragePrefix(`${userId}/${options.transazioneId}`, options.limit)
    return files
      .filter(isFileEntry)
      .map(file => ({ path: `${userId}/${options.transazioneId}/${file.name}`, createdAt: file.created_at }))
  }

  const rootEntries = await listStoragePrefix(userId, options.limit)
  const candidates: StorageCandidateFile[] = []

  for (const entry of rootEntries) {
    if (candidates.length >= options.limit) {
      break
    }

    if (isFileEntry(entry)) {
      candidates.push({ path: `${userId}/${entry.name}`, createdAt: entry.created_at })
      continue
    }

    const remaining = options.limit - candidates.length
    const nestedFiles = await listStoragePrefix(`${userId}/${entry.name}`, remaining)
    candidates.push(
      ...nestedFiles
        .filter(isFileEntry)
        .slice(0, remaining)
        .map(file => ({ path: `${userId}/${entry.name}/${file.name}`, createdAt: file.created_at })),
    )
  }

  return candidates
}

async function listKnownPathsDefault(userId: string, pathPrefix?: string): Promise<Set<string>> {
  let query = supabase
    .from('allegati_transazioni')
    .select('storage_path')
    .like('storage_path', `${userId}/%`)

  if (pathPrefix) {
    query = query.like('storage_path', `${pathPrefix}%`)
  }

  const { data, error } = await query
  if (error) {
    throw error
  }

  return new Set(((data ?? []) as Array<{ storage_path: string }>).map(row => row.storage_path))
}

function createTimeoutResult(): Promise<CleanupResult> {
  return new Promise(resolve => {
    setTimeout(() => resolve({ ...EMPTY_RESULT }), CLEANUP_LOGOUT_TIMEOUT_MS)
  })
}

function isOlderThanSafetyWindow(createdAt: string | undefined, nowMs: number): boolean {
  if (!createdAt) {
    return false
  }

  return nowMs - new Date(createdAt).getTime() >= CLEANUP_SAFETY_WINDOW_MS
}

function isRecentEnough(createdAt: string | undefined, nowMs: number): boolean {
  if (!createdAt) {
    return false
  }

  return nowMs - new Date(createdAt).getTime() <= CLEANUP_RECENCY_HOURS * 60 * 60 * 1000
}

export function createStorageCleanupService(customDeps?: Partial<StorageCleanupDeps>) {
  const deps: StorageCleanupDeps = {
    listCandidateFiles: listCandidateFilesDefault,
    listKnownPaths: listKnownPathsDefault,
    deleteFile: deleteAttachment,
    warn: (...args: unknown[]) => console.warn('[storage-cleanup]', ...args),
    now: () => Date.now(),
    ...customDeps,
  }

  const cleanupInProgressUsers = new Set<string>()
  const lastCleanupAtByUser = new Map<string, number>()

  async function cleanupCandidates(
    userId: string,
    options: {
      transazioneId?: string
      specificPath?: string
      bypassGuards?: boolean
      applyRecencyFilter?: boolean
      applySafetyWindow?: boolean
    },
  ): Promise<CleanupResult> {
    const nowMs = deps.now()
    const userPrefix = `${userId}/`

    if (!options.bypassGuards) {
      if (cleanupInProgressUsers.has(userId)) {
        return { ...EMPTY_RESULT }
      }
      const lastCleanupAt = lastCleanupAtByUser.get(userId) ?? 0
      if (lastCleanupAt > 0 && nowMs - lastCleanupAt < MIN_CLEANUP_INTERVAL_MS) {
        return { ...EMPTY_RESULT }
      }
      cleanupInProgressUsers.add(userId)
    }

    try {
      const pathPrefix = options.transazioneId ? `${userId}/${options.transazioneId}/` : undefined
      const knownPaths = await deps.listKnownPaths(userId, pathPrefix)

      if (options.specificPath) {
        if (!options.specificPath.startsWith(userPrefix) || knownPaths.has(options.specificPath)) {
          return { ...EMPTY_RESULT }
        }

        try {
          await deps.deleteFile(options.specificPath)
          return { scanned: 1, orphanFound: 1, deleted: 1, failed: 0 }
        } catch (error) {
          deps.warn('cleanupSpecificOrphan failed', options.specificPath, error)
          return { scanned: 1, orphanFound: 1, deleted: 0, failed: 1 }
        }
      }

      const candidates = await deps.listCandidateFiles(userId, {
        transazioneId: options.transazioneId,
        limit: MAX_FILES_PER_SCAN,
      })

      const result: CleanupResult = { ...EMPTY_RESULT }
      for (const candidate of candidates) {
        if (!candidate.path.startsWith(userPrefix)) {
          continue
        }
        if (options.applyRecencyFilter && !isRecentEnough(candidate.createdAt, nowMs)) {
          continue
        }

        result.scanned += 1
        if (knownPaths.has(candidate.path)) {
          continue
        }

        result.orphanFound += 1
        if (options.applySafetyWindow && !isOlderThanSafetyWindow(candidate.createdAt, nowMs)) {
          continue
        }

        try {
          await deps.deleteFile(candidate.path)
          result.deleted += 1
        } catch (error) {
          result.failed += 1
          deps.warn('cleanup failed', candidate.path, error)
        }
      }

      if (!options.bypassGuards) {
        lastCleanupAtByUser.set(userId, nowMs)
      }

      return result
    } catch (error) {
      deps.warn('cleanup aborted', userId, error)
      return { ...EMPTY_RESULT }
    } finally {
      if (!options.bypassGuards) {
        cleanupInProgressUsers.delete(userId)
      }
    }
  }

  return {
    cleanupSpecificOrphan(userId: string, storagePath: string): Promise<CleanupResult> {
      return cleanupCandidates(userId, {
        specificPath: storagePath,
        bypassGuards: true,
        applySafetyWindow: false,
      })
    },
    cleanupRecentOrphans(userId: string): Promise<CleanupResult> {
      return cleanupCandidates(userId, {
        applyRecencyFilter: true,
        applySafetyWindow: true,
      })
    },
    cleanupTransactionOrphans(userId: string, transazioneId: string): Promise<CleanupResult> {
      return cleanupCandidates(userId, {
        transazioneId,
        applySafetyWindow: true,
      })
    },
    cleanupOnLogout(userId: string): Promise<CleanupResult> {
      return Promise.race([
        cleanupCandidates(userId, {
          applyRecencyFilter: true,
          applySafetyWindow: true,
        }),
        createTimeoutResult(),
      ])
    },
  }
}

export const storageCleanupService = createStorageCleanupService()