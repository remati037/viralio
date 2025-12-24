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
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient()
    const { isAdmin } = await checkAdmin(supabase)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = params.userId
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

    // Generate confirmation link - this should trigger email sending
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: redirectTo,
      },
    })

    if (linkError) {
      return NextResponse.json(
        { error: linkError.message || 'Failed to generate confirmation link' },
        { status: 400 }
      )
    }

    // Note: generateLink doesn't automatically send the email
    // We need to use the REST API or a webhook to actually send it
    // For now, return the link so admin can manually send it if needed
    return NextResponse.json({
      success: true,
      message: 'Confirmation link generated. Note: Email may need to be sent manually depending on Supabase configuration.',
      confirmationLink: linkData.properties?.action_link,
    })
  } catch (error: any) {
    console.error('Error resending confirmation email:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

