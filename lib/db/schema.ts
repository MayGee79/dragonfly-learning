import { sql } from 'drizzle-orm'
import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const courseStatus = ['draft', 'published', 'archived'] as const
export const purchaseStatus = ['pending', 'completed', 'refunded'] as const
export const feedbackAudience = ['professional', 'personal'] as const
export const feedbackQuoteConsent = ['yes', 'no'] as const

export const courses = pgTable('courses', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  longDescription: text('long_description').notNull().default(''),
  pricePence: integer('price_pence').notNull().default(0),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  cpdHours: decimal('cpd_hours', { precision: 3, scale: 1 }).notNull().default('1.0'),
  bunnyVideoId: text('bunny_video_id'),
  bunnyLibraryId: text('bunny_library_id'),
  thumbnailUrl: text('thumbnail_url'),
  status: text('status', { enum: courseStatus }).notNull().default('draft'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const purchases = pgTable(
  'purchases',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    clerkUserId: text('clerk_user_id').notNull(),
    userEmail: text('user_email').notNull(),
    userName: text('user_name'),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    amountPence: integer('amount_pence').notNull().default(0),
    status: text('status', { enum: purchaseStatus }).notNull().default('pending'),
    immediateAccessWaiver: boolean('immediate_access_waiver').notNull().default(true),
    accessAvailableAt: timestamp('access_available_at', { withTimezone: true }),
    newsletterOptIn: boolean('newsletter_opt_in').notNull().default(false),
    purchasedAt: timestamp('purchased_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    clerkUserIdx: index('purchases_clerk_user_idx').on(table.clerkUserId),
    courseIdx: index('purchases_course_idx').on(table.courseId),
    // One completed purchase per user + course (allows retrying failed/pending ones).
    uniqueCompleted: uniqueIndex('purchases_user_course_completed_unique')
      .on(table.clerkUserId, table.courseId)
      .where(sql`status = 'completed'`),
  }),
)

export const completions = pgTable(
  'completions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    clerkUserId: text('clerk_user_id').notNull(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    watchProgressPercent: integer('watch_progress_percent').notNull().default(0),
    completed: boolean('completed').notNull().default(false),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    feedbackSubmittedAt: timestamp('feedback_submitted_at', { withTimezone: true }),
    certificateName: text('certificate_name'),
    professionalRegistration: text('professional_registration'),
    certificateDownloaded: boolean('certificate_downloaded').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userCourseUnique: uniqueIndex('completions_user_course_unique').on(
      table.clerkUserId,
      table.courseId,
    ),
  }),
)

export const feedbackSubmissions = pgTable(
  'feedback_submissions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    clerkUserId: text('clerk_user_id').notNull(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    certificateName: text('certificate_name').notNull(),
    email: text('email').notNull(),
    audienceType: text('audience_type', { enum: feedbackAudience }).notNull(),
    profession: text('profession'),
    registrationNumber: text('registration_number'),
    ratingOverall: integer('rating_overall').notNull(),
    ratingLearningAims: integer('rating_learning_aims').notNull(),
    ratingClarity: integer('rating_clarity').notNull(),
    ratingLikelyUse: integer('rating_likely_use').notNull(),
    mostUseful: text('most_useful').notNull(),
    couldImprove: text('could_improve'),
    futureTopic: text('future_topic'),
    otherNotes: text('other_notes'),
    newsletterOptIn: boolean('newsletter_opt_in').notNull().default(false),
    quoteConsent: text('quote_consent', { enum: feedbackQuoteConsent }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userCourseUnique: uniqueIndex('feedback_submissions_user_course_unique').on(
      table.clerkUserId,
      table.courseId,
    ),
  }),
)

// Explicit dedupe ledger for Stripe webhook events. Complements the unique
// indexes above: once an event id (evt_xxx) is recorded, a retry of the same
// event is acknowledged and skipped rather than reprocessed.
export const stripeEvents = pgTable('stripe_events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Course = typeof courses.$inferSelect
export type NewCourse = typeof courses.$inferInsert
export type Purchase = typeof purchases.$inferSelect
export type NewPurchase = typeof purchases.$inferInsert
export type Completion = typeof completions.$inferSelect
export type NewCompletion = typeof completions.$inferInsert
export type FeedbackSubmission = typeof feedbackSubmissions.$inferSelect
export type NewFeedbackSubmission = typeof feedbackSubmissions.$inferInsert
export type StripeEvent = typeof stripeEvents.$inferSelect
export type NewStripeEvent = typeof stripeEvents.$inferInsert
