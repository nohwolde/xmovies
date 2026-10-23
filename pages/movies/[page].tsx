import React from "react";
import Container from "../../components/container/Container";
import Layout from "../../components/layout/Layout";
import { usePageParam, useTmdbPage } from "../../hooks/useTmdbPage";

function Movies() {
  const page = usePageParam();
  const { items, totalPages, loading, error, retry } = useTmdbPage(page ? "/discover/movie" : null, { sort_by: "popularity.desc", page: page ?? 1 });

  return (
    <Layout title="Movies" description="Browse the most popular movies right now on NMOVIES.">
      <Container
        Data={items}
        heading="Movies"
        subheading="The most popular movies right now"
        mediaType="movie"
        loading={loading}
        error={error}
        onRetry={retry}
        pagination={{ basePath: "/movies", page: page ?? 1, totalPages }}
      />
    </Layout>
  );
}

export default Movies;
