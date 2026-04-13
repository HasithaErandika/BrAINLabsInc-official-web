import { useEffect, useRef } from 'react';

const TIMEOUT_MS = 30 * 60 * 1_000; // 30 minutes of inactivity

/**
 * Fires `onTimeout` after 30 minutes of user inactivity.
 * Activity events reset the timer. The callback ref is kept up-to-date
 * so the effect only registers once without stale closure issues.
 */
export function useSessionTimeout(onTimeout: () => void) {
  const callbackRef = useRef(onTimeout);
  callbackRef.current = onTimeout;

  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(), TIMEOUT_MS);
    };

    // Throttle to at most once per second to avoid excessive timer resets
    let lastReset = 0;
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastReset > 1_000) {
        lastReset = now;
        reset();
      }
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, throttledReset, { passive: true }));
    reset(); // start the timer immediately on mount

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, throttledReset));
    };
  }, []); // stable — effect runs once; callback updates via ref
}
