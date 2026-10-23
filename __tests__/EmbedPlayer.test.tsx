import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EmbedPlayer, {
  LOAD_TIMEOUT_MS,
  READY_TIMEOUT_MS,
  preferredSourceKey,
} from "../components/player/EmbedPlayer";
import { VideoSource } from "../utils/video-sources";

const makeSource = (id: string): VideoSource => ({
  id,
  name: `Source ${id}`,
  buildUrl: ({ type, id: mediaId, season, episode }) =>
    type === "movie" ? `https://${id}.test/m/${mediaId}` : `https://${id}.test/t/${mediaId}/${season}/${episode}`,
});

const SOURCES = [makeSource("a"), makeSource("b"), makeSource("c")];
const movie = { type: "movie" as const, id: "550" };
const MOVIE_KEY = preferredSourceKey("movie");

// A provider that posts {type:"ready"} / {type:"error"} from its own origin
const makeSignalSource = (id: string): VideoSource => ({
  ...makeSource(id),
  signals: {
    origin: `https://${id}.test`,
    parseMessage: (data: any) => (data?.type === "ready" || data?.type === "error" ? data.type : null),
  },
});

const iframeSrc = () => screen.queryByTitle(/watch|video player/i)?.getAttribute("src") ?? null;
const loadIframe = () => fireEvent.load(screen.getByTitle(/watch|video player/i));
const getIframe = () => screen.getByTitle(/watch|video player/i) as HTMLIFrameElement;

