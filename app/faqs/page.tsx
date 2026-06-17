import type { Metadata } from 'next'
import LegalDocument from '@/components/LegalDocument'
import { readLearningContent } from '@/lib/learningContent'

export const metadata: Metadata = {
  title: 'FAQs',
  description: 'Frequently asked questions about Dragonfly Learning and on-demand CPD.',
}

export default function FaqsPage() {
  return <LegalDocument text={readLearningContent('faqs.txt')} />
}
