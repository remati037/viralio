import { sanityClient } from '@/lib/sanity/client'
import { templateQuery } from '@/lib/sanity/queries'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    // Fetch templates from Sanity
    const sanityTemplates = await sanityClient.fetch(templateQuery)

    if (!sanityTemplates || sanityTemplates.length === 0) {
      return NextResponse.json({
        message: 'No templates found in Sanity',
        synced: 0,
      })
    }

    let synced = 0
    let errors: string[] = []

    for (const sanityTemplate of sanityTemplates) {
      try {
        // Handle structure based on format
        let structure
        if (sanityTemplate.format === 'Duga Forma') {
          // For Duga Forma, only body is required
          structure = {
            body: sanityTemplate.structure?.body || '',
          }
        } else {
          // For Kratka Forma, hook, body, and cta are available
          structure = {
            hook: sanityTemplate.structure?.hook || '',
            body: sanityTemplate.structure?.body || '',
            cta: sanityTemplate.structure?.cta || '',
          }
        }

        const templateData = {
          title: sanityTemplate.title,
          format: sanityTemplate.format,
          niche: sanityTemplate.niche,
          concept: sanityTemplate.concept || null,
          structure: structure,
          is_published: sanityTemplate.isPublished || false,
        }

        // Check if template already exists by title and format (since sanityId is removed)
        const { data: existingTemplates } = await supabase
          .from('templates')
          .select('id')
          .eq('title', sanityTemplate.title)
          .eq('format', sanityTemplate.format)
          .limit(1)

        const existingTemplate = existingTemplates?.[0]

        if (existingTemplate) {
          // Update existing template
          const { error: updateError } = await supabase
            .from('templates')
            .update(templateData)
            .eq('id', existingTemplate.id)

          if (updateError) throw updateError
        } else {
          // Create new template
          const { error: insertError } = await supabase
            .from('templates')
            .insert({
              ...templateData,
              created_by: user.id,
            })

          if (insertError) throw insertError
        }

        synced++
      } catch (error: any) {
        errors.push(`Template "${sanityTemplate.title}": ${error.message}`)
      }
    }

    return NextResponse.json({
      message: `Synced ${synced} templates`,
      synced,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error syncing templates:', error)
    return NextResponse.json(
      { error: 'Failed to sync templates', details: error.message },
      { status: 500 }
    )
  }
}

