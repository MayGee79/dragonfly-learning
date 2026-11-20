const LAUNCH_OFFER_SLUG = 'understanding-and-working-with-rejection-sensitive-dysphoria'

export const LAUNCH_OFFER_BADGE = '50% off until 27/11/2026'
export const LAUNCH_OFFER_FULL_PRICE_PENCE = 1500

export function isLaunchOfferActive(course: { slug: string }): boolean {
  return course.slug === LAUNCH_OFFER_SLUG
}

export function getLaunchOfferBadge(course: { slug: string }): string | null {
  return isLaunchOfferActive(course) ? LAUNCH_OFFER_BADGE : null
}
