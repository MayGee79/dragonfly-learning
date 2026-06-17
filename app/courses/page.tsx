import type { Metadata } from 'next'
import type { Course } from '@/lib/db/schema'
import { getPublishedCourses } from '@/lib/db/queries'
import CourseCard from '@/components/CourseCard'
import styles from './Courses.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Learning',
  description: 'Browse on-demand CPD courses from Dragonfly Learning.',
}

async function loadCourses(): Promise<Course[]> {
  try {
    return await getPublishedCourses()
  } catch (e) {
    console.error('[courses] failed to load courses:', e)
    return []
  }
}

export default async function CoursesPage() {
  const courses = await loadCourses()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Learning</h1>
        <p>On-demand CPD sessions you can watch at your own pace.</p>
      </header>

      {courses.length > 0 ? (
        <div className={styles.grid}>
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          There are no published courses just yet. Please check back soon.
        </p>
      )}
    </div>
  )
}
