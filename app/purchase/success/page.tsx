import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { isCheckoutSessionPaid, retrieveCheckoutSession } from '@/lib/checkoutSession'
import {
  getAccessInfo,
  getCompletedPurchaseNewsletterOptIn,
  getCourseById,
  getCourseBySlug,
  hasCompletedPurchase,
} from '@/lib/db/queries'
import { formatDate } from '@/lib/format'
import { NEWSLETTER_THANK_YOU_MESSAGE } from '@/lib/newsletterCopy'
import styles from './Success.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Enrolment confirmed',
  robots: { index: false, follow: false },
}

type SuccessPageProps = {
  searchParams: { session_id?: string; course?: string }
}

export default async function PurchaseSuccessPage({ searchParams }: SuccessPageProps) {
  const { userId } = await auth()
  if (!userId) {
    const query = new URLSearchParams()
    if (searchParams.session_id) query.set('session_id', searchParams.session_id)
    if (searchParams.course) query.set('course', searchParams.course)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    redirect(`/sign-in?redirect_url=${encodeURIComponent(`/purchase/success${suffix}`)}`)
  }

  const sessionId = searchParams.session_id?.trim()
  const courseSlug = searchParams.course?.trim()

  if (sessionId) {
    return renderPaidSuccess(userId, sessionId)
  }

  if (courseSlug) {
    return renderFreeSuccess(userId, courseSlug)
  }

  return renderFallback()
}

async function renderPaidSuccess(userId: string, sessionId: string) {
  if (!sessionId.startsWith('cs_')) {
    return renderFallback()
  }

  const checkoutSession = await retrieveCheckoutSession(sessionId)
  if (!checkoutSession || !isCheckoutSessionPaid(checkoutSession)) {
    return renderFallback(
      'We could not confirm your payment yet. If you completed checkout, please wait a moment and refresh this page.',
    )
  }

  const sessionUserId = checkoutSession.metadata?.clerk_user_id
  const courseId = checkoutSession.metadata?.course_id
  if (!sessionUserId || sessionUserId !== userId || !courseId) {
    return renderFallback()
  }

  const course = await getCourseById(courseId)
  if (!course) {
    return renderFallback()
  }

  const immediateAccess = checkoutSession.metadata?.immediate_access_waiver === 'true'
  const newsletterOptIn = checkoutSession.metadata?.newsletter_opt_in === 'true'
  const accessInfo = await getAccessInfo(userId, course.id)

  if (!immediateAccess) {
    const accessDate = accessInfo?.accessAvailableAt
    return (
      <SuccessCard
        message={
          accessDate ? (
            <>
              You are enrolled in <span className={styles.courseTitle}>{course.title}</span>. Access
              will begin on {formatDate(accessDate)}. Find it in My Courses in My Learning in the top
              navigation bar.
            </>
          ) : (
            <>
              You are enrolled in <span className={styles.courseTitle}>{course.title}</span>. Find it
              in My Courses in My Learning in the top navigation bar.
            </>
          )
        }
        watchHref={undefined}
        showReceiptNote
        newsletterOptIn={newsletterOptIn}
      />
    )
  }

  return (
    <SuccessCard
      message={
        <>
          You are enrolled in <span className={styles.courseTitle}>{course.title}</span>. Find it in
          My Courses in My Learning in the top navigation bar or start watching now.
        </>
      }
      watchHref={`/courses/${course.slug}/watch`}
      showReceiptNote
      newsletterOptIn={newsletterOptIn}
    />
  )
}

async function renderFreeSuccess(userId: string, courseSlug: string) {
  const course = await getCourseBySlug(courseSlug)
  if (!course || !(await hasCompletedPurchase(userId, course.id))) {
    return renderFallback()
  }

  const newsletterOptIn = await getCompletedPurchaseNewsletterOptIn(userId, course.id)

  return (
    <SuccessCard
      message={
        <>
          You are enrolled in <span className={styles.courseTitle}>{course.title}</span>. Find it in
          My Courses in My Learning in the top navigation bar or start watching now.
        </>
      }
      watchHref={`/courses/${course.slug}/watch`}
      showReceiptNote={false}
      newsletterOptIn={newsletterOptIn}
    />
  )
}

function SuccessCard({
  message,
  watchHref,
  showReceiptNote,
  newsletterOptIn,
}: {
  message: ReactNode
  watchHref?: string
  showReceiptNote?: boolean
  newsletterOptIn?: boolean
}) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Thank you</h1>
        <p className={styles.message}>{message}</p>
        {newsletterOptIn ? (
          <p className={styles.newsletterNote} role="status">
            {NEWSLETTER_THANK_YOU_MESSAGE}
          </p>
        ) : null}
        <div className={styles.actions}>
          {watchHref ? (
            <Link href={watchHref} className="btn-primary">
              Start watching
            </Link>
          ) : null}
          <Link href="/dashboard" className={watchHref ? 'btn-secondary' : 'btn-primary'}>
            My Courses
          </Link>
        </div>
        {showReceiptNote ? (
          <p className={styles.note}>
            You should also receive a payment receipt from Stripe. Questions? Email{' '}
            <a href="mailto:victoria@dragonflypsychotherapy.co.uk">victoria@dragonflypsychotherapy.co.uk</a>
            .
          </p>
        ) : null}
      </div>
    </div>
  )
}

function renderFallback(message?: string) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Thank you</h1>
        <p className={styles.message}>
          {message ??
            'If you completed a purchase, your course should appear in My Courses in My Learning in the top navigation bar shortly.'}
        </p>
        <div className={styles.actions}>
          <Link href="/dashboard" className="btn-primary">
            My Courses
          </Link>
          <Link href="/courses" className="btn-secondary">
            Browse courses
          </Link>
        </div>
      </div>
    </div>
  )
}
