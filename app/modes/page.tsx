import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import ModeSelector from "./ModeSelector"

export default async function ModesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/")

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-3xl font-bold">Choose a mode</h1>
        <p className="text-zinc-400">Pick what kind of tournament you want to play.</p>
      </div>
      <ModeSelector username={session.lastfmUsername!} />
    </main>
  )
}
