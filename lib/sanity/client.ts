import { createClient } from '@sanity/client'
import type { SanityImageSource } from '@sanity/image-url'
import imageUrlBuilder from '@sanity/image-url'

// Validate environment variables
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiToken = process.env.SANITY_API_TOKEN
const nodeEnv = process.env.NODE_ENV as string | undefined
const isProduction = nodeEnv === 'production'

if (!projectId) {
  const errorMessage = 'NEXT_PUBLIC_SANITY_PROJECT_ID is not set. Please add it to your environment variables.'
  if (isProduction) {
    console.error('❌ Sanity Configuration Error:', errorMessage)
  } else {
    throw new Error(errorMessage)
  }
}

export const sanityClient = createClient({
  projectId: projectId || '',
  dataset,
  useCdn: isProduction,
  apiVersion: '2024-01-01',
  token: apiToken,
  // Add request timeout and retry configuration
  requestTagPrefix: 'viralio',
  withCredentials: false,
})

/** Use for sync/API routes that must see the latest content (bypass CDN cache). */
export const sanityClientNoCdn = createClient({
  projectId: projectId || '',
  dataset,
  useCdn: false,
  apiVersion: '2024-01-01',
  token: apiToken,
  requestTagPrefix: 'viralio',
  withCredentials: false,
})

// Log configuration in development
if (nodeEnv === 'development') {
  console.log('🔧 Sanity Server Client Config:', {
    projectId,
    dataset,
    hasToken: !!apiToken,
    useCdn: isProduction,
  })
}

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

