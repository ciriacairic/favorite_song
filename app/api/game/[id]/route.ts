import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Track } from "@/types"
import type { BracketState } from "@/lib/bracket"

function toTrack(row: {
  id: string
  title: string
  artist: string
  album_cover: string | null
  youtube_video_id: string | null
}): Track {
  return {
    title: row.title,
    artist: row.artist,
    albumCover: row.album_cover ?? "",
    playCount: 0,
    lastfmUrl: "",
    youtubeVideoId: row.youtube_video_id,
    songCacheId: row.id,
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params
  const supabase = await createClient()

  // Fetch game metadata
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, period, track_count, created_at, winner_id")
    .eq("id", gameId)
    .single()

  if (gameError || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 })
  }

  // Fetch all matchups for this game
  const { data: matchups, error: matchupError } = await supabase
    .from("matchup_results")
    .select("round, position, song_a_id, song_b_id, winner_id")
    .eq("game_id", gameId)
    .order("round", { ascending: true })
    .order("position", { ascending: true })

  if (matchupError || !matchups?.length) {
    return NextResponse.json({ error: "No matchup data" }, { status: 404 })
  }

  // Collect all unique song IDs
  const songIds = new Set<string>()
  for (const m of matchups) {
    if (m.song_a_id) songIds.add(m.song_a_id)
    if (m.song_b_id) songIds.add(m.song_b_id)
    if (m.winner_id) songIds.add(m.winner_id)
  }

  // Fetch all songs in one query
  const { data: songs } = await supabase
    .from("song_cache")
    .select("id, title, artist, album_cover, youtube_video_id")
    .in("id", [...songIds])

  type SongRow = { id: string; title: string; artist: string; album_cover: string | null; youtube_video_id: string | null }
  const rawSongMap: Record<string, SongRow> = {}
  songs?.forEach((s) => { rawSongMap[s.id] = s as SongRow })

  // Build a Track cache so the same song ID → same object reference (needed for BracketTree winner check)
  const trackCache = new Map<string, Track>()
  function getTrack(id: string): Track {
    if (!trackCache.has(id)) {
      const s = rawSongMap[id]
      if (!s) {
        // Placeholder for missing song data
        trackCache.set(id, { title: "Unknown", artist: "", albumCover: "", playCount: 0, lastfmUrl: "", youtubeVideoId: null, songCacheId: id })
      } else {
        trackCache.set(id, toTrack(s))
      }
    }
    return trackCache.get(id)!
  }

  // Group matchups by round
  const byRound: Record<number, typeof matchups> = {}
  for (const m of matchups) {
    if (!byRound[m.round]) byRound[m.round] = []
    byRound[m.round].push(m)
  }

  const maxRound = Math.max(...Object.keys(byRound).map(Number))

  // Reconstruct rounds array
  // rounds[0] = all seeds: for each matchup at round 0, interleave [songA, songB]
  // rounds[r+1] = winners from round r in position order
  const rounds: Track[][] = []

  const r0 = byRound[0] ?? []
  rounds[0] = r0.flatMap((m) => {
    const a = getTrack(m.song_a_id)
    const b = m.song_b_id ? getTrack(m.song_b_id) : null
    return b ? [a, b] : [a]
  })

  for (let r = 0; r <= maxRound; r++) {
    const group = byRound[r] ?? []
    const nextRound = group.map((m) => getTrack(m.winner_id))
    rounds[r + 1] = nextRound
  }

  // The champion is the winner of the final matchup
  const finalGroup = byRound[maxRound] ?? []
  const champion = finalGroup[0] ? getTrack(finalGroup[0].winner_id) : null

  const bracket: BracketState = {
    rounds,
    currentRound: maxRound + 1,
    currentPosition: 0,
    completed: true,
    winner: champion,
  }

  return NextResponse.json({
    game: {
      id: game.id,
      period: game.period,
      trackCount: game.track_count,
      createdAt: game.created_at,
    },
    bracket,
  })
}
