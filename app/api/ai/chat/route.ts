import { formatHooksForAI, getAllHooks } from '@/lib/data/viral-hooks'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

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
    console.log('🔵 Calling increment_ai_credits for user:', user.id)
    const { data: creditResult, error: creditError } = await supabase.rpc(
      'increment_ai_credits',
      { p_user_id: user.id, p_credits: 1 }
    )

    console.log('🔵 Raw creditResult:', creditResult)
    console.log('🔵 creditError:', creditError)

    if (creditError) {
      console.error('❌ Credit tracking error:', creditError)
      return NextResponse.json(
        { error: 'Failed to track credits', details: creditError.message },
        { status: 500 }
      )
    }

    // Parse JSON if it's a string (Supabase RPC sometimes returns JSON as string)
    let parsedResult = creditResult
    if (typeof creditResult === 'string') {
      try {
        parsedResult = JSON.parse(creditResult)
        console.log('🔵 Parsed creditResult from string:', parsedResult)
      } catch (e) {
        console.error('❌ Failed to parse credit result:', e)
        return NextResponse.json(
          { error: 'Failed to parse credit result' },
          { status: 500 }
        )
      }
    }

    console.log('✅ Final parsedResult:', JSON.stringify(parsedResult, null, 2))

    // Check if credits were successfully incremented
    if (!parsedResult?.success) {
      return NextResponse.json(
        {
          error: 'Nedovoljno AI kredita',
          error_code: 'INSUFFICIENT_CREDITS',
          credits_remaining: parsedResult?.credits_remaining || 0,
          credits_used: parsedResult?.credits_used || 0,
          max_credits: parsedResult?.max_credits || 500,
          reset_at: parsedResult?.reset_at,
        },
        { status: 429 }
      )
    }

    // Check if user is asking for hook generation
    // Check all messages to be more comprehensive
    const allMessagesText = messages.map((m: { content?: string }) => m.content?.toLowerCase() || '').join(' ')
    const isGeneratingHook =
      allMessagesText.includes('hook') ||
      allMessagesText.includes('udica') ||
      allMessagesText.includes('udicu') ||
      allMessagesText.includes('generiši hook') ||
      allMessagesText.includes('kreiraj hook') ||
      allMessagesText.includes('moćan hook') ||
      allMessagesText.includes('hook (udicu)') ||
      allMessagesText.includes('prve 3 sekunde')

    // Get viral hooks for context if generating hooks
    let hooksContext = ''
    if (isGeneratingHook && taskContext?.categoryName) {
      // Get all hooks (or a sample) - AI will use them based on category context
      const allHooks = getAllHooks(50) // Get 50 hooks for context
      if (allHooks.length > 0) {
        hooksContext = `\n\nEXAMPLES OF VIRAL HOOKS:
Study these examples to understand the style, patterns, and what makes hooks effective. Use them as inspiration but create original content tailored to the user's category: "${taskContext.categoryName}".

${formatHooksForAI(allHooks)}

IMPORTANT: 
- Analyze these hooks to understand the language style, tone, and patterns that work
- Understand how to create curiosity and engagement
- Learn what makes hooks viral and attention-grabbing
- The user's category is: "${taskContext.categoryName}" - use this category context to select and adapt relevant patterns from these examples
- Generate hooks that match the style and effectiveness of these examples while being original and specifically tailored to the "${taskContext.categoryName}" category and the user's topic

Focus on hooks that would be relevant for the "${taskContext.categoryName}" category while maintaining the viral patterns shown in the examples.`
      }
    }

    // Build system prompt with task context
    const systemPrompt = `You are an expert content creator assistant helping users create viral social media content. 
Your task is to help generate engaging titles, hooks, body content, and CTAs for social media posts.

Context about the task:
- Format: ${taskContext?.format || 'Not specified'}
- Niche: ${taskContext?.niche || 'Not specified'}
- Category: ${taskContext?.categoryName || 'Not specified'}
- Current title: ${taskContext?.title || 'Not specified'}

Guidelines:
- For "Kratka Forma" (Short Form): Create concise, punchy content optimized for Reels/TikTok (under 60 seconds)
- For "Duga Forma" (Long Form): Create detailed, engaging content for YouTube/Facebook (longer format)
- Hooks should be attention-grabbing and create curiosity (0-3 seconds)
- Body should deliver value and keep viewers engaged (3-45 seconds for short form)
- CTAs should be clear and actionable
- Write in Serbian language (Cyrillic or Latin script, match user's preference)
- Be creative, engaging, and optimized for viral potential

CRITICAL: When generating hooks, return ONLY the hook text itself - no explanations, no labels, no additional text. Just the hook.${hooksContext}`

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
        used: parsedResult.credits_used,
        remaining: parsedResult.credits_remaining,
        max: parsedResult.max_credits,
        reset_at: parsedResult.reset_at,
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

