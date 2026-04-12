"use client"

import { getRoundLabel } from "@/lib/bracket"
import type { BracketState } from "@/lib/bracket"
import type { Track } from "@/types"

// ─── layout constants ────────────────────────────────────────────────────────
const SLOT_H = 44   // px — height of one track slot inside a matchup card
const CARD_W = 208  // px — width of a matchup card
const CONN_W = 40   // px — width of the SVG connector between columns

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Vertical center (px) of matchup m in round r, for a bracket of n initial tracks. */
function centerY(n: number, r: number, m: number): number {
  return (2 * m + 1) * Math.pow(2, r) * SLOT_H
}

// ─── data ────────────────────────────────────────────────────────────────────

interface MatchupNode {
  songA: Track | undefined
  songB: Track | undefined
  winner: Track | undefined
}

function deriveMatchups(bracket: BracketState): MatchupNode[][] {
  const n = bracket.rounds[0].length
  const totalRounds = Math.log2(n)
  const out: MatchupNode[][] = []

  for (let r = 0; r < totalRounds; r++) {
    const round = bracket.rounds[r] ?? []
    const next = bracket.rounds[r + 1] ?? []
    const count = Math.round(n / Math.pow(2, r + 1))
    const nodes: MatchupNode[] = []

    for (let m = 0; m < count; m++) {
      nodes.push({
        songA: round[m * 2],
        songB: round[m * 2 + 1],
        winner: next[m],
      })
    }
    out.push(nodes)
  }

  return out
}

// ─── sub-components ──────────────────────────────────────────────────────────

