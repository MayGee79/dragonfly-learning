'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { SignedIn, SignedOut, useClerk } from '@clerk/nextjs'
import styles from './Navigation.module.css'

const MAIN =
  process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://dragonflypsychotherapy.co.uk'
const SHOP = 'https://dragonflyshop.co.uk'

const moreLinks = [
  { href: MAIN, label: 'Dragonfly Psychotherapy' },
  { href: SHOP, label: 'Shop' },
  { href: '/faqs', label: 'FAQs' },
]

const myLearningLinks = [
  { href: '/dashboard', label: 'My Courses' },
  { href: '/certificates', label: 'Certificates' },
  { href: '/account', label: 'Account' },
]

type DropdownId = 'more' | 'myLearning'

export default function LearningNavigation() {
  const { signOut } = useClerk()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<DropdownId | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const closeMenu = () => {
    setIsMenuOpen(false)
    setOpenDropdown(null)
  }

  const handleDropdownEnter = (id: DropdownId) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    if (!isMenuOpen) setOpenDropdown(id)
  }

  const handleDropdownLeave = () => {
    if (!isMenuOpen) {
      closeTimeoutRef.current = setTimeout(() => setOpenDropdown(null), 300)
    }
  }

  const toggleDropdown = (id: DropdownId) => {
    setOpenDropdown((current) => (current === id ? null : id))
  }

  async function handleSignOut() {
    closeMenu()
    await signOut({ redirectUrl: '/' })
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.menuToggle}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <ul className={`${styles.navList} ${isMenuOpen ? styles.open : ''}`}>
          <li>
            <Link href="/" className={styles.navLink} onClick={closeMenu}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/courses" className={styles.navLink} onClick={closeMenu}>
              Courses
            </Link>
          </li>
          <li
            className={styles.menuItem}
            onMouseEnter={() => handleDropdownEnter('more')}
            onMouseLeave={handleDropdownLeave}
          >
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => toggleDropdown('more')}
              aria-expanded={openDropdown === 'more'}
            >
              More <span className={styles.caret} aria-hidden>▾</span>
            </button>
            {openDropdown === 'more' && (
              <ul className={`${styles.dropdown} ${isMenuOpen ? styles.mobileDropdown : ''}`}>
                {moreLinks.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className={styles.dropdownLink} onClick={closeMenu}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>

          <SignedOut>
            <li className={styles.authSlot}>
              <Link href="/sign-in" className={styles.signInLink} onClick={closeMenu}>
                Sign In
              </Link>
              <span className={styles.authDivider} aria-hidden>
                /
              </span>
              <Link href="/sign-up" className={styles.signUpLink} onClick={closeMenu}>
                Sign Up
              </Link>
            </li>
          </SignedOut>

          <SignedIn>
            <li
              className={styles.menuItem}
              onMouseEnter={() => handleDropdownEnter('myLearning')}
              onMouseLeave={handleDropdownLeave}
            >
              <button
                type="button"
                className={styles.menuButton}
                onClick={() => toggleDropdown('myLearning')}
                aria-expanded={openDropdown === 'myLearning'}
              >
                My Learning <span className={styles.caret} aria-hidden>▾</span>
              </button>
              {openDropdown === 'myLearning' && (
                <ul className={`${styles.dropdown} ${styles.profileDropdown} ${isMenuOpen ? styles.mobileDropdown : ''}`}>
                  {myLearningLinks.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={styles.dropdownLink} onClick={closeMenu}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <button type="button" className={styles.dropdownButton} onClick={handleSignOut}>
                      Sign Out
                    </button>
                  </li>
                </ul>
              )}
            </li>
          </SignedIn>
        </ul>
      </div>
    </nav>
  )
}
