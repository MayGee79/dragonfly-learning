const DEFAULT_NEWSLETTER_FROM =
  'Dragonfly Psychotherapy <victoria@dragonflypsychotherapy.co.uk>'

/** MailerLite API key — supports standard name and Vercel alias `dragonfly_learning`. */
export function getMailerLiteApiKey(): string | undefined {
  return process.env.MAILERLITE_API_KEY?.trim() || process.env.dragonfly_learning?.trim()
}

/** Resend API key — supports standard name and Vercel alias `dragonfly_learning_resend`. */
export function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY?.trim() || process.env.dragonfly_learning_resend?.trim()
}

/** From address for newsletter welcome emails. */
export function getNewsletterFromAddress(): string {
  return (
    process.env.NEWSLETTER_WELCOME_FROM?.trim() ||
    process.env.CONTACT_EMAIL_FROM?.trim() ||
    DEFAULT_NEWSLETTER_FROM
  )
}
