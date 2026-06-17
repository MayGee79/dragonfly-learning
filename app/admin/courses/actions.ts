'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createCourse, deleteCourse, getCourseById, slugify, updateCourse } from '@/lib/db/queries'
import { courseStatus, type NewCourse } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/admin'

function parseStatus(value: FormDataEntryValue | null): (typeof courseStatus)[number] {
  const v = String(value || 'draft')
  return (courseStatus as readonly string[]).includes(v)
    ? (v as (typeof courseStatus)[number])
    : 'draft'
}

function poundsToPence(value: FormDataEntryValue | null): number {
  const pounds = parseFloat(String(value || '0').replace(/[^0-9.]/g, ''))
  if (Number.isNaN(pounds) || pounds < 0) return 0
  return Math.round(pounds * 100)
}

function parseIntField(value: FormDataEntryValue | null, fallback: number): number {
  const n = parseInt(String(value || ''), 10)
  return Number.isNaN(n) ? fallback : n
}

function buildCourseData(formData: FormData): NewCourse {
  const title = String(formData.get('title') || '').trim()
  if (!title) throw new Error('Title is required.')

  const slugInput = String(formData.get('slug') || '').trim()
  const slug = slugify(slugInput || title)
  if (!slug) throw new Error('A valid slug could not be generated.')

  const cpd = parseFloat(String(formData.get('cpdHours') || '1.0'))

  return {
    title,
    slug,
    description: String(formData.get('description') || '').trim(),
    longDescription: String(formData.get('longDescription') || '').trim(),
    pricePence: poundsToPence(formData.get('price')),
    durationMinutes: parseIntField(formData.get('durationMinutes'), 60),
    cpdHours: (Number.isNaN(cpd) ? 1.0 : cpd).toFixed(1),
    bunnyVideoId: String(formData.get('bunnyVideoId') || '').trim() || null,
    bunnyLibraryId: String(formData.get('bunnyLibraryId') || '').trim() || null,
    thumbnailUrl: String(formData.get('thumbnailUrl') || '').trim() || null,
    status: parseStatus(formData.get('status')),
    sortOrder: parseIntField(formData.get('sortOrder'), 0),
  }
}

export async function createCourseAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const data = buildCourseData(formData)
  await createCourse(data)
  revalidatePath('/admin/courses')
  revalidatePath('/courses')
  redirect('/admin/courses')
}

export async function updateCourseAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') || '')
  if (!id) throw new Error('Missing course id.')
  const existing = await getCourseById(id)
  if (!existing) throw new Error('Course not found.')
  const data = buildCourseData(formData)
  await updateCourse(id, data)
  revalidatePath('/admin/courses')
  revalidatePath('/courses')
  revalidatePath(`/courses/${data.slug}`)
  redirect('/admin/courses')
}

export async function deleteCourseAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') || '')
  if (!id) throw new Error('Missing course id.')
  await deleteCourse(id)
  revalidatePath('/admin/courses')
  revalidatePath('/courses')
  redirect('/admin/courses')
}
