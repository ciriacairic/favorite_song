"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Track } from "@/types"
import {
  buildBracket,
  pickWinner,
  getCurrentMatchup,
  getRoundLabel,
  getProgress,
  type BracketState,
} from "@/lib/bracket"

export default function GameBoard() {
  const router = useRouter()
  const [bracket, setBracket] = useState<BracketState | null>(null)
  const [picking, setPicking] = useState<"a" | "b" | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem("bracket_tracks")
    if (!raw) {
      router.replace("/setup")
      return
    }
    try {
      const tracks: Track[] = JSON.parse(raw)
      setBracket(buildBracket(tracks))
    } catch {
      router.replace("/setup")
    }
  }, [router])

  const choose = useCallback(
    (side: "a" | "b") => {
      if (picking || !bracket) return
      setPicking(side)
      setTimeout(() => {
        setBracket((prev) => {
          if (!prev) return prev
          const matchup = getCurrentMatchup(prev)
          if (!matchup) return prev
          const winner = side === "a" ? matchup[0] : matchup[1]
          return pickWinner(prev, winner)
        })
        setPicking(null)
      }, 300)
    },
    [picking, bracket]
  )

  if (!bracket) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        Loading…
      </div>
    )
  }

  if (bracket.completed && bracket.winner) {
    return (
      <WinnerScreen
        winner={bracket.winner}
        onPlayAgain={() => router.push("/setup")}
      />
    )
  }

  const matchup = getCurrentMatchup(bracket)
  if (!matchup) return null

  const [trackA, trackB] = matchup
  const totalTracks = bracket.rounds[0].length
  const label = getRoundLabel(totalTracks, bracket.currentRound)
  const progress = getProgress(bracket)

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-6 py-12">
      {/* Round info */}
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-xs font-medium tracking-widest uppercase text-zinc-500">
          {label}
        </p>
        <p className="text-sm text-zinc-600">
          Match {progress.current} of {progress.total}
        </p>
      </div>

      <p className="text-zinc-400 text-sm">Which song do you like more?</p>

      {/* Matchup cards */}
      <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full max-w-3xl">
        <TrackCard
          track={trackA}
          onClick={() => choose("a")}
          selected={picking === "a"}
          dimmed={picking === "b"}
        />
        <div className="flex items-center justify-center text-zinc-600 font-bold text-lg shrink-0 py-2 sm:py-0">
          VS
        </div>
        <TrackCard
          track={trackB}
          onClick={() => choose("b")}
          selected={picking === "b"}
          dimmed={picking === "a"}
        />
      </div>
    </div>
  )
}

function TrackCard({
  track,
  onClick,
  selected,
  dimmed,
}: {
  track: Track
  onClick: () => void
  selected: boolean
  dimmed: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-4 rounded-2xl border p-6 flex-1 transition-all duration-200 cursor-pointer
        ${selected ? "border-white bg-zinc-800 scale-[1.03]" : ""}
        ${dimmed ? "opacity-25 scale-95" : ""}
        ${!selected && !dimmed ? "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900" : ""}
      `}
    >
      {track.albumCover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={track.albumCover}
          alt=""
          className="w-40 h-40 rounded-xl object-cover"
        />
      ) : (
        <div className="w-40 h-40 rounded-xl bg-zinc-800" />
      )}
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-semibold text-base leading-snug">{track.title}</span>
        <span className="text-sm text-zinc-400">{track.artist}</span>
        <span className="text-xs text-zinc-600 mt-1">
          {track.playCount.toLocaleString()} plays
        </span>
      </div>
    </button>
  )
}

function WinnerScreen({
  winner,
  onPlayAgain,
}: {
  winner: Track
  onPlayAgain: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <p className="text-xs font-medium tracking-widest uppercase text-zinc-500">
        Your Favorite Song
      </p>
      <div className="flex flex-col items-center gap-5">
        {winner.albumCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={winner.albumCover}
            alt=""
            className="w-52 h-52 rounded-2xl object-cover shadow-2xl"
          />
        ) : (
          <div className="w-52 h-52 rounded-2xl bg-zinc-800" />
        )}
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold">{winner.title}</h2>
          <p className="text-zinc-400 text-lg">{winner.artist}</p>
        </div>
      </div>
      <button
        onClick={onPlayAgain}
        className="rounded-full bg-zinc-800 px-8 py-3 text-sm font-semibold hover:bg-zinc-700 transition-colors"
      >
        Play Again
      </button>
    </div>
  )
}
