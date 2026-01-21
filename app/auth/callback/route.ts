import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const token = requestUrl.searchParams.get('token')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const next = requestUrl.searchParams.get('next') || '/planner'
  const origin = requestUrl.origin

  // Handle PKCE code-based flow (most common for Supabase Auth)
  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)

      // If this is an invite/recovery flow, redirect to set-password even on error
      // The set-password page will handle the error appropriately
      if (type === 'invite' || type === 'recovery') {
        const redirectUrl = new URL('/auth/set-password', origin)
        redirectUrl.searchParams.set('code', code)
        redirectUrl.searchParams.set('type', type)
        redirectUrl.searchParams.set('error', error.message)
        return NextResponse.redirect(redirectUrl)
      }

      // If type is missing but this might be a recovery flow, try to redirect to set-password
      // This handles cases where type parameter might be missing
      if (!type) {
        // Check if user needs to set password (recovery/invite flows typically require password setup)
        // Redirect to set-password with code so it can handle the exchange
        const redirectUrl = new URL('/auth/set-password', origin)
        redirectUrl.searchParams.set('code', code)
        redirectUrl.searchParams.set('error', error.message)
        return NextResponse.redirect(redirectUrl)
      }

      const redirectUrl = new URL('/login', origin)
      redirectUrl.searchParams.set('error', error.message)
      return NextResponse.redirect(redirectUrl)
    }

    // Verify session was created
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // Session not created - might need password setup
      if (type === 'invite' || type === 'recovery') {
        const redirectUrl = new URL('/auth/set-password', origin)
        redirectUrl.searchParams.set('code', code)
        redirectUrl.searchParams.set('type', type)
        return NextResponse.redirect(redirectUrl)
      }

      // If no type but session creation failed, might be recovery flow
      // Redirect to set-password to let it handle the code
      if (!type) {
        const redirectUrl = new URL('/auth/set-password', origin)
        redirectUrl.searchParams.set('code', code)
        return NextResponse.redirect(redirectUrl)
      }

      const redirectUrl = new URL('/login', origin)
      redirectUrl.searchParams.set('error', 'Session creation failed')
      return NextResponse.redirect(redirectUrl)
    }

    // If this is an invite or recovery flow, user needs to set password
    // Session is already established, so we don't need to pass the code again
    if (type === 'invite' || type === 'recovery') {
      const redirectUrl = new URL('/auth/set-password', origin)
      redirectUrl.searchParams.set('type', type)
      return NextResponse.redirect(redirectUrl)
    }

    // For regular OAuth/signup flows, ensure profile is set up
    if (session.user) {
      const businessName = session.user.user_metadata?.business_name
      if (businessName) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_name')
          .eq('id', session.user.id)
          .single()

        if (profile && (!profile.business_name || profile.business_name.trim() === '')) {
          await supabase
            .from('profiles')
            .update({ business_name: businessName })
            .eq('id', session.user.id)
        }
      }
    }

    // Redirect to the next URL or dashboard
    return NextResponse.redirect(new URL(next, origin))
  }

  // Handle token-based flows (legacy/alternative Supabase flows)
  const authToken = token || tokenHash
  if (authToken) {
    // Redirect to set-password which will handle token verification
    const redirectUrl = new URL('/auth/set-password', origin)
    redirectUrl.searchParams.set('token', authToken)
    if (type) {
      redirectUrl.searchParams.set('type', type)
    }
    return NextResponse.redirect(redirectUrl)
  }

  // If no code or token, redirect to login with error
  console.warn('Auth callback received but no code or token found', {
    url: requestUrl.toString(),
    searchParams: Object.fromEntries(requestUrl.searchParams),
  })
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent('Invalid or missing authentication parameters')}`, origin)
  )
}

