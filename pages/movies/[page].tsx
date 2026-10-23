import React from "react";
import Container from "../../components/container/Container";
import Layout from "../../components/layout/Layout";
import { usePageParam, useTmdbPage } from "../../hooks/useTmdbPage";

function Movies() {
  const page = usePageParam();
  const { items, totalPages, loading } = useTmdbPage("/discover/movie", { sort_by: "popularity.desc", page });

  return (
    <Layout title="Movies">
      <Container
        Data={items}
        heading="Movies"
        subheading="The most popular movies right now"
        mediaType="movie"
        loading={loading}
        pagination={{ basePath: "/movies", page, totalPages }}
      />
    </Layout>
  );
}

export default Movies;
