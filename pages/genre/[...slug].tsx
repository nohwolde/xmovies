import { useRouter } from "next/router";
import React, { useState } from "react";
import Container from "../../components/container/Container";
import Layout from "../../components/layout/Layout";
import { useTmdbPage } from "../../hooks/useTmdbPage";
import { MediaType } from "../../lib/tmdb";

// TV merges several movie genres into combined ones
const MOVIE_TO_TV_GENRE: Record<number, number> = {
  28: 10759, // Action -> Action & Adventure
  12: 10759, // Adventure -> Action & Adventure
  878: 10765, // Science Fiction -> Sci-Fi & Fantasy
  14: 10765, // Fantasy -> Sci-Fi & Fantasy
  10752: 10768, // War -> War & Politics
};

// Slug format: /genre/<Name-Words>-<genreId>/<page>
function parseGenreSlug(slug: string | undefined) {
  const parts = decodeURIComponent(slug ?? "").split("-");
  const id = Number(parts.pop());
  const name = parts.join(" ").replace(/\s+/g, " ").trim();
  // TV-only genres (e.g. "Sci-Fi & Fantasy", ids >= 10759) have no movie equivalent
  const tvOnly = name.includes("&") || id >= 10759;
  return { id: Number.isFinite(id) ? id : null, name, tvOnly };
}

function Genre() {
  const router = useRouter();
  const slug = (router.query.slug as string[] | undefined) ?? [];
  const genre = parseGenreSlug(slug[0]);
  const page = Math.max(1, parseInt(slug[1] ?? "1", 10) || 1);
  const [type, setType] = useState<MediaType>("movie");
  const effectiveType: MediaType = genre.tvOnly ? "tv" : type;

  const { items, totalPages, loading } = useTmdbPage(genre.id ? `/discover/${effectiveType}` : null, {
    with_genres: genre.id === null ? undefined : effectiveType === "tv" ? MOVIE_TO_TV_GENRE[genre.id] ?? genre.id : genre.id,
    sort_by: "popularity.desc",
    page,
  });

  return (
    <Layout title={genre.name}>
      <Container
        Data={items}
        heading={genre.name || "Genre"}
        subheading={effectiveType === "tv" ? "Series" : "Movies"}
        mediaType={effectiveType}
        loading={loading || !router.isReady}
        toggle={genre.tvOnly ? undefined : { value: type, onChange: setType }}
        pagination={{ basePath: `/genre/${slug[0] ?? ""}`, page, totalPages }}
      />
    </Layout>
  );
}

export default Genre;
