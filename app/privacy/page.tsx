import type { Metadata } from 'next'
import LegalDocument from '@/components/LegalDocument'
import { readLearningContent } from '@/lib/learningContent'

export const metadata: Metadata = {
  title: 'Privacy Notice',
  description: 'How Dragonfly Learning collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return <LegalDocument text={readLearningContent('privacy.txt')} />
}
