import { getSongById } from "@/lib/music/catalogue";
import Player from "../_components/Player";
import Recomandation from "../_components/Recomandation";

export const generateMetadata = async ({ params }) => {
  const song = await getSongById(params.id);
  if (!song) {
    return {
      title: "Track unavailable",
      description: "This track could not be loaded from the catalogue.",
    };
  }

  const artist = song.artists?.primary?.[0]?.name || "unknown artist";
  const image = song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url;

  return {
    title: song.name,
    description: `Listen to "${song.name}" by ${artist} from "${song.album?.name}". 30-second preview on VibeSound AI.`,
    openGraph: {
      title: song.name,
      description: `Listen to "${song.name}" by ${artist}.`,
      type: "music.song",
      url: song.url,
      images: image ? [{ url: image, width: 600, height: 600, alt: song.name }] : [],
      music: {
        album: song.album?.name,
        release_date: song.releaseDate,
        musician: artist,
      },
    },
    twitter: {
      card: "summary_large_image",
      title: song.name,
      description: `Listen to "${song.name}" by ${artist}.`,
      images: image ? [image] : [],
    },
  };
};

export default function Page({ params }) {
  return (
    <div>
      <Player id={params.id} />
      <Recomandation id={params.id} />
    </div>
  );
}
