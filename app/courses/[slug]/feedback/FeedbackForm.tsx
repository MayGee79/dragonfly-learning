'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitFeedbackAction } from './actions'
import styles from './Feedback.module.css'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Submitting…' : 'Submit feedback and get certificate'}
    </button>
  )
}

interface FeedbackFormProps {
  slug: string
  courseTitle: string
  defaultEmail: string
}

export default function FeedbackForm({ slug, courseTitle, defaultEmail }: FeedbackFormProps) {
  const [audienceType, setAudienceType] = useState<'professional' | 'personal'>('professional')

  return (
    <form action={submitFeedbackAction} className={styles.form}>
      <input type="hidden" name="slug" value={slug} />

      <p className={styles.intro}>
        Thank you for completing this session. Please take two or three minutes to share a little
        feedback before your certificate is issued. Your answers help me understand what worked and
        shape future sessions, and the first few questions let me prepare your certificate with the
        correct details. Everything here is treated in line with my{' '}
        <Link href="/privacy" target="_blank" rel="noopener noreferrer">
          Privacy Notice
        </Link>
        .
      </p>

      <section className={styles.section}>
        <h2>Your certificate details</h2>

        <div className={styles.field}>
          <label htmlFor="certificateName">
            Full name (as you would like it on your certificate) <span className={styles.required}>(required)</span>
          </label>
          <input id="certificateName" name="certificateName" type="text" required />
        </div>

        <div className={styles.field}>
          <label htmlFor="email">
            Email address (where your certificate should be sent){' '}
            <span className={styles.required}>(required)</span>
          </label>
          <input id="email" name="email" type="email" defaultValue={defaultEmail} required />
        </div>

        <div className={styles.field}>
          <label htmlFor="courseTitle">Which session is this feedback for?</label>
          <input id="courseTitle" type="text" value={courseTitle} readOnly className={styles.readonly} />
        </div>

        <fieldset className={styles.fieldset}>
          <legend>
            Are you completing this as a professional or for personal interest?{' '}
            <span className={styles.required}>(required)</span>
          </legend>
          <label className={styles.radio}>
            <input
              type="radio"
              name="audienceType"
              value="professional"
              checked={audienceType === 'professional'}
              onChange={() => setAudienceType('professional')}
              required
            />
            A professional seeking CPD
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              name="audienceType"
              value="personal"
              checked={audienceType === 'personal'}
              onChange={() => setAudienceType('personal')}
            />
            For personal interest / self-development
          </label>
        </fieldset>

        {audienceType === 'professional' && (
          <>
            <div className={styles.field}>
              <label htmlFor="profession">Profession or role (optional)</label>
              <input id="profession" name="profession" type="text" />
              <p className={styles.help}>
                For example: counsellor, psychotherapist, GP, teacher, support worker.
              </p>
            </div>
            <div className={styles.field}>
              <label htmlFor="registrationNumber">Professional registration / membership number (optional)</label>
              <input id="registrationNumber" name="registrationNumber" type="text" />
              <p className={styles.help}>
                Only if you need this to appear on your certificate (for example, your BACP number).
              </p>
            </div>
          </>
        )}

        <label className={styles.checkbox}>
          <input type="checkbox" name="completedConfirmation" required />
          <span>
            I confirm that I have completed this session in full.{' '}
            <span className={styles.required}>(required)</span>
          </span>
        </label>
        <p className={styles.help}>Yes, I have watched/worked through the whole session.</p>
      </section>

      <section className={styles.section}>
        <h2>Your feedback</h2>

        <RatingField
          name="ratingOverall"
          label="Overall, how would you rate this session?"
          low="Poor"
          high="Excellent"
        />
        <RatingField
          name="ratingLearningAims"
          label="The session met the learning aims it set out."
          low="Not at all"
          high="Completely"
        />
        <RatingField
          name="ratingClarity"
          label="How clear and easy to follow did you find the session?"
          low="Hard to follow"
          high="Very clear"
        />
        <RatingField
          name="ratingLikelyUse"
          label="How likely are you to use what you learned in your work or daily life?"
          low="Not at all likely"
          high="Very likely"
        />

        <div className={styles.field}>
          <label htmlFor="mostUseful">
            What is one thing from this session that you found most useful?{' '}
            <span className={styles.required}>(required)</span>
          </label>
          <textarea id="mostUseful" name="mostUseful" rows={3} required />
        </div>

        <div className={styles.field}>
          <label htmlFor="couldImprove">What is one thing that could have been better, clearer, or different? (optional)</label>
          <textarea id="couldImprove" name="couldImprove" rows={3} />
        </div>

        <div className={styles.field}>
          <label htmlFor="futureTopic">Is there a topic you would like a future session on? (optional)</label>
          <textarea id="futureTopic" name="futureTopic" rows={2} />
        </div>

        <div className={styles.field}>
          <label htmlFor="otherNotes">Anything else you would like to share? (optional)</label>
          <textarea id="otherNotes" name="otherNotes" rows={2} />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Staying in touch (optional)</h2>

        <label className={styles.checkbox}>
          <input type="checkbox" name="newsletterOptIn" />
          <span>
            I would like to receive the Dragonfly newsletter, with occasional updates on new CPD,
            resources, and reflections (roughly monthly). I can unsubscribe at any time.
          </span>
        </label>

        <fieldset className={styles.fieldset}>
          <legend>May I quote your feedback anonymously on my website or materials? (optional)</legend>
          <label className={styles.radio}>
            <input type="radio" name="quoteConsent" value="yes" />
            Yes, anonymously
          </label>
          <label className={styles.radio}>
            <input type="radio" name="quoteConsent" value="no" />
            No, please keep my feedback private
          </label>
        </fieldset>
      </section>

      <SubmitButton />
    </form>
  )
}

function RatingField({
  name,
  label,
  low,
  high,
}: {
  name: string
  label: string
  low: string
  high: string
}) {
  return (
    <fieldset className={styles.ratingField}>
      <legend>
        {label} <span className={styles.required}>(required)</span>
      </legend>
      <div className={styles.ratingScale} role="radiogroup" aria-label={label}>
        <span className={styles.scaleEnd}>{low}</span>
        {[1, 2, 3, 4, 5].map((value) => (
          <label key={value} className={styles.ratingOption}>
            <input type="radio" name={name} value={value} required />
            <span>{value}</span>
          </label>
        ))}
        <span className={styles.scaleEnd}>{high}</span>
      </div>
    </fieldset>
  )
}
