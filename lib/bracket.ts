import type { Track } from "@/types"

export interface BracketState {
  rounds: Track[][]       // rounds[r] = participants entering that round
  currentRound: number
  currentPosition: number // matchup index within current round
  completed: boolean
  winner: Track | null
}

export function buildBracket(tracks: Track[]): BracketState {
  return {
    rounds: [tracks],
    currentRound: 0,
    currentPosition: 0,
    completed: false,
    winner: null,
  }
}

export function getCurrentMatchup(state: BracketState): [Track, Track] | null {
  if (state.completed) return null
  const round = state.rounds[state.currentRound]
  const a = round[state.currentPosition * 2]
  const b = round[state.currentPosition * 2 + 1]
  if (!a || !b) return null
  return [a, b]
}

export function pickWinner(state: BracketState, winner: Track): BracketState {
  const nextRoundIdx = state.currentRound + 1
  const nextRound = state.rounds[nextRoundIdx] ? [...state.rounds[nextRoundIdx]] : []
  nextRound.push(winner)

  const newRounds = [...state.rounds]
  newRounds[nextRoundIdx] = nextRound

  const matchupsInRound = state.rounds[state.currentRound].length / 2

  if (state.currentPosition + 1 >= matchupsInRound) {
    // Round complete
    if (nextRound.length === 1) {
      // Tournament over
      return {
        rounds: newRounds,
        currentRound: nextRoundIdx,
        currentPosition: 0,
        completed: true,
        winner: nextRound[0],
      }
    }
    return {
      rounds: newRounds,
      currentRound: nextRoundIdx,
      currentPosition: 0,
      completed: false,
      winner: null,
    }
  }

  return {
    rounds: newRounds,
    currentRound: state.currentRound,
    currentPosition: state.currentPosition + 1,
    completed: false,
    winner: null,
  }
}

export function getRoundLabel(totalTracks: number, currentRound: number): string {
  const tracksInRound = totalTracks / Math.pow(2, currentRound)
  if (tracksInRound === 2) return "The Final"
  if (tracksInRound === 4) return "Semi-Finals"
  if (tracksInRound === 8) return "Quarter-Finals"
  return `Round of ${tracksInRound}`
}

export function getProgress(state: BracketState): { current: number; total: number } {
  const total = state.rounds[state.currentRound].length / 2
  return { current: state.currentPosition + 1, total }
}
