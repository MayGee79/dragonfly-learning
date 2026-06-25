const LAUNCH_OFFER_SLUG = 'understanding-and-working-with-rejection-sensitive-dysphoria'
const LAUNCH_OFFER_END = new Date('2026-07-10T23:59:59.999+01:00')

export const LAUNCH_OFFER_BADGE = 'Half Price until 10/07/2026'
export const LAUNCH_OFFER_FULL_PRICE_PENCE = 1500

export function isLaunchOfferActive(course: { slug: string }): boolean {
  if (course.slug !== LAUNCH_OFFER_SLUG) return false
  return Date.now() <= LAUNCH_OFFER_END.getTime()
}

export function getLaunchOfferBadge(course: { slug: string }): string | null {
  return isLaunchOfferActive(course) ? LAUNCH_OFFER_BADGE : null
}
