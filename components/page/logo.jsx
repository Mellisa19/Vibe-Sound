import Link from "next/link";
import { AudioWaveform } from "lucide-react";

export default function Logo() {
  return (
    <Link href="/" className="select-none" aria-label="VibeSound AI home">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">
          <AudioWaveform className="h-4 w-4" aria-hidden="true" />
        </span>
        <h1 className="flex items-center text-xl font-bold tracking-tight">
          Vibe<span className="opacity-50">Sound</span>
          <span className="ml-1.5 rounded bg-secondary px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none tracking-[0.12em] text-muted-foreground">
            AI
          </span>
        </h1>
      </div>
    </Link>
  );
}
