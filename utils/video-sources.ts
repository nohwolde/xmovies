export type MediaType = "movie" | "tv";

export interface MediaRequest {
  type: MediaType;
  id: string | number;
  season?: string | number;
  episode?: string | number;
}

// What a provider's postMessage says about the current title: its player is
// up ("ready"), or it can't play it ("error").
export type PlaybackSignal = "ready" | "error";

export interface PlaybackSignals {
  // Messages from any other origin are ignored
  origin: string;
  parseMessage: (data: unknown) => PlaybackSignal | null;
}

export interface VideoSource {
  id: string;
  // Button label; defaults to "Source <position>" in the current list
  name?: string;
  buildUrl: (media: MediaRequest) => string;
  // Only for providers that reliably post a message once a title is playable.
  // Without it, the iframe's onLoad is the only signal we get.
  signals?: PlaybackSignals;
}

// Providers keyed by TMDB id. Verified 2026-10 by loading each in an iframe
// with the player's attributes and checking the stream length against the
// real runtime. Removed as dead: vidsrc.cc (Cloudflare 522), vidsrcme.su,
// vidsrc.pro; avoided: 2embed, multiembed, vidnest (adult/scam ads).
const tmdbSource = (
  id: string,
  base: string,
  parseMessage?: PlaybackSignals["parseMessage"]
): VideoSource => ({
  id,
  buildUrl: ({ type, id: mediaId, season, episode }) =>
    type === "movie" ? `${base}/movie/${mediaId}` : `${base}/tv/${mediaId}/${season}/${episode}`,
  ...(parseMessage && { signals: { origin: base, parseMessage } }),
});

const messageType = (data: unknown): unknown =>
  typeof data === "object" && data !== null ? (data as { type?: unknown }).type : undefined;

// Message shapes recorded 2026-10 with movie 550, TV 1399 S1E1 and a missing
// id (999999999). No provider posts an explicit error: their "not found"
// pages fire onLoad and then stay silent, so a missing "ready" is the signal.

// No popups; no anime catalog (404s on anime). A playable title autoplays and
// posts {type:"PLAYER_EVENT", event:{event:"play"|"timeupdate"|…}} within ~2s
// of onLoad; the 404 page posts nothing.
const VIXSRC = tmdbSource("vixsrc", "https://vixsrc.to", (data) =>
  messageType(data) === "PLAYER_EVENT" ? "ready" : null
);
// Plays anime series but not anime movies. A playable title posts
// {type:"MEDIA_DATA"} (its watch history) every 2s without waiting for play,
// then {type:"PLAYER_EVENT", data:{event}} once playing. "We Couldn't Find This
// Content" and server-error pages only post Yandex Metrica strings, if anything.
const VIDLINK = tmdbSource("vidlink", "https://vidlink.pro", (data) => {
  const type = messageType(data);
  return type === "MEDIA_DATA" || type === "PLAYER_EVENT" ? "ready" : null;
});
// Best anime coverage; follows TMDB's season/episode numbering. Posts nothing,
// whether the title plays or shows "Content unavailable".
const VIDROCK = tmdbSource("vidrock", "https://vidrock.net");
// Good coverage incl. anime, but popunder ads on click and patchy uptime.
// Its {type:"MEDIA_DATA"} progress message only starts some time into
// playback (and needs autoplay), too late to tell a dead page from a slow one.
const VIDSRC_SU = tmdbSource("vidsrc-su", "https://vidsrc.su");

export type SourceCategory = "movie" | "tv" | "anime-movie" | "anime-tv";

// Ordered by reliability per kind of content: the player starts on the first
// source and fails over down the list.
export const SOURCES_BY_CATEGORY: Record<SourceCategory, VideoSource[]> = {
  movie: [VIXSRC, VIDLINK, VIDROCK, VIDSRC_SU],
  tv: [VIXSRC, VIDLINK, VIDROCK, VIDSRC_SU],
  "anime-movie": [VIDROCK, VIDSRC_SU],
  "anime-tv": [VIDROCK, VIDSRC_SU, VIDLINK],
};

export function getSourceCategory(type: MediaType, anime: boolean): SourceCategory {
  if (anime) return type === "movie" ? "anime-movie" : "anime-tv";
  return type;
}

// TMDB "Animation" genre id
const ANIMATION_GENRE_ID = 16;

export function isAnime(data: any): boolean {
  if (!data || !Array.isArray(data.genres)) return false;

  const hasAnimationGenre = data.genres.some(
    (genre: any) => genre?.id === ANIMATION_GENRE_ID || genre?.name === "Animation"
  );

  if (!hasAnimationGenre) return false;

  // Animation also needs a Japanese origin (TV) or language (movies) when
  // TMDB provides one, so Pixar and Disney titles use the regular sources
  if (Array.isArray(data.origin_country) && data.origin_country.length) {
    return data.origin_country.includes("JP");
  }
  if (typeof data.original_language === "string" && data.original_language) {
    return data.original_language === "ja";
  }
  return true;
}

// Explicit `sources` (tests, overrides) are used as given
export function getAvailableSources(type: MediaType, anime: boolean, sources?: VideoSource[]): VideoSource[] {
  return sources ?? SOURCES_BY_CATEGORY[getSourceCategory(type, anime)];
}

export function sourceLabel(source: VideoSource, index: number): string {
  return source.name ?? `Source ${index + 1}`;
}

// Returns null when the request can't produce a valid embed URL yet
// (e.g. router query not hydrated, or a TV episode with no season/episode).
export function buildEmbedUrl(source: VideoSource | undefined, media: MediaRequest): string | null {
  if (!source || media.id === undefined || media.id === null || media.id === "") return null;
  if (media.type === "tv" && (!media.season || !media.episode)) return null;
  return source.buildUrl(media);
}

// Reads a postMessage from the active source's iframe; anything from another
// origin, or that the provider's adapter doesn't recognise, is null.
export function readPlaybackSignal(
  source: VideoSource | undefined,
  event: Pick<MessageEvent, "origin" | "data">
): PlaybackSignal | null {
  const signals = source?.signals;
  if (!signals || event.origin !== signals.origin) return null;
  try {
    return signals.parseMessage(event.data);
  } catch {
    return null;
  }
}

// Index of the next source to try after `current` fails, or null when every
// source has already been tried.
export function getNextSourceIndex(
  current: number,
  total: number,
  tried: ReadonlySet<number>
): number | null {
  for (let step = 1; step < total; step++) {
    const candidate = (current + step) % total;
    if (!tried.has(candidate)) return candidate;
  }
  return null;
}

// Restores the viewer's last chosen source, falling back to the first one.
export function getInitialSourceIndex(
  sources: VideoSource[],
  preferredId: string | null | undefined
): number {
  if (!preferredId) return 0;
  const index = sources.findIndex((source) => source.id === preferredId);
  return index === -1 ? 0 : index;
}
