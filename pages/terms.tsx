import React from "react";
import Terms from "../components/company/Terms";
import Layout from "../components/layout/Layout";

export default function TermsPage() {
  return (
    <Layout title="Terms of Use" description="The terms and conditions for using NMOVIES.">
      <div className="mx-auto max-w-3xl px-4 text-white/75">
        <Terms />
      </div>
    </Layout>
  );
}
