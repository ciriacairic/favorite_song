import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export interface GlobalStats {
  totalGames: number
  totalPlayers: number
  mostWinningSong: { title: string; artist: string; albumCover: string; wins: number } | null
  mostWinningArtist: { artist: string; wins: number } | null
  mostWinningAlbum: { album: string; albumCover: string; wins: number } | null
  mostSeededSong: { title: string; artist: string; albumCover: string; appearances: number } | null
  mostSeededArtist: { artist: string; appearances: number } | null
  mostSeededAlbum: { album: string; albumCover: string; appearances: number } | null
}

export async function GET() {
  const supabase = await createClient()

  // Fetch all completed games with winner info
  const { data: completedGames, error: gamesError } = await supabase
    .from("games")
    .select("id, username, winner_id")
    .not("winner_id", "is", null)

  if (gamesError) {
    return NextResponse.json({ error: gamesError.message }, { status: 500 })
  }

  const totalGames = completedGames?.length ?? 0

  // Total unique players
  const uniquePlayers = new Set(completedGames?.map((g) => g.username) ?? [])
  const totalPlayers = uniquePlayers.size

  // Collect all winner IDs
  const winnerIds = (completedGames ?? []).map((g) => g.winner_id as string)

  let mostWinningSong: GlobalStats["mostWinningSong"] = null
  let mostWinningArtist: GlobalStats["mostWinningArtist"] = null
  let mostWinningAlbum: GlobalStats["mostWinningAlbum"] = null

  if (winnerIds.length > 0) {
    // Fetch song info for all winners
    const { data: winnerSongs } = await supabase
      .from("song_cache")
      .select("id, title, artist, album, album_cover")
      .in("id", winnerIds)

    const songMap: Record<string, { title: string; artist: string; album: string | null; album_cover: string | null }> = {}
    for (const s of winnerSongs ?? []) {
      songMap[s.id] = s
    }

    // Count wins per song
    const songWins: Record<string, number> = {}
    for (const id of winnerIds) {
      songWins[id] = (songWins[id] ?? 0) + 1
    }

    // Top song
    const topSongId = Object.entries(songWins).sort((a, b) => b[1] - a[1])[0]?.[0]
    if (topSongId && songMap[topSongId]) {
      const s = songMap[topSongId]
      mostWinningSong = {
        title: s.title,
        artist: s.artist,
        albumCover: s.album_cover ?? "",
        wins: songWins[topSongId],
      }
    }

    // Count wins per artist
    const artistWins: Record<string, number> = {}
    for (const id of winnerIds) {
      const artist = songMap[id]?.artist
      if (artist) artistWins[artist] = (artistWins[artist] ?? 0) + 1
    }
    const topArtistEntry = Object.entries(artistWins).sort((a, b) => b[1] - a[1])[0]
    if (topArtistEntry) {
      mostWinningArtist = { artist: topArtistEntry[0], wins: topArtistEntry[1] }
    }

    // Count wins per album (only if album name is stored)
    const albumWins: Record<string, { count: number; albumCover: string }> = {}
    for (const id of winnerIds) {
      const song = songMap[id]
      if (song?.album) {
        if (!albumWins[song.album]) {
          albumWins[song.album] = { count: 0, albumCover: song.album_cover ?? "" }
        }
        albumWins[song.album].count++
      }
    }
    const topAlbumEntry = Object.entries(albumWins).sort((a, b) => b[1].count - a[1].count)[0]
    if (topAlbumEntry) {
      mostWinningAlbum = {
        album: topAlbumEntry[0],
        albumCover: topAlbumEntry[1].albumCover,
        wins: topAlbumEntry[1].count,
      }
    }
  }

  // Most seeded song/artist/album (appeared in round 0)
  let mostSeededSong: GlobalStats["mostSeededSong"] = null
  let mostSeededArtist: GlobalStats["mostSeededArtist"] = null
  let mostSeededAlbum: GlobalStats["mostSeededAlbum"] = null

  const { data: seeds } = await supabase
    .from("matchup_results")
    .select("song_a_id, song_b_id")
    .eq("round", 0)

  if (seeds && seeds.length > 0) {
    const seedCounts: Record<string, number> = {}
    for (const s of seeds) {
      if (s.song_a_id) seedCounts[s.song_a_id] = (seedCounts[s.song_a_id] ?? 0) + 1
      if (s.song_b_id) seedCounts[s.song_b_id] = (seedCounts[s.song_b_id] ?? 0) + 1
    }

    const allSeedIds = Object.keys(seedCounts)

    const { data: seedSongs } = await supabase
      .from("song_cache")
      .select("id, title, artist, album, album_cover")
      .in("id", allSeedIds)

    const seedSongMap: Record<string, { title: string; artist: string; album: string | null; album_cover: string | null }> = {}
    for (const s of seedSongs ?? []) {
      seedSongMap[s.id] = s
    }

    // Top seeded song
    const topSeedId = Object.entries(seedCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    if (topSeedId && seedSongMap[topSeedId]) {
      const s = seedSongMap[topSeedId]
      mostSeededSong = {
        title: s.title,
        artist: s.artist,
        albumCover: s.album_cover ?? "",
        appearances: seedCounts[topSeedId],
      }
    }

    // Count appearances per artist
    const artistSeedCounts: Record<string, number> = {}
    for (const [id, count] of Object.entries(seedCounts)) {
      const artist = seedSongMap[id]?.artist
      if (artist) artistSeedCounts[artist] = (artistSeedCounts[artist] ?? 0) + count
    }
    const topArtistSeed = Object.entries(artistSeedCounts).sort((a, b) => b[1] - a[1])[0]
    if (topArtistSeed) {
      mostSeededArtist = { artist: topArtistSeed[0], appearances: topArtistSeed[1] }
    }

    // Count appearances per album
    const albumSeedCounts: Record<string, { count: number; albumCover: string }> = {}
    for (const [id, count] of Object.entries(seedCounts)) {
      const song = seedSongMap[id]
      if (song?.album) {
        if (!albumSeedCounts[song.album]) {
          albumSeedCounts[song.album] = { count: 0, albumCover: song.album_cover ?? "" }
        }
        albumSeedCounts[song.album].count += count
      }
    }
    const topAlbumSeed = Object.entries(albumSeedCounts).sort((a, b) => b[1].count - a[1].count)[0]
    if (topAlbumSeed) {
      mostSeededAlbum = {
        album: topAlbumSeed[0],
        albumCover: topAlbumSeed[1].albumCover,
        appearances: topAlbumSeed[1].count,
      }
    }
  }

  const stats: GlobalStats = {
    totalGames,
    totalPlayers,
    mostWinningSong,
    mostWinningArtist,
    mostWinningAlbum,
    mostSeededSong,
    mostSeededArtist,
    mostSeededAlbum,
  }

  return NextResponse.json(stats, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  })
}
