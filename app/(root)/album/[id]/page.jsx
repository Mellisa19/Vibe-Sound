import { getAlbumById } from "@/lib/music/catalogue";
import Album from "../_components/Album";

export const generateMetadata = async ({ params }) => {
    const data = await getAlbumById(params.id);
    if (!data) {
        return {
            title: "Album unavailable",
            description: "This album could not be loaded from the catalogue.",
        };
    }

    return {
        title: data.name,
        description: data.description
            ? `${data.name} by ${data.artists?.primary?.[0]?.name || "unknown artist"} — ${data.description}.`
            : `Listen to ${data.name} on VibeSound AI.`,
        openGraph: {
            title: data.name,
            description: `Listen to ${data.name} on VibeSound AI.`,
            images: data.image?.[2]?.url ? [{ url: data.image[2].url }] : [],
        },
    };
}
export default function Page({ params }) {
    return (
        <main>
            <Album id={params.id} />
        </main>
    )
}
