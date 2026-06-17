import { Fragment } from 'react'

function renderInline(text: string): React.ReactNode {
  // Supports **bold** only — keep intentionally minimal.
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

/**
 * Minimal markdown renderer for course long descriptions.
 * Supports: # / ## / ### headings, - bullet lists, **bold**, blank-line paragraphs.
 */
export function Markdown({ source, className }: { source: string; className?: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let listItems: string[] = []
  let paragraph: string[] = []
  let key = 0

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(<p key={key++}>{renderInline(paragraph.join(' '))}</p>)
      paragraph = []
    }
  }
  const flushList = () => {
    if (listItems.length) {
      blocks.push(
        <ul key={key++}>
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>,
      )
      listItems = []
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line.trim() === '') {
      flushParagraph()
      flushList()
      continue
    }
    if (line.startsWith('### ')) {
      flushParagraph()
      flushList()
      blocks.push(<h3 key={key++}>{renderInline(line.slice(4))}</h3>)
    } else if (line.startsWith('## ')) {
      flushParagraph()
      flushList()
      blocks.push(<h2 key={key++}>{renderInline(line.slice(3))}</h2>)
    } else if (line.startsWith('# ')) {
      flushParagraph()
      flushList()
      blocks.push(<h2 key={key++}>{renderInline(line.slice(2))}</h2>)
    } else if (/^[-*]\s+/.test(line)) {
      flushParagraph()
      listItems.push(line.replace(/^[-*]\s+/, ''))
    } else {
      flushList()
      paragraph.push(line.trim())
    }
  }
  flushParagraph()
  flushList()

  return <div className={className}>{blocks}</div>
}
