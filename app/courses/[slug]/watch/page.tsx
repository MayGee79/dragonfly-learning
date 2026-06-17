import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getCompletion, getCourseBySlug, hasAccess } from '@/lib/db/queries'
import { resolveLibraryId } from '@/lib/bunny'
import VideoPlayer from '@/components/VideoPlayer'
import styles from './Watch.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Watch',
  robots: { index: false, follow: false },
}

export default async function WatchPage({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug)
  if (!course) {
    notFound()
  }

  const { userId } = await auth()
  if (!userId) {
    redirect(`/sign-in?redirect_url=/courses/${params.slug}/watch`)
  }

  if (!(await hasAccess(userId, course.id))) {
    redirect(`/courses/${course.slug}`)
  }

  const completion = await getCompletion(userId, course.id)
  const libraryId = resolveLibraryId(course.bunnyLibraryId)
  const requiresFeedback = course.pricePence > 0 && !completion?.feedbackSubmittedAt
  const nextStepHref = requiresFeedback
    ? `/courses/${course.slug}/feedback`
    : `/courses/${course.slug}/certificate`
  const nextStepLabel = requiresFeedback ? 'Complete feedback for certificate' : 'Download certificate'

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.back}>
          ← My Learning
        </Link>
        <h1 className={styles.title}>{course.title}</h1>
      </div>

      {course.bunnyVideoId && libraryId ? (
        <VideoPlayer
          libraryId={libraryId}
          videoId={course.bunnyVideoId}
          courseId={course.id}
          slug={course.slug}
          initialPercent={completion?.watchProgressPercent ?? 0}
          initialCompleted={completion?.completed ?? false}
          nextStepHref={nextStepHref}
          nextStepLabel={nextStepLabel}
        />
      ) : (
        <div className={styles.notReady}>
          <p>This course video is being prepared and will be available soon.</p>
        </div>
      )}
    </div>
  )
}
