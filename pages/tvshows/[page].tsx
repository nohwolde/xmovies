import React from "react";
import Container from "../../components/container/Container";
import Layout from "../../components/layout/Layout";
import { usePageParam, useTmdbPage } from "../../hooks/useTmdbPage";

function TvShows() {
  const page = usePageParam();
  const { items, totalPages, loading, error, retry } = useTmdbPage(page ? "/discover/tv" : null, { sort_by: "popularity.desc", page: page ?? 1 });

  return (
    <Layout title="TV Shows" description="Browse the most popular TV series right now on NMOVIES.">
      <Container
        Data={items}
        heading="TV Shows"
        subheading="The most popular series right now"
        mediaType="tv"
        loading={loading}
        error={error}
        onRetry={retry}
        pagination={{ basePath: "/tvshows", page: page ?? 1, totalPages }}
      />
    </Layout>
  );
}

export default TvShows;
