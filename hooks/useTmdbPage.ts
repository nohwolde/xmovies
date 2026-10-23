import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { MediaItem, tmdb } from "../lib/tmdb";

// TMDB rejects list requests past page 500
export const MAX_TMDB_PAGE = 500;

// The page number from the route, or null until the router is ready (statically
// optimized pages see an empty query on first render, which would otherwise
// fetch page 1 and then page N). Invalid values (0, "abc", 9999) are replaced
// in the URL with the nearest valid page.
export function usePageParam(key = "page"): number | null {
  const router = useRouter();
  const raw = Array.isArray(router.query[key]) ? router.query[key]![0] : (router.query[key] as string | undefined);
  const parsed = parseInt(raw ?? "", 10);
  const valid = String(parsed) === raw && parsed >= 1 && parsed <= MAX_TMDB_PAGE;

  useEffect(() => {
    if (!router.isReady || valid) return;
    const page = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), MAX_TMDB_PAGE) : 1;
    router.replace({ pathname: router.pathname, query: { ...router.query, [key]: String(page) } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, raw]);

  return router.isReady && valid ? parsed : null;
}

// Client-side fetch of a paged TMDB list; `path` null means "not ready yet"
export function useTmdbPage(path: string | null, params: Record<string, string | number | undefined> = {}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [totalPages, setTotalPages] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const key = path ? `${path}?${JSON.stringify(params)}` : null;

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    // Drop the previous list so stale items (e.g. movies after switching to
    // Shows) are never shown or opened under the new query
    setItems([]);
    setLoading(true);
    setError(false);
    tmdb<{ results?: MediaItem[]; total_pages?: number }>(path, params)
      .then((data) => {
        if (cancelled) return;
        setItems(data.results ?? []);
        setTotalPages(data.total_pages);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { items, totalPages, loading, error, retry };
}
