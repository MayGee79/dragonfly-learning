'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  canDownloadCertificate,
  getCompletion,
  getCourseBySlug,
  getFeedbackSubmission,
  hasAccess,
  submitFeedback,
} from '@/lib/db/queries'
import { feedbackAudience, feedbackQuoteConsent } from '@/lib/db/schema'
import { getCurrentUserInfo } from '@/lib/user'
import { subscribeToMailerLite } from '@/lib/mailerlite'

function parseRating(value: FormDataEntryValue | null): number {
  const n = parseInt(String(value || ''), 10)
  if (Number.isNaN(n) || n < 1 || n > 5) throw new Error('Please choose a rating from 1 to 5.')
  return n
}

function parseAudience(value: FormDataEntryValue | null): (typeof feedbackAudience)[number] {
  const v = String(value || '')
  if ((feedbackAudience as readonly string[]).includes(v)) {
    return v as (typeof feedbackAudience)[number]
  }
  throw new Error('Please choose how you are completing this session.')
}

function parseQuoteConsent(value: FormDataEntryValue | null): (typeof feedbackQuoteConsent)[number] | null {
  const v = String(value || '')
  if (!v) return null
  if ((feedbackQuoteConsent as readonly string[]).includes(v)) {
    return v as (typeof feedbackQuoteConsent)[number]
  }
  return null
}

export async function submitFeedbackAction(formData: FormData): Promise<void> {
  const user = await getCurrentUserInfo()
  if (!user?.email) {
    throw new Error('You must be signed in with an email address.')
  }

  const slug = String(formData.get('slug') || '')
  const course = await getCourseBySlug(slug)
  if (!course) throw new Error('Course not found.')

  if (!(await hasAccess(user.userId, course.id))) {
    throw new Error('You do not have access to this course.')
  }

  const completion = await getCompletion(user.userId, course.id)
  if (!completion?.completed) {
    throw new Error('Please complete the session before submitting feedback.')
  }

  if (await getFeedbackSubmission(user.userId, course.id)) {
    redirect(`/courses/${slug}/certificate`)
  }

  if (formData.get('completedConfirmation') !== 'on') {
    throw new Error('Please confirm that you have completed this session in full.')
  }

  const certificateName = String(formData.get('certificateName') || '').trim()
  if (!certificateName) throw new Error('Please enter your full name for the certificate.')

  const email = String(formData.get('email') || '').trim()
  if (!email) throw new Error('Please enter your email address.')

  const audienceType = parseAudience(formData.get('audienceType'))
  const profession =
    audienceType === 'professional' ? String(formData.get('profession') || '').trim() || null : null
  const registrationNumber =
    audienceType === 'professional'
      ? String(formData.get('registrationNumber') || '').trim() || null
      : null

  const newsletterOptIn = formData.get('newsletterOptIn') === 'on'

  const mostUseful = String(formData.get('mostUseful') || '').trim()
  if (!mostUseful) throw new Error('Please share one thing you found most useful.')

  await submitFeedback({
    clerkUserId: user.userId,
    courseId: course.id,
    certificateName,
    email,
    audienceType,
    profession,
    registrationNumber,
    ratingOverall: parseRating(formData.get('ratingOverall')),
    ratingLearningAims: parseRating(formData.get('ratingLearningAims')),
    ratingClarity: parseRating(formData.get('ratingClarity')),
    ratingLikelyUse: parseRating(formData.get('ratingLikelyUse')),
    mostUseful,
    couldImprove: String(formData.get('couldImprove') || '').trim() || null,
    futureTopic: String(formData.get('futureTopic') || '').trim() || null,
    otherNotes: String(formData.get('otherNotes') || '').trim() || null,
    newsletterOptIn,
    quoteConsent: parseQuoteConsent(formData.get('quoteConsent')),
  })

  if (newsletterOptIn) {
    const nameParts = certificateName.split(/\s+/)
    const firstName = nameParts[0] || certificateName
    const result = await subscribeToMailerLite({ email, firstName })
    if (!result.ok) {
      console.error('[feedback] MailerLite subscribe failed:', result.error, { email, courseId: course.id })
    }
  }

  revalidatePath(`/courses/${slug}/certificate`)
  revalidatePath('/certificates')
  revalidatePath('/dashboard')
  redirect(newsletterOptIn ? `/courses/${slug}/certificate?newsletter=1` : `/courses/${slug}/certificate`)
}

export async function feedbackGateForCourse(slug: string) {
  const user = await getCurrentUserInfo()
  if (!user) return { redirectToSignIn: true as const }

  const course = await getCourseBySlug(slug)
  if (!course) return { notFound: true as const }

  const completion = await getCompletion(user.userId, course.id)
  if (!completion?.completed) {
    return { redirectToWatch: true as const, course }
  }

  const existing = await getFeedbackSubmission(user.userId, course.id)
  if (existing || (await canDownloadCertificate(user.userId, course))) {
    return { redirectToCertificate: true as const, course }
  }

  return {
    ready: true as const,
    course,
    userEmail: user.email,
    userName: user.name,
  }
}
