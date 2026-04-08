import { NextRequest, NextResponse } from "next/server"
import { getTopTracks } from "@/lib/lastfm"
import { getCachedSong, cacheSong } from "@/lib/songCache"
import { searchYouTubeVideoId } from "@/lib/youtube"
import type { Period } from "@/types"

const VALID_PERIODS: Period[] = ["overall", "12month", "6month", "3month", "7day"]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get("username")
  const period = (searchParams.get("period") ?? "overall") as Period
  const limit = parseInt(searchParams.get("limit") ?? "32", 10)

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 })
  }
  if (!VALID_PERIODS.includes(period)) {
    return NextResponse.json({ error: "invalid period" }, { status: 400 })
  }
  if (![8, 16, 32, 64].includes(limit)) {
    return NextResponse.json({ error: "invalid limit" }, { status: 400 })
  }

  try {
    const tracks = await getTopTracks(username, period, limit)

    // Check cache for all tracks in parallel
    const cached = await Promise.all(
      tracks.map((t) => getCachedSong(t.artist, t.title))
    )

    // For cache misses, fetch from YouTube and write to cache
    const videoIds = await Promise.all(
      tracks.map(async (t, i) => {
        if (cached[i] !== null) {
          return cached[i]!.youtube_video_id
        }
        const videoId = await searchYouTubeVideoId(t.title, t.artist)
        await cacheSong(t.artist, t.title, videoId, t.albumCover).catch(console.error)
        return videoId
      })
    )

    const enrichedTracks = tracks.map((t, i) => ({
      ...t,
      youtubeVideoId: videoIds[i] ?? null,
    }))

    return NextResponse.json({ tracks: enrichedTracks })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
