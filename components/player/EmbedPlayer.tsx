import React, { useEffect, useMemo, useReducer } from "react";
import {
  MediaRequest,
  SourceCategory,
  VideoSource,
  buildEmbedUrl,
  getAvailableSources,
  getInitialSourceIndex,
  getNextSourceIndex,
  getSourceCategory,
  sourceLabel,
} from "../../utils/video-sources";
import { useHydrated } from "../../hooks/useHydrated";

// One preference per category: anime starts on vidrock, which shouldn't
// carry over to regular movies. (Replaces the old global
// "xmovies:preferred-source", whose saved values predate the new order.)
export const preferredSourceKey = (category: SourceCategory) =>
  `xmovies:preferred-source:${category}`;
export const LOAD_TIMEOUT_MS = 15000;

type Status = "loading" | "loaded" | "failed";

interface EmbedPlayerProps {
  media: MediaRequest;
  title?: string;
  anime?: boolean;
  sources?: VideoSource[];
  className?: string;
  onLoad?: () => void;
}

function readPreferredSource(category: SourceCategory): string | null {
  try {
    return window.localStorage.getItem(preferredSourceKey(category));
  } catch {
    return null;
  }
}

function writePreferredSource(category: SourceCategory, id: string) {
  try {
    window.localStorage.setItem(preferredSourceKey(category), id);
  } catch {
    // storage unavailable (private mode, blocked cookies) — preference just isn't remembered
  }
}

interface PlayerState {
  // The list `index` points into
  sources: VideoSource[];
  index: number;
  tried: ReadonlySet<number>;
  status: Status;
  attempt: number;
}

type PlayerAction =
  | { type: "select"; index: number }
  | { type: "restore"; sources: VideoSource[]; index: number }
  | { type: "reset" }
  | { type: "loaded" }
  | { type: "timeout"; total: number }
  | { type: "retry" };

const initState = (sources: VideoSource[]): PlayerState => ({
  sources,
  index: 0,
  tried: new Set(),
  status: "loading",
  attempt: 0,
});

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    // Only timeouts mark a source as failed; switching away by hand doesn't,
    // so a source that already worked stays available as a fallback.
    case "select":
      // Re-selecting the current source: keep a playing video as is, otherwise
      // force a fresh load (new iframe key + timeout) instead of a stuck spinner
      if (action.index === state.index) {
        return state.status === "loaded" ? state : { ...state, status: "loading", attempt: state.attempt + 1 };
      }
      return { ...state, index: action.index, status: "loading" };
    case "restore":
      return { ...state, sources: action.sources, index: action.index, tried: new Set(), status: "loading" };
    case "reset":
      return { ...state, tried: new Set(), status: "loading" };
    case "loaded":
      return { ...state, status: "loaded" };
    case "timeout": {
      if (state.status !== "loading") return state;
      const tried = new Set(state.tried).add(state.index);
      const next = getNextSourceIndex(state.index, action.total, tried);
      return next === null
        ? { ...state, tried, status: "failed" }
        : { ...state, index: next, tried, status: "loading" };
    }
    case "retry":
      return { ...initState(state.sources), attempt: state.attempt + 1 };
  }
}

const EmbedPlayer = ({
  media,
  title,
  anime = false,
  sources,
  className = "h-[270px] lg:h-[750px]",
  onLoad,
}: EmbedPlayerProps) => {
  const availableSources = useMemo(
    () => getAvailableSources(media.type, anime, sources),
    [media.type, anime, sources]
  );
  const category = getSourceCategory(media.type, anime);
  const [state, dispatch] = useReducer(playerReducer, availableSources, initState);
  const { status, tried, attempt } = state;
  const restore = () =>
    dispatch({
      type: "restore",
      sources: availableSources,
      index: getInitialSourceIndex(availableSources, readPreferredSource(category)),
    });

  // localStorage is only available after hydration, so the first render
  // matches the server's (first source) and the preference is applied here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(restore, []);

  // The list changed while mounted (e.g. client-side navigation from a movie
  // to an anime movie): pick its start source during render, so an index
  // from the old list never mounts the wrong provider
  if (state.sources !== availableSources) restore();

  const safeIndex = state.index < availableSources.length ? state.index : 0;
  const source = availableSources[safeIndex];
  // No iframe in the server HTML: the preferred source is only known after
  // hydration, and loading source 0 first would waste a request
  const hydrated = useHydrated();
  const url = hydrated ? buildEmbedUrl(source, media) : null;
  const mediaKey = `${media.type}:${media.id}:${media.season}:${media.episode}`;

  // A new title or episode gets a fresh round of failover attempts
  useEffect(() => {
    dispatch({ type: "reset" });
  }, [mediaKey]);

  // Cross-origin iframes give no error signal, so a source that never fires
  // onLoad within the timeout is treated as dead and the next one is tried.
  useEffect(() => {
    if (!url) return;
    const timer = window.setTimeout(
      () => dispatch({ type: "timeout", total: availableSources.length }),
      LOAD_TIMEOUT_MS
    );
    return () => window.clearTimeout(timer);
  }, [url, attempt, availableSources.length]);

  const nextIndex = getNextSourceIndex(
    safeIndex,
    availableSources.length,
    new Set(tried).add(safeIndex)
  );

  const selectSource = (index: number) => dispatch({ type: "select", index });

  // Remember the source that actually loaded (not just the one clicked), so a
  // dead source doesn't cost every later visit a full timeout.
  const handleLoad = () => {
    dispatch({ type: "loaded" });
    if (source) writePreferredSource(category, source.id);
    onLoad?.();
  };

  const retry = () => dispatch({ type: "retry" });

  return (
    <div className="w-full" data-testid="embed-player">
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <span className="text-sm font-medium text-white/60">Video Source:</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Video source">
          {availableSources.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={index === safeIndex}
              onClick={() => selectSource(index)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                index === safeIndex
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {sourceLabel(item, index)}
            </button>
          ))}
        </div>
      </div>

      <div className={`relative w-full bg-black ${className}`}>
        {url && (
          <iframe
            key={`${url}#${attempt}`}
            src={url}
            title={title ? `Watch ${title}` : "Video player"}
            onLoad={handleLoad}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="origin"
          />
        )}

        {(!url || status === "loading") && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            role="status"
          >
            <div className="h-10 w-10 rounded-full border-4 border-white/20 border-t-accent animate-spin" />
            <span className="sr-only">Loading player</span>
          </div>
        )}

        {status === "failed" && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 text-center px-4"
            role="alert"
          >
            <p className="text-white/80">None of the sources are responding right now.</p>
            <button
              type="button"
              onClick={retry}
              className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/85"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {nextIndex !== null && (
        <p className="pt-2 text-xs text-white/50">
          Not playing?{" "}
          <button
            type="button"
            onClick={() => selectSource(nextIndex)}
            className="underline hover:text-white"
          >
            Try {sourceLabel(availableSources[nextIndex], nextIndex)}
          </button>
        </p>
      )}
    </div>
  );
};

export default EmbedPlayer;
