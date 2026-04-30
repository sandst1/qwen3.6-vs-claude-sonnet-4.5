import { useEffect, useRef, useState } from "react";

/**
 * Shared hook for fetching and polling data with proper cleanup.
 * Replaces the duplicated useEffect pattern in every widget.
 */
export function useWidgetData<T>(
  fetchFn: () => Promise<T>,
  intervalMs: number
): T | null {
  const [data, setData] = useState<T | null>(null);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  useEffect(() => {
    let cancelled = false;

    const fetch = () => {
      fetchFnRef.current().then((result) => {
        if (!cancelled) setData(result);
      });
    };

    fetch();
    const id = setInterval(fetch, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return data;
}
