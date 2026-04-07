import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import SetupForm from "./SetupForm"

export default async function SetupPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/")
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-3xl font-bold">Hey, {session.lastfmUsername}</h1>
        <p className="text-zinc-400">Pick a time period and bracket size to build your tournament.</p>
      </div>
      <SetupForm username={session.lastfmUsername!} />
    </main>
  )
}
