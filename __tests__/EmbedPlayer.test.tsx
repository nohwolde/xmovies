import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EmbedPlayer, { LOAD_TIMEOUT_MS } from "../components/player/EmbedPlayer";
import { VideoSource } from "../utils/video-sources";

const makeSource = (id: string, supportsAnime = true): VideoSource => ({
  id,
  name: `Source ${id}`,
  supportsAnime,
  buildUrl: ({ type, id: mediaId, season, episode }) =>
    type === "movie" ? `https://${id}.test/m/${mediaId}` : `https://${id}.test/t/${mediaId}/${season}/${episode}`,
});

const SOURCES = [makeSource("a"), makeSource("b"), makeSource("c", false)];
const movie = { type: "movie" as const, id: "550" };

const iframeSrc = () => screen.queryByTitle(/watch|video player/i)?.getAttribute("src") ?? null;
const loadIframe = () => fireEvent.load(screen.getByTitle(/watch|video player/i));

describe("EmbedPlayer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the first source with playback permissions", () => {
    render(<EmbedPlayer media={movie} title="Fight Club" sources={SOURCES} />);

    const iframe = screen.getByTitle("Watch Fight Club");
    expect(iframe).toHaveAttribute("src", "https://a.test/m/550");
    expect(iframe.getAttribute("allow")).toContain("autoplay");
    expect(iframe.getAttribute("allow")).toContain("fullscreen");
    expect(screen.getByRole("button", { name: "Source a" })).toHaveAttribute("aria-pressed", "true");
  });

  it("switches sources and remembers the one that loads", () => {
    render(<EmbedPlayer media={movie} sources={SOURCES} />);

    fireEvent.click(screen.getByRole("button", { name: "Source b" }));
    expect(iframeSrc()).toBe("https://b.test/m/550");
    expect(window.localStorage.getItem("xmovies:preferred-source")).toBeNull();

    loadIframe();
    expect(window.localStorage.getItem("xmovies:preferred-source")).toBe("b");
  });

  it("doesn't remember a source that timed out", () => {
    window.localStorage.setItem("xmovies:preferred-source", "b");
    render(<EmbedPlayer media={movie} sources={SOURCES} />);

    act(() => {
      vi.advanceTimersByTime(LOAD_TIMEOUT_MS);
    });
    expect(iframeSrc()).toBe("https://c.test/m/550");
    loadIframe();

    expect(window.localStorage.getItem("xmovies:preferred-source")).toBe("c");
  });

  it("restores the preferred source on mount", () => {
    window.localStorage.setItem("xmovies:preferred-source", "b");
    render(<EmbedPlayer media={movie} sources={SOURCES} />);

    expect(iframeSrc()).toBe("https://b.test/m/550");
  });

  it("hides sources that can't play anime", () => {
    render(<EmbedPlayer media={movie} sources={SOURCES} anime />);

    expect(screen.queryByRole("button", { name: "Source c" })).not.toBeInTheDocument();
  });

  it("calls onLoad and clears the spinner once the iframe loads", () => {
    const onLoad = vi.fn();
    render(<EmbedPlayer media={movie} sources={SOURCES} onLoad={onLoad} />);
    expect(screen.getByRole("status")).toBeInTheDocument();

    loadIframe();

    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not fail over once a source has loaded", () => {
    render(<EmbedPlayer media={movie} sources={SOURCES} />);
    loadIframe();

    act(() => {
      vi.advanceTimersByTime(LOAD_TIMEOUT_MS * 2);
    });

    expect(iframeSrc()).toBe("https://a.test/m/550");
  });

  it("fails over to the next source when one never loads", () => {
    render(<EmbedPlayer media={movie} sources={SOURCES} />);

    act(() => {
      vi.advanceTimersByTime(LOAD_TIMEOUT_MS);
    });
    expect(iframeSrc()).toBe("https://b.test/m/550");

    act(() => {
      vi.advanceTimersByTime(LOAD_TIMEOUT_MS);
    });
    expect(iframeSrc()).toBe("https://c.test/m/550");
  });

  it("falls back to a source that worked after a manual switch times out", () => {
    render(<EmbedPlayer media={movie} sources={SOURCES.slice(0, 2)} />);
    loadIframe();

    fireEvent.click(screen.getByRole("button", { name: "Source b" }));
    act(() => {
      vi.advanceTimersByTime(LOAD_TIMEOUT_MS);
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(iframeSrc()).toBe("https://a.test/m/550");
  });

  it("shows an error with retry once every source has timed out", () => {
    render(<EmbedPlayer media={movie} sources={SOURCES} />);

    for (let i = 0; i < SOURCES.length; i++) {
      act(() => {
        vi.advanceTimersByTime(LOAD_TIMEOUT_MS);
      });
    }

    expect(screen.getByRole("alert")).toHaveTextContent(/none of the sources/i);

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(iframeSrc()).toBe("https://a.test/m/550");
  });

  it("offers a manual 'try next source' link", () => {
    render(<EmbedPlayer media={movie} sources={SOURCES} />);

    fireEvent.click(screen.getByRole("button", { name: "Try Source b" }));

    expect(iframeSrc()).toBe("https://b.test/m/550");
  });

  it("waits for season and episode before loading a tv embed", () => {
    const { rerender } = render(
      <EmbedPlayer media={{ type: "tv", id: "1399" }} sources={SOURCES} />
    );
    expect(iframeSrc()).toBeNull();

    rerender(
      <EmbedPlayer media={{ type: "tv", id: "1399", season: 1, episode: 2 }} sources={SOURCES} />
    );
    expect(iframeSrc()).toBe("https://a.test/t/1399/1/2");
  });

  it("starts a fresh failover round when the episode changes", () => {
    const tv = (episode: number) => ({ type: "tv" as const, id: "1399", season: 1, episode });
    const { rerender } = render(<EmbedPlayer media={tv(1)} sources={SOURCES} />);

    // exhaust every source on episode 1
    for (let i = 0; i < SOURCES.length; i++) {
      act(() => {
        vi.advanceTimersByTime(LOAD_TIMEOUT_MS);
      });
    }
    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(<EmbedPlayer media={tv(2)} sources={SOURCES} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Try Source/ })).toBeInTheDocument();
  });
});
