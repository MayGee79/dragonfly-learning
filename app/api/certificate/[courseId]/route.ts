import { NextResponse } from 'next/server'
import {
  canDownloadCertificate,
  getCompletion,
  getCourseById,
  markCertificateDownloaded,
} from '@/lib/db/queries'
import { formatCertificateReference, generateCertificatePdf } from '@/lib/certificate'
import { getCurrentUserInfo } from '@/lib/user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { courseId: string } }) {
  try {
    const user = await getCurrentUserInfo()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const course = await getCourseById(params.courseId)
    if (!course) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 })
    }

    const completion = await getCompletion(user.userId, params.courseId)
    if (!completion || !completion.completed) {
      return NextResponse.json(
        { error: 'Certificate is available once you have completed the course.' },
        { status: 403 },
      )
    }

    if (!(await canDownloadCertificate(user.userId, course))) {
      return NextResponse.json(
        { error: 'Please complete the short feedback form before your certificate is issued.' },
        { status: 403 },
      )
    }

    const attendeeName = completion.certificateName || user.name || 'Course Attendee'
    const pdf = await generateCertificatePdf({
      attendeeName,
      courseTitle: course.title,
      cpdHours: Number(course.cpdHours),
      completedAt: completion.completedAt,
      certificateReference: formatCertificateReference(completion.id),
      professionalRegistration: completion.professionalRegistration,
      issuedAt: new Date(),
    })

    await markCertificateDownloaded(user.userId, params.courseId)

    const filename = `dragonfly-learning-certificate-${course.slug}.pdf`
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to generate certificate'
    console.error('[certificate]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
