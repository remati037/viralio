import { createClient } from '@/lib/supabase/server'
import { parseAuthError } from '@/lib/auth/utils'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const token = requestUrl.searchParams.get('token')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const next = requestUrl.searchParams.get('next') || '/pocetna'
  const origin = requestUrl.origin

  // Handle PKCE code-based flow (most common for Supabase Auth)
  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      console.error('Code:', code, 'Type:', type)

      // For recovery/invite flows, always redirect to set-password even on error
      // The set-password page can try to handle the code again or show error
      if (type === 'invite' || type === 'recovery' || !type) {
        // If type is missing, assume it's recovery (password reset)
        const redirectUrl = new URL('/auth/set-password', origin)
        redirectUrl.searchParams.set('code', code)
        if (type) {
          redirectUrl.searchParams.set('type', type)
        } else {
          redirectUrl.searchParams.set('type', 'recovery')
        }
        redirectUrl.searchParams.set('error', parseAuthError(error))
        return NextResponse.redirect(redirectUrl)
      }

      const redirectUrl = new URL('/login', origin)
      redirectUrl.searchParams.set('error', parseAuthError(error))
      return NextResponse.redirect(redirectUrl)
    }

    // Verify session was created
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      console.error('Session not created after code exchange')
      // Session not created - might need password setup
      // For recovery/invite flows, redirect to set-password with code
      if (type === 'invite' || type === 'recovery' || !type) {
        const redirectUrl = new URL('/auth/set-password', origin)
        redirectUrl.searchParams.set('code', code)
        if (type) {
          redirectUrl.searchParams.set('type', type)
        } else {
          redirectUrl.searchParams.set('type', 'recovery')
        }
        return NextResponse.redirect(redirectUrl)
      }

      const redirectUrl = new URL('/login', origin)
      redirectUrl.searchParams.set('error', 'Neuspešno kreiranje sesije. Pokušajte ponovo.')
      return NextResponse.redirect(redirectUrl)
    }

    // If this is an invite or recovery flow, user needs to set password
    // Session is already established, so we don't need to pass the code again
    if (type === 'invite' || type === 'recovery') {
      const redirectUrl = new URL('/auth/set-password', origin)
      redirectUrl.searchParams.set('type', type)
      return NextResponse.redirect(redirectUrl)
    }

    // Email confirmation (signup): show success page and ask user to sign in
    // Don't prompt for password - they already set it at registration
    if (type === 'signup' || type === 'email' || !type) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/confirm-success', origin))
    }

    // For regular OAuth flows (non-email), ensure profile is set up
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
    new URL(`/login?error=${encodeURIComponent('Neispravni ili nedostaju parametri za autentifikaciju')}`, origin)
  )
}

