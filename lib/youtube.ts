export async function searchYouTubeVideoId(
  title: string,
  artist: string
): Promise<string | null> {
  const q = encodeURIComponent(`${title} ${artist}`)
  const apiKey = process.env.YOUTUBE_API_KEY
  // videoEmbeddable=true filters out videos that cannot be embedded
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${q}&videoEmbeddable=true&key=${apiKey}`

  const res = await fetch(url)
  if (!res.ok) return null

  const data = await res.json()
  return (data.items?.[0]?.id?.videoId as string) ?? null
}
