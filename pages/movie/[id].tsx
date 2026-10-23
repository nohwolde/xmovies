import Head from "next/head";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DetailContainer from "../../components/details/DetailContainer";
import MediaRow, { RowShell } from "../../components/media/MediaRow";
import PersonCard from "../../components/media/PersonCard";
import { SetContinueWatching } from "../../redux/actions/tvShowAction";
import { MediaItem, getTitle, tmdb } from "../../lib/tmdb";

const SOURCES = [
  { name: "Vidsrc", baseUrl: "https://vidsrcme.su/embed/movie/" },
  { name: "VidsrcPro", baseUrl: "https://vidsrc.pro/embed/movie/" },
];

export default function MovieEpisode({ resp: data }: { resp: MediaItem }) {
  const router = useRouter();
  const { id } = router.query;
  const dispatch = useDispatch();
  const continueWatching: any[] = useSelector((state: any) => state.ContinueWatching) ?? [];
  const [baseUrl, setBaseUrl] = useState<string>(SOURCES[0].baseUrl);

  const handleIframe = () => {
    if (continueWatching.some((item) => item.id == id)) return;
    dispatch(
      SetContinueWatching({
        id,
        poster_path: data?.poster_path,
        backdrop_path: data?.backdrop_path,
        title: data?.title,
        media_type: "movie",
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

      <DetailContainer {...data} media_type="movie" />

      <section id="watch" className="scroll-mt-24 px-4 md:px-12" aria-label="Watch">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="text-sm font-medium text-white/60">Video Source:</span>
          <div className="flex flex-wrap gap-2">
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
            src={`${baseUrl}${id}`}
            title={`Watch ${getTitle(data)}`}
            allowFullScreen
          ></iframe>
        </div>
      </section>

      <RowShell title="Cast" itemClassName="w-[28%] sm:w-[18%] md:w-[13%] lg:w-[10%]">
        {(data.credits?.cast ?? []).slice(0, 20).map((person: MediaItem) => (
          <PersonCard key={person.id} item={person} />
        ))}
      </RowShell>

      <MediaRow title="More Like This" items={data.recommendations?.results ?? []} mediaType="movie" />
    </>
  );
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export const getStaticProps = async (context: any) => {
  try {
    const resp = await tmdb(`/movie/${context.params.id}`, { append_to_response: "credits,recommendations,videos" });
    return { props: { resp }, revalidate: 60 * 60 * 24 };
  } catch {
    return { notFound: true };
  }
};
