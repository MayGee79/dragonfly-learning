export {}

// Extend Clerk's session claims so `sessionClaims.metadata.role` is typed.
// In the Clerk dashboard add a Session token custom claim:
//   { "metadata": "{{user.public_metadata}}" }
declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: 'admin'
    }
  }
}
