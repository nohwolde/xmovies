import { describe, expect, it } from "vitest";
import {
  SOURCES_BY_CATEGORY,
  VideoSource,
  buildEmbedUrl,
  getAvailableSources,
  getSourceCategory,
  getInitialSourceIndex,
  getNextSourceIndex,
  isAnime,
  readPlaybackSignal,
} from "../utils/video-sources";

const makeSource = (id: string): VideoSource => ({
  id,
  name: id,
  buildUrl: ({ type, id: mediaId, season, episode }) =>
    type === "movie" ? `https://${id}/m/${mediaId}` : `https://${id}/t/${mediaId}/${season}/${episode}`,
});

const ALL_SOURCES = Object.values(SOURCES_BY_CATEGORY).flat();

describe("SOURCES_BY_CATEGORY", () => {
  it("has unique ids within each list", () => {
    for (const list of Object.values(SOURCES_BY_CATEGORY)) {
      const ids = list.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(list.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("builds https movie and tv urls for every source", () => {
    for (const source of ALL_SOURCES) {
      const movie = source.buildUrl({ type: "movie", id: 550 });
      const tv = source.buildUrl({ type: "tv", id: 1399, season: 2, episode: 3 });
      expect(movie).toMatch(/^https:\/\/.+550$/);
      expect(tv).toMatch(/^https:\/\/.+1399\/2\/3$/);
    }
  });

  it("no longer includes dead hosts", () => {
    const urls = ALL_SOURCES.map((s) => s.buildUrl({ type: "movie", id: 1 })).join(" ");
    for (const host of ["vidsrc.cc", "vidsrcme.su", "vidsrc.pro"]) expect(urls).not.toContain(host);
  });

  it("keeps anime off vixsrc, and anime movies off vidlink", () => {
    expect(SOURCES_BY_CATEGORY["anime-tv"].map((s) => s.id)).not.toContain("vixsrc");
    expect(SOURCES_BY_CATEGORY["anime-movie"].map((s) => s.id)).not.toContain("vixsrc");
    expect(SOURCES_BY_CATEGORY["anime-movie"].map((s) => s.id)).not.toContain("vidlink");
  });
});

describe("isAnime", () => {
  const animation = { id: 16, name: "Animation" };

  it("is false for missing data or genres", () => {
    expect(isAnime(undefined)).toBe(false);
    expect(isAnime({})).toBe(false);
    expect(isAnime({ genres: null })).toBe(false);
  });

  it("treats animation with no origin data as anime", () => {
    expect(isAnime({ genres: [animation] })).toBe(true);
    expect(isAnime({ genres: [{ id: 18, name: "Drama" }] })).toBe(false);
  });

  // Shapes as TMDB returns them: movie and TV details both have origin_country
  it("requires a Japanese origin country for movies and TV shows", () => {
    const spiritedAway = { genres: [animation], origin_country: ["JP"], original_language: "ja" };
    const toyStory = { genres: [animation], origin_country: ["US"], original_language: "en" };
    expect(isAnime(spiritedAway)).toBe(true);
    expect(isAnime(toyStory)).toBe(false);
    expect(isAnime({ genres: [animation], origin_country: ["JP"] })).toBe(true);
    expect(isAnime({ genres: [animation], origin_country: ["US"] })).toBe(false);
  });

  it("falls back to the original language when origin_country is missing", () => {
    expect(isAnime({ genres: [animation], original_language: "ja" })).toBe(true);
    expect(isAnime({ genres: [animation], original_language: "en" })).toBe(false);
  });

  it("matches the genre by name as well as id", () => {
    expect(isAnime({ genres: [{ id: 999, name: "Animation" }] })).toBe(true);
  });
});

describe("getAvailableSources", () => {
  it("picks the list for the media type and anime flag", () => {
    expect(getSourceCategory("movie", false)).toBe("movie");
    expect(getSourceCategory("tv", false)).toBe("tv");
    expect(getSourceCategory("movie", true)).toBe("anime-movie");
    expect(getSourceCategory("tv", true)).toBe("anime-tv");
    expect(getAvailableSources("tv", true)).toBe(SOURCES_BY_CATEGORY["anime-tv"]);
  });

  it("uses explicit sources as given", () => {
    const sources = [makeSource("a"), makeSource("b")];
    expect(getAvailableSources("movie", true, sources)).toBe(sources);
  });
});

describe("buildEmbedUrl", () => {
  const source = makeSource("host");

  it("builds a movie url", () => {
    expect(buildEmbedUrl(source, { type: "movie", id: "550" })).toBe("https://host/m/550");
  });

  it("builds a tv url", () => {
    expect(buildEmbedUrl(source, { type: "tv", id: 1399, season: 1, episode: 2 })).toBe(
      "https://host/t/1399/1/2"
    );
  });

  it("returns null until the router id is available", () => {
    expect(buildEmbedUrl(source, { type: "movie", id: undefined as any })).toBeNull();
    expect(buildEmbedUrl(source, { type: "movie", id: "" })).toBeNull();
  });

  it("returns null for tv without season or episode", () => {
    expect(buildEmbedUrl(source, { type: "tv", id: 1399 })).toBeNull();
    expect(buildEmbedUrl(source, { type: "tv", id: 1399, season: 1 })).toBeNull();
  });

  it("returns null without a source", () => {
    expect(buildEmbedUrl(undefined, { type: "movie", id: 1 })).toBeNull();
  });
});

describe("getNextSourceIndex", () => {
  it("moves to the next untried source", () => {
    expect(getNextSourceIndex(0, 3, new Set([0]))).toBe(1);
  });

  it("wraps around the list", () => {
    expect(getNextSourceIndex(2, 3, new Set([2]))).toBe(0);
  });

  it("skips sources that were already tried", () => {
    expect(getNextSourceIndex(0, 3, new Set([0, 1]))).toBe(2);
  });

  it("returns null when every source was tried", () => {
    expect(getNextSourceIndex(1, 3, new Set([0, 1, 2]))).toBeNull();
    expect(getNextSourceIndex(0, 1, new Set([0]))).toBeNull();
  });
});

describe("getInitialSourceIndex", () => {
  const sources = [makeSource("a"), makeSource("b")];

  it("restores the preferred source", () => {
    expect(getInitialSourceIndex(sources, "b")).toBe(1);
  });

  it("falls back to the first source", () => {
    expect(getInitialSourceIndex(sources, null)).toBe(0);
    expect(getInitialSourceIndex(sources, "gone")).toBe(0);
  });
});

describe("readPlaybackSignal", () => {
  const byId = (id: string) => ALL_SOURCES.find((s) => s.id === id)!;
  const vixsrc = byId("vixsrc");
  const vidlink = byId("vidlink");

  // Shapes recorded from the providers' iframes
  const VIXSRC_PLAY = {
    type: "PLAYER_EVENT",
    event: { event: "play", data: { newstate: "playing" }, video_id: "170060" },
  };
  const VIXSRC_TIMEUPDATE = {
    type: "PLAYER_EVENT",
    event: { event: "timeupdate", currentTime: 1, duration: 8348.33, video_id: "170060" },
  };
  const VIDLINK_MEDIA_DATA = {
    type: "MEDIA_DATA",
    data: { 550: { id: 550, type: "movie", progress: { watched: 0, duration: 0 } } },
  };
  const VIDLINK_PLAYER_EVENT = {
    type: "PLAYER_EVENT",
    data: { event: "timeupdate", currentTime: 0.97, duration: 8348.3, mtmdbId: 550, mediaType: "movie" },
  };
  const YANDEX = '{"data":{"type":"initToParent","counterId":98154677},"__yminfo":"__yminfo:1:0.1:0"}';

  it("reads vixsrc player events as ready", () => {
    expect(readPlaybackSignal(vixsrc, { origin: "https://vixsrc.to", data: VIXSRC_PLAY })).toBe("ready");
    expect(readPlaybackSignal(vixsrc, { origin: "https://vixsrc.to", data: VIXSRC_TIMEUPDATE })).toBe("ready");
  });

  it("reads vixsrc player errors as errors", () => {
    for (const event of ["error", "setupError"]) {
      expect(
        readPlaybackSignal(vixsrc, { origin: "https://vixsrc.to", data: { type: "PLAYER_EVENT", event: { event } } })
      ).toBe("error");
    }
  });

  it("reads vidlink media data and player events as ready, and ignores its analytics", () => {
    expect(readPlaybackSignal(vidlink, { origin: "https://vidlink.pro", data: VIDLINK_MEDIA_DATA })).toBe("ready");
    expect(readPlaybackSignal(vidlink, { origin: "https://vidlink.pro", data: VIDLINK_PLAYER_EVENT })).toBe(
      "ready"
    );
    expect(readPlaybackSignal(vidlink, { origin: "https://vidlink.pro", data: YANDEX })).toBeNull();
  });

  it("ignores messages from any other origin", () => {
    expect(readPlaybackSignal(vixsrc, { origin: "https://vidlink.pro", data: VIXSRC_PLAY })).toBeNull();
    expect(readPlaybackSignal(vixsrc, { origin: "http://vixsrc.to", data: VIXSRC_PLAY })).toBeNull();
    expect(readPlaybackSignal(vixsrc, { origin: "https://vixsrc.to.evil.example", data: VIXSRC_PLAY })).toBeNull();
    expect(readPlaybackSignal(vidlink, { origin: "https://vixsrc.to", data: VIDLINK_MEDIA_DATA })).toBeNull();
  });

  it("ignores unrecognised or empty messages", () => {
    for (const data of [null, undefined, "", 42, {}, { type: "something-else" }]) {
      expect(readPlaybackSignal(vixsrc, { origin: "https://vixsrc.to", data })).toBeNull();
      expect(readPlaybackSignal(vidlink, { origin: "https://vidlink.pro", data })).toBeNull();
    }
  });

  it("has no adapter for providers that post nothing usable", () => {
    expect(byId("vidrock").signals).toBeUndefined();
    expect(byId("vidsrc-su").signals).toBeUndefined();
    expect(readPlaybackSignal(byId("vidrock"), { origin: "https://vidrock.net", data: VIXSRC_PLAY })).toBeNull();
    expect(readPlaybackSignal(undefined, { origin: "https://vixsrc.to", data: VIXSRC_PLAY })).toBeNull();
  });

  it("uses each source's own host as its origin", () => {
    for (const source of ALL_SOURCES) {
      if (!source.signals) continue;
      expect(new URL(source.buildUrl({ type: "movie", id: 1 })).origin).toBe(source.signals.origin);
    }
  });

  it("treats a throwing adapter as no signal", () => {
    const source = {
      ...makeSource("x"),
      signals: {
        origin: "https://x",
        parseMessage: () => {
          throw new Error("bad shape");
        },
      },
    };
    expect(readPlaybackSignal(source, { origin: "https://x", data: {} })).toBeNull();
  });
});
