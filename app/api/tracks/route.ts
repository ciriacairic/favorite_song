import { NextRequest, NextResponse } from "next/server"
import { getTopTracks, getTagTopTracks, getChartTopTracks, getGeoTopTracks, getArtistTopTracks, getTrackAlbum } from "@/lib/lastfm"
import { getItunesInfo, getItunesAlbumArtwork } from "@/lib/itunes"
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

type RawTrack = { title: string; artist: string; playCount: number; lastfmUrl: string }

async function withConcurrency<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

async function enrichTracks(rawTracks: RawTrack[]): Promise<Track[]> {
  const cached = await Promise.all(rawTracks.map((t) => getCachedSong(t.artist, t.title)))

  const enriched = await withConcurrency(
    rawTracks,
    4,
    async (t, i) => {
      const hit = cached[i]

      // Full cache hit — have both cover and video, nothing to fetch
      if (hit?.album_cover && hit?.youtube_video_id) {
        return {
          songCacheId: hit.id,
          albumCover: hit.album_cover,
          youtubeVideoId: hit.youtube_video_id,
        }
      }

      const needsYoutube = !hit?.youtube_video_id
      const needsCover = !hit?.album_cover

      const [itunesInfo, youtubeVideoId] = await Promise.all([
        needsCover
          ? getItunesInfo(t.artist, t.title)
          : Promise.resolve({ artwork: hit!.album_cover!, albumName: hit!.album ?? "" }),
        needsYoutube
          ? searchYouTubeVideoId(t.title, t.artist)
          : Promise.resolve(hit!.youtube_video_id),
      ])

      let { artwork: albumCover, albumName } = itunesInfo

      // Fallback: get album name from Last.fm and search iTunes by album
      if (needsCover && !albumCover) {
        const lastfmAlbum = await getTrackAlbum(t.artist, t.title).catch(() => null)
        if (lastfmAlbum) {
          albumCover = await getItunesAlbumArtwork(t.artist, lastfmAlbum).catch(() => "")
          if (!albumName) albumName = lastfmAlbum
        }
      }

      // Never overwrite existing good data with empty
      const coverToSave = albumCover || hit?.album_cover || ""
      const albumToSave = albumName || hit?.album || null

      const songCacheId = await cacheSong(t.artist, t.title, youtubeVideoId, coverToSave, albumToSave).catch(() => null)
      return {
        songCacheId: songCacheId ?? hit?.id ?? undefined,
        albumCover: coverToSave,
        youtubeVideoId,
      }
    }
  )

  return rawTracks.map((t, i) => ({
    ...t,
    songCacheId: enriched[i].songCacheId,
    albumCover: enriched[i].albumCover,
    youtubeVideoId: enriched[i].youtubeVideoId,
  }))
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const gameType = searchParams.get("gameType") ?? "personal"

  try {
    let rawTracks: RawTrack[]

    if (gameType === "personal") {
      const username = searchParams.get("username")
      const period = (searchParams.get("period") ?? "overall") as Period
      const mode = searchParams.get("mode") ?? "standard"

      if (!username) return NextResponse.json({ error: "username required" }, { status: 400 })
      if (!VALID_PERIODS.includes(period)) return NextResponse.json({ error: "invalid period" }, { status: 400 })
      if (!["standard", "random"].includes(mode)) return NextResponse.json({ error: "invalid mode" }, { status: 400 })

      if (mode === "random") {
        const all = await getTopTracks(username, period, 200)
        rawTracks = fisherYates(all).slice(0, MAX_ENRICHED)
      } else {
        rawTracks = await getTopTracks(username, period, MAX_ENRICHED)
      }
    } else if (gameType === "genre") {
      const tag = searchParams.get("tag")
      if (!tag) return NextResponse.json({ error: "tag required" }, { status: 400 })
      const all = await getTagTopTracks(tag, 200)
      rawTracks = fisherYates(all).slice(0, MAX_ENRICHED)
    } else if (gameType === "country") {
      const country = searchParams.get("country")
      if (!country) return NextResponse.json({ error: "country required" }, { status: 400 })
      rawTracks = country === "global"
        ? await getChartTopTracks(MAX_ENRICHED)
        : await getGeoTopTracks(country, MAX_ENRICHED)
    } else if (gameType === "artist") {
      const artist = searchParams.get("artist")
      if (!artist) return NextResponse.json({ error: "artist required" }, { status: 400 })
      rawTracks = await getArtistTopTracks(artist, MAX_ENRICHED)
    } else {
      return NextResponse.json({ error: "invalid gameType" }, { status: 400 })
    }

    const tracks = await enrichTracks(rawTracks)
    return NextResponse.json({ tracks })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
