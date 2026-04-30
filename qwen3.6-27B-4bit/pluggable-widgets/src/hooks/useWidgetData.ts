import { useEffect, useState } from "react";

/**
 * Shared hook that handles initial fetch + periodic polling for a widget.
 * Eliminates the duplicated useEffect pattern across all widgets.
 *
 * @param fetchFn - Async function to fetch data
 * @param interval - Polling interval in milliseconds (0 to disable polling)
 * @returns Current data (null while loading), plus loading/error state
 */
export function useWidgetData<T>(
  fetchFn: () => Promise<T>,
  interval: number,
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = () => {
    fetchFn()
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch();
    if (interval > 0) {
      const id = setInterval(fetch, interval);
      return () => clearInterval(id);
    }
  }, [fetchFn, interval]);

  return { data, loading, error };
}
