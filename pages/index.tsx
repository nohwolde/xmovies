import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import GenreGrid from "../components/home/GenreGrid";
import HeroCarousel from "../components/home/HeroCarousel";
import Top10Row from "../components/home/Top10Row";
import ContinueCard from "../components/media/ContinueCard";
import MediaRow, { RowShell } from "../components/media/MediaRow";
import { MediaItem, MediaType, getMediaType, tmdbList } from "../lib/tmdb";

const ANIME_PARAMS = { with_genres: 16, with_original_language: "ja", sort_by: "popularity.desc" };

const toggleRows = {
  trending: (type: MediaType) => tmdbList(`/trending/${type}/week`),
  popular: (type: MediaType) => tmdbList(`/${type}/popular`),
  topRated: (type: MediaType) => tmdbList(`/${type}/top_rated`),
  comedy: (type: MediaType) =>
    tmdbList(`/discover/${type}`, { with_genres: 35, without_genres: 16, "vote_average.gte": 7, "vote_count.gte": 200, with_original_language: "en" }),
};
type ToggleRow = keyof typeof toggleRows;

interface HomeProps {
  featured: MediaItem[];
  top10: MediaItem[];
  onAir: MediaItem[];
  upcoming: MediaItem[];
  drama: MediaItem[];
  animeShows: MediaItem[];
  animeMovies: MediaItem[];
  rows: Record<ToggleRow, MediaItem[]>;
}

// Keep the SSR payload small: rows only need card fields
const CARD_FIELDS = ["id", "title", "name", "poster_path", "backdrop_path", "vote_average", "release_date", "first_air_date", "genre_ids", "media_type"];
function slim(items: MediaItem[], withOverview = false): MediaItem[] {
  return items.map((item) => {
    const out: any = {};
    for (const key of withOverview ? [...CARD_FIELDS, "overview"] : CARD_FIELDS) {
      if (item[key] !== undefined) out[key] = item[key];
    }
    return out;
  });
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async ({ res }) => {
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
  const [featured, top10, onAir, upcoming, drama, animeShows, animeMovies, trending, popular, topRated, comedy] =
    await Promise.all([
      tmdbList("/trending/all/day"),
      tmdbList("/trending/all/week"),
      tmdbList("/tv/on_the_air"),
      tmdbList("/movie/upcoming"),
      tmdbList("/discover/tv", { with_genres: 18, without_genres: 16, "vote_average.gte": 7.5, "vote_count.gte": 200, with_original_language: "en" }),
      tmdbList("/discover/tv", ANIME_PARAMS),
      tmdbList("/discover/movie", ANIME_PARAMS),
      toggleRows.trending("movie"),
      toggleRows.popular("movie"),
      toggleRows.topRated("movie"),
      toggleRows.comedy("movie"),
    ]);
  return {
    props: {
      featured: slim(featured.filter((item) => item.media_type !== "person").slice(0, 8), true),
      top10: slim(top10.filter((item) => item.media_type !== "person"), true),
      onAir: slim(onAir),
      upcoming: slim(upcoming),
      drama: slim(drama),
      animeShows: slim(animeShows),
      animeMovies: slim(animeMovies),
      rows: { trending: slim(trending), popular: slim(popular), topRated: slim(topRated), comedy: slim(comedy) },
    },
  };
};

// Rows with a Movies/Shows toggle: start from SSR data, refetch on toggle
function useToggleRow(key: ToggleRow, initial: MediaItem[]) {
  const [type, setType] = useState<MediaType>("movie");
  const [items, setItems] = useState(initial);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let cancelled = false;
    toggleRows[key](type).then((results) => !cancelled && setItems(results));
    return () => {
      cancelled = true;
    };
  }, [key, type]);

  return { items, toggle: { value: type, onChange: setType } };
}

function rankLabelFor(top10: MediaItem[]) {
  return (item: MediaItem) => {
    const type = getMediaType(item);
    const rank = top10.filter((t) => getMediaType(t) === type).findIndex((t) => t.id === item.id);
    if (rank < 0 || rank > 9) return null;
    return `#${rank + 1} in ${type === "tv" ? "TV shows" : "movies"}`;
  };
}

const Home: NextPage<HomeProps> = ({ featured, top10, onAir, upcoming, drama, animeShows, animeMovies, rows }) => {
  const continueWatching: any[] = useSelector((state: any) => state.ContinueWatching) ?? [];
  const recent = [...continueWatching].sort((a, b) => b.time - a.time);

  const trending = useToggleRow("trending", rows.trending);
  const popular = useToggleRow("popular", rows.popular);
  const topRated = useToggleRow("topRated", rows.topRated);
  const comedy = useToggleRow("comedy", rows.comedy);

  return (
    <>
      <Head>
        <title>NMOVIES - Watch Movies & TV Shows Online</title>
      </Head>

      <HeroCarousel items={featured} rankLabel={rankLabelFor(top10)} />

      <div className="relative z-10 -mt-10 md:-mt-16">
        {recent.length > 0 && (
          <RowShell title="Continue Watching">
            {recent.map((item) => (
              <ContinueCard key={`${item.media_type}-${item.id}`} item={item} />
            ))}
          </RowShell>
        )}

        <Top10Row title="TOP 10 on NMOVIES" items={top10} />
        <MediaRow title="Current & upcoming TV shows" items={onAir} mediaType="tv" href="/tvshows/1" badge={() => "New episode"} />
        <MediaRow title="Trending This Week" items={trending.items} toggle={trending.toggle} />
        <MediaRow title="Popular" items={popular.items} toggle={popular.toggle} href={popular.toggle.value === "tv" ? "/tvshows/1" : "/movies/1"} />
        <MediaRow title="Coming Soon" items={upcoming} mediaType="movie" badge={() => null} />
        <MediaRow title="Top Rated" items={topRated.items} toggle={topRated.toggle} href="/topimdb/1" />
        <MediaRow title="Acclaimed Drama Series" items={drama} mediaType="tv" />
        <MediaRow title="Comedy" items={comedy.items} toggle={comedy.toggle} />
        <MediaRow title="Anime Series" items={animeShows} mediaType="tv" href="/anime/1" />
        <MediaRow title="Anime Movies" items={animeMovies} mediaType="movie" />
        <GenreGrid />
      </div>
    </>
  );
};

export default Home;
