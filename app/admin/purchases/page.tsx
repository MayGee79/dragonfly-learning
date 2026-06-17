import { getAllPurchases } from '@/lib/db/queries'
import { formatAmount, formatDate } from '@/lib/format'
import styles from '@/components/admin/Admin.module.css'

export const dynamic = 'force-dynamic'

export default async function AdminPurchasesPage() {
  const purchases = await getAllPurchases()

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Purchases</h1>
      </div>

      {purchases.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id}>
                  <td>{formatDate(p.purchasedAt)}</td>
                  <td>{p.courseTitle}</td>
                  <td>{p.userName || '—'}</td>
                  <td>{p.userEmail}</td>
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
