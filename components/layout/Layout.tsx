import Head from "next/head";
import React from "react";

type LayoutProps = {
  title: string;
  children: React.ReactNode;
};

// Standard page wrapper: clears the fixed navbar and sets the document title
function Layout({ title, children }: LayoutProps) {
  const fullTitle = title ? `${title} | NMOVIES` : "NMOVIES";
  return (
    <div className="pt-20 md:pt-24">
      <Head>
        <title>{fullTitle}</title>
        <meta property="og:title" content={fullTitle} />
      </Head>
      {children}
    </div>
  );
}

export default Layout;
