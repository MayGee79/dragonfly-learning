import { and, count, desc, eq, sum } from 'drizzle-orm'
import { db } from './index'
import {
  completions,
  courses,
  feedbackSubmissions,
  purchases,
  stripeEvents,
  type Completion,
  type Course,
  type FeedbackSubmission,
  type NewCourse,
  type NewFeedbackSubmission,
} from './schema'

export const COMPLETION_THRESHOLD = 90
export const ACCESS_DELAY_DAYS = 14
export const ACCESS_PERIOD_MONTHS = 12

/** True when an error is a Postgres unique-constraint violation (code 23505). */
export function isUniqueViolation(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false
  const candidate = e as { code?: unknown; message?: unknown }
  if (candidate.code === '23505') return true
  return typeof candidate.message === 'string' && /duplicate key value/i.test(candidate.message)
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/* ---------- Courses (public) ---------- */

export async function getPublishedCourses(): Promise<Course[]> {
  return db
    .select()
    .from(courses)
    .where(eq(courses.status, 'published'))
    .orderBy(courses.sortOrder, desc(courses.createdAt))
}

export async function getFeaturedCourses(limit = 3): Promise<Course[]> {
  return db
    .select()
    .from(courses)
    .where(eq(courses.status, 'published'))
    .orderBy(desc(courses.createdAt))
    .limit(limit)
}

export async function getCourseBySlug(slug: string): Promise<Course | undefined> {
  const rows = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1)
  return rows[0]
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  const rows = await db.select().from(courses).where(eq(courses.id, id)).limit(1)
  return rows[0]
}

/* ---------- Courses (admin) ---------- */

export async function getAllCourses(): Promise<Course[]> {
  return db.select().from(courses).orderBy(courses.sortOrder, desc(courses.createdAt))
}

export async function createCourse(data: NewCourse): Promise<Course> {
  const rows = await db.insert(courses).values(data).returning()
  return rows[0]
}

export async function updateCourse(id: string, data: Partial<NewCourse>): Promise<Course | undefined> {
  const rows = await db
    .update(courses)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(courses.id, id))
    .returning()
  return rows[0]
}

export async function deleteCourse(id: string): Promise<void> {
  await db.delete(courses).where(eq(courses.id, id))
}

/* ---------- Access / purchases ---------- */

export type AccessInfo = {
  hasAccess: boolean
  accessAvailableAt: Date | null
  immediateAccessWaiver: boolean
}

function resolveAccessAvailableAt(
  purchasedAt: Date,
  accessAvailableAt: Date | null,
): Date {
  return accessAvailableAt ?? purchasedAt
}

export async function getAccessInfo(clerkUserId: string, courseId: string): Promise<AccessInfo | null> {
  const rows = await db
    .select({
      purchasedAt: purchases.purchasedAt,
      accessAvailableAt: purchases.accessAvailableAt,
      immediateAccessWaiver: purchases.immediateAccessWaiver,
    })
    .from(purchases)
    .where(
      and(
        eq(purchases.clerkUserId, clerkUserId),
        eq(purchases.courseId, courseId),
        eq(purchases.status, 'completed'),
      ),
    )
    .limit(1)

  const row = rows[0]
  if (!row) return null

  const availableAt = resolveAccessAvailableAt(row.purchasedAt, row.accessAvailableAt)
  return {
    hasAccess: new Date() >= availableAt,
    accessAvailableAt: availableAt,
    immediateAccessWaiver: row.immediateAccessWaiver,
  }
}

export async function hasAccess(clerkUserId: string, courseId: string): Promise<boolean> {
  const info = await getAccessInfo(clerkUserId, courseId)
  return info?.hasAccess ?? false
}

/** True when the user has a completed purchase row for this course. */
export async function hasCompletedPurchase(
  clerkUserId: string,
  courseId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: purchases.id })
    .from(purchases)
    .where(
      and(
        eq(purchases.clerkUserId, clerkUserId),
        eq(purchases.courseId, courseId),
        eq(purchases.status, 'completed'),
      ),
    )
    .limit(1)
  return rows.length > 0
}

export function accessAvailableFromPurchase(
  purchasedAt: Date,
  immediateAccessWaiver: boolean,
): Date {
  if (immediateAccessWaiver) return purchasedAt
  const available = new Date(purchasedAt)
  available.setDate(available.getDate() + ACCESS_DELAY_DAYS)
  return available
}

export type DashboardCourse = {
  course: Course
  completion: Completion | null
  accessInfo: AccessInfo
}

export async function getUserDashboard(clerkUserId: string): Promise<DashboardCourse[]> {
  const owned = await db
    .select({ course: courses })
    .from(purchases)
    .innerJoin(courses, eq(purchases.courseId, courses.id))
    .where(and(eq(purchases.clerkUserId, clerkUserId), eq(purchases.status, 'completed')))
    .orderBy(desc(purchases.purchasedAt))

  const result: DashboardCourse[] = []
  for (const { course } of owned) {
    const completion = await getCompletion(clerkUserId, course.id)
    const accessInfo = (await getAccessInfo(clerkUserId, course.id)) ?? {
      hasAccess: false,
      accessAvailableAt: null,
      immediateAccessWaiver: true,
    }
    result.push({ course, completion: completion ?? null, accessInfo })
  }
  return result
}

/* ---------- Completions ---------- */

