import { NextRequest, NextResponse } from "next/server"
import { getTopTracks } from "@/lib/lastfm"
import type { Period } from "@/types"

const VALID_PERIODS: Period[] = ["overall", "12month", "6month", "3month", "7day"]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get("username")
  const period = (searchParams.get("period") ?? "overall") as Period
  const limit = parseInt(searchParams.get("limit") ?? "32", 10)

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 })
  }
  if (!VALID_PERIODS.includes(period)) {
    return NextResponse.json({ error: "invalid period" }, { status: 400 })
  }
  if (![8, 16, 32, 64].includes(limit)) {
    return NextResponse.json({ error: "invalid limit" }, { status: 400 })
  }

  try {
    const tracks = await getTopTracks(username, period, limit)
    return NextResponse.json({ tracks })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
