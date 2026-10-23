import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import MusicProvider from "@/components/providers/music-provider";
import TasteProvider from "@/components/providers/taste-provider";

const bricolage_grotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VibeSound AI — Your mood. Your music. Your discovery.",
    template: "%s · VibeSound AI",
  },
  applicationName: "VibeSound AI",
  description:
    "AI-powered music discovery that reads your mood, activity and energy — and helps you find emerging African artists.",
  keywords: [
    "VibeSound AI",
    "AI music discovery",
    "Afrobeats",
    "Amapiano",
    "African artists",
    "mood music",
    "playlist generator",
  ],
  authors: [{ name: "VibeSound AI" }],
  icons: {
    icon: [
      { url: "/vibesound-icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "VibeSound AI",
    title: "VibeSound AI — Your mood. Your music. Your discovery.",
    description:
      "Describe the moment. VibeSound AI finds the music — with a spotlight on emerging African artists.",
    url: "/",
    images: [{ url: "/og-vibesound.png", width: 1200, height: 630, alt: "VibeSound AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeSound AI — Your mood. Your music. Your discovery.",
    description:
      "AI-powered music discovery for your mood, activity and energy.",
    images: ["/og-vibesound.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={bricolage_grotesque.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TasteProvider>
            <MusicProvider>{children}</MusicProvider>
          </TasteProvider>
          <NextTopLoader
            color="hsl(var(--primary))"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px hsl(var(--primary)),0 0 15px hsl(var(--primary))"
            template='<div class="bar" role="bar"><div class="peg"></div></div>
        <div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
            zIndex={1600}
            showAtBottom={false}
          />
          <Toaster position="top-center" visibleToasts={1} />
        </ThemeProvider>
      </body>
    </html>
  );
}
