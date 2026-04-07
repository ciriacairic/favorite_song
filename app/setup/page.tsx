import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export default async function SetupPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/")
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24">
      <h1 className="text-3xl font-bold">Welcome, {session.lastfmUsername}!</h1>
      <p className="text-zinc-400">Track selection coming next.</p>
    </main>
  )
}
