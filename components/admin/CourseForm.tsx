import type { Course } from '@/lib/db/schema'
import { courseStatus } from '@/lib/db/schema'
import CourseFormSubmit from './CourseFormSubmit'
import styles from './Admin.module.css'

interface CourseFormProps {
  action: (formData: FormData) => Promise<void>
  course?: Course
  submitLabel?: string
  defaultLibraryId?: string
}

export default function CourseForm({ action, course, submitLabel = 'Save course', defaultLibraryId }: CourseFormProps) {
  const priceDefault = course ? (course.pricePence / 100).toFixed(2) : ''

  return (
    <form action={action} className={styles.form}>
      {course && <input type="hidden" name="id" value={course.id} />}

      <div className={styles.field}>
        <label htmlFor="title">Course title</label>
        <input id="title" name="title" type="text" defaultValue={course?.title} required placeholder="e.g. Understanding Rejection Sensitive Dysphoria" />
      </div>

      <div className={styles.field}>
        <label htmlFor="slug">URL slug</label>
        <input id="slug" name="slug" type="text" defaultValue={course?.slug} placeholder="Leave blank to auto-generate from the title" />
        <p className={styles.help}>This becomes the web address: /courses/your-slug</p>
      </div>

      <div className={styles.field}>
        <label htmlFor="description">Short description (card blurb)</label>
        <textarea id="description" name="description" rows={2} defaultValue={course?.description} placeholder="One or two sentences shown on the course card." />
      </div>

      <div className={styles.field}>
        <label htmlFor="longDescription">Full description</label>
        <textarea id="longDescription" name="longDescription" rows={8} defaultValue={course?.longDescription} placeholder="Detailed description for the course page. Basic markdown supported: # headings, - bullet points, **bold**." />
        <p className={styles.help}>Basic markdown: # headings, - bullets, **bold**.</p>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="price">Price (£)</label>
          <input id="price" name="price" type="text" inputMode="decimal" defaultValue={priceDefault} placeholder="0.00 (leave 0 for a free course)" />
        </div>
        <div className={styles.field}>
          <label htmlFor="durationMinutes">Duration (minutes)</label>
          <input id="durationMinutes" name="durationMinutes" type="number" min={0} defaultValue={course?.durationMinutes ?? 60} />
        </div>
        <div className={styles.field}>
          <label htmlFor="cpdHours">CPD hours</label>
          <input id="cpdHours" name="cpdHours" type="number" min={0} step={0.5} defaultValue={course ? Number(course.cpdHours) : 1.0} />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="bunnyVideoId">Bunny video ID</label>
          <input id="bunnyVideoId" name="bunnyVideoId" type="text" defaultValue={course?.bunnyVideoId ?? ''} placeholder="GUID from the Bunny Stream dashboard" />
        </div>
        <div className={styles.field}>
          <label htmlFor="bunnyLibraryId">Bunny library ID</label>
          <input id="bunnyLibraryId" name="bunnyLibraryId" type="text" defaultValue={course?.bunnyLibraryId ?? defaultLibraryId ?? ''} placeholder="Pre-filled from settings" />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="thumbnailUrl">Thumbnail URL (optional)</label>
        <input id="thumbnailUrl" name="thumbnailUrl" type="url" defaultValue={course?.thumbnailUrl ?? ''} placeholder="https://…" />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={course?.status ?? 'draft'}>
            {courseStatus.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <p className={styles.help}>Only published courses appear on the public site.</p>
        </div>
        <div className={styles.field}>
          <label htmlFor="sortOrder">Sort order</label>
          <input id="sortOrder" name="sortOrder" type="number" defaultValue={course?.sortOrder ?? 0} />
          <p className={styles.help}>Lower numbers appear first.</p>
        </div>
      </div>

      <div className={styles.formActions}>
        <CourseFormSubmit label={submitLabel} />
      </div>
    </form>
  )
}
