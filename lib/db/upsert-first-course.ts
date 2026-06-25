/**
 * Upsert the first live course: Regulation Beyond Stillness.
 * Run: npm run db:upsert-first-course (with POSTGRES_URL in the environment)
 */
import { eq } from 'drizzle-orm'
import { db } from './index'
import { courses } from './schema'

const slug = 'regulation-beyond-stillness'
const DEFAULT_BUNNY_LIBRARY_ID = '685498'
const DEFAULT_BUNNY_VIDEO_ID = '4fd44592-36e4-4d8c-94c9-0d142e17e463'
const THUMBNAIL_URL = '/images/regulation-beyond-stillness.png'

const description =
  'A guide to grounding and self-regulation — practical tools when stillness and breathwork are not the right fit. **Launch offer: £7 for the first two weeks — then £15.**'

const longDescription = [
  '## Launch pricing',
  '',
  '**£7 for the first two weeks after this course goes live — then £15.**',
  '',
  '## About this session',
  '',
  'An on-demand CPD session from Dr Victoria Froome on grounding and self-regulation — for therapists, counsellors, and anyone supporting neurodivergent clients.',
  '',
  '## The core idea',
  '',
  'Regulation is not necessarily about quieting the brain. It is about giving the brain the right kind of input, or the right kind of job.',
  '',
  '## What you will explore',
  '',
  '- Movement as regulation',
  '- Strong sensory input',
  '- Giving the brain a job',
  '- Bilateral and rhythmic input',
  '- Stimming as regulation',
  '- Co-regulation and environment-first strategies',
  '- Matching tools to activation, shutdown, rumination, and sensory overload',
  '',
  'Watch at least **90%** of the video to complete the session and download your CPD certificate.',
].join('\n')

async function main() {
  if (!process.env.POSTGRES_URL) {
    console.error('POSTGRES_URL is not set.')
    process.exit(1)
  }

  const existing = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1)

  const bunnyLibraryId =
    process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID?.trim() || existing[0]?.bunnyLibraryId || DEFAULT_BUNNY_LIBRARY_ID
  const bunnyVideoId =
    process.env.BUNNY_FIRST_VIDEO_ID?.trim() || existing[0]?.bunnyVideoId || DEFAULT_BUNNY_VIDEO_ID

  const values = {
    title: 'Regulation Beyond Stillness',
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

  if (existing.length > 0) {
    await db.update(courses).set(values).where(eq(courses.slug, slug))
    console.log(`Updated course: ${slug} (£7 launch, published)`)
  } else {
    await db.insert(courses).values(values)
    console.log(`Created course: ${slug} (£7 launch, published)`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Upsert failed:', e)
    process.exit(1)
  })
