'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { bunnyEmbedUrl } from '@/lib/bunny'
import styles from './VideoPlayer.module.css'

const PLAYERJS_SRC = 'https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js'
const POST_INTERVAL_MS = 30_000
const COMPLETION_THRESHOLD = 90

interface VideoPlayerProps {
  libraryId: string
  videoId: string
  courseId: string
  slug: string
  initialPercent: number
  initialCompleted: boolean
  nextStepHref: string
  nextStepLabel: string
}

type PlayerjsPlayer = {
  on: (event: string, cb: (data?: unknown) => void) => void
  getDuration?: (cb: (seconds: number) => void) => void
}

type PlayerjsGlobal = {
  Player: new (el: HTMLIFrameElement) => PlayerjsPlayer
}

declare global {
  interface Window {
    playerjs?: PlayerjsGlobal
  }
}

function loadPlayerJs(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no window'))
    if (window.playerjs) return resolve()
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PLAYERJS_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('player.js failed to load')))
      return
    }
    const script = document.createElement('script')
    script.src = PLAYERJS_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('player.js failed to load'))
    document.head.appendChild(script)
  })
}

export default function VideoPlayer({
  libraryId,
  videoId,
  courseId,
  slug,
  initialPercent,
  initialCompleted,
  nextStepHref,
  nextStepLabel,
}: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const maxPercentRef = useRef<number>(initialPercent)
  const lastSentRef = useRef<number>(initialPercent)
  const durationRef = useRef<number>(0)
  // Mirrors `completed` state so the long-lived player callbacks and the
  // 30s interval (created once on mount) never read a stale value.
  const completedRef = useRef<boolean>(initialCompleted)

  const [percent, setPercent] = useState<number>(initialPercent)
  const [completed, setCompleted] = useState<boolean>(initialCompleted)

  const sendProgress = useCallback(
    async (value: number) => {
      const rounded = Math.round(value)
      const crossedThreshold = rounded >= COMPLETION_THRESHOLD && !completedRef.current
      if (rounded <= lastSentRef.current && !crossedThreshold) {
        return
      }
      lastSentRef.current = rounded
      try {
        const res = await fetch('/api/completion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, progressPercent: rounded }),
          // Survive page unloads so the final progress save isn't cancelled.
          keepalive: true,
        })
        if (res.ok) {
          const data = (await res.json()) as { completed: boolean }
          if (data.completed) {
            completedRef.current = true
            setCompleted(true)
          }
        }
      } catch (e) {
        console.error('[video] progress save failed', e)
      }
    },
    [courseId],
  )

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    let cancelled = false

    loadPlayerJs()
      .then(() => {
        if (cancelled || !iframeRef.current || !window.playerjs) return
        const p = new window.playerjs.Player(iframeRef.current)

        p.on('ready', () => {
          p.getDuration?.((d: number) => {
            if (typeof d === 'number' && d > 0) durationRef.current = d
          })
        })

        p.on('timeupdate', (data) => {
          const payload = data as { seconds?: number; duration?: number } | undefined
          if (!payload) return
          const duration = payload.duration || durationRef.current
          if (!duration || duration <= 0) return
          durationRef.current = duration
          const current = (payload.seconds || 0) / duration * 100
          if (current > maxPercentRef.current) {
            maxPercentRef.current = Math.min(100, current)
            setPercent(Math.round(maxPercentRef.current))
            if (maxPercentRef.current >= COMPLETION_THRESHOLD && !completedRef.current) {
              void sendProgress(maxPercentRef.current)
            }
          }
        })

        p.on('ended', () => {
          maxPercentRef.current = 100
          setPercent(100)
          void sendProgress(100)
        })

        interval = setInterval(() => {
          void sendProgress(maxPercentRef.current)
        }, POST_INTERVAL_MS)
      })
      .catch((e) => console.error('[video] player init failed', e))

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
      // Persist final progress on unmount.
      void sendProgress(maxPercentRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={styles.playerFrame}>
        <iframe
          ref={iframeRef}
          src={bunnyEmbedUrl(libraryId, videoId)}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          title="Course video"
          className={styles.iframe}
        />
      </div>

      <div className={styles.progressBar} aria-hidden>
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>
      <div className={styles.progressRow}>
        <span className={styles.progressLabel}>
          {completed ? 'Course complete' : `${percent}% watched`}
        </span>
        {completed && (
          <Link href={nextStepHref} className="btn-primary">
            {nextStepLabel}
          </Link>
        )}
        {!completed && (
          <span className={styles.hint}>Watch {COMPLETION_THRESHOLD}% to unlock your certificate.</span>
        )}
      </div>

      <div className={styles.materials}>
        <h3>Supporting materials</h3>
        <p>Supporting materials coming soon.</p>
      </div>
    </div>
  )
}
