import React, { useState } from "react";
import Container from "../../components/container/Container";
import Layout from "../../components/layout/Layout";
import { usePageParam, useTmdbPage } from "../../hooks/useTmdbPage";
import { MediaType } from "../../lib/tmdb";

function Anime() {
  const page = usePageParam();
  const [type, setType] = useState<MediaType>("tv");
  const { items, totalPages, loading } = useTmdbPage(`/discover/${type}`, {
    with_genres: 16,
    with_original_language: "ja",
    sort_by: "popularity.desc",
    page,
  });

  return (
    <Layout title="Anime">
      <Container
        Data={items}
        heading="Anime"
        subheading="Popular Japanese animation"
        loading={loading}
        toggle={{ value: type, onChange: setType }}
        pagination={{ basePath: "/anime", page, totalPages }}
      />
    </Layout>
  );
}

export default Anime;
