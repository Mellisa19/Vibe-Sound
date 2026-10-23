"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Confident Afrobeats for getting ready to go out",
  "Calm Amapiano for a slow Sunday",
  "Lo-fi for deep work, no vocals",
  "Start acoustic and build to a dancefloor",
];

export default function VibePrompt({ className }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  const submit = (event) => {
    event?.preventDefault();
    const prompt = value.trim();
    if (!prompt) return;
    router.push(`/companion?q=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className={cn("w-full", className)}>
      <form
        onSubmit={submit}
        className="rounded-xl border border-border bg-secondary/20 p-3 shadow-sm backdrop-blur"
      >
        <div className="flex items-start gap-2">
          <Sparkles className="mt-2.5 hidden h-4 w-4 flex-none text-muted-foreground sm:block" />
          <Textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit(event);
              }
            }}
            rows={2}
            maxLength={1200}
            placeholder="e.g. Confident Afrobeats for getting ready to go out"
            className="min-h-0 flex-1 resize-none border-0 bg-transparent px-0 py-2 text-sm shadow-none focus-visible:ring-0"
            aria-label="Describe the music you want"
          />
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">
            Enter to send · Shift + Enter for a new line
          </span>
          <Button type="submit" size="sm" className="flex-none rounded-full" disabled={!value.trim()}>
            Find my sound
          </Button>
        </div>
      </form>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setValue(example)}
            className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
