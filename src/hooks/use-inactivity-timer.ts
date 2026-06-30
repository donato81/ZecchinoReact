import { useCallback, useEffect, useRef, useState } from 'react';

interface UseInactivityTimerOptions {
  timeoutMinutes: number;
  onTimeout: () => void;
}

interface UseInactivityTimerResult {
  resetTimer: () => void;
  showWarning: boolean;
}

export function useInactivityTimer({
  timeoutMinutes,
  onTimeout,
}: UseInactivityTimerOptions): UseInactivityTimerResult {
  const warningTimerRef = useRef<any>(null);
  const timeoutTimerRef = useRef<any>(null);
  const [showWarning, setShowWarning] = useState(false);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current !== null) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    if (timeoutTimerRef.current !== null) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  }, []);

  const scheduleTimers = useCallback(() => {
    clearTimers();
    setShowWarning(false);

    if (timeoutMinutes <= 0) {
      return;
    }

    const timeoutMs = timeoutMinutes * 60_000;
    const warningMs = Math.max((timeoutMinutes - 1) * 60_000, 0);

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, warningMs);

    timeoutTimerRef.current = setTimeout(() => {
      setShowWarning(false);
      onTimeout();
    }, timeoutMs);
  }, [clearTimers, onTimeout, timeoutMinutes]);

  const resetTimer = useCallback(() => {
    if (timeoutMinutes <= 0) {
      setShowWarning(false);
      clearTimers();
      return;
    }

    scheduleTimers();
  }, [clearTimers, scheduleTimers, timeoutMinutes]);

  useEffect(() => {
    if (timeoutMinutes <= 0) {
      clearTimers();
      setShowWarning(false);
      return;
    }

    scheduleTimers();

    return () => {
      clearTimers();
    };
  }, [clearTimers, scheduleTimers, timeoutMinutes]);

  return {
    resetTimer,
    showWarning,
  };
}
