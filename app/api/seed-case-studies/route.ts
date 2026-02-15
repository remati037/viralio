import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MOCK_CASE_STUDIES } from '@/lib/utils/mockCaseStudies'
import type { TaskInsert } from '@/types'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * POST /api/seed-case-studies
 * Inserts demo admin case studies so the Case Studies page has something to show.
 * Uses service role so rows are inserted with is_admin_case_study = true.
 */
export async function POST() {
  try {
    const supabase = getServiceClient()

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    const adminId = adminProfile?.id
    if (!adminId) {
      return NextResponse.json(
        { error: 'No admin user found. Create an admin profile first.' },
        { status: 400 }
      )
    }

    const rows: TaskInsert[] = MOCK_CASE_STUDIES.map((row) => ({
      ...row,
      user_id: adminId,
      created_by: adminId,
      is_admin_case_study: true,
      is_demo_case_study: true,
    })) as TaskInsert[]

    const { data, error } = await supabase.from('tasks').insert(rows).select('id')

    if (error) {
      console.error('Seed case studies error:', error)
      return NextResponse.json(
        { error: 'Failed to seed case studies', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Seeded ${data?.length ?? 0} demo case studies`,
      count: data?.length ?? 0,
    })
  } catch (err: any) {
    console.error('Seed case studies:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to seed case studies' },
      { status: 500 }
    )
  }
}