export async function getCompletion(
  clerkUserId: string,
  courseId: string,
): Promise<Completion | undefined> {
  const rows = await db
    .select()
    .from(completions)
    .where(and(eq(completions.clerkUserId, clerkUserId), eq(completions.courseId, courseId)))
    .limit(1)
  return rows[0]
}

export async function upsertProgress(
  clerkUserId: string,
  courseId: string,
  progressPercent: number,
): Promise<Completion> {
  const clamped = Math.max(0, Math.min(100, Math.round(progressPercent)))
  const isComplete = clamped >= COMPLETION_THRESHOLD
  const existing = await getCompletion(clerkUserId, courseId)

  if (!existing) {
    const rows = await db
      .insert(completions)
      .values({
        clerkUserId,
        courseId,
        watchProgressPercent: clamped,
        completed: isComplete,
        completedAt: isComplete ? new Date() : null,
      })
      .returning()
    return rows[0]
  }

  // Never let progress regress; lock completion once reached.
  const nextProgress = Math.max(existing.watchProgressPercent, clamped)
  const nextCompleted = existing.completed || isComplete
  const rows = await db
    .update(completions)
    .set({
      watchProgressPercent: nextProgress,
      completed: nextCompleted,
      completedAt: nextCompleted ? existing.completedAt ?? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(completions.id, existing.id))
    .returning()
  return rows[0]
}

export async function ensureCompletionRow(clerkUserId: string, courseId: string): Promise<void> {
  const existing = await getCompletion(clerkUserId, courseId)
  if (!existing) {
    await db.insert(completions).values({ clerkUserId, courseId }).onConflictDoNothing()
  }
}

export async function markCertificateDownloaded(clerkUserId: string, courseId: string): Promise<void> {
  await db
    .update(completions)
    .set({ certificateDownloaded: true, updatedAt: new Date() })
    .where(and(eq(completions.clerkUserId, clerkUserId), eq(completions.courseId, courseId)))
}

export async function canDownloadCertificate(
  clerkUserId: string,
  course: Course,
): Promise<boolean> {
  if (course.pricePence <= 0) return false
  const completion = await getCompletion(clerkUserId, course.id)
  return completion?.completed ?? false
}

export async function getFeedbackSubmission(
  clerkUserId: string,
  courseId: string,
): Promise<FeedbackSubmission | undefined> {
  const rows = await db
    .select()
    .from(feedbackSubmissions)
    .where(and(eq(feedbackSubmissions.clerkUserId, clerkUserId), eq(feedbackSubmissions.courseId, courseId)))
    .limit(1)
  return rows[0]
}

export async function submitFeedback(data: NewFeedbackSubmission): Promise<FeedbackSubmission> {
  const rows = await db.insert(feedbackSubmissions).values(data).returning()
  const submission = rows[0]

  await db
    .update(completions)
    .set({
      feedbackSubmittedAt: submission.submittedAt,
      certificateName: submission.certificateName,
      professionalRegistration: submission.registrationNumber,
      updatedAt: new Date(),
    })
    .where(and(eq(completions.clerkUserId, data.clerkUserId), eq(completions.courseId, data.courseId)))

  return submission
}

/* ---------- Stripe event idempotency ledger ---------- */

/** True when this Stripe event id has already been processed and recorded. */
export async function wasStripeEventProcessed(eventId: string): Promise<boolean> {
  const rows = await db
    .select({ id: stripeEvents.id })
    .from(stripeEvents)
    .where(eq(stripeEvents.id, eventId))
    .limit(1)
  return rows.length > 0
}

/** Records a processed Stripe event id. Safe to call more than once. */
export async function recordStripeEvent(eventId: string, eventType: string): Promise<void> {
  await db
    .insert(stripeEvents)
    .values({ id: eventId, type: eventType })
    .onConflictDoNothing()
}

/* ---------- Admin stats ---------- */

export async function getAdminOverview() {
  const [courseCountRow] = await db.select({ value: count() }).from(courses)
  const [purchaseCountRow] = await db
    .select({ value: count() })
    .from(purchases)
    .where(eq(purchases.status, 'completed'))
  const [revenueRow] = await db
    .select({ value: sum(purchases.amountPence) })
    .from(purchases)
    .where(eq(purchases.status, 'completed'))

  const recentPurchases = await db
    .select({
      id: purchases.id,
      userEmail: purchases.userEmail,
      userName: purchases.userName,
      amountPence: purchases.amountPence,
      status: purchases.status,
      purchasedAt: purchases.purchasedAt,
      courseTitle: courses.title,
    })
    .from(purchases)
    .innerJoin(courses, eq(purchases.courseId, courses.id))
    .orderBy(desc(purchases.purchasedAt))
    .limit(10)

  return {
    courseCount: courseCountRow?.value ?? 0,
    purchaseCount: purchaseCountRow?.value ?? 0,
    revenuePence: Number(revenueRow?.value ?? 0),
    recentPurchases,
  }
}

export async function getAllPurchases() {
  return db
    .select({
      id: purchases.id,
      userEmail: purchases.userEmail,
      userName: purchases.userName,
      amountPence: purchases.amountPence,
      status: purchases.status,
      stripeCheckoutSessionId: purchases.stripeCheckoutSessionId,
      purchasedAt: purchases.purchasedAt,
      courseTitle: courses.title,
    })
    .from(purchases)
    .innerJoin(courses, eq(purchases.courseId, courses.id))
    .orderBy(desc(purchases.purchasedAt))
}
