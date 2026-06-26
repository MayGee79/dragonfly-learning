import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllCourses } from '@/lib/db/queries'
import { isAdmin } from '@/lib/admin'
import { formatPrice } from '@/lib/format'
import { deleteCourseAction } from './actions'
import styles from '@/components/admin/Admin.module.css'

export const dynamic = 'force-dynamic'

export default async function AdminCoursesPage() {
  // Defence in depth: in addition to the admin layout and middleware gate.
  if (!(await isAdmin())) notFound()
  const courses = await getAllCourses()

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Courses</h1>
        <Link href="/admin/courses/new" className="btn-primary">
          New course
        </Link>
      </div>

      {courses.length > 0 ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Price</th>
                <th>Status</th>
                <th>Sort</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.title}</td>
                  <td>{formatPrice(course.pricePence)}</td>
                  <td>
                    <span className={`${styles.badge} ${badgeClass(course.status)}`}>{course.status}</span>
                  </td>
                  <td>{course.sortOrder}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <Link href={`/admin/courses/${course.id}`} className={styles.linkButton}>
                        Edit
                      </Link>
                      <Link href={`/courses/${course.slug}`} className={styles.linkButton} target="_blank">
                        View
                      </Link>
                      <form action={deleteCourseAction}>
                        <input type="hidden" name="id" value={course.id} />
                        <button type="submit" className={`${styles.linkButton} ${styles.danger}`}>
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.empty}>
          <p>No courses yet. Create your first course to get started.</p>
          <Link href="/admin/courses/new" className="btn-primary">
            New course
          </Link>
        </div>
      )}
    </div>
  )
}

function badgeClass(status: string): string {
  if (status === 'published') return styles.badgePublished
  if (status === 'archived') return styles.badgeArchived
  return styles.badgeDraft
}
