// Dev-only page to visually test the BracketTree component.
import BracketTree from "@/components/BracketTree"
import type { BracketState } from "@/lib/bracket"
import type { Track } from "@/types"

// ─── mock data ───────────────────────────────────────────────────────────────

const T: Track[] = [
  { title: "Bohemian Rhapsody", artist: "Queen",            albumCover: "", playCount: 420, lastfmUrl: "t1", youtubeVideoId: null },
  { title: "Hotel California",  artist: "Eagles",           albumCover: "", playCount: 389, lastfmUrl: "t2", youtubeVideoId: null },
  { title: "Stairway to Heaven",artist: "Led Zeppelin",     albumCover: "", playCount: 301, lastfmUrl: "t3", youtubeVideoId: null },
  { title: "Smells Like Teen Spirit", artist: "Nirvana",    albumCover: "", playCount: 278, lastfmUrl: "t4", youtubeVideoId: null },
  { title: "Yesterday",         artist: "The Beatles",      albumCover: "", playCount: 255, lastfmUrl: "t5", youtubeVideoId: null },
  { title: "Purple Haze",       artist: "Jimi Hendrix",     albumCover: "", playCount: 230, lastfmUrl: "t6", youtubeVideoId: null },
  { title: "Wonderwall",        artist: "Oasis",            albumCover: "", playCount: 198, lastfmUrl: "t7", youtubeVideoId: null },
  { title: "Sweet Child O' Mine", artist: "Guns N' Roses",  albumCover: "", playCount: 175, lastfmUrl: "t8", youtubeVideoId: null },
]

// Completed 8-track bracket
// Round 0: T[0]>T[1], T[2]>T[3], T[5]>T[4], T[6]>T[7]
// Round 1: T[0]>T[2], T[5]>T[6]
// Final:   T[0]>T[5]
const COMPLETED: BracketState = {
  rounds: [
    T,
    [T[0], T[2], T[5], T[6]],
    [T[0], T[5]],
    [T[0]],
  ],
  currentRound: 3,
  currentPosition: 0,
  completed: true,
  winner: T[0],
}

// In-progress: 2 of 4 round-0 matchups done; currently on matchup index 2
const IN_PROGRESS: BracketState = {
  rounds: [
    T,
    [T[0], T[2]], // T[0] beat T[1], T[2] beat T[3]
  ],
  currentRound: 0,
  currentPosition: 2, // T[4] vs T[5] is active
  completed: false,
  winner: null,
}

// 16-track completed bracket (two groups of 8 playing together)
const T16: Track[] = [
  ...T,
  { title: "Space Oddity",       artist: "David Bowie",     albumCover: "", playCount: 160, lastfmUrl: "t9",  youtubeVideoId: null },
  { title: "Superstition",       artist: "Stevie Wonder",   albumCover: "", playCount: 155, lastfmUrl: "t10", youtubeVideoId: null },
  { title: "Billie Jean",        artist: "Michael Jackson", albumCover: "", playCount: 148, lastfmUrl: "t11", youtubeVideoId: null },
  { title: "Like a Rolling Stone", artist: "Bob Dylan",     albumCover: "", playCount: 142, lastfmUrl: "t12", youtubeVideoId: null },
  { title: "Waterloo Sunset",    artist: "The Kinks",       albumCover: "", playCount: 136, lastfmUrl: "t13", youtubeVideoId: null },
  { title: "London Calling",     artist: "The Clash",       albumCover: "", playCount: 130, lastfmUrl: "t14", youtubeVideoId: null },
  { title: "Jolene",             artist: "Dolly Parton",    albumCover: "", playCount: 124, lastfmUrl: "t15", youtubeVideoId: null },
  { title: "Respect",            artist: "Aretha Franklin", albumCover: "", playCount: 118, lastfmUrl: "t16", youtubeVideoId: null },
]

const COMPLETED_16: BracketState = {
  rounds: [
    T16,
    [T16[0], T16[2], T16[5], T16[6], T16[8], T16[10], T16[13], T16[14]],
    [T16[0], T16[5], T16[8], T16[13]],
    [T16[0], T16[8]],
    [T16[0]],
  ],
  currentRound: 4,
  currentPosition: 0,
  completed: true,
  winner: T16[0],
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function BracketDemoPage() {
  return (
    <main className="min-h-screen py-12 flex flex-col gap-20">
      <section className="flex flex-col gap-4">
        <div className="px-8">
          <h1 className="text-xl font-bold text-white">BracketTree — dev demo</h1>
        </div>

        <div className="flex flex-col gap-16">
          <div>
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest px-8 mb-4">
              8 tracks — completed
            </h2>
            <BracketTree bracket={COMPLETED} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest px-8 mb-4">
              8 tracks — in progress (match 3 active)
            </h2>
            <BracketTree bracket={IN_PROGRESS} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest px-8 mb-4">
              16 tracks — completed
            </h2>
            <BracketTree bracket={COMPLETED_16} />
          </div>
        </div>
      </section>
    </main>
  )
}
