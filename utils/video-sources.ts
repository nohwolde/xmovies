export type MediaType = "movie" | "tv";

export interface MediaRequest {
  type: MediaType;
  id: string | number;
  season?: string | number;
  episode?: string | number;
}

export interface VideoSource {
  id: string;
  // Button label; defaults to "Source <position>" in the current list
  name?: string;
  buildUrl: (media: MediaRequest) => string;
}

// Providers keyed by TMDB id. Verified 2026-10 by loading each in an iframe
// with the player's attributes and checking the stream length against the
// real runtime. Removed as dead: vidsrc.cc (Cloudflare 522), vidsrcme.su,
// vidsrc.pro; avoided: 2embed, multiembed, vidnest (adult/scam ads).
const tmdbSource = (id: string, base: string): VideoSource => ({
  id,
  buildUrl: ({ type, id: mediaId, season, episode }) =>
    type === "movie" ? `${base}/movie/${mediaId}` : `${base}/tv/${mediaId}/${season}/${episode}`,
});

// No popups, sends progress events; no anime catalog (404s on anime)
const VIXSRC = tmdbSource("vixsrc", "https://vixsrc.to");
// Plays anime series but not anime movies
const VIDLINK = tmdbSource("vidlink", "https://vidlink.pro");
// Best anime coverage; follows TMDB's season/episode numbering
const VIDROCK = tmdbSource("vidrock", "https://vidrock.net");
// Good coverage incl. anime, but popunder ads on click and patchy uptime
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

  // Animation also needs a Japanese origin, so Pixar and Disney titles use
  // the regular sources. TMDB movie and TV details both include
  // origin_country; original_language only covers responses without it.
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
