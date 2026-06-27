import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'

export async function retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
  if (!sessionId.startsWith('cs_')) return null

  try {
    const stripe = getStripe()
    return await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    return null
  }
}

export function isCheckoutSessionPaid(session: Stripe.Checkout.Session): boolean {
  return session.payment_status === 'paid' && session.status === 'complete'
}
