import React from "react";
import Container from "../../components/container/Container";
import Layout from "../../components/layout/Layout";
import { usePageParam, useTmdbPage } from "../../hooks/useTmdbPage";

function TvShows() {
  const page = usePageParam();
  const { items, totalPages, loading } = useTmdbPage("/discover/tv", { sort_by: "popularity.desc", page });

  return (
    <Layout title="TV Shows">
      <Container
        Data={items}
        heading="TV Shows"
        subheading="The most popular series right now"
        mediaType="tv"
        loading={loading}
        pagination={{ basePath: "/tvshows", page, totalPages }}
      />
    </Layout>
  );
}

export default TvShows;
