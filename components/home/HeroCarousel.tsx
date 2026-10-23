import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FaPause, FaPlay, FaStar } from "react-icons/fa";
import { FiInfo } from "react-icons/fi";
import {
  MediaItem,
  fetchLogo,
  formatRating,
  genreNames,
  getMediaType,
  getTitle,
  getYear,
  imageUrl,
  mediaHref,
} from "../../lib/tmdb";
import { useInfoModal } from "../media/MediaRow";

const SLIDE_MS = 8000;

export function Top10Badge() {
  return (
    <span className="flex h-6 w-6 flex-col items-center justify-center rounded-sm bg-badge text-[7px] font-black leading-none">
      TOP<span className="text-[10px]">10</span>
    </span>
  );
}

interface HeroCarouselProps {
  items: MediaItem[];
  rankLabel?: (item: MediaItem) => string | null;
}

function HeroCarousel({ items, rankLabel }: HeroCarouselProps) {
  const slides = items.filter((item) => item.backdrop_path).slice(0, 6);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [logos, setLogos] = useState<Record<number, string | null>>({});
  const { open, modal } = useInfoModal();

  useEffect(() => {
    let cancelled = false;
    slides.forEach((item) => {
      fetchLogo(getMediaType(item), item.id).then((url) => {
        if (!cancelled) setLogos((prev) => ({ ...prev, [item.id]: url }));
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.map((s) => s.id).join(",")]);

  // Warm the cache for the next backdrop so the crossfade never shows a blank frame
  useEffect(() => {
    const next = slides[(index + 1) % slides.length];
    if (next) new Image().src = imageUrl(next.backdrop_path, "w1280")!;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, slides.length]);

  if (!slides.length) return <div className="h-[70vh] bg-surface" />;

  const item = slides[index % slides.length];
  const type = getMediaType(item);
  const rating = formatRating(item.vote_average);
  const logo = logos[item.id];
  const rank = rankLabel?.(item);
  const meta = [getYear(item), type === "tv" ? "Show" : "Movie", ...genreNames(item)].filter(Boolean);

  return (
    <section className="relative h-[85vh] min-h-[520px] max-h-[900px] w-full overflow-hidden" aria-roledescription="carousel" aria-label="Featured">
      {modal}
      <AnimatePresence initial={false}>
        <motion.img
          key={item.id}
          src={imageUrl(item.backdrop_path, "w1280")!}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 1 } }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-black/30" />

      <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-16 md:px-12 md:pb-24">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2 } }}
          className="max-w-xl space-y-4"
        >
          <h2 className="text-4xl md:text-6xl font-black leading-tight text-shadow">
            {logo ? (
              <img src={logo} alt={getTitle(item)} className="max-h-28 md:max-h-40 max-w-[80%] object-contain object-left drop-shadow-2xl" />
            ) : (
              getTitle(item)
            )}
          </h2>

          {rank && (
            <div className="flex items-center gap-2 text-base md:text-lg font-semibold text-shadow">
              <Top10Badge />
              {rank}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm text-white/80 text-shadow">
            {rating && (
              <span className="flex items-center gap-1 font-semibold text-white">
                <FaStar className="text-badge" size={12} aria-hidden /> {rating}
              </span>
            )}
            {meta.map((part, i) => (
              <React.Fragment key={part}>
                {(rating || i > 0) && <span aria-hidden className="text-white/40">·</span>}
                <span>{part}</span>
              </React.Fragment>
            ))}
          </div>

          <p className="line-clamp-3 text-sm md:text-base leading-relaxed text-white/85 text-shadow">{item.overview}</p>

          <div className="flex gap-3 pt-2">
            <Link href={mediaHref(item)}>
              <a className="flex items-center gap-2 rounded-md bg-white px-6 py-2.5 font-semibold text-black transition hover:bg-white/85">
                <FaPlay size={14} /> Play
              </a>
            </Link>
            <button
              type="button"
              onClick={() => open(item, type)}
              className="flex items-center gap-2 rounded-md bg-white/25 px-5 py-2.5 font-semibold backdrop-blur transition hover:bg-white/35"
            >
              <FiInfo size={18} /> More info
            </button>
          </div>
        </motion.div>

        {slides.length > 1 && (
          <div className="absolute bottom-6 right-4 md:bottom-10 md:right-12 flex items-center gap-3">
            <div className="flex gap-1.5" role="tablist" aria-label="Slides">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show ${getTitle(slide)}`}
                  onClick={() => setIndex(i)}
                  className="relative h-1 w-6 md:w-8 overflow-hidden rounded-full bg-white/25"
                >
                  {i === index && (
                    <span
                      key={`${slide.id}-${paused}`}
                      className="absolute inset-0 origin-left bg-white"
                      style={paused ? undefined : { animation: `hero-progress ${SLIDE_MS}ms linear forwards` }}
                    />
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Play slideshow" : "Pause slideshow"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/30 backdrop-blur hover:bg-black/50"
            >
              {paused ? <FaPlay size={10} /> : <FaPause size={10} />}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default HeroCarousel;
