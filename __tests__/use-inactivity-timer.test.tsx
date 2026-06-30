import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useInactivityTimer } from '@/hooks/use-inactivity-timer';

describe('useInactivityTimer - Unit Tests (Test 8-15)', () => {
  let onTimeoutMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    onTimeoutMock = jest.fn();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  function TimerProbe({
    timeoutMinutes,
    onTimeout,
    hookRef,
  }: {
    timeoutMinutes: number;
    onTimeout: () => void;
    hookRef: { current: any };
  }) {
    const result = useInactivityTimer({ timeoutMinutes, onTimeout });
    hookRef.current = result;
    return null;
  }

  it('Test 8: timeoutMinutes <= 0 - nessun timer avviato e stato showWarning forzato a false', () => {
    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(
        <TimerProbe timeoutMinutes={0} onTimeout={onTimeoutMock} hookRef={hookRef} />
      );
    });

    expect(hookRef.current.showWarning).toBe(false);
    
    act(() => {
      jest.advanceTimersByTime(10 * 60_000);
    });
    expect(onTimeoutMock).not.toHaveBeenCalled();
  });

  it('Test 9: timeoutMinutes > 0 - timer di warning e timer finale pianificati correttamente', () => {
    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(
        <TimerProbe timeoutMinutes={5} onTimeout={onTimeoutMock} hookRef={hookRef} />
      );
    });

    expect(hookRef.current.showWarning).toBe(false);
  });

  it('Test 10: Scadenza warning - il passare del tempo (timeout - 1 min) attiva lo stato showWarning', () => {
    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(
        <TimerProbe timeoutMinutes={5} onTimeout={onTimeoutMock} hookRef={hookRef} />
      );
    });

    act(() => {
      jest.advanceTimersByTime(4 * 60_000);
    });
    expect(hookRef.current.showWarning).toBe(true);
    expect(onTimeoutMock).not.toHaveBeenCalled();
  });

  it('Test 11: Scadenza timeout - il passare del tempo completo disattiva showWarning e chiama onTimeout', () => {
    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(
        <TimerProbe timeoutMinutes={5} onTimeout={onTimeoutMock} hookRef={hookRef} />
      );
    });

    act(() => {
      jest.advanceTimersByTime(5 * 60_000);
    });
    expect(hookRef.current.showWarning).toBe(false);
    expect(onTimeoutMock).toHaveBeenCalledTimes(1);
  });

  it('Test 12: resetTimer (disattivato) - pulisce tutti i timer attivi e imposta showWarning a false', () => {
    const hookRef = { current: null as any };
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <TimerProbe timeoutMinutes={5} onTimeout={onTimeoutMock} hookRef={hookRef} />
      );
    });

    act(() => {
      jest.advanceTimersByTime(4 * 60_000);
    });
    expect(hookRef.current.showWarning).toBe(true);

    act(() => {
      renderer.update(
        <TimerProbe timeoutMinutes={0} onTimeout={onTimeoutMock} hookRef={hookRef} />
      );
    });

    expect(hookRef.current.showWarning).toBe(false);

    act(() => {
      jest.advanceTimersByTime(10 * 60_000);
    });
    expect(onTimeoutMock).not.toHaveBeenCalled();
  });

  it('Test 13: resetTimer (attivo) - resetta lo stato e ri-pianifica le scadenze', () => {
    const hookRef = { current: null as any };
    act(() => {
      TestRenderer.create(
        <TimerProbe timeoutMinutes={5} onTimeout={onTimeoutMock} hookRef={hookRef} />
      );
    });

    act(() => {
      jest.advanceTimersByTime(3 * 60_000);
    });

    act(() => {
      hookRef.current.resetTimer();
    });

    act(() => {
      jest.advanceTimersByTime(2 * 60_000);
    });
    expect(hookRef.current.showWarning).toBe(false);

    act(() => {
      jest.advanceTimersByTime(2 * 60_000);
    });
    expect(hookRef.current.showWarning).toBe(true);
  });

  it('Test 14: Unmount - cancella tutti i timer attivi in corso per prevenire leak di memoria', () => {
    const hookRef = { current: null as any };
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <TimerProbe timeoutMinutes={5} onTimeout={onTimeoutMock} hookRef={hookRef} />
      );
    });

    act(() => {
      renderer.unmount();
    });

    act(() => {
      jest.advanceTimersByTime(10 * 60_000);
    });
    expect(onTimeoutMock).not.toHaveBeenCalled();
  });

  it('Test 15: Modifica runtime - cambiare timeoutMinutes dinamicamente cancella i vecchi e rischedula i nuovi timer', () => {
    const hookRef = { current: null as any };
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(
        <TimerProbe timeoutMinutes={5} onTimeout={onTimeoutMock} hookRef={hookRef} />
      );
    });

    act(() => {
      renderer.update(
        <TimerProbe timeoutMinutes={3} onTimeout={onTimeoutMock} hookRef={hookRef} />
      );
    });

    act(() => {
      jest.advanceTimersByTime(2 * 60_000);
    });
    expect(hookRef.current.showWarning).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1 * 60_000);
    });
    expect(onTimeoutMock).toHaveBeenCalledTimes(1);
  });
});
