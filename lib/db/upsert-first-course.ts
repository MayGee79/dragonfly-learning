/**
 * Upsert the first live course (title matches Bunny + slide).
 * Run: npm run db:upsert-first-course (with POSTGRES_URL in the environment)
 */
import { eq, inArray } from 'drizzle-orm'
import { db } from './index'
import { courses } from './schema'

const slug = 'understanding-and-working-with-rejection-sensitive-dysphoria'
const legacySlugs = ['regulation-beyond-stillness', 'understanding-rejection-sensitive-dysphoria']
const DEFAULT_BUNNY_LIBRARY_ID = '685498'
const DEFAULT_BUNNY_VIDEO_ID = '4fd44592-36e4-4d8c-94c9-0d142e17e463'
const THUMBNAIL_URL = '/images/understanding-rejection-sensitive-dysphoria.png'

const title = 'Understanding and Working with Rejection Sensitive Dysphoria'

const description =
  'This on-demand CPD course explores Rejection Sensitive Dysphoria (RSD), the intense emotional response to perceived or actual rejection, criticism or failure that is frequently experienced by neurodivergent clients. Designed for counsellors, psychotherapists and allied health professionals, it covers how to recognise RSD, understand its roots, and work with it therapeutically. On completion you will receive a certificate for your CPD records.'

const longDescription = [
  '## Launch pricing',
  '',
  '**£7 for the first two weeks after this course goes live — then £15.**',
].join('\n')

async function main() {
  if (!process.env.POSTGRES_URL) {
    console.error('POSTGRES_URL is not set.')
    process.exit(1)
  }

  const legacy = await db.select().from(courses).where(inArray(courses.slug, legacySlugs))
  const canonical =
    legacy.find((c) => c.slug === 'regulation-beyond-stillness') ??
    legacy.find((c) => c.slug === slug) ??
    legacy[0]

  const bunnyLibraryId =
    process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID?.trim() ||
    canonical?.bunnyLibraryId ||
    DEFAULT_BUNNY_LIBRARY_ID
  const bunnyVideoId =
    process.env.BUNNY_FIRST_VIDEO_ID?.trim() || canonical?.bunnyVideoId || DEFAULT_BUNNY_VIDEO_ID

  const values = {
    title,
    slug,
    description,
    longDescription,
    pricePence: 700,
    durationMinutes: 60,
    cpdHours: '1.0',
    bunnyVideoId,
    bunnyLibraryId,
    thumbnailUrl: THUMBNAIL_URL,
    status: 'published' as const,
    sortOrder: 0,
    updatedAt: new Date(),
  }

  if (canonical) {
    await db.update(courses).set(values).where(eq(courses.id, canonical.id))
    console.log(`Updated course: ${title}`)
  } else {
    await db.insert(courses).values(values)
    console.log(`Created course: ${title}`)
  }

  const stale = legacy.filter((c) => c.slug !== slug && c.id !== canonical?.id)
  for (const course of stale) {
    await db
      .update(courses)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(courses.id, course.id))
    console.log(`Archived legacy course: ${course.slug}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Upsert failed:', e)
    process.exit(1)
  })
