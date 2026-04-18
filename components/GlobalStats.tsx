"use client"

import { useEffect, useRef, useState } from "react"
import type { GlobalStats } from "@/app/api/stats/route"

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

function AnimatedCard({
  delay = 0,
  children,
}: {
  delay?: number
  children: React.ReactNode
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {children}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  cover,
  delay,
}: {
  label: string
  value: string
  sub?: string
  cover?: string
  delay?: number
}) {
  return (
    <AnimatedCard delay={delay}>
      <div className="flex flex-col gap-3 rounded-2xl bg-zinc-900 border border-zinc-800 p-6 h-full">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
        <div className="flex items-center gap-4 flex-1">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="h-14 w-14 rounded-lg object-cover shrink-0 ring-1 ring-zinc-700"
            />
          )}
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-xl font-bold leading-tight truncate">{value}</p>
            {sub && <p className="text-sm text-zinc-400 truncate">{sub}</p>}
          </div>
        </div>
      </div>
    </AnimatedCard>
  )
}

function BigNumberCard({
  label,
  number,
  delay,
}: {
  label: string
  number: number
  delay?: number
}) {
  const { ref, inView } = useInView()
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (number === 0) return
    const duration = 1200
    const steps = 40
    const increment = number / steps
    let current = 0
    const interval = setInterval(() => {
      current += increment
      if (current >= number) {
        setDisplayed(number)
        clearInterval(interval)
      } else {
        setDisplayed(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(interval)
  }, [inView, number])

  return (
    <AnimatedCard delay={delay}>
      <div
        ref={ref}
        className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-zinc-900 border border-zinc-800 p-8 text-center h-full"
      >
        <p className="text-6xl font-black tabular-nums text-white">
          {inView ? displayed.toLocaleString() : 0}
        </p>
        <p className="text-sm font-medium text-zinc-400 uppercase tracking-widest">{label}</p>
      </div>
    </AnimatedCard>
  )
}

function SectionHeading({ children, delay }: { children: React.ReactNode; delay?: number }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay ?? 0}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      {children}
    </div>
  )
}

export default function GlobalStats() {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !stats || stats.totalGames === 0) return null

  return (
    <section className="w-full max-w-4xl mx-auto px-6 pb-24 flex flex-col gap-16">
      {/* divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
          global stats
        </span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      {/* big numbers */}
      <div>
        <SectionHeading>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-6">
            By the numbers
          </h2>
        </SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <BigNumberCard label="Games completed" number={stats.totalGames} delay={0} />
          <BigNumberCard label="Players" number={stats.totalPlayers} delay={100} />
        </div>
      </div>

      {/* most winning */}
      <div>
        <SectionHeading>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-6">
            Hall of champions
          </h2>
        </SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.mostWinningSong && (
            <StatCard
              label="Most winning song"
              value={stats.mostWinningSong.title}
              sub={`${stats.mostWinningSong.artist} · ${stats.mostWinningSong.wins} ${stats.mostWinningSong.wins === 1 ? "win" : "wins"}`}
              cover={stats.mostWinningSong.albumCover || undefined}
              delay={0}
            />
          )}
          {stats.mostWinningArtist && (
            <StatCard
              label="Most winning artist"
              value={stats.mostWinningArtist.artist}
              sub={`${stats.mostWinningArtist.wins} ${stats.mostWinningArtist.wins === 1 ? "win" : "wins"}`}
              delay={80}
            />
          )}
          {stats.mostWinningAlbum && (
            <StatCard
              label="Most winning album"
              value={stats.mostWinningAlbum.album}
              sub={`${stats.mostWinningAlbum.wins} ${stats.mostWinningAlbum.wins === 1 ? "win" : "wins"}`}
              cover={stats.mostWinningAlbum.albumCover || undefined}
              delay={160}
            />
          )}
        </div>
      </div>

      {/* most seeded */}
      <div>
        <SectionHeading>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-6">
            Most entered in brackets
          </h2>
        </SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.mostSeededSong && (
            <StatCard
              label="Most seeded song"
              value={stats.mostSeededSong.title}
              sub={`${stats.mostSeededSong.artist} · ${stats.mostSeededSong.appearances} ${stats.mostSeededSong.appearances === 1 ? "bracket" : "brackets"}`}
              cover={stats.mostSeededSong.albumCover || undefined}
              delay={0}
            />
          )}
          {stats.mostSeededArtist && (
            <StatCard
              label="Most seeded artist"
              value={stats.mostSeededArtist.artist}
              sub={`${stats.mostSeededArtist.appearances} ${stats.mostSeededArtist.appearances === 1 ? "appearance" : "appearances"}`}
              delay={80}
            />
          )}
          {stats.mostSeededAlbum && (
            <StatCard
              label="Most seeded album"
              value={stats.mostSeededAlbum.album}
              sub={`${stats.mostSeededAlbum.appearances} ${stats.mostSeededAlbum.appearances === 1 ? "appearance" : "appearances"}`}
              cover={stats.mostSeededAlbum.albumCover || undefined}
              delay={160}
            />
          )}
        </div>
      </div>

    </section>
  )
}
