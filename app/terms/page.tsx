import type { Metadata } from 'next'
import LegalDocument from '@/components/LegalDocument'
import { readLearningContent } from '@/lib/learningContent'

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'Terms and conditions for using Dragonfly Learning and purchasing CPD content.',
}

export default function TermsPage() {
  return <LegalDocument text={readLearningContent('terms.txt')} />
}
