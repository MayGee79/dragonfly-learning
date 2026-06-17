import type { MetadataRoute } from 'next'
import { getPublishedCourses } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dragonflylearning.co.uk').replace(/\/$/, '')
  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/courses`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/faqs`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/cancellation`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const courses = await getPublishedCourses()
    for (const course of courses) {
      entries.push({
        url: `${base}/courses/${course.slug}`,
        lastModified: course.updatedAt ?? now,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  } catch (e) {
    console.error('[sitemap] failed to load courses:', e)
  }

  return entries
}
