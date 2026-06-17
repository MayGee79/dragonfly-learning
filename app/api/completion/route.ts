import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { COMPLETION_THRESHOLD, hasAccess, upsertProgress } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

type CompletionBody = { courseId?: string; progressPercent?: number }

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as CompletionBody
    if (!body.courseId || typeof body.progressPercent !== 'number') {
      return NextResponse.json({ error: 'courseId and progressPercent are required.' }, { status: 400 })
    }

    if (!(await hasAccess(userId, body.courseId))) {
      return NextResponse.json({ error: 'You do not have access to this course.' }, { status: 403 })
    }

    const completion = await upsertProgress(userId, body.courseId, body.progressPercent)

    return NextResponse.json({
      watchProgressPercent: completion.watchProgressPercent,
      completed: completion.completed,
      threshold: COMPLETION_THRESHOLD,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to save progress'
    console.error('[completion]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
