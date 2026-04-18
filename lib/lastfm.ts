import { createHash } from "crypto"
import { get as httpsGet } from "https"
import type { Period } from "@/types"

const API_BASE = "https://ws.audioscrobbler.com/2.0"

/** Creates an MD5 API signature for authenticated Last.fm API calls. */
export function lastfmSignature(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("")
  return createHash("md5")
    .update(sorted + process.env.LASTFM_API_SECRET!, "utf8")
    .digest("hex")
}

/**
 * Makes an HTTPS GET request using Node's https module, bypassing Next.js's
 * patched global fetch (which has connectivity issues in dev mode).
 */
function httpsGetJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    httpsGet(url, (res) => {
      let data = ""
      res.on("data", (chunk: string) => (data += chunk))
      res.on("end", () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    }).on("error", reject)
  })
}

/** Exchanges a Last.fm auth token for a permanent session key. */
export async function getLastfmSession(
  token: string
): Promise<{ key: string; name: string }> {
  const apiKey = process.env.LASTFM_API_KEY!
  const sig = lastfmSignature({
    api_key: apiKey,
    method: "auth.getSession",
    token,
  })

  const url = `${API_BASE}/?method=auth.getSession&api_key=${apiKey}&token=${token}&api_sig=${sig}&format=json`
  const data = await httpsGetJson(url) as Record<string, unknown>

  if (data.error) {
    throw new Error(`Last.fm auth error ${data.error}: ${data.message}`)
  }

  const session = data.session as { key: string; name: string }
  return { key: session.key, name: session.name }
}

/** Fetches the user's top tracks from Last.fm. */
export async function getTopTracks(
  username: string,
  period: Period = "overall",
  limit = 50
): Promise<Array<{ title: string; artist: string; playCount: number; lastfmUrl: string }>> {
  const apiKey = process.env.LASTFM_API_KEY!
  const url = `${API_BASE}/?method=user.getTopTracks&user=${encodeURIComponent(username)}&api_key=${apiKey}&period=${period}&limit=${limit}&format=json`
  const data = await httpsGetJson(url) as Record<string, unknown>

  if (data.error) {
    throw new Error(`Last.fm error ${data.error}: ${data.message}`)
  }

  const toptracks = (data.toptracks as { track?: unknown[] })?.track ?? []

  return toptracks.map((t: unknown) => {
    const track = t as {
      name: string
      artist: { name: string }
      playcount: string
      url: string
    }
    return {
      title: track.name,
      artist: track.artist.name,
      playCount: parseInt(track.playcount, 10),
      lastfmUrl: track.url,
    }
  })
}

/** Fetches basic user info from Last.fm. */
export async function getUserInfo(username: string) {
  const apiKey = process.env.LASTFM_API_KEY!
  const url = `${API_BASE}/?method=user.getInfo&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json`
  const data = await httpsGetJson(url) as Record<string, unknown>
  if (data.error) throw new Error(data.message as string)
  return data.user
}

/** Fetches top tracks for a Last.fm tag (genre). */
export async function getTagTopTracks(
  tag: string,
  limit = 64
): Promise<Array<{ title: string; artist: string; playCount: number; lastfmUrl: string }>> {
  const apiKey = process.env.LASTFM_API_KEY!
  const url = `${API_BASE}/?method=tag.getTopTracks&tag=${encodeURIComponent(tag)}&api_key=${apiKey}&limit=${limit}&format=json`
  const data = await httpsGetJson(url) as Record<string, unknown>
  if (data.error) throw new Error(`Last.fm error ${data.error}: ${data.message}`)
  const tracks = (data.tracks as { track?: unknown[] })?.track ?? []
  return tracks.map((t: unknown) => {
    const track = t as { name: string; artist: { name: string }; url: string }
    return { title: track.name, artist: track.artist.name, playCount: 0, lastfmUrl: track.url }
  })
}

