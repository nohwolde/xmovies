import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Container from "../../components/container/Container";
import Layout from "../../components/layout/Layout";
import { MediaItem, imageUrl, tmdb } from "../../lib/tmdb";

function CastMovies() {
  const router = useRouter();
  const slug = decodeURIComponent((router.query.id as string) ?? "");
  // Slug is "<Name-Words>-<personId>"; older links used spaces in the name
  const personId = slug.split("-").pop();
  const [person, setPerson] = useState<any>(null);
  const [credits, setCredits] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!personId) return;
    let cancelled = false;
    setLoading(true);
    tmdb(`/person/${personId}`, { append_to_response: "combined_credits" })
      .then((data: any) => {
        if (cancelled) return;
        setPerson(data);
        const seen = new Set<string>();
        const cast: MediaItem[] = (data.combined_credits?.cast ?? [])
          .filter((item: MediaItem) => {
            const key = `${item.media_type}-${item.id}`;
            if (seen.has(key) || !(item.backdrop_path || item.poster_path)) return false;
            seen.add(key);
            return true;
          })
          .sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0));
        setCredits(cast);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [personId]);

  const name = person?.name ?? slug.split("-").slice(0, -1).join(" ");
  const photo = imageUrl(person?.profile_path, "w342");

  return (
    <Layout title={name}>
      <div className="flex flex-col gap-6 px-4 md:flex-row md:items-start md:px-12">
        {photo && <img src={photo} alt={name} className="w-32 md:w-44 rounded-xl object-cover ring-1 ring-white/10" />}
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{name}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50">
            {person?.known_for_department && <span>{person.known_for_department}</span>}
            {person?.birthday && <span>Born {person.birthday}</span>}
            {person?.place_of_birth && <span>{person.place_of_birth}</span>}
          </div>
          {person?.biography && <p className="line-clamp-3 text-sm leading-relaxed text-white/75">{person.biography}</p>}
        </div>
      </div>
      <Container Data={credits} heading="Known for" loading={loading} />
    </Layout>
  );
}

export default CastMovies;
