import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import FeedbackForm from './FeedbackForm'
import { feedbackGateForCourse } from './actions'
import styles from './Feedback.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Session feedback',
  robots: { index: false, follow: false },
}

export default async function FeedbackPage({ params }: { params: { slug: string } }) {
  const gate = await feedbackGateForCourse(params.slug)

  if ('notFound' in gate && gate.notFound) notFound()
  if ('redirectToSignIn' in gate && gate.redirectToSignIn) {
    redirect(`/sign-in?redirect_url=/courses/${params.slug}/feedback`)
  }
  if ('redirectToWatch' in gate && gate.redirectToWatch) {
    redirect(`/courses/${params.slug}/watch`)
  }
  if ('redirectToCertificate' in gate && gate.redirectToCertificate) {
    redirect(`/courses/${params.slug}/certificate`)
  }

  const { course, userEmail } = gate

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={`/courses/${params.slug}/watch`} className={styles.back}>
          ← Back to session
        </Link>
        <h1 className={styles.title}>CPD session feedback</h1>
      </header>
      <FeedbackForm slug={params.slug} courseTitle={course.title} defaultEmail={userEmail || ''} />
    </div>
  )
}
