import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import SignOutButton from "./SignOutButton"

export default async function Header() {
  const session = await getServerSession(authOptions)

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
      <span className="font-semibold tracking-tight">favorite song</span>
      {session?.lastfmUsername && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">{session.lastfmUsername}</span>
          <SignOutButton />
        </div>
      )}
    </header>
  )
}
