import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import GameBoard from "./GameBoard"

export default async function GamePage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/")
  }
  return (
    <main className="flex flex-1 flex-col">
      <GameBoard />
    </main>
  )
}
