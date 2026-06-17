export function bunnyEmbedUrl(libraryId: string, videoId: string): string {
  const params = 'autoplay=false&preload=false'
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?${params}`
}

export function resolveLibraryId(courseLibraryId?: string | null): string {
  return (courseLibraryId || process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '').trim()
}
