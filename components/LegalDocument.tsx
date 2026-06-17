import styles from './LegalDocument.module.css'

export default function LegalDocument({ text }: { text: string }) {
  return (
    <article className={styles.article}>
      <pre className={styles.body}>{text}</pre>
    </article>
  )
}
