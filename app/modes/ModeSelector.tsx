"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Track, BracketSize } from "@/types"
import SetupForm from "@/app/setup/SetupForm"

interface ArtistResult {
  name: string
  listeners: string
}

type ModalType = "personal" | "genre" | "artist"

const BRACKET_SIZES: BracketSize[] = [8, 16, 32, 64]

const GENRES = [
  { value: "rock", label: "Rock" },
  { value: "pop", label: "Pop" },
  { value: "hip-hop", label: "Hip-Hop" },
  { value: "electronic", label: "Electronic" },
  { value: "jazz", label: "Jazz" },
  { value: "classical", label: "Classical" },
  { value: "metal", label: "Metal" },
  { value: "indie", label: "Indie" },
  { value: "r&b", label: "R&B" },
  { value: "country", label: "Country" },
  { value: "folk", label: "Folk" },
  { value: "punk", label: "Punk" },
  { value: "soul", label: "Soul" },
  { value: "reggae", label: "Reggae" },
  { value: "blues", label: "Blues" },
  { value: "alternative", label: "Alternative" },
  { value: "dance", label: "Dance" },
  { value: "house", label: "House" },
  { value: "techno", label: "Techno" },
  { value: "trap", label: "Trap" },
  { value: "disco", label: "Disco" },
  { value: "latin", label: "Latin" },
  { value: "k-pop", label: "K-Pop" },
  { value: "ambient", label: "Ambient" },
  { value: "grunge", label: "Grunge" },
  { value: "funk", label: "Funk" },
  { value: "gospel", label: "Gospel" },
  { value: "new wave", label: "New Wave" },
  { value: "emo", label: "Emo" },
  { value: "drum and bass", label: "Drum & Bass" },
]

const MODE_CARDS = [
  {
    id: "personal" as const,
    tag: "classic",
    title: "My Tracks",
    description: "Tournament built from your own Last.fm scrobbles — top hits or random picks.",
  },
  {
    id: "genre" as const,
    tag: "genre",
    title: "Genre",
    description: "Battle the most popular tracks from a music genre, worldwide.",
  },
  {
    id: "artist" as const,
    tag: "artist",
    title: "Artist",
    description: "Crown the best song from a single artist's discography.",
  },
]

