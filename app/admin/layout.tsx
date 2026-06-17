import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/admin'
import styles from '@/components/admin/Admin.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Middleware already gates /admin, but guard here too as defence in depth.
  if (!(await isAdmin())) {
    notFound()
  }

  return (
    <div className={styles.shell}>
      <nav className={styles.adminNav}>
        <Link href="/admin" className={styles.adminNavLink}>
          Overview
        </Link>
        <Link href="/admin/courses" className={styles.adminNavLink}>
          Courses
        </Link>
        <Link href="/admin/purchases" className={styles.adminNavLink}>
          Purchases
        </Link>
      </nav>
      {children}
    </div>
  )
}
