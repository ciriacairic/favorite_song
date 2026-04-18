"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import BracketTree from "@/components/BracketTree"

interface PendingMatchup {
  round: number
  position: number
  trackA: Track
  trackB: Track
  winner: Track
}

async function createGame(period: string, trackCount: number): Promise<string | null> {
  try {
    const res = await fetch("/api/game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, trackCount }),
    })
    const data = await res.json()
    return data.gameId ?? null
  } catch {
    return null
  }
}

function postMatchup(
  gameId: string,
  round: number,
  position: number,
  trackA: Track,
  trackB: Track,
  winner: Track
) {
  if (!trackA.songCacheId || !trackB.songCacheId || !winner.songCacheId) return
  fetch(`/api/game/${gameId}/matchup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      round,
      position,
      songAId: trackA.songCacheId,
      songBId: trackB.songCacheId,
      winnerId: winner.songCacheId,
    }),
  }).catch(console.error)
}

function finalizeGame(gameId: string, winner: Track) {
  if (!winner.songCacheId) return
  fetch(`/api/game/${gameId}/winner`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ winnerId: winner.songCacheId }),
  }).catch(console.error)
}

export default function GameBoard() {
  const router = useRouter()
  const [bracket, setBracket] = useState<BracketState | null>(null)
  const [picking, setPicking] = useState<"a" | "b" | null>(null)
  const [expandedCover, setExpandedCover] = useState<string | null>(null)
  const gameIdRef = useRef<string | null>(null)
  const finalizedRef = useRef(false)
  const gameCreatingRef = useRef(false)
  const pendingMatchupsRef = useRef<PendingMatchup[]>([])

  useEffect(() => {
    const raw = sessionStorage.getItem("bracket_tracks")
    const meta = sessionStorage.getItem("bracket_meta")
    if (!raw) {
      router.replace("/setup")
      return
    }
    try {
      const tracks: Track[] = JSON.parse(raw)
      const { period, size } = meta ? JSON.parse(meta) : { period: "overall", size: tracks.length }
      setBracket(buildBracket(tracks))
      if (!gameCreatingRef.current) {
        gameCreatingRef.current = true
        createGame(period, size).then((id) => {
          if (!id) return
          gameIdRef.current = id
          // Flush any matchups that were picked before the game was created
          for (const m of pendingMatchupsRef.current) {
            postMatchup(id, m.round, m.position, m.trackA, m.trackB, m.winner)
          }
          pendingMatchupsRef.current = []
        })
      }
    } catch {
      router.replace("/setup")
    }
  }, [router])

  // Finalize game when bracket completes
  useEffect(() => {
    if (!bracket?.completed || !bracket.winner || finalizedRef.current) return
    finalizedRef.current = true
    if (gameIdRef.current) {
      finalizeGame(gameIdRef.current, bracket.winner)
    }
  }, [bracket?.completed, bracket?.winner])

  const choose = useCallback(
    (side: "a" | "b") => {
      if (picking || !bracket) return
      const matchup = getCurrentMatchup(bracket)
      if (!matchup) return
      const [trackA, trackB] = matchup
      const winner = side === "a" ? trackA : trackB
      setPicking(side)
      if (gameIdRef.current) {
        postMatchup(gameIdRef.current, bracket.currentRound, bracket.currentPosition, trackA, trackB, winner)
      } else {
        pendingMatchupsRef.current.push({
          round: bracket.currentRound,
          position: bracket.currentPosition,
          trackA,
          trackB,
          winner,
        })
      }
      setTimeout(() => {
        setBracket((prev) => {
          if (!prev) return prev
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
        bracket={bracket}
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
    <div className="flex flex-1 flex-col items-center gap-3 sm:gap-10 px-4 sm:px-6 py-3 sm:py-8">
      {/* Round info — compact single line on mobile */}
      <div className="flex items-center gap-2">
        <p className="text-xs sm:text-base font-semibold tracking-widest uppercase text-zinc-300">
          {label}
        </p>
        <span className="text-zinc-700">·</span>
        <p className="text-xs sm:text-base text-zinc-500">
          {progress.current}/{progress.total}
        </p>
      </div>

      {/* Matchup */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-10 w-full max-w-5xl">
        <TrackCard
          track={trackA}
          side="left"
          onPick={() => choose("a")}
          onExpandCover={setExpandedCover}
          selected={picking === "a"}
          dimmed={picking === "b"}
        />

        <div className="flex items-center justify-center text-zinc-700 font-bold text-sm shrink-0">
          VS
        </div>

        <TrackCard
          track={trackB}
          side="right"
          onPick={() => choose("b")}
          onExpandCover={setExpandedCover}
          selected={picking === "b"}
          dimmed={picking === "a"}
        />
      </div>

      {/* Cover lightbox */}
      {expandedCover && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setExpandedCover(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expandedCover}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function TrackCard({
  track,
  side,
  onPick,
  onExpandCover,
  selected,
  dimmed,
}: {
  track: Track
  side: "left" | "right"
  onPick: () => void
  onExpandCover: (url: string) => void
  selected: boolean
  dimmed: boolean
}) {
  const isRight = side === "right"
  const borderClass = selected
    ? "border-white scale-[1.02]"
    : dimmed
    ? "opacity-20 scale-[0.98]"
    : "border-zinc-800"

  const chooseBtn = (extraClass = "") => (
    <button
      onClick={onPick}
      className={`w-full py-3 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700
        flex items-center justify-center gap-2 transition-colors group ${extraClass}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        className="text-zinc-500 group-hover:text-white transition-colors"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span className="text-xs font-medium text-zinc-500 group-hover:text-white transition-colors">
        Choose
      </span>
    </button>
  )

  return (
    <div
      className={`flex flex-col rounded-2xl border overflow-hidden flex-1 transition-all duration-200 ${borderClass}`}
    >
      {/* ── MOBILE ── */}

      {/* Card B: choose button on top */}
      {isRight && <div className="sm:hidden">{chooseBtn()}</div>}

      {/* Video + info overlay */}
      <div className="sm:hidden relative">
        {track.youtubeVideoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${track.youtubeVideoId}?rel=0&modestbranding=1`}
            className="w-full aspect-video block"
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full aspect-video bg-zinc-900 flex items-center justify-center">
            <span className="text-zinc-600 text-sm">No video</span>
          </div>
        )}

        {/* Gradient overlay with cover + info */}
        <div
          className={`absolute inset-x-0 pointer-events-none px-3 py-3 ${isRight ? "bottom-0" : "top-0"}`}
          style={{
            background: isRight
              ? "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.80) 65%, transparent 100%)"
              : "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.80) 65%, transparent 100%)",
          }}
        >
          <div className={`flex items-center gap-3 pointer-events-auto ${isRight ? "flex-row-reverse" : ""}`}>
            {track.albumCover ? (
              <button
                onClick={(e) => { e.stopPropagation(); onExpandCover(track.albumCover) }}
                className="shrink-0 rounded-lg overflow-hidden focus:outline-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={track.albumCover}
                  alt=""
                  className="w-12 h-12 object-cover"
                />
              </button>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-zinc-800 shrink-0" />
            )}
            <div
              role="button" tabIndex={0}
              onClick={onPick}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onPick() }}
              className={`flex flex-col gap-0.5 min-w-0 flex-1 cursor-pointer ${isRight ? "items-end text-right" : ""}`}
            >
              <span className="text-sm font-semibold leading-tight line-clamp-1 drop-shadow">
                {track.title}
              </span>
              <span className="text-xs text-zinc-400 truncate w-full drop-shadow">
                {track.artist}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card A: choose button at bottom */}
      {!isRight && <div className="sm:hidden">{chooseBtn()}</div>}

      {/* ── DESKTOP ── */}

      {/* Info row */}
      <div
        role="button" tabIndex={0}
        onClick={onPick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onPick() }}
        className={`hidden sm:flex items-center gap-5 px-5 py-5 cursor-pointer
          hover:bg-zinc-800/60 active:bg-zinc-800 transition-colors
          ${isRight ? "flex-row-reverse" : ""}`}
      >
        {track.albumCover ? (
          <button
            onClick={(e) => { e.stopPropagation(); onExpandCover(track.albumCover) }}
            className="shrink-0 rounded-xl overflow-hidden focus:outline-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={track.albumCover}
              alt=""
              className="w-28 h-28 object-cover hover:scale-105 transition-transform duration-200"
            />
          </button>
        ) : (
          <div className="w-28 h-28 rounded-xl bg-zinc-800 shrink-0" />
        )}
        <div className={`flex flex-col gap-1 min-w-0 flex-1 ${isRight ? "items-end text-right" : ""}`}>
          <span className="font-bold text-lg leading-tight line-clamp-2">{track.title}</span>
          <span className="text-sm text-zinc-400 truncate w-full">{track.artist}</span>
          <span className="text-xs text-zinc-600 mt-1">{track.playCount.toLocaleString()} plays</span>
        </div>
      </div>

      {/* Video (desktop) */}
      <div className="hidden sm:block">
        {track.youtubeVideoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${track.youtubeVideoId}?rel=0&modestbranding=1`}
            className="w-full aspect-video"
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full aspect-video bg-zinc-900 flex items-center justify-center">
            <span className="text-zinc-600 text-sm">No video available</span>
          </div>
        )}
      </div>

      {/* Choose button (desktop) */}
      <button
        onClick={onPick}
        className="hidden sm:flex w-full py-3 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700
          items-center justify-center transition-colors group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22" height="22" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className="text-zinc-500 group-hover:text-white transition-colors"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
    </div>
  )
}

