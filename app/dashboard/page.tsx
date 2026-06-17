import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getUserDashboard, type DashboardCourse } from '@/lib/db/queries'
import { formatDuration } from '@/lib/format'
import styles from './Dashboard.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Courses',
  robots: { index: false, follow: false },
}

async function loadDashboard(userId: string): Promise<DashboardCourse[]> {
  try {
    return await getUserDashboard(userId)
  } catch (e) {
    console.error('[dashboard] failed to load:', e)
    return []
  }
}

export default async function DashboardPage() {
  const { userId } = await auth()
  // Route is protected by middleware, but guard for types.
  const items = userId ? await loadDashboard(userId) : []

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>My Courses</h1>
        <p>Your enrolled courses and watch progress.</p>
      </header>

      {items.length > 0 ? (
        <ul className={styles.list}>
          {items.map(({ course, completion, accessInfo }) => {
            const percent = completion?.watchProgressPercent ?? 0
            const completed = completion?.completed ?? false
            const accessPending = !accessInfo.hasAccess
            const accessDate = accessInfo.accessAvailableAt
              ? accessInfo.accessAvailableAt.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : null
            const certificateHref =
              course.pricePence > 0 && !completion?.feedbackSubmittedAt
                ? `/courses/${course.slug}/feedback`
                : `/courses/${course.slug}/certificate`

            return (
              <li key={course.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <h2 className={styles.courseTitle}>{course.title}</h2>
                  <div className={styles.metaLine}>
                    <span>{formatDuration(course.durationMinutes)}</span>
                    <span className={styles.dot}>•</span>
                    <span>{Number(course.cpdHours)} CPD hrs</span>
                    {completed && <span className={styles.completeBadge}>Completed</span>}
                    {accessPending && accessDate && (
                      <span className={styles.pendingBadge}>Access from {accessDate}</span>
                    )}
                  </div>
                  {!accessPending && (
                    <>
                      <div className={styles.progressBar} aria-hidden>
                        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
                      </div>
                      <span className={styles.progressLabel}>
                        {completed ? 'Course complete' : `${percent}% watched`}
                      </span>
                    </>
                  )}
                </div>
                <div className={styles.rowActions}>
                  {accessPending ? (
                    <Link href={`/courses/${course.slug}`} className="btn-secondary">
                      View order details
                    </Link>
                  ) : (
                    <>
                      <Link href={`/courses/${course.slug}/watch`} className="btn-primary">
                        {completed ? 'Watch again' : percent > 0 ? 'Continue' : 'Start watching'}
                      </Link>
                      {completed && (
                        <Link href={certificateHref} className="btn-secondary">
                          Certificate
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className={styles.empty}>
          <p>You haven&apos;t enrolled in any courses yet.</p>
          <Link href="/courses" className="btn-primary">
            Browse courses
          </Link>
        </div>
      )}
    </div>
  )
}
