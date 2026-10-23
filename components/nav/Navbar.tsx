import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { FiFilm, FiHome, FiSearch, FiStar, FiTv, FiUser, FiX } from "react-icons/fi";
import Logo from "./Logo";

const NAV_ITEMS = [
  { name: "Home", href: "/", icon: FiHome, match: (p: string) => p === "/" },
  { name: "Movies", href: "/movies/1", icon: FiFilm, match: (p: string) => p.startsWith("/movies/") },
  { name: "Shows", href: "/tvshows/1", icon: FiTv, match: (p: string) => p.startsWith("/tvshows") },
  { name: "Anime", href: "/anime/1", icon: FiStar, match: (p: string) => p.startsWith("/anime") },
];

function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Debounced live search once the query is meaningful
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return;
    const timer = window.setTimeout(() => {
      // Refine in place once on the results page so Back doesn't replay every partial query
      const url = `/search/${encodeURIComponent(q)}/1`;
      if (router.pathname.startsWith("/search")) router.replace(url);
      else router.push(url);
    }, 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search/${encodeURIComponent(q)}/1`);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[100] transition-colors duration-500 ${
        scrolled ? "bg-bg/80 backdrop-blur-md" : "bg-gradient-to-b from-black/70 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 md:h-20 items-center justify-between gap-3 px-4 md:px-12">
        <Link href="/">
          <a className="shrink-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]" aria-label="NMOVIES home">
            <Logo className="h-[28px] sm:h-[32px] md:h-[36px]" />
          </a>
        </Link>

        <nav
          aria-label="Main"
          className="flex items-center gap-1 rounded-xl border border-white/10 bg-neutral-900/70 p-1 backdrop-blur-md shadow-lg"
        >
          {!searchOpen &&
            NAV_ITEMS.map(({ name, href, icon: Icon, match }) => {
              const active = match(router.asPath);
              return (
                <Link href={href} key={name}>
                  <a
                    aria-label={name}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-lg px-2.5 md:px-3 py-1.5 text-sm font-medium transition-colors ${
                      active ? "bg-white/15 text-white" : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon size={16} aria-hidden />
                    <span className="hidden sm:inline">{name}</span>
                  </a>
                </Link>
              );
            })}

          {searchOpen ? (
            <form onSubmit={submit} className="flex items-center gap-2 px-2" role="search">
              <FiSearch size={16} className="text-white/60" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && closeSearch()}
                placeholder="Search movies, shows…"
                aria-label="Search"
                className="w-44 sm:w-64 bg-transparent py-1.5 text-sm text-white placeholder-white/40 outline-none"
              />
              <button type="button" onClick={closeSearch} aria-label="Close search" className="p-1 text-white/60 hover:text-white">
                <FiX size={16} />
              </button>
            </form>
          ) : (
            <>
              <span className="mx-1 h-5 w-px bg-white/10" aria-hidden />
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="rounded-lg p-2 text-white/70 hover:text-white hover:bg-white/5"
              >
                <FiSearch size={16} />
              </button>
              <Link href="/movies-list">
                <a
                  aria-label="My List"
                  title="My List"
                  className={`rounded-lg p-2 hover:bg-white/5 ${
                    router.asPath === "/movies-list" ? "text-white bg-white/15" : "text-white/70 hover:text-white"
                  }`}
                >
                  <FiUser size={16} />
                </a>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
