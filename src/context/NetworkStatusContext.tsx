import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import NetInfo, {
  type NetInfoState,
  type NetInfoSubscription,
} from '@react-native-community/netinfo'

/**
 * Connectivity contract esposto dal provider.
 * Vedi DESIGN 008 §5 e PLAN 008 §5 (INV-7).
 */
export type NetworkStatus = {
  isOffline: boolean
  isConnected: boolean
  isInternetReachable: boolean
  connectionType: string
  isInitialized: boolean
}

const INIT_TIMEOUT_MS = 1500
const OFFLINE_DEBOUNCE_MS = 1000

const FAIL_SAFE_ONLINE: NetworkStatus = {
  isOffline: false,
  isConnected: true,
  isInternetReachable: true,
  connectionType: 'unknown',
  isInitialized: true,
}

const INITIAL_STATE: NetworkStatus = {
  isOffline: false,
  isConnected: false,
  isInternetReachable: false,
  connectionType: 'unknown',
  isInitialized: false,
}

export const NetworkStatusContext = createContext<NetworkStatus | null>(null)

/**
 * Traduce un evento NetInfo nel contratto NetworkStatus.
 * Semantica isOffline conforme a INV-7 (DESIGN 008 §5):
 *   - isInternetReachable === null  → online-first
 *   - captive portal (connected ma not reachable) → offline
 */
function translate(state: NetInfoState): NetworkStatus {
  const isConnected = state.isConnected === true
  const reachable = state.isInternetReachable
  const isInternetReachable = reachable === true || reachable === null
  const isOffline =
    state.isConnected === false ||
    state.isConnected === null ||
    reachable === false
  return {
    isOffline,
    isConnected,
    isInternetReachable: reachable === true,
    connectionType: state.type ?? 'unknown',
    isInitialized: true,
  }
}

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<NetworkStatus>(INITIAL_STATE)

  const isMountedRef = useRef<boolean>(true)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastEmittedOfflineRef = useRef<boolean>(false)
  const initializedRef = useRef<boolean>(false)

  useEffect(() => {
    isMountedRef.current = true

    const safeSetState = (next: NetworkStatus) => {
      if (!isMountedRef.current) return
      setStatus(next)
    }

    const clearDebounce = () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }

    const clearInitTimer = () => {
      if (initTimerRef.current !== null) {
        clearTimeout(initTimerRef.current)
        initTimerRef.current = null
      }
    }

    const applyFailSafe = (reason: string, error?: unknown) => {
      if (initializedRef.current) return
      initializedRef.current = true
      lastEmittedOfflineRef.current = false
      clearDebounce()
      // eslint-disable-next-line no-console
      console.warn(
        `[NetworkStatusProvider] Fail-Safe Online-First attivato: ${reason}`,
        error,
      )
      safeSetState(FAIL_SAFE_ONLINE)
    }

    const applyState = (next: NetworkStatus) => {
      initializedRef.current = true
      if (next.isOffline === lastEmittedOfflineRef.current) {
        // Stessa direzione: aggiorna gli altri campi senza debounce.
        clearDebounce()
        safeSetState(next)
        return
      }
      if (next.isOffline === false) {
        // offline → online: propagazione immediata (INV-3).
        clearDebounce()
        lastEmittedOfflineRef.current = false
        safeSetState(next)
        return
      }
      // online → offline: debounce 1000 ms (INV-3).
      clearDebounce()
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null
        if (!isMountedRef.current) return
        lastEmittedOfflineRef.current = true
        safeSetState(next)
      }, OFFLINE_DEBOUNCE_MS)
    }

    let unsubscribe: NetInfoSubscription | null = null
    try {
      unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
        clearInitTimer()
        applyState(translate(state))
      })
    } catch (error) {
      applyFailSafe('eccezione in NetInfo.addEventListener', error)
      return () => {
        isMountedRef.current = false
        clearDebounce()
        clearInitTimer()
      }
    }

    initTimerRef.current = setTimeout(() => {
      initTimerRef.current = null
      applyFailSafe('timeout di inizializzazione NetInfo')
    }, INIT_TIMEOUT_MS)

    return () => {
      isMountedRef.current = false
      clearDebounce()
      clearInitTimer()
      if (unsubscribe) {
        try {
          unsubscribe()
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(
            '[NetworkStatusProvider] errore in unsubscribe NetInfo',
            error,
          )
        }
      }
    }
  }, [])

  return (
    <NetworkStatusContext.Provider value={status}>
      {children}
    </NetworkStatusContext.Provider>
  )
}
