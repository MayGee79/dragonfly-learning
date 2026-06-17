import Link from 'next/link'
import CourseForm from '@/components/admin/CourseForm'
import { createCourseAction } from '../actions'
import styles from '@/components/admin/Admin.module.css'

export const dynamic = 'force-dynamic'

export default function NewCoursePage() {
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
