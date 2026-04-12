import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.lastfmUsername) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: gameId } = await params
  const { round, position, songAId, songBId, winnerId } = await req.json()

  const supabase = await createClient()
  const { error } = await supabase.from("matchup_results").insert({
    game_id: gameId,
    round,
    position,
    song_a_id: songAId,
    song_b_id: songBId,
    winner_id: winnerId,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
