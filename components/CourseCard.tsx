import Link from 'next/link'
import type { Course } from '@/lib/db/schema'
import LaunchOfferBadge from '@/components/LaunchOfferBadge'
import { isLaunchOfferActive, LAUNCH_OFFER_FULL_PRICE_PENCE } from '@/lib/launchOffer'
import { formatDuration, formatPrice } from '@/lib/format'
import styles from './CourseCard.module.css'

export default function CourseCard({ course }: { course: Course }) {
  const isFree = course.pricePence <= 0
  const offerActive = isLaunchOfferActive(course)
  return (
    <Link href={`/courses/${course.slug}`} className={styles.card}>
      <div className={styles.thumb}>
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnailUrl} alt={course.title} className={styles.thumbImg} />
        ) : (
          <div className={styles.thumbPlaceholder} aria-hidden>
            <span>Dragonfly Learning</span>
          </div>
        )}
        {isFree && <span className={styles.freeBadge}>Free</span>}
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{course.title}</h3>
        {course.description && <p className={styles.description}>{course.description}</p>}
        <div className={styles.meta}>
          <span className={styles.metaItem}>{formatDuration(course.durationMinutes)}</span>
          <span className={styles.dot} aria-hidden>
            •
          </span>
          <span className={styles.metaItem}>{Number(course.cpdHours)} CPD hrs</span>
        </div>
        <div className={styles.footer}>
          <div className={styles.priceRow}>
            {offerActive && (
              <span className={styles.originalPrice} title="Full price from 21 July 2026">
                {formatPrice(LAUNCH_OFFER_FULL_PRICE_PENCE)}
              </span>
            )}
            <span className={styles.price}>{formatPrice(course.pricePence)}</span>
            <LaunchOfferBadge slug={course.slug} />
          </div>
          <span className={styles.cta}>View course →</span>
        </div>
      </div>
    </Link>
  )
}
