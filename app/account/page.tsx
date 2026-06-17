import type { Metadata } from 'next'
import { UserProfile } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false, follow: false },
}

export default function AccountPage() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: 'var(--spacing-4xl) var(--spacing-lg)',
      }}
    >
      <UserProfile />
    </div>
  )
}
