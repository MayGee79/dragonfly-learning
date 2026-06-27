import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { ACCESS_PERIOD_MONTHS, getCompletion, getCourseBySlug, getAccessInfo, hasAccess } from '@/lib/db/queries'
import { formatDuration, formatPrice } from '@/lib/format'
import LaunchOfferBadge from '@/components/LaunchOfferBadge'
import { isLaunchOfferActive, LAUNCH_OFFER_FULL_PRICE_PENCE } from '@/lib/launchOffer'
import { Markdown } from '@/lib/markdown'
import BuyButton, { type BuyButtonState } from '@/components/BuyButton'
import styles from './CourseDetail.module.css'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  try {
    const course = await getCourseBySlug(params.slug)
    if (!course) return { title: 'Course not found' }
    return {
      title: course.title,
      description: course.description || undefined,
    }
  } catch {
    return { title: 'Course' }
  }
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug)
  if (!course || course.status !== 'published') {
    notFound()
  }

  const { userId } = await auth()
  const isFree = course.pricePence <= 0

  let buttonState: BuyButtonState
  let accessAvailableAt: string | null = null
  let certificateHref: string | undefined

  if (!userId) {
    buttonState = 'signed-out'
  } else {
    const accessInfo = await getAccessInfo(userId, course.id)
    if (accessInfo && !accessInfo.hasAccess) {
      buttonState = 'pending-access'
      accessAvailableAt = accessInfo.accessAvailableAt?.toISOString() ?? null
    } else if (!(await hasAccess(userId, course.id))) {
      buttonState = isFree ? 'free' : 'buy'
    } else {
      const completion = await getCompletion(userId, course.id)
      if (completion?.completed) {
        buttonState = 'completed'
        certificateHref = !isFree ? `/courses/${course.slug}/certificate` : undefined
      } else {
        buttonState = 'continue'
      }
    }
  }

  const showMainPurchaseFlow =
    buttonState === 'signed-out' || buttonState === 'buy' || buttonState === 'free'
  const showSidebarCta = !showMainPurchaseFlow

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        <div className={styles.main}>
          <p className={styles.eyebrow}>Dragonfly Learning · CPD</p>
          <h1 className={styles.title}>{course.title}</h1>
          {course.description && <p className={styles.lead}>{course.description}</p>}

          {showMainPurchaseFlow && (
            <section className={styles.purchaseSection} aria-label="Register or purchase this course">
              <BuyButton
                state={buttonState}
                courseId={course.id}
                slug={course.slug}
                pricePence={course.pricePence}
                accessAvailableAt={accessAvailableAt}
                certificateHref={certificateHref}
              />
            </section>
          )}

          <div className={styles.media}>
            {course.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.thumbnailUrl} alt={course.title} className={styles.thumb} />
            ) : (
              <div className={styles.thumbPlaceholder} aria-hidden>
                <span>Dragonfly Learning</span>
              </div>
            )}
          </div>

          {course.longDescription && (
            <div className={styles.longDescription}>
              <Markdown source={course.longDescription} />
            </div>
          )}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.card}>
            <div className={styles.priceRow}>
              {isLaunchOfferActive(course) && (
                <span className={styles.originalPrice} title="Full price from 11 July 2026">
                  {formatPrice(LAUNCH_OFFER_FULL_PRICE_PENCE)}
                </span>
              )}
              <p className={styles.price}>{formatPrice(course.pricePence)}</p>
              <LaunchOfferBadge slug={course.slug} />
            </div>
            <ul className={styles.facts}>
              <li>
                <span>Duration</span>
                <strong>{formatDuration(course.durationMinutes)}</strong>
              </li>
              <li>
                <span>CPD hours</span>
                <strong>{Number(course.cpdHours)}</strong>
              </li>
              <li>
                <span>Certificate</span>
                <strong>{isFree ? 'Not included' : 'On completion'}</strong>
              </li>
              <li>
                <span>Access</span>
                <strong>{ACCESS_PERIOD_MONTHS} months from purchase</strong>
              </li>
            </ul>

            {!isFree && (
              <div className={styles.preContract}>
                <p>
                  Digital on-demand CPD accessed online. You need a device that can play video and open
                  PDF files, plus a stable internet connection.
                </p>
                <p>
                  UK consumers have a 14-day right to cancel. You may waive this at checkout to start
                  immediately. See{' '}
                  <Link href="/terms" target="_blank" rel="noopener noreferrer">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                    Privacy Notice
                  </Link>
                  .
                </p>
              </div>
            )}

            {showSidebarCta && (
              <div className={styles.cta}>
                <BuyButton
                  state={buttonState}
                  courseId={course.id}
                  slug={course.slug}
                  pricePence={course.pricePence}
                  accessAvailableAt={accessAvailableAt}
                  certificateHref={certificateHref}
                />
              </div>
            )}
            <p className={styles.note}>
              CPD hours are indicative. Please confirm suitability with your own professional body or employer.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
