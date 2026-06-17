/**
 * Seed a single draft course so the app has something to show in development.
 *
 * Run after your Postgres env vars are available locally, e.g.:
 *   vercel env pull .env.local
 *   node --env-file=.env.local node_modules/.bin/tsx lib/db/seed.ts
 * or simply:
 *   npm run db:seed   (with env already loaded into the shell)
 */
import { eq } from 'drizzle-orm'
import { db } from './index'
import { courses } from './schema'

async function main() {
  if (!process.env.POSTGRES_URL && !process.env.POSTGRES_URL_NON_POOLING) {
    console.error('POSTGRES_URL is not set. Run `vercel env pull .env.local` first.')
    process.exit(1)
  }

  const slug = 'understanding-rejection-sensitive-dysphoria'
  const existing = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1)
  if (existing.length > 0) {
    console.log(`Course "${slug}" already exists — nothing to seed.`)
    return
  }

  await db.insert(courses).values({
    title: 'Understanding Rejection Sensitive Dysphoria',
    slug,
    description:
      'A practical introduction to recognising and supporting Rejection Sensitive Dysphoria (RSD) in clinical work.',
    longDescription: [
      '## What this session covers',
      '',
      'This on-demand session introduces Rejection Sensitive Dysphoria (RSD) and how it shows up in everyday life and in the therapy room.',
      '',
      '- What RSD is and how it relates to ADHD and neurodivergence',
      '- How to recognise the signs with clients',
      '- Practical, compassionate approaches you can use straight away',
      '',
      'You will receive a **certificate of completion** once you have watched 90% of the video.',
    ].join('\n'),
    pricePence: 0,
    durationMinutes: 60,
    cpdHours: '1.0',
    status: 'draft',
    sortOrder: 0,
  })

  console.log(`Seeded draft course: ${slug}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
