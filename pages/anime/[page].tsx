import React, { useState } from "react";
import Container from "../../components/container/Container";
import Layout from "../../components/layout/Layout";
import { usePageParam, useTmdbPage } from "../../hooks/useTmdbPage";
import { MediaType } from "../../lib/tmdb";

function Anime() {
  const page = usePageParam();
  const [type, setType] = useState<MediaType>("tv");
  const { items, totalPages, loading, error, retry } = useTmdbPage(page ? `/discover/${type}` : null, {
    with_genres: 16,
    with_original_language: "ja",
    sort_by: "popularity.desc",
    page: page ?? 1,
  });

  return (
    <Layout title="Anime" description="Browse popular Japanese anime series and movies on NMOVIES.">
      <Container
        Data={items}
        heading="Anime"
        subheading="Popular Japanese animation"
        loading={loading}
        error={error}
        onRetry={retry}
        toggle={{ value: type, onChange: setType }}
        pagination={{ basePath: "/anime", page: page ?? 1, totalPages }}
      />
    </Layout>
  );
}

export default Anime;
