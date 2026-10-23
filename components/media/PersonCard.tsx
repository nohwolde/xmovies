import Link from "next/link";
import React from "react";
import { MediaItem, imageUrl } from "../../lib/tmdb";

function PersonCard({ item }: { item: MediaItem }) {
  const photo = imageUrl(item.profile_path, "w185");
  const slug = `${encodeURIComponent((item.name ?? "").replace(/\s+/g, "-"))}-${item.id}`;
  return (
    <Link href={`/cast/${slug}`}>
      <a className="group block w-full text-center focus:outline-none" aria-label={item.name}>
        <div className="mx-auto aspect-square w-full overflow-hidden rounded-full bg-surface-2 ring-1 ring-white/10 transition group-hover:ring-accent group-focus-visible:ring-2 group-focus-visible:ring-accent">
          {photo ? (
            <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl font-bold text-white/30">
              {item.name?.[0]}
            </div>
          )}
        </div>
        <p className="mt-2 line-clamp-1 text-sm font-medium text-white/90">{item.name}</p>
        {item.character && <p className="line-clamp-1 text-xs text-white/50">{item.character}</p>}
      </a>
    </Link>
  );
}

export default PersonCard;
