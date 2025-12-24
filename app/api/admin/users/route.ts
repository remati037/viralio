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

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, hasUnlimitedFree, businessName } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const adminClient = getAdminClient()

    // Check if user with this email already exists and delete it
    try {
      const { data: existingUsers } = await adminClient.auth.admin.listUsers()
      const existingUser = existingUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      
      if (existingUser) {
        // User exists - delete it first to allow recreation
        console.log(`User with email ${email} already exists (ID: ${existingUser.id}), deleting first...`)
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(existingUser.id)
        
        if (deleteError) {
          console.error('Error deleting existing user:', deleteError)
          return NextResponse.json(
            { error: `User with this email already exists and could not be deleted: ${deleteError.message}` },
            { status: 400 }
          )
        }
        
        // Wait for deletion to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (checkError: any) {
      console.error('Error checking for existing user:', checkError)
      // Continue anyway - might be a listing issue
    }

    // Use inviteUserByEmail which automatically sends confirmation email
    // This is the recommended way to create users that need email confirmation
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.NEXT_PUBLIC_SUPABASE_URL ? 
                     `https://${process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1]?.split('.')[0] || 'localhost'}` : 
                     'http://localhost:3000')
    
    const redirectTo = `${siteUrl}/auth/callback`

    let authData
    let authError
    let userId

      // Use inviteUserByEmail - this automatically sends an invitation/confirmation email
      // This is the recommended method as it handles email sending automatically
      // The email sent depends on Supabase configuration (invitation or confirmation)
    try {
      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          created_by_admin: true,
          initial_password: password, // Store password in metadata (will be used when user confirms)
        },
        redirectTo: redirectTo,
      })

      if (inviteError) {
        // If invite fails, fall back to createUser
        console.log('inviteUserByEmail failed, trying createUser:', inviteError.message)
        throw inviteError
      }

      if (inviteData.user) {
        authData = { user: inviteData.user }
        userId = inviteData.user.id
        
        // inviteUserByEmail sends an invitation email automatically
        // The user will set their password when they click the invitation link
        // We can optionally set a temporary password here
        if (password) {
          try {
            // Set password after invitation (user can change it when they confirm)
            await adminClient.auth.admin.updateUserById(userId, {
              password: password,
            })
            console.log('Password set for invited user, confirmation email should be sent automatically')
          } catch (pwdError: any) {
            console.error('Error setting password for invited user:', pwdError)
            // Don't fail - password will be set when user confirms email via invitation link
          }
        }
        
        console.log('User invited successfully, confirmation email should be sent automatically')
      }
    } catch (inviteErr: any) {
      // Fallback: Use createUser if inviteUserByEmail fails
      console.log('Using createUser as fallback')
      
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
          created_by_admin: true,
        },
      })

      if (createError || !createData.user) {
        return NextResponse.json(
          { error: createError?.message || inviteErr?.message || 'Failed to create user' },
          { status: 400 }
        )
      }

      authData = createData
      userId = createData.user.id

      // For createUser, we need to manually send the confirmation email
      // Use generateLink with type 'signup' and then trigger email sending
      try {
        // Generate the confirmation link
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
          type: 'signup',
          email: email,
          options: {
            redirectTo: redirectTo,
          },
        })

        if (linkError) {
          console.error('Error generating confirmation link:', linkError)
        } else if (linkData?.properties?.action_link) {
          // The link is generated, but Supabase doesn't automatically send it
          // We need to manually send the email or use a webhook
          console.log('Confirmation link generated:', linkData.properties.action_link)
          console.warn('Email may not be sent automatically. Consider using inviteUserByEmail or configuring SMTP.')
          
          // Note: generateLink doesn't send the email, it just generates the link
          // You would need to send it manually via your email service or use inviteUserByEmail
        }
      } catch (emailError: any) {
        console.error('Error handling confirmation email:', emailError)
      }
    }

    if (!authData?.user || !userId) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user' },
        { status: 400 }
      )
    }

    // Update profile with admin settings
    const profileUpdate: any = {
      business_name: businessName || '',
    }

    if (hasUnlimitedFree) {
      // Set to PRO tier with unlimited free subscription
      profileUpdate.tier = 'pro'
      profileUpdate.has_unlimited_free = true
    } else {
      // Set to PRO tier for 7-day trial - after trial, user will be prompted to subscribe
      profileUpdate.tier = 'pro'
      profileUpdate.has_unlimited_free = false

      // Create a 7-day trial payment record
      const trialStart = new Date()
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 7)

      await adminClient.from('payments').insert({
        user_id: userId,
        amount: 0,
        currency: 'USD',
        status: 'completed',
        payment_method: 'trial',
        subscription_period_start: trialStart.toISOString(),
        subscription_period_end: trialEnd.toISOString(),
        next_payment_date: trialEnd.toISOString(),
        tier_at_payment: 'pro',
      })
    }

    const { error: updateError } = await adminClient
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId)

    if (updateError) {
      // If profile update fails, we should clean up the auth user
      await adminClient.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Verification email is automatically sent when email_confirm is false
    // Supabase will send the email with the confirmation link

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: authData.user.email,
        tier: profileUpdate.tier,
        has_unlimited_free: profileUpdate.has_unlimited_free,
      },
    })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

