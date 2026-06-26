import { NextResponse } from 'next/server'

// In-memory fixed-window rate limiter.
//
// NOTE: state lives in this server process only. It resets on every deploy and
// is not shared across serverless instances or regions, so the effective limit
// can be higher than configured when traffic is spread over several instances.
// This is acceptable at current scale. If traffic grows, move this to
// Upstash/Redis (see dragonfly-shop/lib/rateLimit.ts for the Upstash pattern,
// which keeps the same enforceRateLimit(request, rule) shape).

type RateLimitRule = {
  key: string
  limit: number
  windowSeconds: number
}

type Counter = { count: number; resetAt: number }

const buckets = new Map<string, Counter>()

// Opportunistic cleanup so the map cannot grow without bound between deploys.
function pruneExpired(now: number): void {
  if (buckets.size < 5000) return
  for (const [key, counter] of buckets) {
    if (now >= counter.resetAt) buckets.delete(key)
  }
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  return 'unknown'
}

/**
 * Returns a 429 NextResponse when the caller has exceeded the rule, or null when
 * the request is allowed. Pass `identifier` (e.g. a Clerk user id) to rate limit
 * per user; otherwise the client IP is used.
 */
export function enforceRateLimit(
  request: Request,
  rule: RateLimitRule,
  identifier?: string,
): NextResponse | null {
  const id = identifier?.trim() || clientIp(request)
  const bucketKey = `${rule.key}:${id}`
  const now = Date.now()
  const windowMs = rule.windowSeconds * 1000

  pruneExpired(now)

  const existing = buckets.get(bucketKey)
  if (!existing || now >= existing.resetAt) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs })
    return null
  }

  if (existing.count >= rule.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
    )
  }

  existing.count += 1
  return null
}

export const LEARNING_RATE_LIMITS = {
  // Called by the video player roughly every 30s, so allow generous headroom.
  completion: { key: 'completion', limit: 60, windowSeconds: 60 },
  checkout: { key: 'checkout', limit: 20, windowSeconds: 60 },
  webhook: { key: 'webhook', limit: 100, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitRule>
