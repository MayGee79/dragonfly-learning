const LAUNCH_OFFER_SLUG = 'understanding-and-working-with-rejection-sensitive-dysphoria'
const LAUNCH_OFFER_END = new Date('2026-11-27T23:59:59.999+00:00')

export const LAUNCH_OFFER_BADGE = '50% off until 27/11/2026'
export const LAUNCH_OFFER_FULL_PRICE_PENCE = 1500
export const LAUNCH_OFFER_SALE_PRICE_PENCE = 750

type PricedCourse = { slug: string; pricePence: number }

export function isLaunchOfferActive(course: { slug: string }): boolean {
  if (course.slug !== LAUNCH_OFFER_SLUG) return false
  return Date.now() <= LAUNCH_OFFER_END.getTime()
}

export function getLaunchOfferBadge(course: { slug: string }): string | null {
  return isLaunchOfferActive(course) ? LAUNCH_OFFER_BADGE : null
}

/** Price charged and shown now. Sale price until 27 Nov, then the course list price (or £15 if the DB was left on the sale amount). */
export function getPayablePricePence(course: PricedCourse): number {
  if (course.slug !== LAUNCH_OFFER_SLUG) return course.pricePence
  if (isLaunchOfferActive(course)) return LAUNCH_OFFER_SALE_PRICE_PENCE
  if (course.pricePence === LAUNCH_OFFER_SALE_PRICE_PENCE) return LAUNCH_OFFER_FULL_PRICE_PENCE
  return course.pricePence
}
