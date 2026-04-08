export interface LastFmTrack {
  name: string
  artist: { name: string; "#text"?: string }
  album?: { "#text": string }
  image?: Array<{ "#text": string; size: string }>
  playcount?: string
  url: string
}

export interface Track {
  title: string
  artist: string
  albumCover: string
  playCount: number
  lastfmUrl: string
  youtubeVideoId: string | null
}

export type Period = "overall" | "12month" | "6month" | "3month" | "7day"

export type BracketSize = 8 | 16 | 32 | 64

export interface Game {
  id: string
  lastfmUser: string
  period: Period
  trackCount: number
  status: "in_progress" | "completed"
  createdAt: string
  updatedAt: string
}

export interface BracketSong {
  id: string
  gameId: string
  lastfmUrl: string
  title: string
  artist: string
  albumCover: string
  playCount: number
  seed: number
}

export interface Matchup {
  id: string
  gameId: string
  round: number
  position: number
  songAId: string
  songBId: string | null
  winnerId: string | null
  playedAt: string | null
}

// NextAuth session extensions
declare module "next-auth" {
  interface Session {
    lastfmSessionKey?: string
    lastfmUsername?: string
  }
  interface User {
    sessionKey?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    lastfmSessionKey?: string
    lastfmUsername?: string
  }
}
