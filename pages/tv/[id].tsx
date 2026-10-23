import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { FaPlay } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import DetailContainer from "../../components/details/DetailContainer";
import MediaRow, { RowShell } from "../../components/media/MediaRow";
import PersonCard from "../../components/media/PersonCard";
import { SetContinueWatching, SetCurrentState } from "../../redux/actions/tvShowAction";
import { MediaItem, formatRuntime, getTitle, imageUrl, tmdb } from "../../lib/tmdb";

const SOURCES = [
  { name: "Vidsrc", baseUrl: "https://vidsrcme.su/embed/tv/" },
  { name: "VidsrcPro", baseUrl: "https://vidsrc.pro/embed/tv/" },
];

interface Episode {
  episode_number: number;
  season_number: number;
  name: string;
  overview?: string;
  still_path?: string | null;
  runtime?: number | null;
  air_date?: string | null;
}

// Episodes per season, cached by "<showId>:<season>"
function useSeasonEpisodes(showId: string | undefined, seasons: number[]) {
  const [cache, setCache] = useState<Record<string, Episode[]>>({});
  const key = seasons.join(",");

  useEffect(() => {
    if (!showId) return;
    seasons
      .filter((s) => !cache[`${showId}:${s}`])
      .forEach((season) => {
        const cacheKey = `${showId}:${season}`;
        tmdb<{ episodes?: Episode[] }>(`/tv/${showId}/season/${season}`)
          .then((res) => setCache((prev) => ({ ...prev, [cacheKey]: res.episodes ?? [] })))
          .catch(() => setCache((prev) => ({ ...prev, [cacheKey]: [] })));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showId, key]);

  return (season: number): Episode[] | undefined => cache[`${showId}:${season}`];
}

function TvEpisode({ res: data }: { res: MediaItem }) {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const dispatch = useDispatch();
  const currentState: any[] = useSelector((state: any) => state.CurrentState) ?? [];
  const saved = currentState.find((item) => item.id == id);
  const playing = { season: saved?.season_number ?? 1, episode: saved?.episode_number ?? 1 };

  const [viewSeason, setViewSeason] = useState(playing.season);
  const [baseUrl, setBaseUrl] = useState<string>(SOURCES[0].baseUrl);
  useEffect(() => setViewSeason(playing.season), [id, playing.season]);

  const seasons: any[] = (data?.seasons ?? []).filter((s: any) => s.season_number > 0 && s.air_date);
  const episodesFor = useSeasonEpisodes(id, viewSeason === playing.season ? [viewSeason] : [viewSeason, playing.season]);
  const viewEpisodes = episodesFor(viewSeason);
  const playingEpisodes = episodesFor(playing.season) ?? [];
  const playingEpisode = playingEpisodes.find((ep) => ep.episode_number === playing.episode);
  const lastSeason = seasons.length ? seasons[seasons.length - 1].season_number : 1;

  const playEpisode = (ep: Pick<Episode, "season_number" | "episode_number"> & Partial<Episode>, scroll = true) => {
    dispatch(
      SetCurrentState({
        id,
        episode_number: ep.episode_number,
        episode_name: ep.name ?? "",
        season_number: ep.season_number,
        episode_image: ep.still_path,
      })
    );
    if (scroll) document.getElementById("watch")?.scrollIntoView({ behavior: "smooth" });
  };

  const hasPrev = playing.episode > 1 || playing.season > 1;
  const hasNext = playing.episode < playingEpisodes.length || playing.season < lastSeason;

  const goPrev = () => {
    if (playing.episode > 1) {
      const ep = playingEpisodes.find((e) => e.episode_number === playing.episode - 1);
      playEpisode(ep ?? { season_number: playing.season, episode_number: playing.episode - 1 }, false);
    } else if (playing.season > 1) {
      const prevSeason = seasons.find((s) => s.season_number === playing.season - 1);
      playEpisode({ season_number: playing.season - 1, episode_number: prevSeason?.episode_count ?? 1 }, false);
    }
  };

  const goNext = () => {
    if (playing.episode < playingEpisodes.length) {
      const ep = playingEpisodes.find((e) => e.episode_number === playing.episode + 1);
      playEpisode(ep ?? { season_number: playing.season, episode_number: playing.episode + 1 }, false);
    } else if (playing.season < lastSeason) {
      playEpisode({ season_number: playing.season + 1, episode_number: 1 }, false);
    }
  };

  const handleIframe = () => {
    dispatch(
      SetContinueWatching({
        id,
        poster_path: data?.poster_path,
        backdrop_path: playingEpisode?.still_path || data?.backdrop_path,
        title: data?.name,
        season: playing.season,
        episode: playing.episode,
        episode_name: playingEpisode?.name ?? saved?.episode_name ?? "",
        media_type: "tv",
        time: Date.now(),
      })
    );
  };

  if (!data?.id) return null;

  return (
    <>
      <Head>
        <title>{`${getTitle(data)} | NMOVIES`}</title>
        <meta name="description" content={data.overview} />
      </Head>

      <DetailContainer {...data} media_type="tv" />

      <section id="watch" className="scroll-mt-24 px-4 md:px-12" aria-label="Watch">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Now playing</p>
            <h2 className="text-lg md:text-xl font-bold">
              S{playing.season} · E{playing.episode}
              {playingEpisode?.name ? <span className="font-normal text-white/70"> — {playingEpisode.name}</span> : null}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-white/60">Source:</span>
            {SOURCES.map((source) => (
              <button
                key={source.baseUrl}
                type="button"
                aria-pressed={baseUrl === source.baseUrl}
                onClick={() => setBaseUrl(source.baseUrl)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  baseUrl === source.baseUrl ? "bg-white text-black" : "bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                {source.name}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
          <iframe
            onLoadCapture={handleIframe}
            className="aspect-video w-full"
            src={`${baseUrl}${id}/${playing.season}/${playing.episode}`}
            title={`Watch ${getTitle(data)} S${playing.season}E${playing.episode}`}
            allowFullScreen
          ></iframe>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={!hasPrev}
            className="flex items-center gap-1 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <FiChevronLeft /> Prev episode
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!hasNext}
            className="flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next episode <FiChevronRight />
          </button>
        </div>
      </section>

      <section className="mt-12 px-4 md:px-12" aria-label="Episodes">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg md:text-2xl font-bold tracking-tight">Episodes</h2>
          {seasons.length > 0 && (
            <select
              value={viewSeason}
              onChange={(e) => setViewSeason(Number(e.target.value))}
              aria-label="Season"
              className="rounded-lg border border-white/10 bg-surface-2 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-accent"
            >
              {seasons.map((s) => (
                <option key={s.season_number} value={s.season_number}>
                  {s.name} ({s.episode_count} ep)
                </option>
              ))}
            </select>
          )}
        </div>

        {!viewEpisodes ? (
          <div className="grid gap-3 md:grid-cols-2" aria-hidden>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : (
          <ol className="grid gap-3 md:grid-cols-2">
            {viewEpisodes.map((ep) => {
              const active = ep.season_number === playing.season && ep.episode_number === playing.episode;
              const still = imageUrl(ep.still_path, "w300");
              return (
                <li key={ep.episode_number}>
                  <button
                    type="button"
                    onClick={() => playEpisode(ep)}
                    aria-current={active ? "true" : undefined}
                    className={`group flex w-full gap-4 rounded-xl p-2 text-left transition ${
                      active ? "bg-white/10 ring-1 ring-white/30" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="relative aspect-video w-36 md:w-44 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                      {still && <img src={still} alt="" loading="lazy" className="h-full w-full object-cover" />}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                        <FaPlay size={18} />
                      </span>
                      {active && (
                        <span className="absolute bottom-1 left-1 rounded bg-badge px-1.5 py-0.5 text-[10px] font-bold uppercase">
                          Playing
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 py-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="line-clamp-1 font-semibold">
                          {ep.episode_number}. {ep.name || `Episode ${ep.episode_number}`}
                        </h3>
                        {formatRuntime(ep.runtime) && (
                          <span className="shrink-0 text-xs text-white/40">{formatRuntime(ep.runtime)}</span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs md:text-sm text-white/55">{ep.overview || ep.air_date}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <RowShell title="Cast" itemClassName="w-[28%] sm:w-[18%] md:w-[13%] lg:w-[10%]">
        {(data.credits?.cast ?? []).slice(0, 20).map((person: MediaItem) => (
          <PersonCard key={person.id} item={person} />
        ))}
      </RowShell>

      <MediaRow title="More Like This" items={data.recommendations?.results ?? []} mediaType="tv" />
    </>
  );
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export const getStaticProps = async (context: any) => {
  try {
    const res = await tmdb(`/tv/${context.params.id}`, { append_to_response: "credits,recommendations,videos" });
    return { props: { res }, revalidate: 60 * 60 * 24 };
  } catch {
    return { notFound: true };
  }
};

export default TvEpisode;
