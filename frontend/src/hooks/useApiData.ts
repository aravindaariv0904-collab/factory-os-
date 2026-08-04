"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    let cancelled = false;

    loader()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setIsFallback(false);
        options?.onSuccess?.(result);
      })
      .catch(() => {
        if (cancelled) return;
        setData(fallback);
        setIsFallback(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, setData, isLoading, isFallback };
}
