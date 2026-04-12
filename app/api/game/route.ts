import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createClient } from "@/lib/supabase/server"
import type { Period } from "@/types"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.lastfmUsername) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { period, trackCount } = await req.json() as { period: Period; trackCount: number }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("games")
    .insert({ username: session.lastfmUsername, period, track_count: trackCount })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ gameId: data.id })
}
