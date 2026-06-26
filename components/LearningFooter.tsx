'use client'

import Link from 'next/link'
import styles from './Footer.module.css'

const MAIN = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://dragonflypsychotherapy.co.uk'

export default function LearningFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.linksSection}>
          <ul className={styles.links}>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/courses">Courses</Link>
            </li>
            <li>
              <Link href="/dashboard">My Courses</Link>
            </li>
            <li>
              <Link href="/faqs">FAQs</Link>
            </li>
            <li>
              <Link href="/terms">Terms</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy Notice</Link>
            </li>
            <li>
              <Link href="/cancellation">Cancellation</Link>
            </li>
            <li>
              <a href={`${MAIN}/ai-and-transparency`} target="_blank" rel="noopener noreferrer">
                AI and Transparency
              </a>
            </li>
            <li>
              <a href={`${MAIN}/`} target="_blank" rel="noopener noreferrer">
                Dragonfly Psychotherapy
              </a>
            </li>
          </ul>
        </div>
        <div className={styles.footerBottom}>
          <p className={styles.footerLeft}>
            <a href="https://lunaclara.studio" target="_blank" rel="noopener noreferrer">
              Website by LunaClara.Studio
            </a>
          </p>
          <p className={styles.footerCenter}>&copy; {new Date().getFullYear()} Dragonfly Psychotherapy. All Rights Reserved.</p>
          <p className={styles.footerRight}>
            <Link href="/admin">Admin</Link>
            {' · '}
            <button
              type="button"
              className={styles.cookieSettings}
              onClick={() => window.dispatchEvent(new Event('dragonfly:cookie-settings'))}
            >
              Cookie settings
            </button>
          </p>
        </div>
      </div>
    </footer>
  )
}
