import { motion } from "framer-motion";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { FaPlay } from "react-icons/fa";
import { FiCheck, FiPlus, FiX, FiYoutube } from "react-icons/fi";
import { useMyList } from "../../hooks/useMyList";
import {
  MediaItem,
  MediaType,
  formatRating,
  formatRuntime,
  genreNames,
  getTitle,
  getYear,
  imageUrl,
  pickLogo,
  tmdb,
} from "../../lib/tmdb";
import MediaCard from "./MediaCard";

interface InfoModalProps {
  id: number;
  mediaType: MediaType;
  onClose: () => void;
}

function InfoModal({ id: initialId, mediaType: initialType, onClose }: InfoModalProps) {
  const [current, setCurrent] = useState({ id: initialId, type: initialType });
  const [data, setData] = useState<MediaItem | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { inList, toggle } = useMyList(data, current.type);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setLogo(null);
    setFailed(false);
    setShowTrailer(false);
    panelRef.current?.scrollTo({ top: 0 });
    tmdb<MediaItem>(`/${current.type}/${current.id}`, {
      append_to_response: "videos,recommendations,similar,images",
      include_image_language: "en,null",
    })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setLogo(pickLogo(res.images?.logos));
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const videos: any[] = (data?.videos?.results ?? []).filter((v: any) => v.site === "YouTube");
  const trailerKey = (videos.find((v) => v.type === "Trailer") ?? videos[0])?.key;
  const recs: MediaItem[] = (data?.recommendations?.results?.length ? data.recommendations.results : data?.similar?.results ?? [])
    .filter((item: MediaItem) => item.backdrop_path)
    .slice(0, 9);
  const title = getTitle(data);
  const rating = formatRating(data?.vote_average);
  const length =
    current.type === "movie"
      ? formatRuntime(data?.runtime)
      : data?.number_of_seasons
      ? `${data.number_of_seasons} Season${data.number_of_seasons > 1 ? "s" : ""}`
      : null;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/80 px-2 py-6 md:py-12 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Details"}
        initial={{ y: 40, scale: 0.97 }}
        animate={{ y: 0, scale: 1, transition: { type: "spring", damping: 26, stiffness: 260 } }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-white/10"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
        >
          <FiX size={20} />
        </button>

        <div className="relative aspect-video w-full bg-black">
          {showTrailer && trailerKey ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
              title={`${title} trailer`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <>
              {data?.backdrop_path && (
                <img src={imageUrl(data.backdrop_path, "w1280")!} alt="" className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                {logo ? (
                  <img src={logo} alt={title} className="mb-4 max-h-20 md:max-h-28 max-w-[60%] object-contain object-left drop-shadow-xl" />
                ) : (
                  <h2 className="mb-4 text-3xl md:text-4xl font-black text-shadow">{title}</h2>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/${current.type}/${current.id}`}>
                    <a
                      onClick={onClose}
                      className="flex items-center gap-2 rounded-md bg-white px-5 py-2 font-semibold text-black hover:bg-white/85"
                    >
                      <FaPlay size={14} /> Play
                    </a>
                  </Link>
                  {trailerKey && (
                    <button
                      type="button"
                      onClick={() => setShowTrailer(true)}
                      className="flex items-center gap-2 rounded-md bg-white/20 px-4 py-2 font-semibold backdrop-blur hover:bg-white/30"
                    >
                      <FiYoutube size={18} /> Trailer
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={toggle}
                    aria-pressed={inList}
                    aria-label={inList ? "Remove from My List" : "Add to My List"}
                    title={inList ? "Remove from My List" : "Add to My List"}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/40 bg-black/40 hover:border-white"
                  >
                    {inList ? <FiCheck size={18} /> : <FiPlus size={18} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="space-y-6 p-5 md:p-8">
          {failed ? (
            <p className="py-6 text-center text-white/60" role="alert">
              Couldn&apos;t load details right now. Please try again later.
            </p>
          ) : !data ? (
            <div className="space-y-3" aria-hidden>
              <div className="h-4 w-1/3 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-full animate-pulse rounded bg-white/10" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
                  {rating && <span className="font-semibold text-green-400">★ {rating}</span>}
                  {getYear(data) && <span>{getYear(data)}</span>}
                  {length && <span>{length}</span>}
                  <span className="rounded border border-white/30 px-1.5 text-xs">{current.type === "tv" ? "Show" : "Movie"}</span>
                </div>
                <p className="text-sm leading-relaxed text-white/80">{data.overview}</p>
              </div>
              <dl className="space-y-2 text-sm">
                {genreNames(data, 4).length > 0 && (
                  <div>
                    <dt className="inline text-white/40">Genres: </dt>
                    <dd className="inline text-white/80">{genreNames(data, 4).join(", ")}</dd>
                  </div>
                )}
                {data.status && (
                  <div>
                    <dt className="inline text-white/40">Status: </dt>
                    <dd className="inline text-white/80">{data.status}</dd>
                  </div>
                )}
                {data.imdb_id && (
                  <a
                    href={`https://www.imdb.com/title/${data.imdb_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-[#f5c518] hover:underline"
                  >
                    View on IMDb
                  </a>
                )}
              </dl>
            </div>
          )}

          {recs.length > 0 && (
            <section>
              <h3 className="mb-3 text-lg font-bold">More like this</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {recs.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    mediaType={current.type}
                    badge={null}
                    onSelect={(next, type) => setCurrent({ id: next.id, type })}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default InfoModal;
