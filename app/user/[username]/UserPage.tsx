"use client"

import { useState } from "react"
import type { GameSummary } from "./page"
import BracketTree from "@/components/BracketTree"
import type { BracketState } from "@/lib/bracket"
import type { Period } from "@/types"

const PERIOD_LABELS: Record<Period, string> = {
  overall: "All Time",
  "12month": "12 Months",
  "6month": "6 Months",
  "3month": "3 Months",
  "7day": "7 Days",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ─── game card ────────────────────────────────────────────────────────────────

function GameCard({
  game,
  onClick,
}: {
  game: GameSummary
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-xl border border-zinc-800 overflow-hidden
        hover:border-zinc-600 transition-colors text-left bg-zinc-900/50 hover:bg-zinc-900"
    >
      {/* Album cover */}
      <div className="relative w-full aspect-square bg-zinc-800 overflow-hidden">
        {game.winner?.albumCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.winner.albumCover}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-zinc-700"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        )}
        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className="rounded-full bg-black/70 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-zinc-300">
            {game.trackCount} tracks
          </span>
          <span className="rounded-full bg-black/70 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-zinc-300">
            {PERIOD_LABELS[game.period]}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 px-3 py-3">
        {game.winner ? (
          <>
            <p className="text-sm font-semibold text-white leading-tight line-clamp-1">
              {game.winner.title}
            </p>
            <p className="text-xs text-zinc-500 truncate">{game.winner.artist}</p>
          </>
        ) : (
          <p className="text-sm text-zinc-600 italic">No winner recorded</p>
        )}
        <p className="text-xs text-zinc-700 mt-1">{formatDate(game.createdAt)}</p>
      </div>
    </button>
  )
}

// ─── bracket modal ────────────────────────────────────────────────────────────

function BracketModal({
  game,
  bracket,
  loading,
  onClose,
}: {
  game: GameSummary
  bracket: BracketState | null
  loading: boolean
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-0.5">
          {game.winner && (
            <>
              <p className="text-sm font-bold text-white">{game.winner.title}</p>
              <p className="text-xs text-zinc-500">{game.winner.artist}</p>
            </>
          )}
          <div className="flex gap-2 mt-1">
            <span className="text-xs text-zinc-600">
              {game.trackCount} tracks · {PERIOD_LABELS[game.period]} · {formatDate(game.createdAt)}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Bracket */}
      <div
        className="flex-1 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-zinc-500 p-6">
            Loading bracket…
          </div>
        ) : bracket ? (
          <div className="p-4">
            <BracketTree bracket={bracket} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500 p-6">
            Could not load bracket data.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function UserPage({
  username,
  games,
}: {
  username: string
  games: GameSummary[]
}) {
  const [openGameId, setOpenGameId] = useState<string | null>(null)
  const [bracketCache, setBracketCache] = useState<Record<string, BracketState>>({})
  const [loading, setLoading] = useState(false)

  const openGame = games.find((g) => g.id === openGameId)

  async function handleCardClick(gameId: string) {
    setOpenGameId(gameId)
    if (bracketCache[gameId]) return
    setLoading(true)
    try {
      const res = await fetch(`/api/game/${gameId}`)
      if (res.ok) {
        const data = await res.json()
        setBracketCache((prev) => ({ ...prev, [gameId]: data.bracket }))
      }
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setOpenGameId(null)
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-10 max-w-5xl mx-auto w-full">
      {/* Profile header */}
      <div className="flex items-end gap-4 mb-10">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-widest uppercase text-zinc-500">
            Last.fm
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{username}</h1>
          <p className="text-sm text-zinc-500">
            {games.length === 0
              ? "No completed games yet"
              : `${games.length} game${games.length === 1 ? "" : "s"} played`}
          </p>
        </div>
      </div>

      {/* Game history grid */}
      {games.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-zinc-500">No completed brackets yet.</p>
          <a
            href="/setup"
            className="rounded-full bg-zinc-800 px-6 py-2.5 text-sm font-semibold hover:bg-zinc-700 transition-colors"
          >
            Play your first game
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => handleCardClick(game.id)}
            />
          ))}
        </div>
      )}

      {/* Bracket modal */}
      {openGameId && openGame && (
        <BracketModal
          game={openGame}
          bracket={bracketCache[openGameId] ?? null}
          loading={loading && !bracketCache[openGameId]}
          onClose={handleClose}
        />
      )}
    </main>
  )
}
