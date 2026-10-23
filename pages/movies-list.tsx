import React from "react";
import { useSelector } from "react-redux";
import Container from "../components/container/Container";
import Layout from "../components/layout/Layout";

function MyList() {
  const myList: any[] = useSelector((state: any) => state.MyList) ?? [];
  const items = [...myList].sort((a, b) => (b.time ?? 0) - (a.time ?? 0));

  return (
    <Layout title="My List" description="The movies and shows you saved on NMOVIES." noindex>
      <Container
        Data={items}
        heading="My List"
        subheading={items.length ? `${items.length} saved title${items.length > 1 ? "s" : ""}` : undefined}
        emptyMessage="Your list is empty. Use the + button on any title to save it here."
      />
    </Layout>
  );
}

export default MyList;
