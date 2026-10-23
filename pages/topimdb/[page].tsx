import React, { useState } from "react";
import Container from "../../components/container/Container";
import Layout from "../../components/layout/Layout";
import { usePageParam, useTmdbPage } from "../../hooks/useTmdbPage";
import { MediaType } from "../../lib/tmdb";

function TopRated() {
  const page = usePageParam();
  const [type, setType] = useState<MediaType>("movie");
  const { items, totalPages, loading, error, retry } = useTmdbPage(page ? `/${type}/top_rated` : null, { page: page ?? 1 });

  return (
    <Layout title="Top Rated" description="The all-time highest rated movies and TV shows on NMOVIES.">
      <Container
        Data={items}
        heading="Top Rated"
        subheading="All-time highest rated on TMDB"
        loading={loading}
        error={error}
        onRetry={retry}
        toggle={{ value: type, onChange: setType }}
        pagination={{ basePath: "/topimdb", page: page ?? 1, totalPages }}
      />
    </Layout>
  );
}

export default TopRated;
