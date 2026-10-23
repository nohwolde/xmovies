import Link from "next/link";
import React from "react";
import { FaStar } from "react-icons/fa";
import {
  MediaItem,
  MediaType,
  formatRating,
  getMediaType,
  getTitle,
  getYear,
  imageUrl,
  isRecent,
  mediaHref,
} from "../../lib/tmdb";

interface MediaCardProps {
  item: MediaItem;
  mediaType?: MediaType;
  badge?: string | null;
  onSelect?: (item: MediaItem, type: MediaType) => void;
  className?: string;
}

export function MetaLine({ item, mediaType }: { item: MediaItem; mediaType?: MediaType }) {
  const rating = formatRating(item.vote_average);
  const parts = [getYear(item), getMediaType(item, mediaType) === "tv" ? "Show" : "Movie"].filter(Boolean);
  return (
    <div className="flex items-center gap-1.5 text-xs text-white/60">
      {rating && (
        <span className="flex items-center gap-1 text-white/80">
          <FaStar className="text-badge" size={10} aria-hidden />
          {rating}
        </span>
      )}
      {parts.map((part, i) => (
        <React.Fragment key={part}>
          {(rating || i > 0) && <span aria-hidden>·</span>}
          <span>{part}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

// Landscape backdrop card used across rows and grids
function MediaCard({ item, mediaType, badge, onSelect, className = "" }: MediaCardProps) {
  const type = getMediaType(item, mediaType);
  const title = getTitle(item);
  const image = imageUrl(item.backdrop_path, "w780") ?? imageUrl(item.poster_path, "w500");
  const label = badge === undefined ? (isRecent(item) ? "Recently added" : null) : badge;

  const body = (
    <>
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-2 ring-1 ring-white/5">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-sm text-white/50">{title}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        {label && (
          <span className="absolute right-2 top-2 rounded bg-badge px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {label}
          </span>
        )}
      </div>
      <div className="mt-2 space-y-1 px-0.5 text-left">
        <h3 className="line-clamp-1 text-sm font-medium text-white/90 group-hover:text-white">{title}</h3>
        <MetaLine item={item} mediaType={type} />
      </div>
    </>
  );

  const classes = `group block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg ${className}`;

  if (onSelect) {
    return (
      <button type="button" className={classes} onClick={() => onSelect(item, type)} aria-label={title}>
        {body}
      </button>
    );
  }
  return (
    <Link href={mediaHref(item, type)}>
      <a className={classes} aria-label={title}>
        {body}
      </a>
    </Link>
  );
}

export default MediaCard;
