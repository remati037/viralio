'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // createBrowserClient automatically handles cookies
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

