import { describe, expect, it } from "vitest";
import {
  VIDEO_SOURCES,
  VideoSource,
  buildEmbedUrl,
  getAvailableSources,
  getInitialSourceIndex,
  getNextSourceIndex,
  isAnime,
} from "../utils/video-sources";

const makeSource = (id: string, supportsAnime = true): VideoSource => ({
  id,
  name: id,
  supportsAnime,
  buildUrl: ({ type, id: mediaId, season, episode }) =>
    type === "movie" ? `https://${id}/m/${mediaId}` : `https://${id}/t/${mediaId}/${season}/${episode}`,
});

describe("VIDEO_SOURCES", () => {
  it("has unique ids", () => {
    const ids = VIDEO_SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("builds https movie and tv urls for every source", () => {
    for (const source of VIDEO_SOURCES) {
      const movie = source.buildUrl({ type: "movie", id: 550 });
      const tv = source.buildUrl({ type: "tv", id: 1399, season: 2, episode: 3 });
      expect(movie).toMatch(/^https:\/\/.+550$/);
      expect(tv).toMatch(/^https:\/\/.+1399\/2\/3$/);
    }
  });

  it("no longer includes the unreachable hosts", () => {
    const urls = VIDEO_SOURCES.map((s) => s.buildUrl({ type: "movie", id: 1 })).join(" ");
    expect(urls).not.toContain("vidsrcme.su");
    expect(urls).not.toContain("vidsrc.pro");
  });
});

describe("isAnime", () => {
  const animation = { id: 16, name: "Animation" };

  it("is false for missing data or genres", () => {
    expect(isAnime(undefined)).toBe(false);
    expect(isAnime({})).toBe(false);
    expect(isAnime({ genres: null })).toBe(false);
  });

  it("treats animated movies as anime", () => {
    expect(isAnime({ genres: [animation] })).toBe(true);
    expect(isAnime({ genres: [{ id: 18, name: "Drama" }] })).toBe(false);
  });

  it("requires a Japanese origin for TV shows", () => {
    expect(isAnime({ genres: [animation], origin_country: ["JP"] })).toBe(true);
    expect(isAnime({ genres: [animation], origin_country: ["US"] })).toBe(false);
  });

  it("matches the genre by name as well as id", () => {
    expect(isAnime({ genres: [{ id: 999, name: "Animation" }] })).toBe(true);
  });
});

describe("getAvailableSources", () => {
  const sources = [makeSource("a"), makeSource("b", false), makeSource("c")];

  it("returns every source for non-anime content", () => {
    expect(getAvailableSources(false, sources)).toEqual(sources);
  });

  it("drops sources that can't play anime", () => {
    expect(getAvailableSources(true, sources).map((s) => s.id)).toEqual(["a", "c"]);
  });

  it("defaults to VIDEO_SOURCES", () => {
    expect(getAvailableSources(false)).toBe(VIDEO_SOURCES);
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
