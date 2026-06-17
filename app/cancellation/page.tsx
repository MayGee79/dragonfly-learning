import type { Metadata } from 'next'
import LegalDocument from '@/components/LegalDocument'
import { readLearningContent } from '@/lib/learningContent'

export const metadata: Metadata = {
  title: 'Cancellation Form',
  description: 'Model cancellation form for Dragonfly Learning CPD purchases.',
}

export default function CancellationPage() {
  return <LegalDocument text={readLearningContent('cancellation-form.txt')} />
}
