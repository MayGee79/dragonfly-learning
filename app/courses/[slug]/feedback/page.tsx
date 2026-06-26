import { redirect } from 'next/navigation'
import { getCourseBySlug } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function FeedbackPage({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug)
  if (!course) {
    redirect('/courses')
  }

  redirect(`/courses/${course.slug}/certificate`)
}
