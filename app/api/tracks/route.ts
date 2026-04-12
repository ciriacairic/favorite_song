import { NextRequest, NextResponse } from "next/server"
import { getTopTracks } from "@/lib/lastfm"
import { getItunesArtwork } from "@/lib/itunes"
import { getCachedSong, cacheSong } from "@/lib/songCache"
import { searchYouTubeVideoId } from "@/lib/youtube"
import type { Period, Track } from "@/types"

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
    const rawTracks = await getTopTracks(username, period, limit)

    // Check cache for all tracks in parallel
    const cached = await Promise.all(
      rawTracks.map((t) => getCachedSong(t.artist, t.title))
    )

    // For cache misses, fetch iTunes + YouTube in parallel, then write to cache
    const enriched = await Promise.all(
      rawTracks.map(async (t, i) => {
        if (cached[i] !== null) {
          return {
            songCacheId: cached[i]!.id,
            albumCover: cached[i]!.album_cover ?? "",
            youtubeVideoId: cached[i]!.youtube_video_id,
          }
        }
        const [albumCover, youtubeVideoId] = await Promise.all([
          getItunesArtwork(t.artist, t.title),
          searchYouTubeVideoId(t.title, t.artist),
        ])
        const songCacheId = await cacheSong(t.artist, t.title, youtubeVideoId, albumCover).catch(() => null)
        return { songCacheId: songCacheId ?? undefined, albumCover, youtubeVideoId }
      })
    )

    const tracks: Track[] = rawTracks.map((t, i) => ({
      ...t,
      songCacheId: enriched[i].songCacheId,
      albumCover: enriched[i].albumCover,
      youtubeVideoId: enriched[i].youtubeVideoId,
    }))

    return NextResponse.json({ tracks })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
