'use client'

import Link from 'next/link'
import styles from './PurchaseConsent.module.css'

interface PurchaseConsentProps {
  isPaid: boolean
  acceptTerms: boolean
  onAcceptTermsChange: (value: boolean) => void
  newsletter: boolean
  onNewsletterChange: (value: boolean) => void
  immediateAccess: boolean
  onImmediateAccessChange: (value: boolean) => void
}

export default function PurchaseConsent({
  isPaid,
  acceptTerms,
  onAcceptTermsChange,
  newsletter,
  onNewsletterChange,
  immediateAccess,
  onImmediateAccessChange,
}: PurchaseConsentProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Before you continue</legend>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => onAcceptTermsChange(e.target.checked)}
          required
        />
        <span>
          I have read and agree to the{' '}
          <Link href="/terms" target="_blank" rel="noopener noreferrer">
            Learning Terms and Conditions
          </Link>{' '}
          and the{' '}
          <Link href="/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Notice
          </Link>
          . <span className={styles.required}>(required)</span>
        </span>
      </label>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={newsletter}
          onChange={(e) => onNewsletterChange(e.target.checked)}
        />
        <span>
          I would like to receive the Dragonfly newsletter, with occasional updates on new CPD,
          resources, and reflections (roughly monthly). I can unsubscribe at any time.{' '}
          <span className={styles.optional}>(optional)</span>
        </span>
      </label>

      {isPaid && (
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={immediateAccess}
            onChange={(e) => onImmediateAccessChange(e.target.checked)}
          />
          <span>
            I want access to my CPD content to be made available immediately, and I understand that
            by doing so I lose my 14-day right to cancel this purchase. (My statutory rights if the
            content is faulty or not as described are unaffected.){' '}
            <span className={styles.optional}>(optional: leave unticked to keep your 14-day cancellation right)</span>
          </span>
        </label>
      )}
    </fieldset>
  )
}
