import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FaPlay, FaStar } from "react-icons/fa";
import { FiCheck, FiPlus, FiYoutube } from "react-icons/fi";
import { useMyList } from "../../hooks/useMyList";
import {
  MediaItem,
  MediaType,
  fetchLogo,
  fetchTrailerKey,
  formatRating,
  formatRuntime,
  getTitle,
  getYear,
  imageUrl,
} from "../../lib/tmdb";
import Trailer from "../Trailer";

interface DetailContainerProps extends MediaItem {
  media_type: MediaType;
  // Called by the Play button; defaults to scrolling to #watch
  onPlay?: () => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children || (Array.isArray(children) && !children.length)) return null;
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-white/40">{label}</dt>
      <dd className="text-white/80">{children}</dd>
    </div>
  );
}

function DetailContainer({ onPlay, ...data }: DetailContainerProps) {
  const type = data.media_type;
  const [logo, setLogo] = useState<string | null>(null);
  const [trailer, setTrailer] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const { inList, toggle } = useMyList(data, type);

  useEffect(() => {
    if (!data.id) return;
    let cancelled = false;
    setLogo(null);
    setTrailer(null);
    fetchLogo(type, data.id).then((url) => !cancelled && setLogo(url));
    const videos: any[] = (data.videos?.results ?? []).filter((v: any) => v.site === "YouTube");
    const key = (videos.find((v) => v.type === "Trailer") ?? videos[0])?.key;
    if (key) setTrailer(key);
    else fetchTrailerKey(type, data.id).then((k) => !cancelled && setTrailer(k));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.id, type]);

  const title = getTitle(data);
  const rating = formatRating(data.vote_average);
  const length =
    type === "movie"
      ? formatRuntime(data.runtime)
      : data.number_of_seasons
      ? `${data.number_of_seasons} Season${data.number_of_seasons > 1 ? "s" : ""} · ${data.number_of_episodes} Episodes`
      : null;
  const play = onPlay ?? (() => document.getElementById("watch")?.scrollIntoView({ behavior: "smooth" }));
  const people: { name: string }[] = type === "tv" ? data.created_by ?? [] : (data.credits?.crew ?? []).filter((c: any) => c.job === "Director");

  return (
    <section className="relative min-h-[80vh] w-full overflow-hidden">
      {data.backdrop_path && (
        <img src={imageUrl(data.backdrop_path, "w1280")!} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-black/40" />

      <div className="relative z-10 flex min-h-[80vh] flex-col justify-end gap-8 px-4 pb-12 pt-28 md:px-12 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-4">
          {logo ? (
            <img src={logo} alt={title} className="max-h-28 md:max-h-40 max-w-[80%] object-contain object-left drop-shadow-2xl" />
          ) : (
            <h1 className="text-4xl md:text-6xl font-black leading-tight text-shadow">{title}</h1>
          )}
          {data.tagline && <p className="text-lg italic text-white/70 text-shadow">{data.tagline}</p>}

          <div className="flex flex-wrap items-center gap-2 text-sm text-white/80 text-shadow">
            {rating && (
              <span className="flex items-center gap-1 font-semibold text-white">
                <FaStar className="text-badge" size={12} aria-hidden /> {rating}
              </span>
            )}
            {[getYear(data), type === "tv" ? "Show" : "Movie", length].filter(Boolean).map((part, i) => (
              <React.Fragment key={part as string}>
                {(rating || i > 0) && <span aria-hidden className="text-white/40">·</span>}
                <span>{part}</span>
              </React.Fragment>
            ))}
          </div>

          {data.genres?.length ? (
            <div className="flex flex-wrap gap-2">
              {data.genres.map((g) => (
                <Link href={`/genre/${g.name.replace(/\s+/g, "-")}-${g.id}/1`} key={g.id}>
                  <a className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur hover:border-white/50">
                    {g.name}
                  </a>
                </Link>
              ))}
            </div>
          ) : null}

          <p className="line-clamp-3 md:line-clamp-none text-sm md:text-base leading-relaxed text-white/85 text-shadow">{data.overview}</p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={play}
              className="flex items-center gap-2 rounded-md bg-white px-6 py-2.5 font-semibold text-black transition hover:bg-white/85"
            >
              <FaPlay size={14} /> Play
            </button>
            {trailer && (
              <button
                type="button"
                onClick={() => setShowTrailer(true)}
                className="flex items-center gap-2 rounded-md bg-white/20 px-5 py-2.5 font-semibold backdrop-blur transition hover:bg-white/30"
              >
                <FiYoutube size={18} /> Trailer
              </button>
            )}
            <button
              type="button"
              onClick={toggle}
              aria-pressed={inList}
              className="flex items-center gap-2 rounded-md bg-white/20 px-5 py-2.5 font-semibold backdrop-blur transition hover:bg-white/30"
            >
              {inList ? <FiCheck size={18} /> : <FiPlus size={18} />}
              {inList ? "In My List" : "My List"}
            </button>
          </div>
        </div>

        <dl className="w-full max-w-sm space-y-2 rounded-xl bg-black/40 p-5 text-sm backdrop-blur-md ring-1 ring-white/10">
          <DetailRow label="Status">{data.status}</DetailRow>
          <DetailRow label="Released">{data.release_date || data.first_air_date}</DetailRow>
          <DetailRow label={type === "tv" ? "Created by" : "Director"}>{people.map((p) => p.name).join(", ")}</DetailRow>
          <DetailRow label="Languages">{(data.spoken_languages ?? []).map((l: any) => l.english_name || l.name).join(", ")}</DetailRow>
          <DetailRow label="Countries">{(data.production_countries ?? []).map((c: any) => c.name).join(", ")}</DetailRow>
          <DetailRow label="Studio">{(data.production_companies ?? data.networks ?? []).slice(0, 2).map((c: any) => c.name).join(", ")}</DetailRow>
        </dl>
      </div>

      <AnimatePresence>
        {showTrailer && trailer && <Trailer trailer_key={trailer} handleClose={() => setShowTrailer(false)} />}
      </AnimatePresence>
    </section>
  );
}

export default DetailContainer;
