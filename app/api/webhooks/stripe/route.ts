import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { db, purchases } from '@/lib/db'
import {
  accessAvailableFromPurchase,
  ensureCompletionRow,
  isUniqueViolation,
  recordStripeEvent,
  wasStripeEventProcessed,
} from '@/lib/db/queries'
import { getStripe } from '@/lib/stripe'
import { LEARNING_RATE_LIMITS, enforceRateLimit } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, LEARNING_RATE_LIMITS.webhook)
  if (limited) return limited

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const body = await request.text()
  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    console.error('[stripe-webhook] signature verification failed:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency ledger: if we have already processed this event id, acknowledge
  // and skip. This complements the unique indexes that already make duplicate
  // processing safe in practice.
  try {
    if (await wasStripeEventProcessed(event.id)) {
      return NextResponse.json({ received: true, duplicate: true })
    }
  } catch (e) {
    console.error('[stripe-webhook] dedupe check failed:', e)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const purchaseId = session.metadata?.purchase_id
      const clerkUserId = session.metadata?.clerk_user_id
      const courseId = session.metadata?.course_id
      const immediateAccessWaiver = session.metadata?.immediate_access_waiver === 'true'
      const newsletterOptIn = session.metadata?.newsletter_opt_in === 'true'
      const purchasedAt = new Date()
      const accessAvailableAt = accessAvailableFromPurchase(purchasedAt, immediateAccessWaiver)
      const paymentIntentId =
        typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id

      try {
        const update = {
          status: 'completed' as const,
          stripePaymentIntentId: paymentIntentId ?? null,
          immediateAccessWaiver,
          accessAvailableAt,
          newsletterOptIn,
          purchasedAt,
        }
        if (purchaseId) {
          await db.update(purchases).set(update).where(eq(purchases.id, purchaseId))
        } else if (session.id) {
          await db.update(purchases).set(update).where(eq(purchases.stripeCheckoutSessionId, session.id))
        }
      } catch (e) {
        // A completed purchase already exists for this user+course (e.g. the
        // user paid twice in parallel tabs). Access is already granted, so
        // acknowledge the event rather than making Stripe retry forever.
        if (!isUniqueViolation(e)) throw e
        console.warn('[stripe-webhook] duplicate completed purchase ignored', {
          purchaseId,
          sessionId: session.id,
        })
      }

      if (clerkUserId && courseId) {
        await ensureCompletionRow(clerkUserId, courseId)
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId =
        typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
      if (paymentIntentId) {
        await db
          .update(purchases)
          .set({ status: 'refunded' })
          .where(eq(purchases.stripePaymentIntentId, paymentIntentId))
      }
    }
  } catch (e) {
    console.error('[stripe-webhook] handler error:', e)
    // Do not record the event id on failure, so Stripe can retry.
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  // Processing succeeded: record the event id so retries are skipped.
  try {
    await recordStripeEvent(event.id, event.type)
  } catch (e) {
    console.error('[stripe-webhook] failed to record event id:', e)
  }

  return NextResponse.json({ received: true })
}
