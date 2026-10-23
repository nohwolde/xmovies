import { useRouter } from "next/router";
import React from "react";
import Container from "../../components/container/Container";
import Layout from "../../components/layout/Layout";
import { useTmdbPage } from "../../hooks/useTmdbPage";

function Search() {
  const router = useRouter();
  const slug = (router.query.slug as string[] | undefined) ?? [];
  const query = slug[0] ?? "";
  const page = Math.max(1, parseInt(slug[1] ?? "1", 10) || 1);
  const { items, totalPages, loading } = useTmdbPage(query ? "/search/multi" : null, { query, page });

  return (
    <Layout title={query ? `Search: ${query}` : "Search"}>
      <Container
        Data={items}
        heading={query ? `Results for “${query}”` : "Search"}
        loading={loading || !router.isReady}
        emptyMessage={`No movies or shows match “${query}”.`}
        pagination={{ basePath: `/search/${encodeURIComponent(query)}`, page, totalPages }}
      />
    </Layout>
  );
}

export default Search;
