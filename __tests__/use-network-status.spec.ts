/**
 * Test PLAN 008 T6 — useNetworkStatus / NetworkStatusProvider
 *
 * Riferimento:
 *   docs/3-coding-plans/008-PLAN_network-connectivity_v0.1.0.md (T6, INV-3..7)
 *   docs/2-projects/008-DESIGN_network-connectivity_v0.1.0.md
 *
 * 6 scenari (INV-3, INV-4, INV-5, INV-7 + cleanup):
 *   1. Online (isConnected=true, isInternetReachable=true)
 *   2. Offline confermato (isConnected=false)
 *   3. Captive portal (isConnected=true, isInternetReachable=false) → isOffline=true
 *   4. Flapping con debounce
 *        4a. online → offline propagato dopo 1000 ms
 *        4b. offline → online immediato (no debounce)
 *   5. Fail-Safe: timeout init 3000 ms senza eventi NetInfo
 *   6. Cleanup: unsubscribe invocato all'unmount
 */

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

type NetInfoListener = (state: unknown) => void;

let mockListeners: NetInfoListener[] = [];
let mockSubscribeImpl: () => () => void = () => {
  const fn: NetInfoListener = () => {};
  mockListeners.push(fn);
  return () => {
    mockListeners = mockListeners.filter(l => l !== fn);
  };
};
const mockUnsubscribe = jest.fn();

jest.mock('@react-native-community/netinfo', () => {
  return {
    __esModule: true,
    default: {
      addEventListener: jest.fn((listener: NetInfoListener) => {
        mockListeners.push(listener);
        mockUnsubscribe.mockImplementation(() => {
          mockListeners = mockListeners.filter(l => l !== listener);
        });
        return mockSubscribeImpl();
      }),
      fetch: jest.fn(),
    },
  };
});

import {
  NetworkStatusProvider,
  type NetworkStatus,
} from '@/context/NetworkStatusContext';
import { useNetworkStatus } from '@/hooks/use-network-status';

function triggerNetInfo(state: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type?: string;
}) {
  for (const listener of mockListeners) {
    listener({ type: state.type ?? 'wifi', ...state });
  }
}

function mountProbe(): {
  renderer: TestRenderer.ReactTestRenderer;
  read: () => NetworkStatus;
} {
  const probeRef: { current: NetworkStatus | null } = { current: null };

  function Probe() {
    probeRef.current = useNetworkStatus();
    return null;
  }

  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      React.createElement(
        NetworkStatusProvider,
        null,
        React.createElement(Probe, null),
      ),
    );
  });
  return {
    renderer,
    read: () => {
      if (!probeRef.current) {
        throw new Error('Probe non ha letto lo stato.');
      }
      return probeRef.current;
    },
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  mockListeners = [];
  mockSubscribeImpl = () => {
    return () => mockUnsubscribe();
  };
  mockUnsubscribe.mockReset();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('useNetworkStatus / NetworkStatusProvider — PLAN 008 T6', () => {
  it('Scenario 1: stato Online (isConnected=true, isInternetReachable=true) → isOffline=false', () => {
    const { read } = mountProbe();

    act(() => {
      triggerNetInfo({ isConnected: true, isInternetReachable: true });
    });

    const s = read();
    expect(s.isInitialized).toBe(true);
    expect(s.isOffline).toBe(false);
    expect(s.isConnected).toBe(true);
    expect(s.isInternetReachable).toBe(true);
  });

  it('Scenario 2: Offline confermato (isConnected=false) → isOffline=true dopo debounce', () => {
    const { read } = mountProbe();

    act(() => {
      triggerNetInfo({ isConnected: false, isInternetReachable: false });
    });
    // Debounce online→offline è 1000 ms, ma il primo evento parte da
    // lastEmittedOffline=false: avanziamo i timer per propagare.
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const s = read();
    expect(s.isInitialized).toBe(true);
    expect(s.isOffline).toBe(true);
    expect(s.isConnected).toBe(false);
  });

  it('Scenario 3: Captive portal (connected ma not reachable) → isOffline=true (INV-7)', () => {
    const { read } = mountProbe();

    act(() => {
      triggerNetInfo({ isConnected: true, isInternetReachable: false });
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const s = read();
    expect(s.isOffline).toBe(true);
    expect(s.isConnected).toBe(true);
    expect(s.isInternetReachable).toBe(false);
  });

  it('Scenario 4a: flapping online→offline propaga dopo 1000 ms (INV-3)', () => {
    const { read } = mountProbe();

    act(() => {
      triggerNetInfo({ isConnected: true, isInternetReachable: true });
    });
    expect(read().isOffline).toBe(false);

    act(() => {
      triggerNetInfo({ isConnected: false, isInternetReachable: false });
    });
    // Prima del debounce lo stato osservato è ancora online.
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(read().isOffline).toBe(false);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(read().isOffline).toBe(true);
  });

  it('Scenario 4b: flapping offline→online è immediato (INV-3)', () => {
    const { read } = mountProbe();

    // Porta lo stato a offline confermato.
    act(() => {
      triggerNetInfo({ isConnected: false, isInternetReachable: false });
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(read().isOffline).toBe(true);

    // Ritorno online: deve essere immediato, senza attendere il debounce.
    act(() => {
      triggerNetInfo({ isConnected: true, isInternetReachable: true });
    });
    expect(read().isOffline).toBe(false);
    expect(read().isConnected).toBe(true);
  });

  it('Scenario 5: Fail-Safe Online-First su timeout di init (INV-4)', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { read } = mountProbe();

    // Nessun evento NetInfo: scatta il timer di init a 3000 ms.
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    const s = read();
    expect(s.isInitialized).toBe(true);
    expect(s.isOffline).toBe(false);
    expect(s.isConnected).toBe(true);
    expect(s.isInternetReachable).toBe(true);
    expect(s.connectionType).toBe('unknown');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('Scenario 6: cleanup invoca unsubscribe e clear dei timer', () => {
    const { renderer } = mountProbe();

    act(() => {
      renderer.unmount();
    });

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    // Anche se restassero timer in volo, non devono lanciare warning React:
    // li esauriamo per coerenza.
    expect(() => {
      jest.advanceTimersByTime(2000);
    }).not.toThrow();
  });

  it('Scenario 7: Test 37 - eccezione in NetInfo.addEventListener attiva immediatamente il fail-safe FAIL_SAFE_ONLINE', () => {
    const NetInfo = require('@react-native-community/netinfo').default;
    NetInfo.addEventListener.mockImplementationOnce(() => {
      throw new Error('NetInfo mock registration failed');
    });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { read } = mountProbe();

    const s = read();
    expect(s.isInitialized).toBe(true);
    expect(s.isOffline).toBe(false);
    expect(s.isConnected).toBe(true);
    expect(s.isInternetReachable).toBe(true);
    expect(s.connectionType).toBe('unknown');

    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('Scenario 8: Test 38 - eccezione in unsubscribe durante unmount viene catturata stampando un warning senza crash', () => {
    mockSubscribeImpl = () => {
      return () => {
        throw new Error('Unsubscribe failed');
      };
    };

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { renderer } = mountProbe();

    expect(() => {
      act(() => {
        renderer.unmount();
      });
    }).not.toThrow();

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
