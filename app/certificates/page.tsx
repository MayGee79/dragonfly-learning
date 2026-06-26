import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getUserDashboard } from '@/lib/db/queries'
import { formatDate } from '@/lib/format'
import styles from '../dashboard/Dashboard.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Certificates',
  robots: { index: false, follow: false },
}

export default async function CertificatesPage() {
  const { userId } = await auth()
  const items = userId ? await getUserDashboard(userId) : []
  const completed = items.filter(
    ({ completion, course }) => completion?.completed && course.pricePence > 0,
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Certificates</h1>
        <p>Download your CPD certificates for completed courses.</p>
      </header>

      {completed.length > 0 ? (
        <ul className={styles.list}>
          {completed.map(({ course, completion }) => (
            <li key={course.id} className={styles.row}>
              <div className={styles.rowMain}>
                <h2 className={styles.courseTitle}>{course.title}</h2>
                <div className={styles.metaLine}>
                  <span>{Number(course.cpdHours)} CPD hrs</span>
                  {completion?.completedAt && (
                    <>
                      <span className={styles.dot}>•</span>
                      <span>Completed {formatDate(completion.completedAt)}</span>
                    </>
                  )}
                  <span className={styles.completeBadge}>Completed</span>
                </div>
              </div>
              <div className={styles.rowActions}>
                <Link href={`/courses/${course.slug}/certificate`} className="btn-primary">
                  Download certificate
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <p>You don&apos;t have any certificates yet. Complete a course to unlock yours.</p>
          <Link href="/dashboard" className="btn-primary">
            My Courses
          </Link>
        </div>
      )}
    </div>
  )
}