function SizeSelector({ size, onChange }: { size: BracketSize; onChange: (s: BracketSize) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
        Bracket size
      </label>
      <div className="flex gap-2">
        {BRACKET_SIZES.map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
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
  )
}

function TrackPreview({
  allTracks,
  size,
  onSizeChange,
  onStart,
  loading,
}: {
  allTracks: Track[]
  size: BracketSize
  onSizeChange: (s: BracketSize) => void
  onStart: () => void
  loading: boolean
}) {
  const tracks = allTracks.slice(0, size)
  const notEnough = tracks.length < size

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-zinc-500">
            {tracks.length} tracks ready
            {allTracks.length < size && (
              <span className="text-amber-400 ml-2">
                — only {allTracks.length} available, need {size}
              </span>
            )}
          </p>
          <button
            onClick={onStart}
            disabled={notEnough || loading}
            className="rounded-full bg-red-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start Game →
          </button>
        </div>
        {tracks.map((track, i) => (
          <div
            key={`${track.artist}-${track.title}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-900 transition-colors"
          >
            <span className="w-5 text-right text-xs text-zinc-600 shrink-0">{i + 1}</span>
            {track.albumCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={track.albumCover} alt="" className="h-9 w-9 rounded object-cover shrink-0" />
            ) : (
              <div className="h-9 w-9 rounded bg-zinc-800 shrink-0" />
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{track.title}</span>
              <span className="text-xs text-zinc-500 truncate">{track.artist}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ModeSelector({ username }: { username: string }) {
  const router = useRouter()

  const [activeModal, setActiveModal] = useState<ModalType | null>(null)
  const [bracketSize, setBracketSize] = useState<BracketSize>(32)
  const [allTracks, setAllTracks] = useState<Track[] | null>(null)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Genre state
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)

  // Artist state
  const [artistQuery, setArtistQuery] = useState("")
  const [artistResults, setArtistResults] = useState<ArtistResult[]>([])
  const [artistSearchLoading, setArtistSearchLoading] = useState(false)
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null)

  // Artist search debounce
  useEffect(() => {
    if (artistQuery.length < 2) {
      setArtistResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setArtistSearchLoading(true)
      try {
        const res = await fetch(`/api/search/artists?q=${encodeURIComponent(artistQuery)}`)
        const data = await res.json()
        setArtistResults(data.artists ?? [])
      } catch {
        setArtistResults([])
      } finally {
        setArtistSearchLoading(false)
      }
    }, 400)
    return () => clearTimeout(timeout)
  }, [artistQuery])

  function openModal(type: ModalType) {
    setActiveModal(type)
    setAllTracks(null)
    setFetchError(null)
    setBracketSize(32)
    setSelectedGenre(null)
    setArtistQuery("")
    setArtistResults([])
    setSelectedArtist(null)
  }

  function closeModal() {
    setActiveModal(null)
    setAllTracks(null)
    setFetchError(null)
  }

  const canFetch =
    (activeModal === "genre" && selectedGenre !== null) ||
    (activeModal === "artist" && selectedArtist !== null)

  const fetchTracks = useCallback(async () => {
    setFetchLoading(true)
    setFetchError(null)
    setAllTracks(null)
    try {
      let url: string
      if (activeModal === "genre") {
        url = `/api/tracks?gameType=genre&tag=${encodeURIComponent(selectedGenre!)}`
      } else {
        url = `/api/tracks?gameType=artist&artist=${encodeURIComponent(selectedArtist!)}`
      }
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch tracks")
      setAllTracks(data.tracks)
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : String(e))
    } finally {
      setFetchLoading(false)
    }
  }, [activeModal, selectedGenre, selectedArtist])

  function startGame() {
    if (!allTracks) return
    const tracks = allTracks.slice(0, bracketSize)
    sessionStorage.setItem("bracket_tracks", JSON.stringify(tracks))
    let meta: Record<string, unknown>
    if (activeModal === "genre") {
      meta = { gameType: "genre", tag: selectedGenre, size: bracketSize, period: "overall" }
    } else {
      meta = { gameType: "artist", artist: selectedArtist, size: bracketSize, period: "overall" }
    }
    sessionStorage.setItem("bracket_meta", JSON.stringify(meta))
    router.push("/game")
  }

  const modalTitle: Record<ModalType, string> = {
    personal: "My Tracks",
    genre: "Genre Tournament",
    artist: "Artist Tournament",
  }

  const modalSubtitle: Record<ModalType, string> = {
    personal: "Tournament from your own Last.fm scrobbles.",
    genre: "Pick a genre and battle its top tracks worldwide.",
    artist: "Search an artist and crown their best song.",
  }

  return (
    <>
      {/* Mode cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {MODE_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={() => openModal(card.id as ModalType)}
            className="flex flex-col items-start gap-3 rounded-2xl bg-zinc-900 border border-zinc-800 p-6 text-left hover:border-zinc-600 transition-colors group"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              {card.tag}
            </span>
            <div className="text-xl font-bold">{card.title}</div>
            <p className="text-sm text-zinc-400 leading-relaxed">{card.description}</p>
            <span className="mt-1 text-sm text-red-500 font-medium group-hover:text-red-400 transition-colors">
              Play →
            </span>
          </button>
        ))}
      </div>

      {/* Modal overlay */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto py-8 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold">{modalTitle[activeModal]}</h2>
                <p className="text-sm text-zinc-400">{modalSubtitle[activeModal]}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-zinc-500 hover:text-white transition-colors text-lg leading-none ml-4 mt-0.5"
              >
                ✕
              </button>
            </div>

            {/* Personal setup */}
            {activeModal === "personal" && (
              <SetupForm username={username} />
            )}

            {/* Genre selection */}
            {activeModal === "genre" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
                  Genre
                </label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => {
                        setSelectedGenre(g.value)
                        setAllTracks(null)
                        setFetchError(null)
                      }}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                        selectedGenre === g.value
                          ? "bg-red-600 text-white"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Artist selection */}
            {activeModal === "artist" && (
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
                  Search artist
                </label>
                {selectedArtist ? (
                  <div className="flex items-center gap-2 rounded-full bg-red-600 self-start px-4 py-1.5 text-sm font-medium text-white">
                    {selectedArtist}
                    <button
                      onClick={() => {
                        setSelectedArtist(null)
                        setArtistQuery("")
                        setAllTracks(null)
                        setFetchError(null)
                      }}
                      className="ml-1 text-red-200 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Type an artist name..."
                      value={artistQuery}
                      onChange={(e) => setArtistQuery(e.target.value)}
                      className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                      autoFocus
                    />
                    {artistResults.length > 0 && (
                      <div className="flex flex-col rounded-xl border border-zinc-800 overflow-hidden">
                        {artistResults.map((artist) => (
                          <button
                            key={artist.name}
                            onClick={() => {
                              setSelectedArtist(artist.name)
                              setArtistQuery("")
                              setArtistResults([])
                            }}
                            className="flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-800 transition-colors"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate">{artist.name}</span>
                              {artist.listeners && artist.listeners !== "0" && (
                                <span className="text-xs text-zinc-500">
                                  {parseInt(artist.listeners).toLocaleString()} listeners
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Fetch button + track preview */}
            {canFetch && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <SizeSelector size={bracketSize} onChange={setBracketSize} />
                  <button
                    onClick={fetchTracks}
                    disabled={fetchLoading}
                    className="self-start rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {fetchLoading
                      ? "Fetching tracks & videos…"
                      : allTracks
                      ? "Re-fetch tracks"
                      : "Fetch tracks"}
                  </button>
                  {fetchError && (
                    <p className="text-red-400 text-sm">Oops — {fetchError}</p>
                  )}
                </div>
                {allTracks && (
                  <TrackPreview
                    allTracks={allTracks}
                    size={bracketSize}
                    onSizeChange={setBracketSize}
                    onStart={startGame}
                    loading={fetchLoading}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
