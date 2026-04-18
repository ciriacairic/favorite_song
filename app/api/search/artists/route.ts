import { NextRequest, NextResponse } from "next/server"
import { searchArtists } from "@/lib/lastfm"

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q")
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ artists: [] })
  }
  try {
    const artists = await searchArtists(q.trim())
    return NextResponse.json({ artists })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
