'use client'

import { useFormStatus } from 'react-dom'

export default function CourseFormSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Saving…' : label}
    </button>
  )
}
