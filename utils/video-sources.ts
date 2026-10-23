export type MediaType = "movie" | "tv";

export interface MediaRequest {
  type: MediaType;
  id: string | number;
  season?: string | number;
  episode?: string | number;
}

export interface VideoSource {
  id: string;
  name: string;
  supportsAnime: boolean;
  buildUrl: (media: MediaRequest) => string;
}

// Ordered by reliability: the player starts on the first source and fails
// over down the list. Removed (unreachable as of 2026-10): vidsrcme.su, vidsrc.pro.
export const VIDEO_SOURCES: VideoSource[] = [
  {
    id: "vidlink",
    name: "Source 1",
    supportsAnime: true,
    buildUrl: ({ type, id, season, episode }) =>
      type === "movie"
        ? `https://vidlink.pro/movie/${id}`
        : `https://vidlink.pro/tv/${id}/${season}/${episode}`,
  },
  {
    id: "vidsrc-cc",
    name: "Source 2",
    supportsAnime: true,
    buildUrl: ({ type, id, season, episode }) =>
      type === "movie"
        ? `https://vidsrc.cc/v2/embed/movie/${id}`
        : `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`,
  },
];

// TMDB "Animation" genre id
const ANIMATION_GENRE_ID = 16;

export function isAnime(data: any): boolean {
  if (!data || !Array.isArray(data.genres)) return false;

  const hasAnimationGenre = data.genres.some(
    (genre: any) => genre?.id === ANIMATION_GENRE_ID || genre?.name === "Animation"
  );

  // TV shows additionally need a Japanese origin to count as anime
  if (Array.isArray(data.origin_country)) {
    return hasAnimationGenre && data.origin_country.includes("JP");
  }

  return hasAnimationGenre;
}

export function getAvailableSources(
  isAnimeContent: boolean,
  sources: VideoSource[] = VIDEO_SOURCES
): VideoSource[] {
  return isAnimeContent ? sources.filter((source) => source.supportsAnime) : sources;
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
