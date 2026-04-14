import { createClient } from "@/lib/supabase/server"

export interface CachedSong {
  id: string
  youtube_video_id: string | null
  album_cover: string | null
  album: string | null
}

export async function getCachedSong(
  artist: string,
  title: string
): Promise<CachedSong | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("song_cache")
    .select("id, youtube_video_id, album_cover, album")
    .eq("artist", artist)
    .eq("title", title)
    .single()
  return data ?? null
}

export async function cacheSong(
  artist: string,
  title: string,
  youtubeVideoId: string | null,
  albumCover?: string | null,
  album?: string | null
): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("song_cache")
    .upsert(
      { artist, title, youtube_video_id: youtubeVideoId, album_cover: albumCover, album: album ?? null },
      { onConflict: "artist,title" }
    )
    .select("id")
    .single()
  return data?.id ?? null
}