function WinnerScreen({
  winner,
  bracket,
  onPlayAgain,
}: {
  winner: Track
  bracket: BracketState
  onPlayAgain: () => void
}) {
  return (
    <div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-hidden">
      {/* Winner card — full-width strip on mobile, fixed left panel on desktop */}
      <div className="flex flex-col md:flex-col items-center gap-4 md:gap-5 text-center shrink-0
        w-full md:w-56 px-6 py-6 md:py-10
        border-b border-zinc-800 md:border-b-0 md:border-r
        md:overflow-y-auto">
        <p className="text-xs font-medium tracking-widest uppercase text-zinc-500">
          Your Favorite Song
        </p>
        {/* On mobile: horizontal layout to save vertical space */}
        <div className="flex md:flex-col items-center gap-4 md:gap-4 w-full md:w-auto">
          {winner.albumCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={winner.albumCover}
              alt=""
              className="w-24 h-24 md:w-40 md:h-40 rounded-2xl object-cover shadow-2xl shrink-0"
            />
          ) : (
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-2xl bg-zinc-800 shrink-0" />
          )}
          <div className="flex flex-col gap-1 text-left md:text-center min-w-0">
            <h2 className="text-lg md:text-xl font-bold leading-tight line-clamp-3">{winner.title}</h2>
            <p className="text-zinc-400 text-sm truncate">{winner.artist}</p>
            <button
              onClick={onPlayAgain}
              className="mt-2 self-start md:self-center rounded-full bg-zinc-800 px-5 py-2 text-sm font-semibold hover:bg-zinc-700 transition-colors"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>

      {/* Full bracket — scrolls both axes */}
      <div className="flex-1 min-w-0 min-h-0 overflow-auto pt-4">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 text-center pb-2">
          Full Bracket
        </p>
        <BracketTree
          bracket={bracket}
          startRound={Math.max(0, Math.log2(bracket.rounds[0]?.length ?? 8) - 3)}
        />
      </div>
    </div>
  )
}
