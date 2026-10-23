import { describe, expect, it } from "vitest";
import { slimItems, trimDetail } from "../lib/tmdb";

describe("trimDetail", () => {
  const detail: any = {
    id: 550,
    title: "Fight Club",
    images: {
      backdrops: Array.from({ length: 50 }, (_, i) => ({ file_path: `/b${i}.jpg` })),
      logos: [
        { file_path: "/fr.png", iso_639_1: "fr", width: 500 },
        { file_path: "/en.png", iso_639_1: "en", width: 500 },
      ],
    },
    videos: { results: [{ key: "vimeo1", site: "Vimeo", type: "Trailer" }, { key: "yt1", site: "YouTube", type: "Trailer", id: "x" }] },
    credits: {
      cast: Array.from({ length: 60 }, (_, i) => ({ id: i, name: `Actor ${i}`, character: "Role", profile_path: null, popularity: 1 })),
      crew: [
        { id: 1, name: "David Fincher", job: "Director", department: "Directing" },
        { id: 2, name: "Someone", job: "Editor" },
      ],
    },
    recommendations: { results: [{ id: 680, title: "Pulp Fiction", overview: "long text", popularity: 9 }] },
  };

  it("keeps only what the detail page renders", () => {
    const out = trimDetail(detail);
    expect(out.title).toBe("Fight Club");
    expect(out.images).toEqual({ logos: [{ file_path: "/en.png", iso_639_1: "en" }] });
    expect(out.videos.results).toEqual([{ key: "yt1", site: "YouTube", type: "Trailer" }]);
    expect(out.credits.cast).toHaveLength(20);
    expect(out.credits.cast[0]).toEqual({ id: 0, name: "Actor 0", character: "Role", profile_path: null });
    expect(out.credits.crew).toEqual([{ id: 1, name: "David Fincher", job: "Director" }]);
    expect(out.recommendations.results).toEqual([{ id: 680, title: "Pulp Fiction" }]);
  });

  it("keeps the trailer even when TMDB lists it after many clips", () => {
    const clips = Array.from({ length: 30 }, (_, i) => ({ key: `clip${i}`, site: "YouTube", type: "Clip" }));
    const out = trimDetail({ id: 2, videos: { results: [...clips, { key: "trailer", site: "YouTube", type: "Trailer" }] } });
    expect(out.videos.results[0]).toEqual({ key: "trailer", site: "YouTube", type: "Trailer" });
    expect(out.videos.results).toHaveLength(5);
  });

  it("produces JSON-serializable props when parts are missing", () => {
    const out = trimDetail({ id: 1, title: "Bare" });
    expect(JSON.parse(JSON.stringify(out))).toEqual(out);
    expect(out.images.logos).toEqual([]);
  });
});

describe("slimItems", () => {
  it("drops fields that are absent instead of writing undefined", () => {
    expect(slimItems([{ id: 1, name: "Show", popularity: 3 } as any])).toEqual([{ id: 1, name: "Show" }]);
  });
});
