import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import LearningNavigation from '@/components/LearningNavigation'
import LearningFooter from '@/components/LearningFooter'
import LearningCookieConsent from '@/components/LearningCookieConsent'

const FALLBACK_SITE_URL = 'https://dragonflylearning.co.uk'

/** Same stack as the main Dragonfly site — see app/globals.css */
const FONT_MAIN = "'Century Gothic', 'CenturyGothic', 'AppleGothic', sans-serif"

function metadataBaseUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return new URL(FALLBACK_SITE_URL)
  try {
    if (/^https?:\/\//i.test(raw)) {
      return new URL(raw)
    }
    return new URL(`http://${raw}`)
  } catch {
    console.warn('[dragonfly-learning] Invalid NEXT_PUBLIC_SITE_URL — using fallback. Value was:', JSON.stringify(raw))
    return new URL(FALLBACK_SITE_URL)
  }
}

const metadataBaseResolved = metadataBaseUrl()

export const metadata: Metadata = {
  metadataBase: metadataBaseResolved,
  title: {
    default: 'Dragonfly Learning',
    template: '%s | Dragonfly Learning',
  },
  description:
    'On-demand CPD for therapists and counsellors. Evidence-informed sessions from Dr Victoria Froome. Watch anytime, get your CPD certificate instantly.',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'Dragonfly Learning',
    title: 'Dragonfly Learning',
    description:
      'On-demand CPD for therapists and counsellors. Evidence-informed sessions from Dr Victoria Froome. Watch anytime, get your CPD certificate instantly.',
    url: metadataBaseResolved.href,
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          fontFamily: FONT_MAIN,
          fontFamilyButtons: FONT_MAIN,
        },
      }}
    >
      <html lang="en-GB">
        <head>
          <style
            dangerouslySetInnerHTML={{
              __html: 'body{margin:0;background:#ebe6ee}',
            }}
          />
        </head>
        <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <LearningNavigation />
          <main style={{ flex: 1, width: '100%' }}>{children}</main>
          <LearningFooter />
          <LearningCookieConsent />
        </body>
      </html>
    </ClerkProvider>
  )
}
