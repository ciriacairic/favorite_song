import { getServerSession } from "next-auth"
import Link from "next/link"
import { authOptions } from "./api/auth/[...nextauth]/route"
import SignInButton from "@/components/SignInButton"
import GlobalStats from "@/components/GlobalStats"

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <main className="flex flex-col items-center">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-32 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-5xl font-bold tracking-tight">
            favorite song
          </h1>
          <p className="max-w-md text-lg text-zinc-400">
            A bracket tournament for your most-played tracks. Sign in with Last.fm
            and find out which song wins.
          </p>
        </div>

        {session ? (
          <Link
            href="/setup"
            className="rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-500"
          >
            Play →
          </Link>
        ) : (
          <SignInButton />
        )}

        <p className="text-sm text-zinc-600">
          Powered by your Last.fm scrobbles — works with Spotify, Apple Music,
          Tidal, YouTube Music, and more.
        </p>
      </section>

      {/* Global stats */}
      <GlobalStats />
    </main>
  )
}
