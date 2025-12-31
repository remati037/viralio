'use client'

import { createClient } from '@sanity/client'

// Get project ID from environment or fallback
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '7d9ft76t';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

// Log in development to verify configuration
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔧 Sanity client config:', { projectId, dataset });
}

// Client-side Sanity client for read-only access (no token needed for public reads)
// useCdn: false in development to avoid caching issues, true in production for performance
export const sanityClient = createClient({
  projectId,
  dataset,
  useCdn: process.env.NODE_ENV === 'production', // Disable CDN in dev to see fresh content
  apiVersion: '2024-01-01',
  perspective: 'published', // Only fetch published content
  stega: {
    enabled: false, // Disable visual editing overlays
  },
})

// Client without CDN for cache-busting (always fresh data)
const sanityClientNoCache = createClient({
  projectId,
  dataset,
  useCdn: false, // Always bypass CDN for fresh data
  apiVersion: '2024-01-01',
  perspective: 'published',
  stega: {
    enabled: false,
  },
})

// Helper function to fetch with cache busting
export async function fetchWithCacheBust<T>(
  query: string,
  params?: Record<string, any>,
  options?: { forceFresh?: boolean }
): Promise<T> {
  // Use no-cache client when forceFresh is true or in development
  const client = (process.env.NODE_ENV === 'development' || options?.forceFresh) 
    ? sanityClientNoCache 
    : sanityClient;
  
  return client.fetch(query, params || {}) as Promise<T>;
}

