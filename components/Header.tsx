import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import SignOutButton from "./SignOutButton"

export default async function Header() {
  const session = await getServerSession(authOptions)

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
      <Link href="/" className="font-semibold tracking-tight hover:text-zinc-300 transition-colors">
        favorite song
      </Link>
      {session?.lastfmUsername && (
        <div className="flex items-center gap-4">
          <a
            href={`/user/${session.lastfmUsername}`}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            {session.lastfmUsername}
          </a>
          <SignOutButton />
        </div>
      )}
    </header>
  )
}
