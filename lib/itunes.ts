import { get as httpsGet } from "https"

function httpsGetJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    httpsGet(url, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
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

/** Searches iTunes by album name + artist and returns the best artwork URL. */
export async function getItunesAlbumArtwork(artist: string, album: string): Promise<string> {
  try {
    const results = await itunesSearch(`${album} ${artist}`)
    const best = pickBest(results, artist)
    const raw = best?.artworkUrl100 ?? ""
    return raw ? raw.replace("100x100bb", "600x600bb") : ""
  } catch {
    return ""
  }
}

/** Fetches album artwork and album name from the iTunes Search API. */
export async function getItunesArtwork(
  artist: string,
  title: string
): Promise<string> {
  const result = await getItunesInfo(artist, title)
  return result.artwork
}

type ItunesRawResult = {
  artworkUrl100?: string
  collectionName?: string
  artistName?: string
}

async function itunesSearch(term: string): Promise<ItunesRawResult[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=10`
  try {
    const data = (await httpsGetJson(url)) as { results?: ItunesRawResult[] }
    return data.results ?? []
  } catch {
    return []
  }
}

function pickBest(results: ItunesRawResult[], artist: string): ItunesRawResult | undefined {
  const normalizedArtist = artist.toLowerCase()
  const withArtwork = results.filter((r) => r.artworkUrl100)

  // Prefer: artist match + has artwork
  const best = withArtwork.find((r) => {
    const ra = (r.artistName ?? "").toLowerCase()
    return ra.includes(normalizedArtist) || normalizedArtist.includes(ra)
  })
  if (best) return best

  // Fallback: any result with artwork
  if (withArtwork.length > 0) return withArtwork[0]

  return results[0]
}

/** Fetches album artwork and album name from the iTunes Search API. */
export async function getItunesInfo(
  artist: string,
  title: string
): Promise<ItunesResult> {
  try {
    // Primary: search by title + artist
    let results = await itunesSearch(`${title} ${artist}`)

    // Fallback: search by title only (catches non-English artists, special chars, etc.)
    if (results.length === 0) {
      results = await itunesSearch(title)
    }

    if (results.length === 0) return { artwork: "", albumName: "" }

    const best = pickBest(results, artist)
    const raw = best?.artworkUrl100 ?? ""
    return {
      artwork: raw ? raw.replace("100x100bb", "600x600bb") : "",
      albumName: best?.collectionName ?? "",
    }
  } catch {
    return { artwork: "", albumName: "" }
  }
}
