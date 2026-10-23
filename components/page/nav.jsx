"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Discover" },
  { href: "/companion", label: "AI Companion" },
  { href: "/for-you", label: "For You" },
  { href: "/africa", label: "Africa" },
  { href: "/journey", label: "Journey" },
];

export default function Nav() {
  const path = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="-mx-1 flex flex-wrap items-center gap-1 px-1 pb-1 text-sm"
    >
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? path === "/" : path === link.href || path.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex-none rounded-full px-3 py-1.5 transition",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
