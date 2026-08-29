"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Loads data from an async API service and falls back to mock data when the
 * backend is unreachable. Keeps the UI fully navigable in demo mode.
 *
 * IMPORTANT: Pass a stable `loader` (wrapped in useCallback) to avoid
 * infinite re-fetching. The `fallback` value is captured once on mount.
 */
export function useApiData<T>(
  loader: () => Promise<T>,
  fallback: T
) {
  const [data, setData] = useState<T>(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  // Capture the fallback value on first render only — prevents re-fetching
  // when parent components re-render with new object literals.
  const fallbackRef = useRef<T>(fallback);

  const load = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);

    loader()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setIsFallback(false);
      })
      .catch(() => {
        if (cancelled) return;
        setData(fallbackRef.current);
        setIsFallback(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loader]); // Only re-run when the loader function reference changes

  useEffect(() => {
    const cancel = load();
    return cancel;
  }, [load]);

  const refetch = useCallback(() => {
    load();
  }, [load]);

  return { data, setData, isLoading, isFallback, refetch };
}
