import Link from "next/link";
import React from "react";
import { FaPlay } from "react-icons/fa";
import { useSelector } from "react-redux";
import { imageUrl } from "../../lib/tmdb";

interface ContinueItem {
  id: number | string;
  title?: string;
  backdrop_path?: string;
  poster_path?: string;
  media_type: "movie" | "tv";
  season?: number;
  episode?: number;
  episode_name?: string;
}

function ContinueCard({ item }: { item: ContinueItem }) {
  const currentState: any[] = useSelector((state: any) => state.CurrentState) ?? [];
  const current = currentState.find((entry) => entry.id == item.id);
  const season = current?.season_number ?? item.season ?? 1;
  const episode = current?.episode_number ?? item.episode ?? 1;
  const episodeName = current?.episode_name ?? item.episode_name;
  const image = imageUrl(item.backdrop_path, "w780") ?? imageUrl(item.poster_path, "w500");

  return (
    <Link href={`/${item.media_type}/${item.id}`}>
      <a className="group block w-full focus:outline-none" aria-label={`Continue ${item.title}`}>
        <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-2 ring-1 ring-white/5 group-focus-visible:ring-2 group-focus-visible:ring-accent">
          {image && (
            <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-80 transition group-hover:bg-black/10 group-hover:opacity-100">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition group-hover:scale-110">
              <FaPlay size={16} className="ml-0.5" />
            </span>
          </div>
        </div>
        <div className="mt-2 px-0.5">
          <h3 className="line-clamp-1 text-sm font-medium text-white/90">{item.title}</h3>
          {item.media_type === "tv" && (
            <p className="line-clamp-1 text-xs text-white/50">
              S{season} · E{episode}
              {episodeName ? ` · ${episodeName}` : ""}
            </p>
          )}
        </div>
      </a>
    </Link>
  );
}

export default ContinueCard;
