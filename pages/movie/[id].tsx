import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import { useDispatch } from "react-redux";
import DetailContainer from "../../components/details/DetailContainer";
import MediaRow, { RowShell } from "../../components/media/MediaRow";
import PersonCard from "../../components/media/PersonCard";
import { SetContinueWatching } from "../../redux/actions/tvShowAction";
import EmbedPlayer from "../../components/player/EmbedPlayer";
import { MediaItem, getTitle, notFoundOrThrow, tmdb } from "../../lib/tmdb";
import { isAnime } from "../../utils/video-sources";

export default function MovieEpisode({ resp: data }: { resp: MediaItem }) {
  const router = useRouter();
  const { id } = router.query;
  const dispatch = useDispatch();

  // The reducer replaces any existing entry, so re-watching bumps it to the front
  const handleIframe = () => {
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
        <EmbedPlayer
          media={{ type: "movie", id: id as string }}
          title={getTitle(data)}
          anime={isAnime(data)}
          className="aspect-video overflow-hidden rounded-xl ring-1 ring-white/10"
          onLoad={handleIframe}
        />
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
    const resp = await tmdb(`/movie/${context.params.id}`, {
      append_to_response: "credits,recommendations,videos,images",
      include_image_language: "en,null",
    });
    return { props: { resp }, revalidate: 60 * 60 * 24 };
  } catch (error) {
    return notFoundOrThrow(error);
  }
};
