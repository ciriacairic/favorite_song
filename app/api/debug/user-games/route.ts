import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")
  const gameId = req.nextUrl.searchParams.get("gameId")
  if (!username) return NextResponse.json({ error: "username required" }, { status: 400 })

  const supabase = await createClient()

  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("id, username, period, track_count, created_at, winner_id")
    .eq("username", username)

  if (gameId) {
    const { data: matchups, error: matchupError } = await supabase
      .from("matchup_results")
      .select("*")
      .eq("game_id", gameId)
      .order("round")
      .order("position")

    return NextResponse.json({ games, gamesError, matchups, matchupError })
  }

  return NextResponse.json({ games, gamesError })
}
