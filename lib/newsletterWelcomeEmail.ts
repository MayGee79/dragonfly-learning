import {
  getNewsletterFromAddress,
  getResendApiKey,
  getResendFallbackFromAddress,
} from '@/lib/envSecrets'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildWelcomeHtml(greeting: string): string {
  return `
    <p>${escapeHtml(greeting)}</p>
    <p>Thank you for subscribing to the Dragonfly Psychotherapy newsletter. I am delighted to welcome you.</p>
    <p>You will receive my newsletter roughly once a month, with reflections from my practice, news about new resources, occasional offers, and signposting to support that may be useful. I will never share your email address with anyone else.</p>
    <p>If you have any questions, you are very welcome to reply to this email directly.</p>
    <p>With warm regards,<br>Victoria</p>
    <p>Dr Victoria Froome<br>Dragonfly Psychotherapy<br>victoria@dragonflypsychotherapy.co.uk<br>www.dragonflypsychotherapy.co.uk</p>
    <p style="font-size:12px;color:#666;margin-top:24px;">You can unsubscribe at any time by replying to this email or contacting victoria@dragonflypsychotherapy.co.uk.</p>
  `.trim()
}

async function sendWithFrom(
  apiKey: string,
  from: string,
  to: string,
  greeting: string,
): Promise<Response> {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: 'victoria@dragonflypsychotherapy.co.uk',
      subject: 'Welcome to the Dragonfly newsletter',
      html: buildWelcomeHtml(greeting),
    }),
  })
}

function isUnverifiedDomainError(status: number, raw: string): boolean {
  return status === 403 && /domain is not verified/i.test(raw)
}

/**
 * Sends the newsletter welcome email via Resend (optional — skips if no API key is set).
 */
export async function sendNewsletterWelcomeEmail(input: {
  email: string
  firstName?: string
}): Promise<void> {
  const apiKey = getResendApiKey()
  if (!apiKey) return

  const to = input.email.trim()
  if (!to) return

  const firstName = input.firstName?.trim()
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,'

  const preferredFrom = getNewsletterFromAddress()
  let res = await sendWithFrom(apiKey, preferredFrom, to, greeting)

  if (!res.ok) {
    const raw = await res.text().catch(() => '')
    const fallbackFrom = getResendFallbackFromAddress()
    if (isUnverifiedDomainError(res.status, raw) && preferredFrom !== fallbackFrom) {
      console.warn('[newsletter-welcome] domain not verified, retrying with Resend test from address')
      res = await sendWithFrom(apiKey, fallbackFrom, to, greeting)
      if (!res.ok) {
        const retryRaw = await res.text().catch(() => '')
        throw new Error(`Resend welcome email failed: ${res.status} ${retryRaw}`)
      }
      console.info('[newsletter-welcome] sent via fallback from address to', to)
      return
    }
    throw new Error(`Resend welcome email failed: ${res.status} ${raw}`)
  }

  console.info('[newsletter-welcome] sent to', to)
}
