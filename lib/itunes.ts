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

/** Fetches album artwork from the iTunes Search API. Returns "" if not found. */
export async function getItunesArtwork(
  artist: string,
  title: string
): Promise<string> {
  const term = encodeURIComponent(`${artist} ${title}`)
  const url = `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=1`
  try {
    const data = (await httpsGetJson(url)) as {
      results?: Array<{ artworkUrl100?: string }>
    }
    const raw = data.results?.[0]?.artworkUrl100 ?? ""
    return raw ? raw.replace("100x100bb", "600x600bb") : ""
  } catch {
    return ""
  }
}
