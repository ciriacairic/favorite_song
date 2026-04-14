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
  const term = encodeURIComponent(`${artist} ${title}`)
  const url = `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=1`
  try {
    const data = (await httpsGetJson(url)) as {
      results?: Array<{ artworkUrl100?: string; collectionName?: string }>
    }
    const hit = data.results?.[0]
    const raw = hit?.artworkUrl100 ?? ""
    return {
      artwork: raw ? raw.replace("100x100bb", "600x600bb") : "",
      albumName: hit?.collectionName ?? "",
    }
  } catch {
    return { artwork: "", albumName: "" }
  }
}
