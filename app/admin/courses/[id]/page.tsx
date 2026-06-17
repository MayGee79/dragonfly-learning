import Link from 'next/link'
import { notFound } from 'next/navigation'
import CourseForm from '@/components/admin/CourseForm'
import { getCourseById } from '@/lib/db/queries'
import { updateCourseAction } from '../actions'
import styles from '@/components/admin/Admin.module.css'

export const dynamic = 'force-dynamic'

export default async function EditCoursePage({ params }: { params: { id: string } }) {
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
