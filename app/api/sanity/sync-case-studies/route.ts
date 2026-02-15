import { NextRequest, NextResponse } from 'next/server'
import { sanityClientNoCdn, urlFor } from '@/lib/sanity/client'
import { caseStudyQuery } from '@/lib/sanity/queries'
import { createClient } from '@/lib/supabase/server'
import type { TaskInsert } from '@/types'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

/** Build Sanity CDN image URL from asset _ref (e.g. "image-abc123-1200x800-jpg"). */
function buildImageUrlFromRef(ref: string): string | null {
  if (!ref || typeof ref !== 'string' || !ref.startsWith('image-')) return null
  const rest = ref.slice(6)
  const lastDash = rest.lastIndexOf('-')
  if (lastDash === -1) return null
  const path = `${rest.slice(0, lastDash)}.${rest.slice(lastDash + 1)}`
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${path}`
}

function getCoverImageUrl(item: {
  coverImage?: { _type?: string; asset?: { _ref?: string; _type?: string } } | null
  coverImageCdnUrl?: string | null
  coverImageUrl?: string | null
}): string | null {
  if (item.coverImageCdnUrl && typeof item.coverImageCdnUrl === 'string') {
    return item.coverImageCdnUrl
  }
  if (item.coverImageUrl && typeof item.coverImageUrl === 'string') {
    return item.coverImageUrl
  }
  const ref = item.coverImage?.asset?._ref
  if (ref) {
    const fromRef = buildImageUrlFromRef(ref)
    if (fromRef) return fromRef
    try {
      const url = urlFor(item.coverImage!).width(1200).url()
      return url && typeof url === 'string' ? url : null
    } catch (_) {
      return null
    }
  }
  return null
}

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

    // Fetch case studies from Sanity (no CDN so we get latest, including new uploads)
    let sanityCaseStudies
    try {
      sanityCaseStudies = await sanityClientNoCdn.fetch(caseStudyQuery)
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
          cover_image_url: getCoverImageUrl(sanityCaseStudy),
          viral_video_url: sanityCaseStudy.viralVideoUrl || null,
          result_views: sanityCaseStudy.resultViews || null,
          result_engagement: sanityCaseStudy.resultEngagement || null,
          result_conversions: sanityCaseStudy.resultConversions || null,
          original_template: sanityCaseStudy.originalTemplate || null,
          status: 'published',
          publish_date: sanityCaseStudy.publishDate || new Date().toISOString(),
          is_admin_case_study: true,
          category_id: sanityCaseStudy.categoryId || null,
        }

        // Find existing: try sanity_id first (if migration 030 applied), else match by title + admin
        let existingCaseStudy: { id: string } | null = null
        if (sanityDocumentId) {
          const { data, error: sanityIdError } = await supabase
            .from('tasks')
            .select('id')
            .eq('sanity_id', sanityDocumentId)
            .eq('is_admin_case_study', true)
            .maybeSingle()
          if (!sanityIdError) existingCaseStudy = data
        }
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

        const payloadWithSanityId = {
          ...caseStudyData,
          ...(sanityDocumentId ? { sanity_id: sanityDocumentId } : {}),
          ...(existingCaseStudy ? { user_id: undefined } : {}),
        }

        const runUpdate = () =>
          supabase
            .from('tasks')
            .update(payloadWithSanityId)
            .eq('id', existingCaseStudy!.id)

        const runInsert = () =>
          supabase
            .from('tasks')
            .insert(payloadWithSanityId as TaskInsert)
            .select('id')
            .single()

        if (existingCaseStudy) {
          let { error: updateError } = await runUpdate()
          if (updateError?.message?.includes('sanity_id') || updateError?.message?.includes('schema cache')) {
            const { sanity_id: _, ...payloadWithoutSanityId } = payloadWithSanityId as Record<string, unknown>
            const { error: retryError } = await supabase
              .from('tasks')
              .update(payloadWithoutSanityId)
              .eq('id', existingCaseStudy.id)
            updateError = retryError
          }
          if (updateError) throw updateError
        } else {
          let { error: insertError } = await runInsert()
          if (insertError?.message?.includes('sanity_id') || insertError?.message?.includes('schema cache')) {
            const { sanity_id: _, ...payloadWithoutSanityId } = payloadWithSanityId as Record<string, unknown>
            const { error: retryError } = await supabase
              .from('tasks')
              .insert(payloadWithoutSanityId as TaskInsert)
              .select('id')
              .single()
            insertError = retryError
          }
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

