"use client"

import { useRouter } from "next/navigation"

export default function GameError() {
  const router = useRouter()
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-2xl font-bold">Oops, something went wrong :/</p>
      <p className="text-zinc-500 text-sm">
        Something unexpected happened. Try starting a new game.
      </p>
      <button
        onClick={() => router.push("/setup")}
        className="rounded-full bg-zinc-800 px-6 py-2.5 text-sm font-semibold hover:bg-zinc-700 transition-colors"
      >
        Back to Setup
      </button>
    </main>
  )
}
