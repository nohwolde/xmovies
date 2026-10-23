import React from "react";
import Privacy from "../components/company/Privacy";
import Layout from "../components/layout/Layout";

export default function PrivacyPage() {
  return (
    <Layout title="Privacy Notice" description="How NMOVIES collects, uses and protects your information.">
      <div className="mx-auto max-w-3xl px-4 text-white/75">
        <Privacy />
      </div>
    </Layout>
  );
}
