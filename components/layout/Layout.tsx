import Head from "next/head";
import React from "react";

type LayoutProps = {
  title: string;
  description?: string;
  // Personal or query-driven pages that shouldn't be indexed
  noindex?: boolean;
  children: React.ReactNode;
};

// Standard page wrapper: clears the fixed navbar and sets the document title
function Layout({ title, description, noindex, children }: LayoutProps) {
  const fullTitle = title ? `${title} | NMOVIES` : "NMOVIES";
  return (
    <div className="pt-20 md:pt-24">
      <Head>
        <title>{fullTitle}</title>
        <meta key="og:title" property="og:title" content={fullTitle} />
        {description && <meta key="description" name="description" content={description} />}
        {noindex && <meta name="robots" content="noindex" />}
        {description && <meta key="og:description" property="og:description" content={description} />}
      </Head>
      {children}
    </div>
  );
}

export default Layout;
