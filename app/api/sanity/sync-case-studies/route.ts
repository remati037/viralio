import { NextRequest, NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity/client'
import { caseStudyQuery } from '@/lib/sanity/queries'
import { createClient } from '@/lib/supabase/server'
import type { TaskInsert } from '@/types'

// Helper to convert Portable Text to HTML
function portableTextToHTML(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return ''
  
  return blocks
    .map((block) => {
      if (block._type === 'block') {
        const text = block.children?.map((child: any) => child.text || '').join('') || ''
        const style = block.style || 'normal'
        
        if (style === 'h1') return `<h1>${text}</h1>`
        if (style === 'h2') return `<h2>${text}</h2>`
        if (style === 'h3') return `<h3>${text}</h3>`
        if (style === 'blockquote') return `<blockquote>${text}</blockquote>`
        if (style === 'normal') return `<p>${text}</p>`
        return `<p>${text}</p>`
      }
      return ''
    })
    .join('')
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch case studies from Sanity
    let sanityCaseStudies
    try {
      sanityCaseStudies = await sanityClient.fetch(caseStudyQuery)
    } catch (error: any) {
      console.error('Sanity fetch error:', error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch case studies from Sanity', 
          details: error.message,
          hint: 'Check that NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN are set in Vercel environment variables'
        },
        { status: 500 }
      )
    }

    if (!sanityCaseStudies || sanityCaseStudies.length === 0) {
      return NextResponse.json({
        message: 'No case studies found in Sanity',
        synced: 0,
        foundInSanity: 0,
        hint: 'Check NEXT_PUBLIC_SANITY_DATASET (e.g. production) and that documents exist in Sanity Studio with type "Studija slučaja (Case Study)".',
      })
    }

    const foundInSanity = sanityCaseStudies.length

    let synced = 0
    let errors: string[] = []

    for (const sanityCaseStudy of sanityCaseStudies) {
      try {
        // Convert Portable Text analysis to HTML
        const analysisHtml = portableTextToHTML(sanityCaseStudy.analysis || [])

        const sanityDocumentId = sanityCaseStudy._id ?? null
        const caseStudyData: Partial<TaskInsert> = {
          user_id: user.id,
          title: sanityCaseStudy.title,
          niche: sanityCaseStudy.niche,
          format: sanityCaseStudy.format,
          hook: sanityCaseStudy.hook || null,
          body: sanityCaseStudy.body || null,
          cta: sanityCaseStudy.cta || null,
          analysis: analysisHtml || null,
          cover_image_url: sanityCaseStudy.coverImageUrl || null,
          viral_video_url: sanityCaseStudy.viralVideoUrl || null,
          result_views: sanityCaseStudy.resultViews || null,
          result_engagement: sanityCaseStudy.resultEngagement || null,
          result_conversions: sanityCaseStudy.resultConversions || null,
          original_template: sanityCaseStudy.originalTemplate || null,
          status: 'published',
          publish_date: sanityCaseStudy.publishDate || new Date().toISOString(),
          is_admin_case_study: true,
          category_id: sanityCaseStudy.categoryId || null,
          sanity_id: sanityDocumentId,
        }

        // Find existing case study by Sanity document _id to avoid duplicates
        let existingCaseStudy: { id: string } | null = null
        if (sanityDocumentId) {
          const { data } = await supabase
            .from('tasks')
            .select('id')
            .eq('sanity_id', sanityDocumentId)
            .eq('is_admin_case_study', true)
            .maybeSingle()
          existingCaseStudy = data
        }

        // Fallback: match by title + admin owner for case studies synced before sanity_id existed
        if (!existingCaseStudy && sanityCaseStudy.title) {
          const { data: byTitle } = await supabase
            .from('tasks')
            .select('id')
            .eq('title', sanityCaseStudy.title)
            .eq('is_admin_case_study', true)
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle()
          existingCaseStudy = byTitle
        }

        if (existingCaseStudy) {
          const { error: updateError } = await supabase
            .from('tasks')
            .update({
              ...caseStudyData,
              user_id: undefined,
            })
            .eq('id', existingCaseStudy.id)

          if (updateError) throw updateError
        } else {
          const { error: insertError } = await supabase
            .from('tasks')
            .insert(caseStudyData as TaskInsert)
            .select('id')
            .single()

          if (insertError) throw insertError
        }

        synced++
      } catch (error: any) {
        errors.push(`Case Study "${sanityCaseStudy.title}": ${error.message}`)
      }
    }

    return NextResponse.json({
      message: `Synced ${synced} case studies`,
      synced,
      foundInSanity,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error syncing case studies:', error)
    return NextResponse.json(
      { error: 'Failed to sync case studies', details: error.message },
      { status: 500 }
    )
  }
}

