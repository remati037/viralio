import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { messages, taskContext } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check and increment AI credits
    const { data: creditResult, error: creditError } = await supabase.rpc(
      'increment_ai_credits',
      { p_user_id: user.id, p_credits: 1 }
    )

    if (creditError) {
      console.error('Credit tracking error:', creditError)
      return NextResponse.json(
        { error: 'Failed to track credits', details: creditError.message },
        { status: 500 }
      )
    }

    // Check if credits were successfully incremented
    if (!creditResult?.success) {
      return NextResponse.json(
        {
          error: 'Nedovoljno AI kredita',
          error_code: 'INSUFFICIENT_CREDITS',
          credits_remaining: creditResult?.credits_remaining || 0,
          credits_used: creditResult?.credits_used || 0,
          max_credits: creditResult?.max_credits || 500,
          reset_at: creditResult?.reset_at,
        },
        { status: 429 }
      )
    }

    // Build system prompt with task context
    const systemPrompt = `You are an expert content creator assistant helping users create viral social media content. 
Your task is to help generate engaging titles, hooks, body content, and CTAs for social media posts.

Context about the task:
- Format: ${taskContext?.format || 'Not specified'}
- Niche: ${taskContext?.niche || 'Not specified'}
- Current title: ${taskContext?.title || 'Not specified'}

Guidelines:
- For "Kratka Forma" (Short Form): Create concise, punchy content optimized for Reels/TikTok (under 60 seconds)
- For "Duga Forma" (Long Form): Create detailed, engaging content for YouTube/Facebook (longer format)
- Hooks should be attention-grabbing and create curiosity (0-3 seconds)
- Body should deliver value and keep viewers engaged (3-45 seconds for short form)
- CTAs should be clear and actionable
- Write in Serbian language (Cyrillic or Latin script, match user's preference)
- Be creative, engaging, and optimized for viral potential

When generating content, provide structured output that can be easily copied into the appropriate fields.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.8,
      max_tokens: 1500,
    })

    const aiMessage = response.choices[0]?.message?.content

    if (!aiMessage) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: aiMessage,
      credits: {
        used: creditResult.credits_used,
        remaining: creditResult.credits_remaining,
        max: creditResult.max_credits,
      },
    })
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}

