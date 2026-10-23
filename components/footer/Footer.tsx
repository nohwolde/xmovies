import Link from "next/link";
import React from "react";

const LINKS = [
  { name: "Home", href: "/" },
  { name: "Movies", href: "/movies/1" },
  { name: "Shows", href: "/tvshows/1" },
  { name: "Anime", href: "/anime/1" },
  { name: "Top Rated", href: "/topimdb/1" },
  { name: "My List", href: "/movies-list" },
  { name: "Privacy", href: "/privacy" },
  { name: "Terms", href: "/terms" },
];

function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 bg-bg px-4 md:px-12 py-12 text-sm text-white/50">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <Link href="/">
            <a className="text-2xl font-black tracking-tight text-white">
              N<span className="text-accent">MOVIES</span>
            </a>
          </Link>
          <p>
            NMOVIES does not store any files on its servers. All content is provided by non-affiliated third
            parties. Metadata and images courtesy of TMDB.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 sm:grid-cols-4">
          {LINKS.map((link) => (
            <Link href={link.href} key={link.name}>
              <a className="hover:text-white">{link.name}</a>
            </Link>
          ))}
        </nav>
      </div>
      <p className="mt-10 text-xs text-white/30">© {new Date().getFullYear()} NMOVIES</p>
    </footer>
  );
}

export default Footer;
