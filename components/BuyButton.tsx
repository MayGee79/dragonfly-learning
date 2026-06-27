'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { formatPrice } from '@/lib/format'
import PurchaseConsent from '@/components/PurchaseConsent'
import styles from './BuyButton.module.css'

export type BuyButtonState = 'signed-out' | 'buy' | 'free' | 'continue' | 'completed' | 'pending-access'

interface BuyButtonProps {
  state: BuyButtonState
  courseId: string
  slug: string
  pricePence: number
  accessAvailableAt?: string | null
  certificateHref?: string
}

export default function BuyButton({
  state,
  courseId,
  slug,
  pricePence,
  accessAvailableAt,
  certificateHref,
}: BuyButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [newsletter, setNewsletter] = useState(false)
  const [immediateAccess, setImmediateAccess] = useState(false)

  const watchUrl = `/courses/${slug}/watch`
  const isPaid = pricePence > 0

  async function startCheckout() {
    if (!acceptTerms) {
      setError('Please read and agree to the Terms and Privacy Notice before continuing.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          acceptTerms,
          newsletter,
          immediateAccess: isPaid ? immediateAccess : undefined,
        }),
      })
      const data = (await res.json()) as { url?: string; redirectUrl?: string; error?: string }
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.')
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      if (data.redirectUrl) {
        router.push(data.redirectUrl)
        return
      }
      throw new Error('No redirect returned.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed.')
      setLoading(false)
    }
  }

  if (state === 'signed-out') {
    const redirect = encodeURIComponent(`/courses/${slug}`)
    return (
      <div className={styles.wrapper}>
        <p className={styles.signInHint}>
          Sign in to continue. You&apos;ll then see terms and an optional newsletter tick box before
          {isPaid ? ' checkout' : ' registering'}.
        </p>
        <Link href={`/sign-in?redirect_url=${redirect}`} className="btn-primary">
          Sign in to {isPaid ? 'purchase' : 'register'}
        </Link>
      </div>
    )
  }

  if (state === 'pending-access') {
    const dateLabel = accessAvailableAt
      ? new Date(accessAvailableAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'soon'
    return (
      <div className={styles.wrapper}>
        <p className={styles.pending}>
          Your purchase is confirmed. Access will be available from <strong>{dateLabel}</strong> so
          your 14-day cancellation period is preserved. You may{' '}
          <Link href="/cancellation">cancel for a full refund</Link> before then.
        </p>
      </div>
    )
  }

  if (state === 'continue') {
    return (
      <Link href={watchUrl} className="btn-primary">
        Continue watching
      </Link>
    )
  }

  if (state === 'completed') {
    return (
      <div className={styles.group}>
        <Link href={watchUrl} className="btn-secondary">
          Watch again
        </Link>
        {certificateHref && (
          <Link href={certificateHref} className="btn-primary">
            Certificate
          </Link>
        )}
      </div>
    )
  }

  const label =
    state === 'free' ? 'Register and start watching (Free)' : `Buy now for ${formatPrice(pricePence)}`

  return (
    <div className={styles.wrapper}>
      <PurchaseConsent
        isPaid={isPaid}
        acceptTerms={acceptTerms}
        onAcceptTermsChange={setAcceptTerms}
        newsletter={newsletter}
        onNewsletterChange={setNewsletter}
        immediateAccess={immediateAccess}
        onImmediateAccessChange={setImmediateAccess}
      />
      <button
        type="button"
        className="btn-primary"
        onClick={startCheckout}
        disabled={loading || !acceptTerms}
      >
        {loading ? 'Please wait…' : label}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
