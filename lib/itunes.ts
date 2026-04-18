import { get as httpsGet } from "https"

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

export interface ItunesResult {
  artwork: string
  albumName: string
}

/** Fetches album artwork and album name from the iTunes Search API. */
export async function getItunesArtwork(
  artist: string,
  title: string
): Promise<string> {
  const result = await getItunesInfo(artist, title)
  return result.artwork
}

/** Fetches album artwork and album name from the iTunes Search API. */
export async function getItunesInfo(
  artist: string,
  title: string
): Promise<ItunesResult> {
  const term = encodeURIComponent(`${title} ${artist}`)
  // Fetch up to 5 results to find the best artist match
  const url = `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=5`
  try {
    const data = (await httpsGetJson(url)) as {
      results?: Array<{
        artworkUrl100?: string
        collectionName?: string
        artistName?: string
      }>
    }
    const results = data.results ?? []
    if (results.length === 0) return { artwork: "", albumName: "" }

    const normalizedArtist = artist.toLowerCase()
    // Pick the result whose artistName best matches the expected artist
    const best =
      results.find((r) => {
        const ra = (r.artistName ?? "").toLowerCase()
        return ra.includes(normalizedArtist) || normalizedArtist.includes(ra)
      }) ?? results[0]

    const raw = best?.artworkUrl100 ?? ""
    return {
      artwork: raw ? raw.replace("100x100bb", "600x600bb") : "",
      albumName: best?.collectionName ?? "",
    }
  } catch {
    return { artwork: "", albumName: "" }
  }
}
