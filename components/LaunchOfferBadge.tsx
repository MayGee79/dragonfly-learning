import { getLaunchOfferBadge } from '@/lib/launchOffer'
import styles from './LaunchOfferBadge.module.css'

export default function LaunchOfferBadge({ slug }: { slug: string }) {
  const label = getLaunchOfferBadge({ slug })
  if (!label) return null
  return <span className={styles.launchBadge}>{label}</span>
}
