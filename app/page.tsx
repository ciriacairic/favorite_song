import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "./api/auth/[...nextauth]/route"
import SignInButton from "@/components/SignInButton"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/setup")
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          favorite song
        </h1>
        <p className="max-w-md text-lg text-zinc-400">
          A bracket tournament for your most-played tracks. Sign in with Last.fm
          and find out which song wins.
        </p>
      </div>

      <SignInButton />

      <p className="text-sm text-zinc-600">
        Powered by your Last.fm scrobbles — works with Spotify, Apple Music,
        Tidal, YouTube Music, and more.
      </p>
    </main>
  )
}
