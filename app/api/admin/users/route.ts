import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const DEFAULT_PAGE_SIZE = 10

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

async function checkAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { isAdmin: false }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return { isAdmin: profile?.role === 'admin' }
}

/**
 * GET /api/admin/users
 * Fetch paginated users (admin only)
 * Query params: page (default 1), pageSize (default 10), search (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10)))
    const search = (searchParams.get('search') || '').trim()

    const adminClient = getAdminClient()
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build profiles query with optional search
    let profilesQuery = adminClient
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      profilesQuery = profilesQuery.or(`business_name.ilike.%${search}%,id.ilike.%${search}%`)
    }

    const { data: profiles, error: profilesError, count: totalCount } = await profilesQuery.range(from, to)

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      )
    }

    const profileIds = (profiles || []).map((p) => p.id)
    if (profileIds.length === 0) {
      const stats = await fetchStats(adminClient)
      return NextResponse.json({
        users: [],
        pagination: { page, pageSize, total: totalCount ?? 0, totalPages: Math.ceil((totalCount ?? 0) / pageSize) },
        stats,
      })
    }

    // Fetch payments, statistics, tasks, and auth emails in parallel
    const [paymentsRes, statisticsRes, tasksRes, emailsMap] = await Promise.all([
      adminClient.from('payments').select('*').in('user_id', profileIds).order('created_at', { ascending: false }),
      adminClient.from('user_statistics').select('*').in('user_id', profileIds),
      adminClient
        .from('tasks')
        .select('user_id, status, result_views, result_engagement, result_conversions, is_admin_case_study')
        .in('user_id', profileIds),
      fetchEmailsForUsers(adminClient, profileIds),
    ])

    const payments = paymentsRes.data || []
    const statistics = statisticsRes.data || []
    const allTasks = tasksRes.data || []

    const usersWithData = (profiles || []).map((profile) => {
      const userTasks = allTasks.filter((t) => t.user_id === profile.id && !t.is_admin_case_study)
      let totalViews = 0
      let totalEngagement = 0
      let totalConversions = 0
      userTasks.forEach((task) => {
        if (task.status === 'published') {
          totalViews += parseInt(task.result_views || '0', 10) || 0
          totalEngagement += parseInt(task.result_engagement || '0', 10) || 0
          totalConversions += parseInt(task.result_conversions || '0', 10) || 0
        }
      })
      const { email, email_confirmed } = emailsMap[profile.id] || {}
      return {
        ...profile,
        email: email ?? null,
        email_confirmed: email_confirmed ?? null,
        statistics: statistics.find((s) => s.user_id === profile.id),
        payments: payments.filter((p) => p.user_id === profile.id),
        realStats: {
          total_tasks: userTasks.length,
          published_tasks: userTasks.filter((t) => t.status === 'published').length,
          total_views: totalViews,
          total_engagement: totalEngagement,
          total_conversions: totalConversions,
        },
      }
    })

    const stats = await fetchStats(adminClient)
    const total = totalCount ?? 0

    return NextResponse.json({
      users: usersWithData,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats,
    })
  } catch (error: any) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

async function fetchEmailsForUsers(adminClient: ReturnType<typeof getAdminClient>, userIds: string[]) {
  const map: Record<string, { email: string; email_confirmed: boolean }> = {}
  await Promise.all(
    userIds.map(async (userId) => {
      try {
        const { data } = await adminClient.auth.admin.getUserById(userId)
        if (data?.user) {
          map[userId] = {
            email: data.user.email ?? '',
            email_confirmed: !!(data.user.email_confirmed_at !== null && data.user.email_confirmed_at !== undefined),
          }
        }
      } catch {
        // ignore per-user errors
      }
    })
  )
  return map
}

async function fetchStats(adminClient: ReturnType<typeof getAdminClient>) {
  const [profilesRes, proCountRes, tasksCountRes, viewsRes] = await Promise.all([
    adminClient.from('profiles').select('id', { count: 'exact', head: true }),
    adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('tier', 'pro'),
    adminClient
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('is_admin_case_study', false),
    adminClient
      .from('tasks')
      .select('result_views')
      .eq('status', 'published')
      .eq('is_admin_case_study', false),
  ])

  const totalUsers = profilesRes.count ?? 0
  const totalPro = proCountRes.count ?? 0
  const totalTasks = tasksCountRes.count ?? 0
  const totalViews = (viewsRes.data || []).reduce(
    (sum, t) => sum + (parseInt(t.result_views || '0', 10) || 0),
    0
  )

  return { totalUsers, totalPro, totalTasks, totalViews }
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
                   process.env.NEXT_PUBLIC_APP_URL ||
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
    
    // Redirect to auth callback - this will handle the invite flow and redirect to set-password
    // The callback route will exchange the code for a session and redirect to /auth/set-password
    const redirectTo = `${siteUrl}/auth/callback`

    let authData
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
        
        // Verify user was created successfully
        const { data: verifyUser, error: verifyError } = await adminClient.auth.admin.getUserById(userId)
        if (verifyError || !verifyUser) {
          console.error('User verification failed after creation:', verifyError)
          return NextResponse.json(
            { error: 'User was created but verification failed. Please try again.' },
            { status: 500 }
          )
        }
        
        // inviteUserByEmail sends an invitation email automatically
        // The user will set their password when they click the invitation link
        // For invitations, we should NOT set a password - let the user set it via the link
        // Setting a password here can cause issues with the invitation flow
        console.log('User invited successfully - they will set password when clicking invitation link')
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

      // For createUser, we can't use generateLink with type 'signup' as it requires password
      // Since we already have the password, we can use it, but it's better to just rely on
      // inviteUserByEmail which handles email sending automatically
      // If we fall back to createUser, the email won't be sent automatically
      // The admin should use inviteUserByEmail for proper email delivery
      console.warn('User created with createUser. Email confirmation may not be sent automatically.')
      console.warn('Consider using inviteUserByEmail for automatic email delivery, or configure SMTP in Supabase.')
    }

    if (!authData?.user || !userId) {
      return NextResponse.json(
        { error: 'Failed to create user - no user data returned' },
        { status: 400 }
      )
    }

    // Update profile with admin settings
    const profileUpdate: any = {
      business_name: businessName || '',
    }

    if (hasUnlimitedFree) {
      // Set to PRO tier with unlimited free subscription (no Stripe; admin-granted)
      profileUpdate.tier = 'pro'
      profileUpdate.has_unlimited_free = true
    } else {
      // Classic user: free tier until they complete Stripe checkout (7-day trial, then €19/month)
      profileUpdate.tier = 'free'
      profileUpdate.has_unlimited_free = false
      // No payment record: user must open payment modal and complete Stripe checkout
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

