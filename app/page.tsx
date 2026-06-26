import Image from 'next/image'
import Link from 'next/link'
import type { Course } from '@/lib/db/schema'
import { getFeaturedCourses } from '@/lib/db/queries'
import CourseCard from '@/components/CourseCard'
import styles from './Home.module.css'

export const dynamic = 'force-dynamic'

const MAIN = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://dragonflypsychotherapy.co.uk'

async function loadFeatured(): Promise<Course[]> {
  try {
    return await getFeaturedCourses(3)
  } catch (e) {
    console.error('[home] failed to load featured courses:', e)
    return []
  }
}

export default async function HomePage() {
  const featured = await loadFeatured()

  return (
    <div className={styles.page}>
      <header className={styles.hero} id="top">
        <div className={styles.heroBanner}>
          <div className={styles.heroBannerInner}>
            <div className={styles.heroBrand}>
              <div className={styles.heroLogo}>
                <Image
                  src="/images/dragonfly_logo_transparent.png"
                  alt="Dragonfly Psychotherapy"
                  className={styles.heroLogoImg}
                  width={260}
                  height={260}
                  sizes="(max-width: 767px) 140px, 260px"
                  priority
                />
              </div>
              <div className={styles.heroTextContent}>
                <h1 className={styles.siteTitle}>Learning</h1>
                <p className={styles.heroWelcome}>Welcome to Dragonfly Learning</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.wrap}>
        <div className={styles.heroIntro}>
          <p>
            Online CPD for therapists, counsellors and helping professionals. Evidence-informed on-demand
            sessions from Dr Victoria Froome, Integrative Psychotherapist. Watch at your own pace,
            complete a paid session and download your CPD certificate instantly. New courses added
            regularly.
          </p>
          <div className={styles.heroActions}>
            <Link href="/courses" className="btn-primary">
              Browse courses
            </Link>
            <a href="#about" className="btn-secondary">
              About Dragonfly Psychotherapy
            </a>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Featured courses</h2>
            <Link href="/courses" className={styles.seeAll}>
              See all courses →
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className={styles.grid}>
              {featured.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>New courses are on their way. Please check back soon.</p>
          )}
        </section>

      </div>

      <section className={styles.aboutSection} id="about">
        <div className={styles.aboutInner}>
          <h2>About Dragonfly Psychotherapy</h2>
          <p>
            Dragonfly Learning is part of Dragonfly Psychotherapy, the Surrey practice of Dr Victoria
            Froome, an integrative psychotherapist and former NHS GP. With over 20 years of clinical
            experience and BACP registration, Vicky brings a rare combination of therapeutic skill and
            medical insight to everything she teaches. She works with adults and young people in
            Guildford, East Horsley and online, supporting people through anxiety, depression, burnout,
            menopause, neurodiversity and life&apos;s many transitions. The same warmth, expertise and
            whole person understanding that shape her therapy room now shape these sessions.
          </p>
          <a href={`${MAIN}/`} target="_blank" rel="noopener noreferrer" className={styles.aboutLink}>
            Visit Dragonfly Psychotherapy →
          </a>
        </div>
      </section>
    </div>
  )
}
