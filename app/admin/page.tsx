import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminOverview } from '@/lib/db/queries'
import { isAdmin } from '@/lib/admin'
import { formatAmount, formatDate } from '@/lib/format'
import styles from '@/components/admin/Admin.module.css'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  // Defence in depth: in addition to the admin layout and middleware gate.
  if (!(await isAdmin())) notFound()
  const overview = await getAdminOverview()

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Overview</h1>
        <Link href="/admin/courses/new" className="btn-primary">
          New course
        </Link>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{overview.courseCount}</div>
          <div className={styles.statLabel}>Courses</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{overview.purchaseCount}</div>
          <div className={styles.statLabel}>Completed purchases</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatAmount(overview.revenuePence)}</div>
          <div className={styles.statLabel}>Revenue</div>
        </div>
      </div>

      <h2>Recent purchases</h2>
      {overview.recentPurchases.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentPurchases.map((p) => (
                <tr key={p.id}>
                  <td>{formatDate(p.purchasedAt)}</td>
                  <td>{p.courseTitle}</td>
                  <td>{p.userName || p.userEmail}</td>
                  <td>{formatAmount(p.amountPence)}</td>
                  <td>
                    <span className={`${styles.badge} ${badgeClass(p.status)}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.empty}>No purchases yet.</p>
      )}
    </div>
  )
}

function badgeClass(status: string): string {
  if (status === 'completed') return styles.badgeCompleted
  if (status === 'refunded') return styles.badgeRefunded
  return styles.badgePending
}
