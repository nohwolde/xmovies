import React, { useState } from "react";
import Container from "../../components/container/Container";
import Layout from "../../components/layout/Layout";
import { usePageParam, useTmdbPage } from "../../hooks/useTmdbPage";
import { MediaType } from "../../lib/tmdb";

function TopRated() {
  const page = usePageParam();
  const [type, setType] = useState<MediaType>("movie");
  const { items, totalPages, loading } = useTmdbPage(`/${type}/top_rated`, { page });

  return (
    <Layout title="Top Rated">
      <Container
        Data={items}
        heading="Top Rated"
        subheading="All-time highest rated on TMDB"
        loading={loading}
        toggle={{ value: type, onChange: setType }}
        pagination={{ basePath: "/topimdb", page, totalPages }}
      />
    </Layout>
  );
}

export default TopRated;
