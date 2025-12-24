import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Create admin client for user management operations
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Helper to check if user is admin
async function checkAdmin(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { isAdmin: false, user: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return { isAdmin: profile?.role === 'admin', user }
}

/**
 * POST /api/admin/users/[userId]/resend-confirmation
 * Resend confirmation email to user (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = await createClient()
    const { isAdmin } = await checkAdmin(supabase)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = await params
    const adminClient = getAdminClient()

    // Get user email
    const { data: authUser, error: getUserError } = await adminClient.auth.admin.getUserById(userId)

    if (getUserError || !authUser.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const email = authUser.user.email
    if (!email) {
      return NextResponse.json(
        { error: 'User has no email address' },
        { status: 400 }
      )
    }

    // Check if email is already confirmed
    if (authUser.user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Email is already confirmed' },
        { status: 400 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.NEXT_PUBLIC_SUPABASE_URL ? 
                     `https://${process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1]?.split('.')[0] || 'localhost'}` : 
                     'http://localhost:3000')
    
    const redirectTo = `${siteUrl}/auth/callback`

    // For resending confirmation, we can't use 'signup' type as it requires password
    // Instead, we'll use 'magiclink' or 'recovery' type, or update the user to trigger email
    // The best approach is to use 'magiclink' which doesn't require password
    try {
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: redirectTo,
        },
      })

      if (linkError) {
        // If magiclink fails, try recovery type
        const { data: recoveryLink, error: recoveryError } = await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: redirectTo,
          },
        })

        if (recoveryError) {
          return NextResponse.json(
            { error: recoveryError.message || 'Failed to generate confirmation link' },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Confirmation link generated. Note: Email may need to be sent manually depending on Supabase configuration.',
          confirmationLink: recoveryLink?.properties?.action_link,
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Confirmation link generated. Note: Email may need to be sent manually depending on Supabase configuration.',
        confirmationLink: linkData?.properties?.action_link,
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Failed to generate confirmation link' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error resending confirmation email:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