/** Fetches the worldwide top tracks chart. */
export async function getChartTopTracks(
  limit = 64
): Promise<Array<{ title: string; artist: string; playCount: number; lastfmUrl: string }>> {
  const apiKey = process.env.LASTFM_API_KEY!
  const url = `${API_BASE}/?method=chart.getTopTracks&api_key=${apiKey}&limit=${limit}&format=json`
  const data = await httpsGetJson(url) as Record<string, unknown>
  if (data.error) throw new Error(`Last.fm error ${data.error}: ${data.message}`)
  const tracks = (data.tracks as { track?: unknown[] })?.track ?? []
  return tracks.map((t: unknown) => {
    const track = t as { name: string; artist: { name: string }; url: string; playcount: string }
    return { title: track.name, artist: track.artist.name, playCount: parseInt(track.playcount ?? "0", 10), lastfmUrl: track.url }
  })
}

/** Fetches top tracks for a specific country. */
export async function getGeoTopTracks(
  country: string,
  limit = 64
): Promise<Array<{ title: string; artist: string; playCount: number; lastfmUrl: string }>> {
  const apiKey = process.env.LASTFM_API_KEY!
  const url = `${API_BASE}/?method=geo.getTopTracks&country=${encodeURIComponent(country)}&api_key=${apiKey}&limit=${limit}&format=json`
  const data = await httpsGetJson(url) as Record<string, unknown>
  if (data.error) throw new Error(`Last.fm error ${data.error}: ${data.message}`)
  const tracks = (data.tracks as { track?: unknown[] })?.track ?? []
  return tracks.map((t: unknown) => {
    const track = t as { name: string; artist: { name: string }; url: string; listeners: string }
    return { title: track.name, artist: track.artist.name, playCount: parseInt(track.listeners ?? "0", 10), lastfmUrl: track.url }
  })
}

/** Fetches top tracks for an artist. */
export async function getArtistTopTracks(
  artist: string,
  limit = 64
): Promise<Array<{ title: string; artist: string; playCount: number; lastfmUrl: string }>> {
  const apiKey = process.env.LASTFM_API_KEY!
  const url = `${API_BASE}/?method=artist.getTopTracks&artist=${encodeURIComponent(artist)}&api_key=${apiKey}&limit=${limit}&autocorrect=1&format=json`
  const data = await httpsGetJson(url) as Record<string, unknown>
  if (data.error) throw new Error(`Last.fm error ${data.error}: ${data.message}`)
  const tracks = (data.toptracks as { track?: unknown[] })?.track ?? []
  return tracks.map((t: unknown) => {
    const track = t as { name: string; artist: { name: string }; url: string; playcount: string }
    return { title: track.name, artist: track.artist.name, playCount: parseInt(track.playcount ?? "0", 10), lastfmUrl: track.url }
  })
}

/** Fetches the album name for a track via track.getInfo. */
export async function getTrackAlbum(artist: string, title: string): Promise<string | null> {
  const apiKey = process.env.LASTFM_API_KEY!
  const url = `${API_BASE}/?method=track.getInfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(title)}&api_key=${apiKey}&autocorrect=1&format=json`
  try {
    const data = await httpsGetJson(url) as Record<string, unknown>
    if (data.error) return null
    const track = data.track as { album?: { title: string } } | undefined
    return track?.album?.title ?? null
  } catch {
    return null
  }
}

/** Searches for artists by name. */
export async function searchArtists(
  query: string,
  limit = 8
): Promise<Array<{ name: string; listeners: string }>> {
  const apiKey = process.env.LASTFM_API_KEY!
  const url = `${API_BASE}/?method=artist.search&artist=${encodeURIComponent(query)}&api_key=${apiKey}&limit=${limit}&format=json`
  const data = await httpsGetJson(url) as Record<string, unknown>
  if (data.error) throw new Error(`Last.fm error ${data.error}: ${data.message}`)
  const artists = (data.results as { artistmatches?: { artist?: unknown[] } })?.artistmatches?.artist ?? []
  return artists.map((a: unknown) => {
    const artist = a as { name: string; listeners: string }
    return { name: artist.name, listeners: artist.listeners }
  })
}
