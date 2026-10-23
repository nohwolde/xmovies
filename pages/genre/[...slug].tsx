import { useRouter } from "next/router";
import React, { useState } from "react";
import Container from "../../components/container/Container";
import Layout from "../../components/layout/Layout";
import { MAX_TMDB_PAGE, useTmdbPage } from "../../hooks/useTmdbPage";
import { MediaType } from "../../lib/tmdb";

// TV merges several movie genres into combined ones
const MOVIE_TO_TV_GENRE: Record<number, number> = {
  28: 10759, // Action -> Action & Adventure
  12: 10759, // Adventure -> Action & Adventure
  878: 10765, // Science Fiction -> Sci-Fi & Fantasy
  14: 10765, // Fantasy -> Sci-Fi & Fantasy
  10752: 10768, // War -> War & Politics
};
// TV genres with no movie equivalent, and movie genres with no TV equivalent
const TV_ONLY = new Set([10759, 10762, 10763, 10764, 10765, 10766, 10767, 10768]);
const MOVIE_ONLY = new Set([27, 36, 53, 10402, 10749, 10770]); // Horror, History, Thriller, Music, Romance, TV Movie

// Slug format: /genre/<Name-Words>-<genreId>/<page>
function parseGenreSlug(slug: string | undefined) {
  const parts = (slug ?? "").split("-");
  const id = Number(parts.pop());
  const name = parts.join(" ").replace(/\s+/g, " ").trim();
  const valid = Number.isInteger(id) && id > 0;
  return { id: valid ? id : null, name, tvOnly: TV_ONLY.has(id), movieOnly: MOVIE_ONLY.has(id) };
}

function Genre() {
  const router = useRouter();
  const slug = (router.query.slug as string[] | undefined) ?? [];
  const genre = parseGenreSlug(slug[0]);
  const page = Math.min(MAX_TMDB_PAGE, Math.max(1, parseInt(slug[1] ?? "1", 10) || 1));
  const [type, setType] = useState<MediaType>("movie");
  const effectiveType: MediaType = genre.tvOnly ? "tv" : genre.movieOnly ? "movie" : type;

  const { items, totalPages, loading, error, retry } = useTmdbPage(genre.id ? `/discover/${effectiveType}` : null, {
    with_genres: genre.id === null ? undefined : effectiveType === "tv" ? MOVIE_TO_TV_GENRE[genre.id] ?? genre.id : genre.id,
    sort_by: "popularity.desc",
    page,
  });

  return (
    <Layout title={genre.name} description={`Browse ${genre.name} movies and TV shows on NMOVIES.`}>
      <Container
        Data={items}
        heading={genre.name || "Genre"}
        subheading={effectiveType === "tv" ? "Series" : "Movies"}
        mediaType={effectiveType}
        // A slug without a valid id never fetches; show "not found" instead of a skeleton
        loading={(loading && genre.id !== null) || !router.isReady}
        error={error}
        onRetry={retry}
        emptyMessage={genre.id === null ? "This genre doesn't exist." : undefined}
        toggle={genre.id === null || genre.tvOnly || genre.movieOnly ? undefined : { value: type, onChange: setType }}
        pagination={{ basePath: `/genre/${slug[0] ?? ""}`, page, totalPages }}
      />
    </Layout>
  );
}

export default Genre;
