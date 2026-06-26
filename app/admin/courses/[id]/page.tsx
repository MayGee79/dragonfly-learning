import Link from 'next/link'
import { notFound } from 'next/navigation'
import CourseForm from '@/components/admin/CourseForm'
import { getCourseById } from '@/lib/db/queries'
import { isAdmin } from '@/lib/admin'
import { updateCourseAction } from '../actions'
import styles from '@/components/admin/Admin.module.css'

export const dynamic = 'force-dynamic'

export default async function EditCoursePage({ params }: { params: { id: string } }) {
  // Defence in depth: in addition to the admin layout and middleware gate.
  if (!(await isAdmin())) notFound()
  const course = await getCourseById(params.id)
  if (!course) {
    notFound()
  }

  return (
    <div>
      <Link href="/admin/courses" className={styles.backLink}>
        ← Back to courses
      </Link>
      <h1>Edit course</h1>
      <CourseForm
        action={updateCourseAction}
        course={course}
        submitLabel="Save changes"
        defaultLibraryId={process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}
      />
    </div>
  )
}
