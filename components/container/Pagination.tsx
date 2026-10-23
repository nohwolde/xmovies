import Link from "next/link";
import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface PaginationProps {
  // Path prefix without the page number, e.g. "/movies" or "/genre/Action-28"
  basePath: string;
  page: number;
  totalPages?: number;
}

export function pageHref(basePath: string, page: number): string {
  return `/${basePath.replace(/^\/+|\/+$/g, "")}/${page}`;
}

function Pagination({ basePath, page, totalPages = 500 }: PaginationProps) {
  const last = Math.min(totalPages, 500); // TMDB caps discover results at 500 pages
  const pill = "flex h-10 min-w-[2.5rem] items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium transition";
  const pages = [page - 1, page, page + 1].filter((p) => p >= 1 && p <= last);

  // Past the end (e.g. after switching Movies/Shows on a high page)
  if (page > last && last >= 1) {
    return (
      <nav className="flex justify-center py-10" aria-label="Pagination">
        <Link href={pageHref(basePath, last)}>
          <a className={`${pill} bg-white/5 hover:bg-white/10`}>
            <FiChevronLeft /> Back to page {last}
          </a>
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center justify-center gap-2 py-10" aria-label="Pagination">
      {page > 1 ? (
        <Link href={pageHref(basePath, page - 1)}>
          <a className={`${pill} bg-white/5 hover:bg-white/10`} aria-label="Previous page">
            <FiChevronLeft /> <span className="hidden sm:inline">Prev</span>
          </a>
        </Link>
      ) : (
        <span className={`${pill} bg-white/5 text-white/30`} aria-disabled="true">
          <FiChevronLeft /> <span className="hidden sm:inline">Prev</span>
        </span>
      )}
      {pages.map((p) => (
        <Link href={pageHref(basePath, p)} key={p}>
          <a
            aria-current={p === page ? "page" : undefined}
            className={`${pill} ${p === page ? "bg-white text-black" : "bg-white/5 hover:bg-white/10"}`}
          >
            {p}
          </a>
        </Link>
      ))}
      {page < last ? (
        <Link href={pageHref(basePath, page + 1)}>
          <a className={`${pill} bg-white/5 hover:bg-white/10`} aria-label="Next page">
            <span className="hidden sm:inline">Next</span> <FiChevronRight />
          </a>
        </Link>
      ) : (
        <span className={`${pill} bg-white/5 text-white/30`} aria-disabled="true">
          <span className="hidden sm:inline">Next</span> <FiChevronRight />
        </span>
      )}
    </nav>
  );
}

export default Pagination;
