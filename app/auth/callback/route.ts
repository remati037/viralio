import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const token = requestUrl.searchParams.get('token')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const next = requestUrl.searchParams.get('next') || '/'
  const origin = requestUrl.origin

  // Log all parameters for debugging
  console.log('Auth callback received:', {
    code: code ? 'present' : 'missing',
    type,
    token: token ? 'present' : 'missing',
    tokenHash: tokenHash ? 'present' : 'missing',
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
  })

  // Handle token-based flows (Supabase sometimes uses token instead of code)
  const authToken = token || tokenHash

  // Check if this is an invitation (user needs to set password)
  // Supabase invitation emails include type=invite or we can check if user has no password
  if (code && (type === 'invite' || type === 'recovery')) {
    // Redirect to set-password page with the code
    return NextResponse.redirect(
      new URL(`/auth/set-password?code=${code}&type=${type}`, origin)
    )
  }

  // Handle token-based invitations (common for email confirmations/invitations)
  if (authToken && (type === 'invite' || type === 'recovery' || type === 'signup')) {
    return NextResponse.redirect(
      new URL(`/auth/set-password?token=${authToken}&type=${type}`, origin)
    )
  }

  // If we have a token but no type, it might still be an invitation
  // Redirect to set-password to let it handle the verification
  if (authToken && !code) {
    // Try to verify the token first to determine the type
    const supabase = await createClient()

    // For invitations, we'll redirect to set-password which will handle verification
    // This is safer than trying to guess the type here
    return NextResponse.redirect(
      new URL(`/auth/set-password?token=${authToken}${type ? `&type=${type}` : ''}`, origin)
    )
  }

  // Handle code-based flow (OAuth/PKCE flow)
  if (code) {
    const supabase = await createClient()

    // Try to exchange code for session
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)

      // If error suggests user needs to set password (e.g., for invited users)
      // Check if this might be an invitation that needs password setup
      if (error.message?.includes('password') || error.message?.includes('invite')) {
        return NextResponse.redirect(
          new URL(`/auth/set-password?code=${code}`, origin)
        )
      }

      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
      )
    }

    // Verify session was created
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      // Ensure business_name is set in profile (from user metadata if available)
      if (session.user) {
        const businessName = session.user.user_metadata?.business_name
        if (businessName) {
          // Check current profile and update if business_name is missing or empty
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

      // Redirect to the next URL or home
      return NextResponse.redirect(new URL(next, origin))
    } else {
      // Session not created - might need password setup
      return NextResponse.redirect(
        new URL(`/auth/set-password?code=${code}`, origin)
      )
    }
  }

  // If no code or token, redirect to login with error
  console.warn('Auth callback received but no code or token found')
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent('Invalid or missing authentication parameters')}`, origin)
  )
}

