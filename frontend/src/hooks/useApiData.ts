"use client";

import { useCallback, useEffect, useState } from "react";

interface UseApiDataOptions<T> {
  fallback: T;
  onSuccess?: (data: T) => void;
}

/**
 * Loads data from an async API service and falls back to mock data when the
 * backend is unreachable. Keeps the UI fully navigable in demo mode.
 */
export function useApiData<T>(
  loader: () => Promise<T>,
  fallback: T,
  options?: UseApiDataOptions<T>
) {
  const [data, setData] = useState<T>(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  const load = useCallback(
    (nextFallback: T) => {
      let cancelled = false;

      setData(nextFallback);
      setIsLoading(true);

      loader()
        .then((result) => {
          if (cancelled) return;
          setData(result);
          setIsFallback(false);
          options?.onSuccess?.(result);
        })
        .catch(() => {
          if (cancelled) return;
          setData(nextFallback);
          setIsFallback(true);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });

      return () => {
        cancelled = true;
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loader, options]
  );

  useEffect(() => {
    const cancel = load(fallback);
    return () => {
      cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetch = useCallback(
    () =>
      new Promise<void>((resolve) => {
        load(data);
        resolve();
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [load, data]
  );

  return { data, setData, isLoading, isFallback, refetch };
}
