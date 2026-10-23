import Link from "next/link";
import React, { useState } from "react";
import { FiYoutube } from "react-icons/fi";
import { MediaItem, getMediaType, getTitle, imageUrl, mediaHref } from "../../lib/tmdb";
import { MetaLine } from "../media/MediaCard";
import { RowShell, useInfoModal } from "../media/MediaRow";

function RankBadge({ rank }: { rank: number }) {
  return (
    <span className="absolute left-2 top-0 z-10 flex flex-col items-center rounded-b bg-badge px-1.5 pb-1 pt-0.5 text-[8px] font-black leading-tight shadow-lg">
      TOP
      <span className="text-sm leading-none">{rank}</span>
    </span>
  );
}

// Netflix-style Top 10: the focused card expands into a wide backdrop with details
function Top10Row({ title, items }: { title: string; items: MediaItem[] }) {
  const [active, setActive] = useState(0);
  const { open, modal } = useInfoModal();
  const top = items.filter((item) => item.poster_path && item.media_type !== "person").slice(0, 10);

  return (
    <>
      {modal}
      <RowShell title={title} itemClassName="w-auto">
        {top.map((item, i) => {
          const expanded = i === active;
          const type = getMediaType(item);
          return (
            <div
              key={item.id}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className={`transition-[width] duration-500 ease-out ${
                expanded ? "w-[78vw] sm:w-[520px] lg:w-[620px]" : "w-[36vw] sm:w-[180px] lg:w-[210px]"
              }`}
            >
              <div className="relative h-[54vw] sm:h-[270px] lg:h-[315px] overflow-hidden rounded-lg bg-surface-2 ring-1 ring-white/5">
                <RankBadge rank={i + 1} />
                <Link href={mediaHref(item)}>
                  <a className="absolute inset-0" aria-label={`${i + 1}. ${getTitle(item)}`}>
                    <img
                      src={imageUrl(expanded && item.backdrop_path ? item.backdrop_path : item.poster_path, expanded ? "w1280" : "w342")!}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </a>
                </Link>
                {expanded && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-r from-black/90 via-black/50 to-transparent p-4 md:p-6">
                    <div className="max-w-[70%] space-y-2">
                      <h3 className="text-xl md:text-2xl font-black text-shadow">{getTitle(item)}</h3>
                      <p className="line-clamp-3 text-xs md:text-sm text-white/80">{item.overview}</p>
                      <button
                        type="button"
                        onClick={() => open(item, type)}
                        className="pointer-events-auto mt-1 flex items-center gap-2 rounded-md bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/30"
                      >
                        <FiYoutube size={14} /> More info
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 px-0.5">
                <h3 className="line-clamp-1 text-sm font-medium text-white/90">{getTitle(item)}</h3>
                <MetaLine item={item} />
              </div>
            </div>
          );
        })}
      </RowShell>
    </>
  );
}

export default Top10Row;
