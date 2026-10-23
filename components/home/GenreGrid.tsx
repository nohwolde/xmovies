import Link from "next/link";
import React from "react";
import { FiChevronRight } from "react-icons/fi";
import { GENRE_LINKS } from "../../lib/tmdb";

function GenreGrid() {
  return (
    <section className="my-10 px-4 md:px-12" aria-label="Popular genres">
      <h2 className="mb-3 text-lg md:text-2xl font-bold tracking-tight">Popular Genres</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {GENRE_LINKS.map((genre) => (
          <Link href={genre.href} key={genre.name}>
            <a
              className={`group relative flex h-20 md:h-24 items-end overflow-hidden rounded-lg bg-gradient-to-br ${genre.tone} to-surface-2 p-3 ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:ring-white/20`}
            >
              <span className="flex items-center gap-1 font-semibold">
                {genre.name}
                <FiChevronRight className="opacity-0 transition group-hover:opacity-100" aria-hidden />
              </span>
            </a>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default GenreGrid;
