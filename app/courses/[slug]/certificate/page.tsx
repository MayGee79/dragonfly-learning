import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { canDownloadCertificate, getCompletion, getCourseBySlug } from '@/lib/db/queries'
import { formatCertificateReference } from '@/lib/certificate'
import { formatDate } from '@/lib/format'
import styles from './Certificate.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Certificate',
  robots: { index: false, follow: false },
}

export default async function CertificatePage({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug)
  if (!course) {
    notFound()
  }

  const { userId } = await auth()
  if (!userId) {
    redirect(`/sign-in?redirect_url=/courses/${params.slug}/certificate`)
  }

  const completion = await getCompletion(userId, course.id)
  if (!completion || !completion.completed) {
    redirect(`/courses/${course.slug}/watch`)
  }

  if (!(await canDownloadCertificate(userId, course))) {
    redirect(`/courses/${course.slug}/feedback`)
  }

  const certRef = formatCertificateReference(completion.id)

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.tealBar} />
        <p className={styles.brand}>Dragonfly Learning</p>
        <h1 className={styles.heading}>Certificate of Completion</h1>
        <p className={styles.subtle}>You have completed</p>
        <p className={styles.courseTitle}>{course.title}</p>

        <div className={styles.meta}>
          <div>
            <span>CPD hours</span>
            <strong>{Number(course.cpdHours)}</strong>
          </div>
          <div>
            <span>Completed</span>
            <strong>{formatDate(completion.completedAt) || '—'}</strong>
          </div>
        </div>

        <a href={`/api/certificate/${course.id}`} className="btn-primary" download>
          Download PDF certificate
        </a>

        <p className={styles.note}>
          CPD hours are indicative. Please confirm suitability with your own professional body or employer.
        </p>
        <p className={styles.certId}>Certificate reference: {certRef}</p>

        <Link href="/dashboard" className={styles.back}>
          ← Back to My Learning
        </Link>
      </div>
    </div>
  )
}
