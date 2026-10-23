import Link from "next/link";
import React from "react";
import Layout from "../components/layout/Layout";

export default function NotFound() {
  return (
    <Layout title="Page not found">
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-7xl md:text-8xl font-black tracking-tight text-accent">404</p>
        <h1 className="text-2xl md:text-3xl font-bold">This page could not be found</h1>
        <p className="max-w-md text-white/60">The title may have been removed, or the link is wrong.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link href="/">
            <a className="rounded-md bg-white px-5 py-2.5 font-semibold text-black transition hover:bg-white/85">Back to home</a>
          </Link>
          <Link href="/movies/1">
            <a className="rounded-md bg-white/10 px-5 py-2.5 font-semibold transition hover:bg-white/20">Browse movies</a>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
