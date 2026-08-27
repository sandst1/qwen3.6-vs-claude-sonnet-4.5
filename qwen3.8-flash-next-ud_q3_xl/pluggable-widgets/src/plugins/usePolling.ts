import { useEffect, useState } from "react";

/**
 * Fetch on mount, then re-fetch every `intervalMs`. Returns null until the
 * first result lands. Pass a stable fetcher (a module-level function, not an
 * inline arrow) so the effect doesn't restart on every render.
 */
export function usePolling<T>(fetcher: () => Promise<T>, intervalMs: number): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetcher().then((result) => {
        if (!cancelled) setData(result);
      });
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetcher, intervalMs]);

  return data;
}
