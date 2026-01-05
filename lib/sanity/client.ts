import { createClient } from '@sanity/client'
import type { SanityImageSource } from '@sanity/image-url'
import imageUrlBuilder from '@sanity/image-url'

// Validate environment variables
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiToken = process.env.SANITY_API_TOKEN

if (!projectId) {
  const errorMessage = 'NEXT_PUBLIC_SANITY_PROJECT_ID is not set. Please add it to your environment variables.'
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Sanity Configuration Error:', errorMessage)
  } else {
    throw new Error(errorMessage)
  }
}

export const sanityClient = createClient({
  projectId: projectId || '',
  dataset,
  useCdn: process.env.NODE_ENV === 'production',
  apiVersion: '2024-01-01',
  token: apiToken,
  // Add request timeout and retry configuration
  requestTagPrefix: 'viralio',
  withCredentials: false,
})

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Sanity Server Client Config:', {
    projectId,
    dataset,
    hasToken: !!apiToken,
    useCdn: process.env.NODE_ENV === 'production',
  })
}

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

