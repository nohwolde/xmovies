export const TMDB_API_KEY = "cfe422613b250f702980a3bbf9e90716";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

export type MediaType = "movie" | "tv";

export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  profile_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  media_type?: MediaType | "person";
  character?: string;
  [key: string]: any;
}

export async function tmdb<T = any>(
  path: string,
  params: Record<string, string | number | undefined> = {}
): Promise<T> {
  const query = new URLSearchParams({ api_key: TMDB_API_KEY });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const res = await fetch(`${TMDB_BASE}${path}?${query}`);
  if (!res.ok) throw new Error(`TMDB ${path} failed: ${res.status}`);
  return res.json();
}

// Fetches a list endpoint and returns `results`, or [] on failure so one bad
// row never breaks a whole page.
export async function tmdbList(
  path: string,
  params: Record<string, string | number | undefined> = {}
): Promise<MediaItem[]> {
  try {
    const data = await tmdb<{ results?: MediaItem[] }>(path, params);
    return data.results ?? [];
  } catch {
    return [];
  }
}

export type ImageSize = "w92" | "w185" | "w300" | "w342" | "w500" | "w780" | "w1280" | "original";

export function imageUrl(path: string | null | undefined, size: ImageSize = "w500"): string | null {
  return path ? `${IMAGE_BASE}/${size}${path.startsWith("/") ? "" : "/"}${path}` : null;
}

export function getTitle(item: Partial<MediaItem> | null | undefined): string {
  return item?.title || item?.name || "";
}

export function getYear(item: Partial<MediaItem> | null | undefined): string {
  return (item?.release_date || item?.first_air_date || "").slice(0, 4);
}

export function getMediaType(item: Partial<MediaItem>, fallback?: MediaType): MediaType {
  if (item.media_type === "movie" || item.media_type === "tv") return item.media_type;
  if (fallback) return fallback;
  return item.first_air_date !== undefined || (item.name && !item.title) ? "tv" : "movie";
}

export function formatRating(vote?: number): string | null {
  return vote ? vote.toFixed(1) : null;
}

export function formatRuntime(minutes?: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function mediaHref(item: Partial<MediaItem>, fallback?: MediaType): string {
  return `/${getMediaType(item, fallback)}/${item.id}`;
}

// "New" when released in the last 30 days
export function isRecent(item: Partial<MediaItem>, now = Date.now()): boolean {
  const date = Date.parse(item.release_date || item.first_air_date || "");
  if (Number.isNaN(date)) return false;
  const age = now - date;
  return age >= 0 && age < 30 * 24 * 60 * 60 * 1000;
}

const GENRES: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
  878: "Sci-Fi", 10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
  10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics",
};

export function genreNames(item: Partial<MediaItem>, limit = 2): string[] {
  const names = item.genres?.map((g) => g.name) ?? (item.genre_ids ?? []).map((id) => GENRES[id]);
  return names.filter(Boolean).slice(0, limit);
}

// English (or language-neutral) title logo for hero/detail headers.
export async function fetchLogo(type: MediaType, id: number | string): Promise<string | null> {
  try {
    const data = await tmdb<{ logos?: { file_path: string; iso_639_1: string | null }[] }>(
      `/${type}/${id}/images`,
      { include_image_language: "en,null" }
    );
    const logo = data.logos?.find((l) => l.iso_639_1 === "en") ?? data.logos?.[0];
    return logo ? imageUrl(logo.file_path, "w500") : null;
  } catch {
    return null;
  }
}

export async function fetchTrailerKey(type: MediaType, id: number | string): Promise<string | null> {
  try {
    const data = await tmdb<{ results?: { key: string; site: string; type: string }[] }>(
      `/${type}/${id}/videos`
    );
    const videos = (data.results ?? []).filter((v) => v.site === "YouTube");
    return (videos.find((v) => v.type === "Trailer") ?? videos[0])?.key ?? null;
  } catch {
    return null;
  }
}

export const GENRE_LINKS: { name: string; href: string; tone: string }[] = [
  { name: "Action", href: "/genre/Action-28/1", tone: "from-orange-600/80" },
  { name: "Comedy", href: "/genre/Comedy-35/1", tone: "from-yellow-500/80" },
  { name: "Horror", href: "/genre/Horror-27/1", tone: "from-red-700/80" },
  { name: "Sci-Fi", href: "/genre/Science-Fiction-878/1", tone: "from-cyan-600/80" },
  { name: "Thriller", href: "/genre/Thriller-53/1", tone: "from-slate-500/80" },
  { name: "Drama", href: "/genre/Drama-18/1", tone: "from-rose-600/80" },
  { name: "Crime", href: "/genre/Crime-80/1", tone: "from-zinc-500/80" },
  { name: "Animation", href: "/genre/Animation-16/1", tone: "from-pink-500/80" },
  { name: "Family", href: "/genre/Family-10751/1", tone: "from-emerald-600/80" },
  { name: "Fantasy", href: "/genre/Fantasy-14/1", tone: "from-violet-600/80" },
  { name: "Mystery", href: "/genre/Mystery-9648/1", tone: "from-indigo-600/80" },
  { name: "Adventure", href: "/genre/Adventure-12/1", tone: "from-amber-600/80" },
  { name: "Romance", href: "/genre/Romance-10749/1", tone: "from-fuchsia-600/80" },
  { name: "War", href: "/genre/War-10752/1", tone: "from-stone-500/80" },
];
