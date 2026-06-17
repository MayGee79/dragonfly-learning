import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: 'var(--spacing-4xl) var(--spacing-lg)',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontWeight: 700,
          color: 'var(--color-primary)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        404
      </p>
      <h1 style={{ marginBottom: 'var(--spacing-md)' }}>Page not found</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-xl)' }}>
        Sorry, we couldn&apos;t find the page you were looking for.
      </p>
      <Link href="/" className="btn-primary">
        Back to home
      </Link>
    </div>
  )
}
