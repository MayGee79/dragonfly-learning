import { currentUser } from '@clerk/nextjs/server'

export type CurrentUserInfo = {
  userId: string
  email: string
  name: string | null
}

export async function getCurrentUserInfo(): Promise<CurrentUserInfo | null> {
  const user = await currentUser()
  if (!user) return null

  const email =
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    ''

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.username ||
    null

  return { userId: user.id, email, name }
}
