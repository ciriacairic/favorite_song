import { NextRequest, NextResponse } from "next/server"
import { getItunesInfo, getItunesAlbumArtwork } from "@/lib/itunes"
import { getTrackAlbum } from "@/lib/lastfm"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get("title") ?? "No Surprises"
  const artist = searchParams.get("artist") ?? "Radiohead"

  const itunesResult = await getItunesInfo(artist, title)
  const lastfmAlbum = await getTrackAlbum(artist, title).catch(() => null)
  const albumArtwork = lastfmAlbum
    ? await getItunesAlbumArtwork(artist, lastfmAlbum).catch(() => "")
    : null

  return NextResponse.json({
    title,
    artist,
    itunes_primary: itunesResult,
    lastfm_album: lastfmAlbum,
    itunes_album_artwork: albumArtwork,
  })
}
