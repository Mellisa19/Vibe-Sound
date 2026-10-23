import Link from "next/link";

export default function Footer() {
    return (
        <footer className="py-8 backdrop-blur-3xl mt-8 px-6 md:px-20 lg:px-32">
            <div className="flex flex-col justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-end">
                <div>
                    <h1 className="text-lg font-bold">Vibe<span className="opacity-50">Sound</span> <span className="text-xs align-middle text-muted-foreground">AI</span></h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Your mood. Your music. Your discovery.</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <Link className="text-sm opacity-80 font-light underline hover:opacity-100" href="/companion">AI Companion</Link>
                    <Link className="text-sm opacity-80 font-light underline hover:opacity-100" href="/for-you">For You</Link>
                    <Link className="text-sm opacity-80 font-light underline hover:opacity-100" href="/africa">African Discovery</Link>
                    <Link className="text-sm opacity-80 font-light underline hover:opacity-100" href="/journey">Journey</Link>
                </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
                Music metadata and 30-second previews courtesy of Apple&apos;s public iTunes catalogue.
                Built for educational purposes on the open-source{" "}
                <a className="underline text-primary hover:text-primary" href="https://github.com/r2hu1/musichub">MusicHub</a>{" "}
                foundation by r2hu1.
            </p>
        </footer>
    )
}
