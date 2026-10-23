import { useRouter } from "next/router";
import React from "react";
import Container from "../../components/container/Container";
import Layout from "../../components/layout/Layout";
import { MAX_TMDB_PAGE, useTmdbPage } from "../../hooks/useTmdbPage";

function Search() {
  const router = useRouter();
  const slug = (router.query.slug as string[] | undefined) ?? [];
  const query = slug[0] ?? "";
  const page = Math.min(MAX_TMDB_PAGE, Math.max(1, parseInt(slug[1] ?? "1", 10) || 1));
  const { items, totalPages, loading, error, retry } = useTmdbPage(query ? "/search/multi" : null, { query, page });

  return (
    <Layout title={query ? `Search: ${query}` : "Search"} description="Search movies, TV shows and anime on NMOVIES." noindex>
      <Container
        Data={items}
        heading={query ? `Results for “${query}”` : "Search"}
        loading={loading || !router.isReady}
        error={error}
        onRetry={retry}
        emptyMessage={`No movies or shows match “${query}”.`}
        pagination={{ basePath: `/search/${encodeURIComponent(query)}`, page, totalPages }}
      />
    </Layout>
  );
}

export default Search;
