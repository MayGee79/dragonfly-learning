import { sendNewsletterWelcomeEmail } from '@/lib/newsletterWelcomeEmail'

const MAILERLITE_ENDPOINT = 'https://connect.mailerlite.com/api/subscribers'

export type MailerLiteSubscribeResult =
  | { ok: true; alreadySubscribed?: boolean }
  | { ok: false; error: string }

export type MailerLiteSubscribeInput = {
  email: string
  firstName?: string
}

async function sendWelcomeAfterSubscribe(input: MailerLiteSubscribeInput): Promise<void> {
  try {
    await sendNewsletterWelcomeEmail(input)
  } catch (error) {
    console.error('[mailerlite] welcome email failed:', error)
  }
}

/**
 * Add a subscriber as active (single opt-in). Call only after an explicit website opt-in.
 */
export async function subscribeToMailerLite(
  input: MailerLiteSubscribeInput,
): Promise<MailerLiteSubscribeResult> {
  const apiKey = process.env.MAILERLITE_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'MAILERLITE_API_KEY is not set' }
  }

  const trimmed = input.email.trim()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: 'Invalid email' }
  }

  const firstName = input.firstName?.trim()
  const body: Record<string, unknown> = {
    email: trimmed,
    status: 'active',
  }

  if (firstName) {
    body.fields = { name: firstName }
  }

  const groupId = process.env.MAILERLITE_GROUP_ID?.trim()
  if (groupId) {
    body.groups = [groupId]
  }

  const res = await fetch(MAILERLITE_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (res.status === 409) {
    return { ok: true, alreadySubscribed: true }
  }

  if (res.status === 200 || res.status === 201) {
    await sendWelcomeAfterSubscribe({ email: trimmed, firstName })
    return { ok: true }
  }

  const raw = await res.text().catch(() => '')
  console.error('[mailerlite] subscribe failed:', res.status, raw)
  return { ok: false, error: `MailerLite returned ${res.status}` }
}
