"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Track, Period, BracketSize } from "@/types"

const PERIODS: { value: Period; label: string }[] = [
  { value: "overall", label: "All Time" },
  { value: "12month", label: "Last 12 Months" },
  { value: "6month", label: "Last 6 Months" },
  { value: "3month", label: "Last 3 Months" },
  { value: "7day", label: "Last 7 Days" },
]

const BRACKET_SIZES: BracketSize[] = [8, 16, 32, 64]

type Mode = "standard" | "random"

export default function SetupForm({ username }: { username: string }) {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>("overall")
  const [size, setSize] = useState<BracketSize>(32)
  const [mode, setMode] = useState<Mode>("standard")
  // allTracks holds up to 64 fetched+enriched tracks
  const [allTracks, setAllTracks] = useState<Track[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Visible subset depends on bracket size
  const tracks = allTracks ? allTracks.slice(0, size) : null

  function startGame() {
    if (!tracks) return
    sessionStorage.setItem("bracket_tracks", JSON.stringify(tracks))
    sessionStorage.setItem("bracket_meta", JSON.stringify({ period, size, mode }))
    router.push("/game")
  }

  function handleModeChange(next: Mode) {
    setMode(next)
    setAllTracks(null)
    setError(null)
  }

  function handleSizeChange(next: BracketSize) {
    setSize(next)
    // No re-fetch needed — just re-slice from allTracks
  }

  async function fetchTracks() {
    setLoading(true)
    setError(null)
    setAllTracks(null)
    try {
      const res = await fetch(
        `/api/tracks?username=${encodeURIComponent(username)}&period=${period}&mode=${mode}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch tracks")
      setAllTracks(data.tracks)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const hasTracks = tracks !== null
  const notEnough = hasTracks && tracks.length < size

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl">
      {/* Mode toggle */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
          Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => handleModeChange("standard")}
            className={`flex flex-col items-start rounded-xl px-4 py-3 text-sm font-medium transition-colors border ${
              mode === "standard"
                ? "bg-zinc-800 border-zinc-500 text-white"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <span className="font-semibold">Top Hits</span>
            <span className="text-xs text-zinc-500 mt-0.5 font-normal">Your most played tracks</span>
          </button>
          <button
            onClick={() => handleModeChange("random")}
            className={`flex flex-col items-start rounded-xl px-4 py-3 text-sm font-medium transition-colors border ${
              mode === "random"
                ? "bg-zinc-800 border-zinc-500 text-white"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <span className="font-semibold">Random Picks</span>
            <span className="text-xs text-zinc-500 mt-0.5 font-normal">Random sample from your top 200</span>
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
          Time period
        </label>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                period === p.value
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bracket size selector */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
          Bracket size
        </label>
        <div className="flex gap-2">
          {BRACKET_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => handleSizeChange(s)}
              className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
                size === s
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {allTracks && !loading && (
          <p className="text-xs text-zinc-600">
            Showing {Math.min(size, allTracks.length)} of {allTracks.length} fetched tracks — change size without re-fetching
          </p>
        )}
      </div>

      {/* Fetch button */}
      <button
        onClick={fetchTracks}
        disabled={loading}
        className="self-start rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? "Fetching tracks & videos…"
          : allTracks
          ? "Re-fetch tracks"
          : "Fetch my top tracks"}
      </button>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm">Oops, something went wrong :/ — {error}</p>
      )}

      {/* Track list + start */}
      {hasTracks && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-zinc-500">{tracks.length} tracks ready</p>
              {notEnough && (
                <p className="text-sm text-amber-400">
                  Not enough tracks for a bracket of {size} — you need at least {size} scrobbles in this period.
                </p>
              )}
            </div>
            <button
              onClick={startGame}
              disabled={notEnough}
              className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start Game →
            </button>
          </div>
          {tracks.map((track, i) => (
            <div
              key={`${track.artist}-${track.title}`}
              className="flex items-center gap-4 rounded-lg px-3 py-2 hover:bg-zinc-900 transition-colors"
            >
              <span className="w-6 text-right text-sm text-zinc-600 shrink-0">
                {i + 1}
              </span>
              {track.albumCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={track.albumCover}
                  alt=""
                  className="h-10 w-10 rounded object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-zinc-800 shrink-0" />
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{track.title}</span>
                <span className="text-xs text-zinc-500 truncate">{track.artist}</span>
              </div>
              <span className="ml-auto text-xs text-zinc-600 shrink-0">
                {track.playCount.toLocaleString()} plays
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
