import { NextRequest, NextResponse } from "next/server"
import { getTopTracks } from "@/lib/lastfm"
import { getItunesInfo } from "@/lib/itunes"
import { getCachedSong, cacheSong } from "@/lib/songCache"
import { searchYouTubeVideoId } from "@/lib/youtube"
import type { Period, Track } from "@/types"

const VALID_PERIODS: Period[] = ["overall", "12month", "6month", "3month", "7day"]
const MAX_ENRICHED = 64

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get("username")
  const period = (searchParams.get("period") ?? "overall") as Period
  const mode = searchParams.get("mode") ?? "standard"

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 })
  }
  if (!VALID_PERIODS.includes(period)) {
    return NextResponse.json({ error: "invalid period" }, { status: 400 })
  }
  if (!["standard", "random"].includes(mode)) {
    return NextResponse.json({ error: "invalid mode" }, { status: 400 })
  }

  try {
    let rawTracks: Awaited<ReturnType<typeof getTopTracks>>

    if (mode === "random") {
      // Fetch top 200 (Last.fm errors on very high limits), shuffle, take MAX_ENRICHED for enrichment
      const all = await getTopTracks(username, period, 200)
      rawTracks = fisherYates(all).slice(0, MAX_ENRICHED)
    } else {
      // Standard: always fetch top MAX_ENRICHED tracks in play-count order
      rawTracks = await getTopTracks(username, period, MAX_ENRICHED)
    }

    // Check cache for all tracks in parallel
    const cached = await Promise.all(
      rawTracks.map((t) => getCachedSong(t.artist, t.title))
    )

    // For cache misses OR cached entries missing album, fetch iTunes + YouTube, then write to cache
    const enriched = await Promise.all(
      rawTracks.map(async (t, i) => {
        const hit = cached[i]
        if (hit !== null && hit.album) {
          return {
            songCacheId: hit.id,
            albumCover: hit.album_cover ?? "",
            youtubeVideoId: hit.youtube_video_id,
          }
        }
        const needsYoutube = hit === null || !hit.youtube_video_id
        const [itunesInfo, youtubeVideoId] = await Promise.all([
          getItunesInfo(t.artist, t.title),
          needsYoutube ? searchYouTubeVideoId(t.title, t.artist) : Promise.resolve(hit!.youtube_video_id),
        ])
        const { artwork: albumCover, albumName } = itunesInfo
        const songCacheId = await cacheSong(
          t.artist, t.title, youtubeVideoId, albumCover, albumName
        ).catch(() => null)
        return {
          songCacheId: songCacheId ?? hit?.id ?? undefined,
          albumCover: albumCover || hit?.album_cover || "",
          youtubeVideoId,
        }
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
