import { auth } from '@clerk/nextjs/server'

export async function isAdmin(): Promise<boolean> {
  const session = await auth()
  return session.sessionClaims?.metadata?.role === 'admin'
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error('Forbidden')
  }
}
