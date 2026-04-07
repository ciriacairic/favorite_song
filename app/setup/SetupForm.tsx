"use client"

import { useState } from "react"
import type { Track, Period, BracketSize } from "@/types"

const PERIODS: { value: Period; label: string }[] = [
  { value: "overall", label: "All Time" },
  { value: "12month", label: "Last 12 Months" },
  { value: "6month", label: "Last 6 Months" },
  { value: "3month", label: "Last 3 Months" },
  { value: "7day", label: "Last 7 Days" },
]

const BRACKET_SIZES: BracketSize[] = [8, 16, 32, 64]

export default function SetupForm({ username }: { username: string }) {
  const [period, setPeriod] = useState<Period>("overall")
  const [size, setSize] = useState<BracketSize>(32)
  const [tracks, setTracks] = useState<Track[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchTracks() {
    setLoading(true)
    setError(null)
    setTracks(null)
    try {
      const res = await fetch(
        `/api/tracks?username=${encodeURIComponent(username)}&period=${period}&limit=${size}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch tracks")
      setTracks(data.tracks)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl">
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
              onClick={() => setSize(s)}
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
      </div>

      {/* Fetch button */}
      <button
        onClick={fetchTracks}
        disabled={loading}
        className="self-start rounded-full bg-red-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Fetching…" : "Fetch my top tracks"}
      </button>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {/* Track list */}
      {tracks && (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-zinc-500 mb-2">
            {tracks.length} tracks fetched
          </p>
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
