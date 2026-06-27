import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { db, courses, purchases } from '@/lib/db'
import { eq } from 'drizzle-orm'
import {
  accessAvailableFromPurchase,
  ensureCompletionRow,
  hasAccess,
  isUniqueViolation,
} from '@/lib/db/queries'
import { getStripe } from '@/lib/stripe'
import { getCurrentUserInfo } from '@/lib/user'
import { LEARNING_RATE_LIMITS, enforceRateLimit } from '@/lib/rateLimit'
import { subscribeToMailerLite } from '@/lib/mailerlite'

export const dynamic = 'force-dynamic'

type CheckoutBody = {
  courseId?: string
  acceptTerms?: boolean
  newsletter?: boolean
  immediateAccess?: boolean
}

export async function POST(request: Request) {
  try {
    const limited = enforceRateLimit(request, LEARNING_RATE_LIMITS.checkout)
    if (limited) return limited

    const user = await getCurrentUserInfo()
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 })
    }
    if (!user.email) {
      return NextResponse.json({ error: 'Your account has no email address.' }, { status: 400 })
    }

    const body = (await request.json()) as CheckoutBody
    if (!body.courseId) {
      return NextResponse.json({ error: 'Missing courseId.' }, { status: 400 })
    }
    if (body.acceptTerms !== true) {
      return NextResponse.json(
        { error: 'You must agree to the Learning Terms and Privacy Notice.' },
        { status: 400 },
      )
    }

    const [course] = await db.select().from(courses).where(eq(courses.id, body.courseId)).limit(1)
    if (!course || course.status !== 'published') {
      return NextResponse.json({ error: 'Course not available.' }, { status: 404 })
    }

    if (await hasAccess(user.userId, course.id)) {
      return NextResponse.json({ redirectUrl: `/courses/${course.slug}/watch` })
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002').replace(/\/$/, '')
    const newsletterOptIn = body.newsletter === true
    const now = new Date()

    // Free course: skip Stripe, enrol immediately.
    if (course.pricePence <= 0) {
      try {
        await db.insert(purchases).values({
          clerkUserId: user.userId,
          userEmail: user.email,
          userName: user.name,
          courseId: course.id,
          amountPence: 0,
          status: 'completed',
          immediateAccessWaiver: true,
          accessAvailableAt: now,
          newsletterOptIn,
        })
      } catch (e) {
        if (!isUniqueViolation(e)) throw e
      }
      await ensureCompletionRow(user.userId, course.id)

      if (newsletterOptIn) {
        const result = await subscribeToMailerLite({
          email: user.email,
          firstName: user.name?.trim() || undefined,
        })
        if (!result.ok) {
          console.error('[checkout] newsletter subscribe failed:', result.error, {
            email: user.email,
            courseId: course.id,
          })
        }
      }

      return NextResponse.json({ redirectUrl: `/purchase/success?course=${course.slug}` })
    }

    const immediateAccessWaiver = body.immediateAccess === true

    const [pending] = await db
      .insert(purchases)
      .values({
        clerkUserId: user.userId,
        userEmail: user.email,
        userName: user.name,
        courseId: course.id,
        amountPence: course.pricePence,
        status: 'pending',
        immediateAccessWaiver,
        accessAvailableAt: accessAvailableFromPurchase(now, immediateAccessWaiver),
        newsletterOptIn,
      })
      .returning()

    const stripe = getStripe()
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: course.pricePence,
            product_data: {
              name: course.title,
              description: course.description || undefined,
            },
          },
        },
      ],
      success_url: `${siteUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/courses/${course.slug}`,
      metadata: {
        clerk_user_id: user.userId,
        course_id: course.id,
        purchase_id: pending.id,
        immediate_access_waiver: immediateAccessWaiver ? 'true' : 'false',
        newsletter_opt_in: newsletterOptIn ? 'true' : 'false',
        terms_accepted: 'true',
        user_name: user.name?.trim() || '',
      },
      payment_intent_data: {
        receipt_email: user.email,
        metadata: {
          clerk_user_id: user.userId,
          course_id: course.id,
          purchase_id: pending.id,
          immediate_access_waiver: immediateAccessWaiver ? 'true' : 'false',
          newsletter_opt_in: newsletterOptIn ? 'true' : 'false',
        },
      },
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    await db
      .update(purchases)
      .set({ stripeCheckoutSessionId: session.id })
      .where(eq(purchases.id, pending.id))

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL.' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Checkout failed'
    console.error('[checkout]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
