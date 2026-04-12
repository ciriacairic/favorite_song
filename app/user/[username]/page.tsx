import { createClient } from "@/lib/supabase/server"
import UserPage from "./UserPage"
import type { Period } from "@/types"

export interface GameSummary {
  id: string
  period: Period
  trackCount: number
  createdAt: string
  winner: {
    title: string
    artist: string
    albumCover: string | null
  } | null
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()

  const { data: allGames } = await supabase
    .from("games")
    .select("id, period, track_count, created_at, winner_id")
    .eq("username", username)
    .order("created_at", { ascending: false })

  const games = (allGames ?? []).filter((g) => g.winner_id !== null)

  if (!games.length) {
    return <UserPage username={username} games={[]} />
  }

  // Fetch winner song info for all games that have one
  const winnerIds = games.map((g) => g.winner_id).filter(Boolean) as string[]
  const songMap: Record<string, { title: string; artist: string; album_cover: string | null }> = {}

  if (winnerIds.length > 0) {
    const { data: songs } = await supabase
      .from("song_cache")
      .select("id, title, artist, album_cover")
      .in("id", winnerIds)

    songs?.forEach((s) => { songMap[s.id] = s })
  }

  const summaries: GameSummary[] = games.map((g) => ({
    id: g.id,
    period: g.period as Period,
    trackCount: g.track_count,
    createdAt: g.created_at,
    winner:
      g.winner_id && songMap[g.winner_id]
        ? {
            title: songMap[g.winner_id].title,
            artist: songMap[g.winner_id].artist,
            albumCover: songMap[g.winner_id].album_cover,
          }
        : null,
  }))

  return <UserPage username={username} games={summaries} />
}
