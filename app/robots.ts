import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dragonflylearning.co.uk').replace(/\/$/, '')
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dashboard', '/sign-in', '/sign-up', '/api'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
