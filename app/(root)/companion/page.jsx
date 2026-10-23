import { Suspense } from "react";
import Companion from "./_components/Companion";

export const metadata = {
  title: "AI Music Companion",
  description:
    "Describe your mood, activity, genre or energy and VibeSound AI finds a playable mix from the live catalogue.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="px-6 py-8 md:px-20 lg:px-32">
          <div className="mx-auto max-w-4xl">
            <div className="h-6 w-52 animate-pulse rounded bg-secondary" />
            <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-secondary" />
            <div className="mt-6 h-32 animate-pulse rounded-xl bg-secondary/50" />
          </div>
        </main>
      }
    >
      <Companion />
    </Suspense>
  );
}

