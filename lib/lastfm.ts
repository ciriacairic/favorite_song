import { createHash } from "crypto"
import { get as httpsGet } from "https"
import type { Track, Period } from "@/types"

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

/** Fetches album artwork from the iTunes Search API. Returns "" if not found. */
async function getItunesArtwork(artist: string, title: string): Promise<string> {
  const term = encodeURIComponent(`${artist} ${title}`)
  const url = `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=1`
  try {
    const data = await httpsGetJson(url) as { results?: Array<{ artworkUrl100?: string }> }
    const raw = data.results?.[0]?.artworkUrl100 ?? ""
    // Upgrade to 600x600 by replacing the size token in the URL
    return raw ? raw.replace("100x100bb", "600x600bb") : ""
  } catch {
    return ""
  }
}

/** Fetches the user's top tracks from Last.fm, with artwork from iTunes. */
export async function getTopTracks(
  username: string,
  period: Period = "overall",
  limit = 50
): Promise<Track[]> {
  const apiKey = process.env.LASTFM_API_KEY!
  const url = `${API_BASE}/?method=user.getTopTracks&user=${encodeURIComponent(username)}&api_key=${apiKey}&period=${period}&limit=${limit}&format=json`
  const data = await httpsGetJson(url) as Record<string, unknown>

  if ((data as Record<string, unknown>).error) {
    throw new Error(`Last.fm error ${data.error}: ${data.message}`)
  }

  const toptracks = (data.toptracks as { track?: unknown[] })?.track ?? []

  const tracks = toptracks.map((t: unknown) => {
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

  const artworks = await Promise.all(
    tracks.map((t) => getItunesArtwork(t.artist, t.title))
  )

  return tracks.map((t, i) => ({ ...t, albumCover: artworks[i] }))
}

/** Fetches basic user info from Last.fm. */
export async function getUserInfo(username: string) {
  const apiKey = process.env.LASTFM_API_KEY!
  const url = `${API_BASE}/?method=user.getInfo&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json`
  const data = await httpsGetJson(url) as Record<string, unknown>
  if (data.error) throw new Error(data.message as string)
  return data.user
}
