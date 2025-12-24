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
 * PUT /api/admin/users/[userId]
 * Update user data (admin only)
 */
export async function PUT(
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
    const body = await request.json()

    const adminClient = getAdminClient()

    // Update profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        business_name: body.business_name,
        target_audience: body.target_audience,
        persona: body.persona,
        monthly_goal_short: body.monthly_goal_short,
        monthly_goal_long: body.monthly_goal_long,
        tier: body.tier,
        has_unlimited_free: body.has_unlimited_free,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      )
    }

    // If email or password needs to be updated, update auth user
    if (body.email || body.password) {
      const updateData: any = {}
      if (body.email) updateData.email = body.email
      if (body.password) updateData.password = body.password

      const { error: authError } = await adminClient.auth.admin.updateUserById(
        userId,
        updateData
      )

      if (authError) {
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[userId]
 * Delete user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient()
    const { isAdmin, user: currentUser } = await checkAdmin(supabase)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = params.userId

    // Prevent admin from deleting themselves
    if (userId === currentUser?.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const adminClient = getAdminClient()

    // First, verify the user exists in auth
    let authUser
    try {
      const result = await adminClient.auth.admin.getUserById(userId)
      authUser = result.data.user
      
      if (!authUser) {
        // User might already be deleted, check if profile exists
        const { data: profile } = await adminClient
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single()
        
        if (profile) {
          // Profile exists but auth user doesn't - delete profile manually
          await adminClient.from('profiles').delete().eq('id', userId)
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'User was already deleted from auth system' 
        })
      }
    } catch (getUserError: any) {
      console.error('Error getting user:', getUserError)
      // Continue with deletion attempt anyway
    }

    // Delete user from auth.users using admin API
    // This should cascade delete profile and related data due to ON DELETE CASCADE
    try {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

      if (deleteError) {
        console.error('Error deleting user from auth:', deleteError)
        
        // If deletion fails, try to manually delete from profiles as fallback
        const { error: profileDeleteError } = await adminClient
          .from('profiles')
          .delete()
          .eq('id', userId)
        
        if (profileDeleteError) {
          return NextResponse.json(
            { error: `Failed to delete user: ${deleteError.message}` },
            { status: 400 }
          )
        }
        
        return NextResponse.json({
          success: true,
          warning: 'User deleted from profiles but may still exist in auth.users',
        })
      }

      // Wait a moment for cascade to complete
      await new Promise(resolve => setTimeout(resolve, 500))

      // Verify deletion was successful
      try {
        const { data: verifyUser } = await adminClient.auth.admin.getUserById(userId)
        if (verifyUser?.user) {
          console.warn('User still exists after deletion attempt')
          // Don't fail, just warn - sometimes there's a delay
        }
      } catch (verifyError) {
        // User doesn't exist - good!
      }

      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('Unexpected error during deletion:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete user' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

