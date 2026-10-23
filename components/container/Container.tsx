import React from "react";
import { MediaItem, MediaType } from "../../lib/tmdb";
import MediaCard from "../media/MediaCard";
import { TypeToggle, useInfoModal } from "../media/MediaRow";
import Pagination from "./Pagination";

interface ContainerProps {
  Data: MediaItem[];
  heading: string;
  subheading?: string;
  mediaType?: MediaType;
  // Shows a Movies/Shows toggle when provided
  toggle?: { value: MediaType; onChange: (type: MediaType) => void };
  pagination?: { basePath: string; page: number; totalPages?: number };
  loading?: boolean;
  emptyMessage?: string;
  // The fetch failed; shows an alert with a retry button instead of "empty"
  error?: boolean;
  onRetry?: () => void;
  // The page's own title, unless the page already has an h1
  headingLevel?: "h1" | "h2";
}

// Catalog grid used by the list, genre, search, cast and recommendation sections
function Container({
  Data,
  heading,
  subheading,
  mediaType,
  toggle,
  pagination,
  loading,
  emptyMessage,
  headingLevel: Heading = "h1",
  error,
  onRetry,
}: ContainerProps) {
  const { open, modal } = useInfoModal();
  const items = (Data ?? []).filter((item) => item && item.media_type !== "person");

  return (
    <section className="px-4 md:px-12 py-6" aria-label={heading}>
      {modal}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Heading className="text-2xl md:text-4xl font-black tracking-tight">{heading}</Heading>
          {subheading && <p className="mt-1 text-sm text-white/50">{subheading}</p>}
        </div>
        {toggle && <TypeToggle value={toggle.value} onChange={toggle.onChange} />}
      </div>

      {error && !loading ? (
        <div role="alert" className="flex flex-col items-center gap-4 py-20 text-center text-white/60">
          <p>Couldn&apos;t load this list. Check your connection and try again.</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Retry
            </button>
          )}
        </div>
      ) : loading && !items.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      ) : items.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {items.map((item) => (
            <MediaCard
              key={`${item.media_type ?? mediaType}-${item.id}`}
              item={item}
              mediaType={toggle?.value ?? mediaType}
              onSelect={open}
            />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center text-white/50">{emptyMessage ?? "Nothing to show here yet."}</p>
      )}

      {/* Also shown when this page is empty but others exist (e.g. past the last page, or only people matched) */}
      {pagination && !loading && !error && (items.length > 0 || (pagination.totalPages ?? 0) > 0) && (
        <Pagination {...pagination} />
      )}
    </section>
  );
}

export default Container;
