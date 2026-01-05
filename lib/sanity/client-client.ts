'use client'

import { createClient } from '@sanity/client'

// Get project ID from environment
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

// Validate configuration
if (!projectId && typeof window !== 'undefined') {
  console.error(
    '❌ Sanity Configuration Error: NEXT_PUBLIC_SANITY_PROJECT_ID is not set.\n' +
    'Please add it to your Vercel environment variables:\n' +
    '1. Go to your Vercel project settings\n' +
    '2. Navigate to Environment Variables\n' +
    '3. Add NEXT_PUBLIC_SANITY_PROJECT_ID with your Sanity project ID\n' +
    '4. Redeploy your application'
  )
}

// Log in development to verify configuration
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔧 Sanity Client Config:', { 
    projectId: projectId || 'MISSING', 
    dataset,
    environment: process.env.NODE_ENV 
  })
}

// Client-side Sanity client for read-only access (no token needed for public reads)
// useCdn: false in development to avoid caching issues, true in production for performance
export const sanityClient = createClient({
  projectId: projectId || '',
  dataset,
  useCdn: process.env.NODE_ENV === 'production', // Disable CDN in dev to see fresh content
  apiVersion: '2024-01-01',
  perspective: 'published', // Only fetch published content
  stega: {
    enabled: false, // Disable visual editing overlays
  },
  // Add request configuration for better error handling
  requestTagPrefix: 'viralio-client',
  withCredentials: false,
})

// Client without CDN for cache-busting (always fresh data)
const sanityClientNoCache = createClient({
  projectId: projectId || '',
  dataset,
  useCdn: false, // Always bypass CDN for fresh data
  apiVersion: '2024-01-01',
  perspective: 'published',
  stega: {
    enabled: false,
  },
  requestTagPrefix: 'viralio-client',
  withCredentials: false,
})

// Helper function to fetch with cache busting
export async function fetchWithCacheBust<T>(
  query: string,
  params?: Record<string, any>,
  options?: { forceFresh?: boolean }
): Promise<T> {
  if (!projectId) {
    throw new Error(
      'Sanity is not configured. NEXT_PUBLIC_SANITY_PROJECT_ID environment variable is missing. ' +
      'Please add it to your Vercel environment variables and redeploy.'
    )
  }

  try {
    // Use no-cache client when forceFresh is true or in development
    const client = (process.env.NODE_ENV === 'development' || options?.forceFresh) 
      ? sanityClientNoCache 
      : sanityClient;
    
    return await client.fetch(query, params || {}) as Promise<T>;
  } catch (error: any) {
    // Detect CORS errors specifically
    const errorMessage = error.message || error.toString() || ''
    const statusCode = error.statusCode || error.status || (error.response?.status)
    
    // CORS errors can manifest as:
    // 1. Explicit CORS messages
    // 2. 403 Forbidden (often CORS-related when from browser)
    // 3. Network errors with CORS-related messages
    const isCorsError = 
      errorMessage.includes('CORS') || 
      errorMessage.includes('Access-Control-Allow-Origin') ||
      errorMessage.includes('blocked by CORS policy') ||
      errorMessage.includes('No \'Access-Control-Allow-Origin\'') ||
      (statusCode === 403 && typeof window !== 'undefined') || // 403 from browser is often CORS
      (error.name === 'TypeError' && errorMessage.includes('Failed to fetch'))
    
    if (isCorsError) {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown'
      console.error(
        '❌ Sanity CORS Error Detected!\n\n' +
        'Your domain is not allowed to access Sanity API.\n\n' +
        '🔧 To fix this:\n' +
        '1. Go to https://www.sanity.io/manage\n' +
        '2. Select your project (Project ID: ' + projectId + ')\n' +
        '3. Navigate to: API → CORS origins\n' +
        '4. Click "Add CORS origin"\n' +
        '5. Add your domain: ' + currentOrigin + '\n' +
        '6. ✅ Check "Allow credentials"\n' +
        '7. Save\n\n' +
        'Also add preview domains if needed:\n' +
        '- ' + currentOrigin.replace('www.', '') + '\n' +
        '- Any Vercel preview URLs you use\n\n' +
        'After adding, wait a few minutes and refresh your page.'
      )
      
      // Create a more user-friendly error
      const corsError = new Error(
        'CORS Error: Your domain (' + currentOrigin + ') is not allowed to access Sanity. ' +
        'Please add it to Sanity CORS origins. See console for detailed instructions.'
      )
      corsError.name = 'SanityCORSError'
      throw corsError
    }
    
    // Provide helpful error messages for other errors
    if (error.message?.includes('project') || error.message?.includes('Project')) {
      console.error('❌ Sanity Project Error:', {
        message: error.message,
        projectId,
        dataset,
        hint: 'Check that NEXT_PUBLIC_SANITY_PROJECT_ID is correct in Vercel environment variables'
      })
    }
    
    throw error
  }
}

