import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
      )
    }

    // Verify session was created
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      // Redirect to the next URL or home
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  // If no code or session creation failed, redirect to login
  return NextResponse.redirect(new URL('/login', origin))
}

