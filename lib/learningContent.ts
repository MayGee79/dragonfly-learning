import fs from 'fs'
import path from 'path'

export function readLearningContent(filename: string): string {
  return fs.readFileSync(path.join(process.cwd(), 'content', filename), 'utf8')
}
