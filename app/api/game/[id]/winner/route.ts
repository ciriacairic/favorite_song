import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.lastfmUsername) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: gameId } = await params
  const { winnerId } = await req.json()

  const supabase = await createClient()
  const { error } = await supabase
    .from("games")
    .update({ winner_id: winnerId })
    .eq("id", gameId)
    .eq("username", session.lastfmUsername)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