function TrackSlot({
  track,
  isWinner,
  isLoser,
}: {
  track: Track | undefined
  isWinner: boolean
  isLoser: boolean
}) {
  return (
    <div
      style={{ height: SLOT_H }}
      className={`flex items-center gap-2 px-2 overflow-hidden
        ${isLoser ? "opacity-25" : ""}
        ${isWinner ? "bg-zinc-800/60" : ""}
      `}
    >
      {track ? (
        <>
          {track.albumCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={track.albumCover}
              alt=""
              className="w-7 h-7 rounded object-cover shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded bg-zinc-700 shrink-0" />
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <span
              className={`text-xs font-medium truncate leading-tight
                ${isWinner ? "text-white" : "text-zinc-300"}
              `}
            >
              {track.title}
            </span>
            <span className="text-xs text-zinc-500 truncate leading-tight">
              {track.artist}
            </span>
          </div>
          {isWinner && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-400 shrink-0"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </>
      ) : (
        <span className="text-xs text-zinc-700 italic">TBD</span>
      )}
    </div>
  )
}

function MatchupCard({
  node,
  top,
  isActive,
}: {
  node: MatchupNode
  top: number
  isActive: boolean
}) {
  const { songA, songB, winner } = node
  const hasWinner = !!winner
  const sameTrack = (a: Track | undefined, b: Track | undefined) =>
    !!a && !!b && (a === b || (!!a.songCacheId && a.songCacheId === b.songCacheId))
  const winA = hasWinner && sameTrack(winner, songA)
  const winB = hasWinner && sameTrack(winner, songB)

  return (
    <div
      className={`absolute rounded overflow-hidden border bg-zinc-900
        ${isActive ? "border-zinc-400 ring-1 ring-zinc-400/30" : "border-zinc-700/70"}
      `}
      style={{ top, left: 0, width: CARD_W }}
    >
      <TrackSlot
        track={songA}
        isWinner={winA}
        isLoser={hasWinner && !winA && !!songA}
      />
      <div className="h-px bg-zinc-700/70" />
      <TrackSlot
        track={songB}
        isWinner={winB}
        isLoser={hasWinner && !winB && !!songB}
      />
    </div>
  )
}

function ConnectorSVG({
  n,
  round,
  totalHeight,
  matchupCount,
}: {
  n: number
  round: number
  totalHeight: number
  matchupCount: number
}) {
  const mid = CONN_W / 2
  const pairs = matchupCount / 2

  return (
    <svg
      width={CONN_W}
      height={totalHeight}
      className="shrink-0 overflow-visible"
    >
      {Array.from({ length: pairs }, (_, p) => {
        const yA = centerY(n, round, p * 2)
        const yB = centerY(n, round, p * 2 + 1)
        const yMid = (yA + yB) / 2
        return (
          <g key={p} stroke="#3f3f46" strokeWidth={1} fill="none">
            <line x1={0} y1={yA} x2={mid} y2={yA} />
            <line x1={0} y1={yB} x2={mid} y2={yB} />
            <line x1={mid} y1={yA} x2={mid} y2={yB} />
            <line x1={mid} y1={yMid} x2={CONN_W} y2={yMid} />
          </g>
        )
      })}
    </svg>
  )
}

function ChampionCard({ track }: { track: Track }) {
  return (
    <div
      className="rounded border border-amber-500/40 bg-zinc-900 flex flex-col items-center gap-2 p-4 text-center"
      style={{ width: CARD_W }}
    >
      {track.albumCover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={track.albumCover}
          alt=""
          className="w-14 h-14 rounded-xl object-cover shadow-lg"
        />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-zinc-800" />
      )}
      <div className="flex flex-col min-w-0 w-full">
        <p className="text-xs font-bold text-white leading-tight line-clamp-2">
          {track.title}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5 truncate">{track.artist}</p>
      </div>
      <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">
        Champion
      </span>
    </div>
  )
}

// ─── main export ─────────────────────────────────────────────────────────────

export default function BracketTree({ bracket }: { bracket: BracketState }) {
  const n = bracket.rounds[0]?.length ?? 0
  // Guard: n must be a power of 2
  if (!n || !Number.isInteger(Math.log2(n))) return null

  const totalHeight = n * SLOT_H
  const totalRounds = Math.log2(n)
  const matchupsByRound = deriveMatchups(bracket)

  return (
    <div className="overflow-auto">
      <div className="inline-flex flex-col min-w-max pb-4 px-4">

        {/* ── Round labels row ─────────────────────────────────────────────── */}
        <div className="flex items-end mb-2">
          {matchupsByRound.map((_, r) => (
            <div key={r} className="flex items-center">
              <div
                className="text-xs font-semibold tracking-widest uppercase text-zinc-500 text-center"
                style={{ width: CARD_W }}
              >
                {getRoundLabel(n, r)}
              </div>
              {r < totalRounds - 1 && <div style={{ width: CONN_W }} />}
            </div>
          ))}
          {bracket.winner && (
            <>
              <div style={{ width: CONN_W }} />
              <div
                className="text-xs font-semibold tracking-widest uppercase text-amber-500/70 text-center"
                style={{ width: CARD_W }}
              >
                Champion
              </div>
            </>
          )}
        </div>

        {/* ── Bracket row ──────────────────────────────────────────────────── */}
        <div className="flex items-start">
          {matchupsByRound.map((matchups, r) => (
            <div key={r} className="flex items-start shrink-0">
              {/* Cards column */}
              <div
                className="relative shrink-0"
                style={{ width: CARD_W, height: totalHeight }}
              >
                {matchups.map((node, m) => {
                  const isActive =
                    !bracket.completed &&
                    r === bracket.currentRound &&
                    m === bracket.currentPosition
                  return (
                    <MatchupCard
                      key={m}
                      node={node}
                      top={Math.round(centerY(n, r, m) - SLOT_H)}
                      isActive={isActive}
                    />
                  )
                })}
              </div>

              {/* Connector to next round */}
              {r < totalRounds - 1 && (
                <ConnectorSVG
                  n={n}
                  round={r}
                  totalHeight={totalHeight}
                  matchupCount={matchups.length}
                />
              )}
            </div>
          ))}

          {/* Straight connector + champion card */}
          {bracket.winner && (
            <>
              <div
                className="shrink-0 flex items-center"
                style={{ width: CONN_W, height: totalHeight }}
              >
                <div className="w-full h-px bg-zinc-700/70" />
              </div>
              <div
                className="shrink-0 flex items-center justify-center"
                style={{ width: CARD_W, height: totalHeight }}
              >
                <ChampionCard track={bracket.winner} />
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
