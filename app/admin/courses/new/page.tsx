import Link from 'next/link'
import { notFound } from 'next/navigation'
import CourseForm from '@/components/admin/CourseForm'
import { isAdmin } from '@/lib/admin'
import { createCourseAction } from '../actions'
import styles from '@/components/admin/Admin.module.css'

export const dynamic = 'force-dynamic'

export default async function NewCoursePage() {
  // Defence in depth: in addition to the admin layout and middleware gate.
  if (!(await isAdmin())) notFound()
  return (
    <div>
      <Link href="/admin/courses" className={styles.backLink}>
        ← Back to courses
      </Link>
      <h1>New course</h1>
      <CourseForm
        action={createCourseAction}
        submitLabel="Create course"
        defaultLibraryId={process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}
      />
    </div>
  )
}
