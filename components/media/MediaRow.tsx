import { AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { MediaItem, MediaType } from "../../lib/tmdb";
import InfoModal from "./InfoModal";
import MediaCard from "./MediaCard";
import { useHydrated } from "../../hooks/useHydrated";

interface RowShellProps {
  title: string;
  href?: string;
  actions?: React.ReactNode;
  itemClassName?: string;
  children: React.ReactNode[];
}

// Horizontal, snap-scrolling row with hover arrows — shared by every row type
export function RowShell({
  title,
  href,
  actions,
  itemClassName = "w-[70%] sm:w-[42%] md:w-[31%] lg:w-[23.5%] xl:w-[19%]",
  children,
}: RowShellProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, children.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  if (!children.length) return null;

  return (
    <section className="media-row relative my-8 md:my-10" aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-4 px-4 md:px-12">
        <h2 className="text-lg md:text-2xl font-bold tracking-tight">
          {href ? (
            <Link href={href}>
              <a className="row-title inline-flex items-center gap-1 hover:text-white/80">
                {title}
                <FiChevronRight className="transition-transform" aria-hidden />
              </a>
            </Link>
          ) : (
            title
          )}
        </h2>
        {actions}
      </div>

      <div className="relative">
        <div
          ref={scroller}
          onScroll={update}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 md:px-12 pb-2 scroll-px-4 md:scroll-px-12"
        >
          {children.map((child, i) => (
            <div key={i} className={`shrink-0 snap-start ${itemClassName}`}>
              {child}
            </div>
          ))}
        </div>

        {!edges.start && (
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label={`Scroll ${title} left`}
            className="absolute left-0 top-0 z-10 hidden h-[calc(100%-3.5rem)] w-10 md:w-12 items-center justify-center bg-gradient-to-r from-bg to-transparent row-arrow md:flex"
          >
            <FiChevronLeft size={30} />
          </button>
        )}
        {!edges.end && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label={`Scroll ${title} right`}
            className="absolute right-0 top-0 z-10 hidden h-[calc(100%-3.5rem)] w-10 md:w-12 items-center justify-center bg-gradient-to-l from-bg to-transparent row-arrow md:flex"
          >
            <FiChevronRight size={30} />
          </button>
        )}
      </div>
    </section>
  );
}

export function TypeToggle({ value, onChange }: { value: MediaType; onChange: (type: MediaType) => void }) {
  return (
    <div className="flex rounded-lg bg-white/5 p-0.5 text-xs md:text-sm" role="group" aria-label="Media type">
      {(["movie", "tv"] as MediaType[]).map((type) => (
        <button
          key={type}
          type="button"
          aria-pressed={value === type}
          onClick={() => onChange(type)}
          className={`rounded-md px-3 py-1 font-medium transition-colors ${
            value === type ? "bg-white text-black" : "text-white/70 hover:text-white"
          }`}
        >
          {type === "movie" ? "Movies" : "Shows"}
        </button>
      ))}
    </div>
  );
}

export function useInfoModal() {
  const [selected, setSelected] = useState<{ id: number; type: MediaType } | null>(null);
  const open = useCallback((item: MediaItem, type: MediaType) => setSelected({ id: item.id, type }), []);
  const close = useCallback(() => setSelected(null), []);
  // Portal to <body> so the modal escapes ancestor stacking contexts
  // (the home rows' z-10 wrapper would otherwise put it under the navbar)
  const hydrated = useHydrated();
  const modal = hydrated
    ? createPortal(
        <AnimatePresence>
          {selected && <InfoModal key="info" id={selected.id} mediaType={selected.type} onClose={close} />}
        </AnimatePresence>,
        document.body
      )
    : null;
  return { open, modal };
}

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  mediaType?: MediaType;
  href?: string;
  toggle?: { value: MediaType; onChange: (type: MediaType) => void };
  badge?: (item: MediaItem) => string | null | undefined;
}

function MediaRow({ title, items, mediaType, href, toggle, badge }: MediaRowProps) {
  const { open, modal } = useInfoModal();
  const visible = (items ?? []).filter((item) => item && item.media_type !== "person");

  return (
    <>
      {modal}
      <RowShell
        title={title}
        href={href}
        actions={toggle && <TypeToggle value={toggle.value} onChange={toggle.onChange} />}
      >
        {visible.map((item) => (
          <MediaCard
            key={`${item.media_type ?? mediaType}-${item.id}`}
            item={item}
            mediaType={mediaType}
            badge={badge?.(item)}
            onSelect={open}
          />
        ))}
      </RowShell>
    </>
  );
}

export default MediaRow;
