import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { MediaItem, tmdb } from "../lib/tmdb";

export function usePageParam(key = "page"): number {
  const { query } = useRouter();
  const raw = Array.isArray(query[key]) ? query[key]![0] : query[key];
  const page = parseInt(raw as string, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

// Client-side fetch of a paged TMDB list; `path` null means "not ready yet"
export function useTmdbPage(path: string | null, params: Record<string, string | number | undefined> = {}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [totalPages, setTotalPages] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const key = path ? `${path}?${JSON.stringify(params)}` : null;

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setLoading(true);
    tmdb<{ results?: MediaItem[]; cast?: MediaItem[]; total_pages?: number }>(path, params)
      .then((data) => {
        if (cancelled) return;
        setItems(data.results ?? data.cast ?? []);
        setTotalPages(data.total_pages);
      })
      .catch(() => !cancelled && setItems([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { items, totalPages, loading };
}