const postMessage = (
  data: unknown,
  origin: string,
  source: Window | null = getIframe().contentWindow
) => {
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data, origin, source }));
  });
};

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
    expect(window.localStorage.getItem(MOVIE_KEY)).toBeNull();

    loadIframe();
    expect(window.localStorage.getItem(MOVIE_KEY)).toBe("b");
  });

  it("doesn't remember a source that timed out", () => {
    window.localStorage.setItem(MOVIE_KEY, "b");
    render(<EmbedPlayer media={movie} sources={SOURCES} />);

    act(() => {
      vi.advanceTimersByTime(LOAD_TIMEOUT_MS);
    });
    expect(iframeSrc()).toBe("https://c.test/m/550");
    loadIframe();

    expect(window.localStorage.getItem(MOVIE_KEY)).toBe("c");
  });

  it("leaves a playing video alone when its source is clicked again", () => {
    render(<EmbedPlayer media={movie} sources={SOURCES} />);
    loadIframe();
    const iframe = screen.getByTitle(/video player/i);

    fireEvent.click(screen.getByRole("button", { name: "Source a" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByTitle(/video player/i)).toBe(iframe);
  });

  it("reloads and re-arms the timeout when the current source is clicked before it loads", () => {
    render(<EmbedPlayer media={movie} sources={SOURCES} />);
    const iframe = screen.getByTitle(/video player/i);

    fireEvent.click(screen.getByRole("button", { name: "Source a" }));

    expect(screen.getByTitle(/video player/i)).not.toBe(iframe);
    act(() => {
      vi.advanceTimersByTime(LOAD_TIMEOUT_MS);
    });
    expect(iframeSrc()).toBe("https://b.test/m/550");
  });

  it("restores the preferred source on mount", () => {
    window.localStorage.setItem(MOVIE_KEY, "b");
    render(<EmbedPlayer media={movie} sources={SOURCES} />);

    expect(iframeSrc()).toBe("https://b.test/m/550");
  });

  it("uses the anime source list for anime and labels sources by position", () => {
    render(<EmbedPlayer media={{ type: "movie", id: "129" }} anime />);

    expect(iframeSrc()).toBe("https://vidrock.net/movie/129");
    expect(screen.getByRole("button", { name: "Source 1" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Source 2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Source 3" })).not.toBeInTheDocument();
  });

  it("starts regular movies on the movie list", () => {
    render(<EmbedPlayer media={movie} />);

    expect(iframeSrc()).toBe("https://vixsrc.to/movie/550");
  });

  it("keeps the preferred source separate per category", () => {
    // saved by anime pages, plus the old global key from before categories
    window.localStorage.setItem(preferredSourceKey("anime-movie"), "vidrock");
    window.localStorage.setItem(preferredSourceKey("anime-tv"), "vidlink");
    window.localStorage.setItem("xmovies:preferred-source", "vidlink");
    render(<EmbedPlayer media={movie} />);

    expect(iframeSrc()).toBe("https://vixsrc.to/movie/550");
  });

  it("saves an anime source under the anime category only", () => {
    render(<EmbedPlayer media={{ type: "movie", id: "129" }} anime />);
    loadIframe();

    expect(window.localStorage.getItem(preferredSourceKey("anime-movie"))).toBe("vidrock");
    expect(window.localStorage.getItem(MOVIE_KEY)).toBeNull();
  });

  it("starts the new list's first source when the category changes while mounted", () => {
    const { container, rerender } = render(<EmbedPlayer media={movie} />);
    fireEvent.click(screen.getByRole("button", { name: "Source 2" }));
    expect(iframeSrc()).toBe("https://vidlink.pro/movie/550");

    const observer = new MutationObserver(() => {});
    observer.observe(container, { childList: true, subtree: true });
    rerender(<EmbedPlayer media={{ type: "movie", id: "129" }} anime />);
    const mounted = observer
      .takeRecords()
      .flatMap((record) => Array.from(record.addedNodes))
      .filter((node): node is HTMLIFrameElement => node instanceof HTMLIFrameElement)
      .map((iframe) => iframe.src);
    observer.disconnect();

    // index 1 in the anime-movie list is vidsrc.su; it must never mount
    expect(mounted).toEqual(["https://vidrock.net/movie/129"]);
    expect(iframeSrc()).toBe("https://vidrock.net/movie/129");
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

  describe("with provider playback signals", () => {
    const SIGNAL_SOURCES = [makeSignalSource("a"), makeSignalSource("b"), makeSource("c")];

    it("fails over as soon as the provider reports an error", () => {
      render(<EmbedPlayer media={movie} sources={SIGNAL_SOURCES} />);
      loadIframe();

      postMessage({ type: "error" }, "https://a.test");

      expect(iframeSrc()).toBe("https://b.test/m/550");
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("ignores messages from other origins or other windows", () => {
      render(<EmbedPlayer media={movie} sources={SIGNAL_SOURCES} />);
      loadIframe();

      postMessage({ type: "error" }, "https://b.test");
      postMessage({ type: "error" }, "https://a.test.evil.example");
      postMessage({ type: "error" }, "https://a.test", window);
      expect(iframeSrc()).toBe("https://a.test/m/550");

      // nor does a "ready" from the wrong origin count as playing
      postMessage({ type: "ready" }, "https://evil.test");
      act(() => {
        vi.advanceTimersByTime(READY_TIMEOUT_MS);
      });
      expect(iframeSrc()).toBe("https://b.test/m/550");
    });

    it("fails over when the page loads but the provider never says it's ready", () => {
      const onLoad = vi.fn();
      render(<EmbedPlayer media={movie} sources={SIGNAL_SOURCES} onLoad={onLoad} />);
      loadIframe();

      // the provider's page is visible while we wait, so no spinner
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(READY_TIMEOUT_MS - 1);
      });
      expect(iframeSrc()).toBe("https://a.test/m/550");

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(iframeSrc()).toBe("https://b.test/m/550");
      expect(onLoad).not.toHaveBeenCalled();
      expect(window.localStorage.getItem(MOVIE_KEY)).toBeNull();
    });

    it("keeps and remembers a source once it says it's ready", () => {
      const onLoad = vi.fn();
      render(<EmbedPlayer media={movie} sources={SIGNAL_SOURCES} onLoad={onLoad} />);
      loadIframe();
      expect(window.localStorage.getItem(MOVIE_KEY)).toBeNull();

      postMessage({ type: "ready" }, "https://a.test");
      postMessage({ type: "ready" }, "https://a.test");

      expect(onLoad).toHaveBeenCalledTimes(1);
      expect(window.localStorage.getItem(MOVIE_KEY)).toBe("a");

      // a later error from a source that played doesn't switch it away
      postMessage({ type: "error" }, "https://a.test");
      act(() => {
        vi.advanceTimersByTime(LOAD_TIMEOUT_MS * 2);
      });
      expect(iframeSrc()).toBe("https://a.test/m/550");
    });

    it("accepts a ready message that arrives before onLoad", () => {
      render(<EmbedPlayer media={movie} sources={SIGNAL_SOURCES} />);

      postMessage({ type: "ready" }, "https://a.test");
      loadIframe();
      act(() => {
        vi.advanceTimersByTime(LOAD_TIMEOUT_MS * 2);
      });

      expect(iframeSrc()).toBe("https://a.test/m/550");
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("leaves the player alone once the viewer clicks into it", () => {
      render(<EmbedPlayer media={movie} sources={SIGNAL_SOURCES} />);
      loadIframe();

      act(() => {
        getIframe().focus();
        window.dispatchEvent(new Event("blur"));
        vi.advanceTimersByTime(READY_TIMEOUT_MS * 2);
      });

      expect(iframeSrc()).toBe("https://a.test/m/550");
      expect(window.localStorage.getItem(MOVIE_KEY)).toBeNull();

      // and still remembers it once it starts playing
      postMessage({ type: "ready" }, "https://a.test");
      expect(window.localStorage.getItem(MOVIE_KEY)).toBe("a");
    });

    it("also leaves it alone when the viewer clicked in before it finished loading", () => {
      render(<EmbedPlayer media={movie} sources={SIGNAL_SOURCES} />);

      act(() => {
        getIframe().focus();
        window.dispatchEvent(new Event("blur"));
        vi.advanceTimersByTime(0);
      });
      loadIframe();
      act(() => {
        vi.advanceTimersByTime(READY_TIMEOUT_MS * 2);
      });

      expect(iframeSrc()).toBe("https://a.test/m/550");
    });

    it("doesn't let a late ready message confirm the source it failed over to", () => {
      render(<EmbedPlayer media={movie} sources={SIGNAL_SOURCES} />);
      loadIframe();
      const staleFrame = getIframe().contentWindow;

      // the grace timer and the provider's first message land in the same tick
      act(() => {
        vi.advanceTimersByTime(READY_TIMEOUT_MS);
        window.dispatchEvent(
          new MessageEvent("message", { data: { type: "ready" }, origin: "https://a.test", source: staleFrame })
        );
      });

      expect(iframeSrc()).toBe("https://b.test/m/550");
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(window.localStorage.getItem(MOVIE_KEY)).toBeNull();
      // b is still checked like any other source
      loadIframe();
      act(() => {
        vi.advanceTimersByTime(READY_TIMEOUT_MS);
      });
      expect(iframeSrc()).toBe("https://c.test/m/550");
    });

    it("keeps today's onLoad behaviour for silent providers", () => {
      render(<EmbedPlayer media={movie} sources={SIGNAL_SOURCES} />);
      loadIframe();
      postMessage({ type: "error" }, "https://a.test");
      loadIframe();
      postMessage({ type: "error" }, "https://b.test");
      expect(iframeSrc()).toBe("https://c.test/m/550");

      loadIframe();
      // c has no adapter, so even a message from its origin means nothing
      postMessage({ type: "error" }, "https://c.test");
      act(() => {
        vi.advanceTimersByTime(LOAD_TIMEOUT_MS * 2);
      });

      expect(iframeSrc()).toBe("https://c.test/m/550");
      expect(window.localStorage.getItem(MOVIE_KEY)).toBe("c");
    });

    it("shows the all-failed alert when every provider errors", () => {
      render(<EmbedPlayer media={movie} sources={SIGNAL_SOURCES.slice(0, 2)} />);

      postMessage({ type: "error" }, "https://a.test");
      postMessage({ type: "error" }, "https://b.test");

      expect(screen.getByRole("alert")).toHaveTextContent(/none of the sources/i);
    });

    it("falls back to a source that played when a manual pick errors", () => {
      render(<EmbedPlayer media={movie} sources={SIGNAL_SOURCES.slice(0, 2)} />);
      loadIframe();
      postMessage({ type: "ready" }, "https://a.test");

      fireEvent.click(screen.getByRole("button", { name: "Source b" }));
      loadIframe();
      postMessage({ type: "error" }, "https://b.test");

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(iframeSrc()).toBe("https://a.test/m/550");
    });
  });
});
