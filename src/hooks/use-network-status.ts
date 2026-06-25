import { useContext } from 'react';
import {
  NetworkStatusContext,
  type NetworkStatus,
} from '@/context/NetworkStatusContext';

/**
 * Hook pubblico per il connectivity contract.
 * Vedi DESIGN 008 §4 e PLAN 008 §6 T2.
 *
 * Throw esplicito se invocato fuori dall'albero di NetworkStatusProvider:
 * un consumer fuori contesto è un bug di wiring (NOTA 3 del TODO 008).
 */
export function useNetworkStatus(): NetworkStatus {
  const ctx = useContext(NetworkStatusContext);
  if (ctx === null) {
    throw new Error(
      'useNetworkStatus must be used within NetworkStatusProvider',
    );
  }
  return ctx;
}
