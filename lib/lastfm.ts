import { createHash } from "crypto"
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
  const res = await fetch(url)
  const data = await res.json()

  if (data.error) {
    throw new Error(`Last.fm auth error ${data.error}: ${data.message}`)
  }

  return { key: data.session.key, name: data.session.name }
}

/** Fetches the user's top tracks from Last.fm. */
export async function getTopTracks(
  username: string,
  period: Period = "overall",
  limit = 50
): Promise<Track[]> {
  const apiKey = process.env.LASTFM_API_KEY!
  const url = `${API_BASE}/?method=user.getTopTracks&user=${encodeURIComponent(username)}&api_key=${apiKey}&period=${period}&limit=${limit}&format=json`
  const res = await fetch(url, { next: { revalidate: 300 } })
  const data = await res.json()

  if (data.error) {
    throw new Error(`Last.fm error ${data.error}: ${data.message}`)
  }

  return (data.toptracks?.track ?? []).map(
    (t: {
      name: string
      artist: { name: string }
      image?: Array<{ "#text": string; size: string }>
      playcount: string
      url: string
    }) => ({
      title: t.name,
      artist: t.artist.name,
      albumCover:
        t.image?.find((img) => img.size === "large")?.["#text"] ?? "",
      playCount: parseInt(t.playcount, 10),
      lastfmUrl: t.url,
    })
  )
}

/** Fetches basic user info from Last.fm. */
export async function getUserInfo(username: string) {
  const apiKey = process.env.LASTFM_API_KEY!
  const url = `${API_BASE}/?method=user.getInfo&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json`
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(data.message)
  return data.user
}
