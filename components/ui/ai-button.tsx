'use client';

import { TONE_OPTIONS } from '@/components/ui/tone-select';
import { useUserId } from '@/components/UserContext';
import { useAICredits } from '@/lib/hooks/useAICredits';
import { Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AIButtonProps {
  fieldType: 'hook' | 'body' | 'cta' | 'title' | 'fullScript';
  currentContent: string;
  taskContext?: {
    title?: string;
    niche?: string;
    format?: 'Kratka Forma' | 'Duga Forma';
    hook?: string;
    body?: string;
    cta?: string;
    categoryId?: string | null;
    categoryName?: string;
    tone?: string | null;
    targetAudience?: string | null;
  };
  onGenerate: (content: string) => void;
  className?: string;
}

const getToneInfo = (tone?: string | null): string => {
  if (!tone) return '';
  const toneOption = TONE_OPTIONS.find((t) => t.value === tone);
  if (!toneOption) return '';
  return ` Ton: ${toneOption.label} (${toneOption.description}).`;
};

const fieldPrompts: Record<
  AIButtonProps['fieldType'],
  (context: AIButtonProps['taskContext'], currentContent: string) => string
> = {
  hook: (context, currentContent) => {
    const hasContent = currentContent.trim().length > 0;
    const categoryInfo = context?.categoryName
      ? ` Kategorija: ${context.categoryName}.`
      : '';
    const toneInfo = getToneInfo(context?.tone);
    const audienceInfo = context?.targetAudience
      ? ` Ciljna publika: ${context.targetAudience}.`
      : '';
    return `### ROLE & OBJECTIVE
You are a Viral Hook Expert for Short-Form content (TikTok, Reels, Shorts).
Your ONLY goal is to write opening lines that stop the scroll immediately.

### INPUT DATA
- *Topic:* ${context?.title}
- *Target Audience:* ${context?.targetAudience} (default: General)

### STRICT RULES FOR HOOKS
1.  *NO GREETINGS:* NEVER start with "Hello everyone", "Hi guys", "Dobrodošli". Start instantly.
2.  *LENGTH:* Maximum 10-15 words per hook. It must be spoken in under 3 seconds.
3.  *LANGUAGE:* Serbian (Latin script). Use the informal "Ti" (You).
4.  *TONE:* Urgent, specific, and bold.
5.  *VISUAL CUE:* The text must imply visual movement or a strong statement.

### TASK: GENERATE 3 DISTINCT VARIATIONS

*Variation 1: The Negative/Warning Hook*
* Logic: Focus on a mistake, a stop command, or a fear of missing out.
* Template examples: "Prestani da radiš X...", "Ovo je razlog zašto ne uspevaš da...", "Najveća greška kod..."

*Variation 2: The Direct Benefit Hook*
* Logic: A massive promise delivered quickly. "How to" without boring words.
* Template examples: "Kako da [Benefit] za manje od [Time]...", "Jedini trik koji ti treba za..."

*Variation 3: The Curiosity/Secret Hook*
* Logic: Start in the middle of a sentence or state something counter-intuitive.
* Template examples: "Niko ti ovo neće reći o...", "Ovo zvuči ludo, ali..."

### OUTPUT FORMAT
Provide the output specifically formatted like this (just the text):

[Warning]: [Insert Hook Text Here]
[Benefit]: [Insert Hook Text Here]
[Curiosity]: [Insert Hook Text Here]

### GENERATE HOOKS NOW FOR TOPIC: ${context?.title}`;
  },
  body: (context, currentContent) => {
    const hasContent = currentContent.trim().length > 0;
    const categoryInfo = context?.categoryName
      ? ` Kategorija: ${context.categoryName}.`
      : '';
    const toneInfo = getToneInfo(context?.tone);
    const audienceInfo = context?.targetAudience
      ? ` Ciljna publika: ${context.targetAudience}.`
      : '';
    return `### ROLE & OBJECTIVE
You are an expert Short-Form Video Scriptwriter for the Balkan market (Serbia, Croatia, Bosnia, Montenegro). Your task is to write the *BODY* section of a viral Reel/TikTok script based on the User's Topic.

### INPUT DATA
- *Topic:* ${context?.title}
- *Tone:* ${context?.tone} (default: Energetic, confident, informal)
- *Target Audience:* ${context?.targetAudience} (optional, default: General public)

### STRICT WRITING RULES (CRITICAL)
1.  *LANGUAGE:* Output must be in *SERBIAN* (Latin script).
2.  *TONE & STYLE:*
    - Use the informal "Ti" (You) to address the viewer directly. NEVER use the formal "Vi" unless explicitly requested.
    - Write exactly how people speak in Belgrade/region (urban, modern, conversational).
    - Avoid complex academic words. Use simple, punchy vocabulary (6th-grade level).
    - NO generic fluff phrases like "U današnjem videu ću vam pokazati..." (In today's video I will show you...).
3.  *PACING & STRUCTURE:*
    - *Start immediately:* The Hook is already done. Jump straight into the value/story.
    - *Sentence Length:* Keep sentences short. One breath per sentence.
    - *Formatting:* Write each sentence on a new line for easier reading on a teleprompter.
    - *Length:* Target 60-90 words total (approx. 20-30 seconds spoken).

### CONTENT LOGIC (Dynamic Selection)
Based on the Topic, choose the best structure automatically:
- *If Educational:* Use "Step-by-Step" (Prvo uradi ovo... Zatim...).
- *If Explanatory:* Use "The Insight" (Većina ljudi misli X, ali zapravo je Y...).
- *If Tips:* Use "Rapid Fire" (Broj 1... Broj 2... Broj 3...).

### OUTPUT FORMAT
- Do NOT output the Hook or CTA. Only the BODY.
- Do NOT use labels like "Body:" or "Tekst:". Just the raw script text.
- Do NOT use markdown bolding (**) in the final text (it confuses some teleprompters).

### GENERATE SCRIPT BODY NOW FOR TOPIC: ${context?.title}`;
  },
  cta: (context, currentContent) => {
    return `### ROLE & OBJECTIVE
You are a Conversion Rate Optimization (CRO) Expert for social media.
Your task is to take a User's DRAFT CTA and rewrite it into 3 high-converting variations.

### INPUT DATA
- *User's Draft:* ${context?.cta || currentContent} (The raw idea)
- *Topic:* ${context?.title} (Context for relevance)

### ANALYSIS LOGIC
1.  *Identify the Goal:* Determine what the user wants (Follow, Comment, Share, Save, or Click Link) based on their draft.
2.  *Respect the Goal:* Do NOT change the action type. If they ask for a "Comment", do not write a "Follow" CTA.
3.  *Upgrade the Phrasing:*
    - Remove "Please" or begging tones.
    - Add a "Benefit" (Why should they do it?).
    - Add "Urgency" or "FOMO" (Fear Of Missing Out).

### STRICT RULES
1.  *Language:* Serbian (Latin script). Informal "Ti".
2.  *Length:* Short and punchy (max 8-10 words).
3.  *Tone:* Confident and directive.

### OUTPUT FORMAT
Provide the output specifically formatted like this:

1. A polished, stronger version of their exact words.
2. The action + the specific benefit they get. 
3. Uses curiosity, FOMO, or reverse psychology.

### GENERATE CTA UPGRADES NOW.
USER DRAFT: "${context?.cta || currentContent}"
TOPIC: "${context?.title}"`;
  },
  title: (context, currentContent) => {
    const hasContent = currentContent.trim().length > 0;
    const categoryInfo = context?.categoryName
      ? ` Kategorija: ${context.categoryName}.`
      : '';
    const toneInfo = getToneInfo(context?.tone);
    const audienceInfo = context?.targetAudience
      ? ` Ciljna publika: ${context.targetAudience}.`
      : '';
    return `Generiši kreativan i privlačan naslov za ${
      context?.format || 'video'
    } u niši ${context?.niche || 'marketing'}. ${
      hasContent
        ? `Trenutni sadržaj: ${currentContent.substring(0, 200)}. `
        : ''
    }Naslov treba da bude kratak, jasan i privlačan.${categoryInfo}${toneInfo}${audienceInfo}`;
  },
  fullScript: (context, currentContent) => {
    const hasContent = currentContent.trim().length > 0;
    const categoryInfo = context?.categoryName
      ? ` Kategorija: ${context.categoryName}.`
      : '';
    const toneInfo = getToneInfo(context?.tone);
    const audienceInfo = context?.targetAudience
      ? ` Ciljna publika: ${context.targetAudience}.`
      : '';
    return `Kreiraj kompletan scenario/tekst za ${
      context?.format || 'Duga Forma'
    } u niši ${context?.niche || 'marketing'}. ${
      hasContent
        ? `Trenutni sadržaj: ${currentContent.substring(0, 200)}. `
        : ''
    }Uključi ceo tekst bez razdvajanja na delove. Format: ${
      context?.format || 'Duga Forma'
    }.${categoryInfo}${toneInfo}${audienceInfo}`;
  },
};

export default function AIButton({
  fieldType,
  currentContent,
  taskContext,
  onGenerate,
  className = '',
}: AIButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const userId = useUserId();
  const { credits, refreshCredits, updateCreditsFromResponse, hasCredits } =
    useAICredits(userId);

  const handleGenerate = async () => {
    if (isLoading) return;

    // Special validation for CTA generator - ONLY requires title and CTA, nothing else
    if (fieldType === 'cta') {
      const hasTitle =
        taskContext?.title && taskContext.title.trim().length > 0;
      const hasCTA = taskContext?.cta && taskContext.cta.trim().length > 0;

      if (!hasTitle) {
        toast.error('Naslov je obavezan', {
          description:
            'CTA generator zahteva unos Naslova (Naziv) pre korišćenja.',
          duration: 5000,
        });
        return;
      }
      if (!hasCTA) {
        toast.error('CTA je obavezan', {
          description: 'CTA generator zahteva unos CTA polja pre korišćenja.',
          duration: 5000,
        });
        return;
      }
    } else {
      // Standard validation for other generators
      // Check if title is provided
      if (!taskContext?.title || !taskContext.title.trim()) {
        toast.error('Naslov je obavezan', {
          description: 'Molimo unesite naslov pre korišćenja AI generatora.',
          duration: 5000,
        });
        return;
      }

      // Check if category is selected
      if (!taskContext?.categoryId) {
        toast.error('Kategorija je obavezna', {
          description:
            'Molimo izaberite kategoriju pre korišćenja AI generatora.',
          duration: 5000,
        });
        return;
      }

      // Check if tone is selected
      if (!taskContext?.tone) {
        toast.error('Ton je obavezan', {
          description: 'Molimo izaberite ton pre korišćenja AI generatora.',
          duration: 5000,
        });
        return;
      }
      console.log(taskContext);

      // Check if target audience is provided
      if (!taskContext?.targetAudience || !taskContext.targetAudience.trim()) {
        toast.error('Ciljna publika je obavezna', {
          description:
            'Molimo unesite ciljnu publiku pre korišćenja AI generatora.',
          duration: 5000,
        });
        return;
      }
    }

    // Check if user has credits
    if (!hasCredits) {
      toast.error('Nema AI kredita', {
        description: `Iskorišćeni su svi mesečni AI krediti (${credits?.max_credits || 500}). Krediti se resetuju početkom sledećeg meseca.`,
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const prompt = fieldPrompts[fieldType](taskContext, currentContent);

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          taskContext,
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        // Handle insufficient credits error
        if (error.error_code === 'INSUFFICIENT_CREDITS') {
          refreshCredits();
          throw new Error(
            `Nedovoljno AI kredita. Preostalo: ${error.credits_remaining}/${error.max_credits}. Krediti se resetuju: ${new Date(error.reset_at).toLocaleDateString('sr-RS')}`
          );
        }

        throw new Error(error.error || 'Failed to generate content');
      }

      const data = await response.json();
      const generatedContent = data.message;

      // Clean up the response - remove any markdown formatting or labels
      // let cleanedContent = generatedContent.trim();
      let cleanedContent = generatedContent;

      // For hooks, preserve all lines and format them properly
      if (fieldType === 'hook') {
        // Remove common prefixes
        const prefixes = [
          'HOOK:',
          'Hook:',
          'Udica:',
          'Udicu:',
          '**HOOK:**',
          '**Hook:**',
          '**Udica:**',
        ];
        for (const prefix of prefixes) {
          if (cleanedContent.toLowerCase().startsWith(prefix.toLowerCase())) {
            cleanedContent = cleanedContent.substring(prefix.length).trim();
          }
        }

        // Remove explanation lines but keep all hook content lines
        const lines = cleanedContent
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line);

        if (lines.length > 0) {
          const explanationIndicators = [
            'ovo je',
            'evo',
            'primer',
            'hook bi',
            'udica bi',
            'može biti',
          ];

          // Filter out explanation lines but keep all actual hook content
          const hookLines = lines.filter((line: string) => {
            const lowerLine = line.toLowerCase();
            return !explanationIndicators.some((indicator) =>
              lowerLine.includes(indicator)
            );
          });

          // If we filtered out all lines, use the original lines
          const finalLines = hookLines.length > 0 ? hookLines : lines;

          // Join all lines preserving the structure - convert to HTML paragraphs
          cleanedContent = finalLines
            .map((line: string) => `<p>${line.trim()}</p>`)
            .join('');
        }
      } else {
        // For other field types, use existing logic
        // Remove common prefixes like "HOOK:", "BODY:", "CTA:", etc.
        const prefixes = [
          'HOOK:',
          'BODY:',
          'CTA:',
          'TITLE:',
          'Naslov:',
          'Hook:',
          'Body:',
          'Cta:',
          'Title:',
        ];
        for (const prefix of prefixes) {
          if (cleanedContent.startsWith(prefix)) {
            cleanedContent = cleanedContent.substring(prefix.length).trim();
          }
        }
      }

      // Convert plain text to HTML paragraphs if needed
      if (!cleanedContent.includes('<')) {
        const lines = cleanedContent
          .split('\n')
          .filter((line: string) => line.trim());
        cleanedContent = lines
          .map((line: string) => `<p>${line.trim()}</p>`)
          .join('');
      }

      onGenerate(cleanedContent);

      // Update credits directly from API response to avoid race conditions
      if (data.credits) {
        console.log('Updating credits from API response:', data.credits);
        updateCreditsFromResponse(data.credits);
        toast.success('AI sadržaj generisan', {
          description: `Sadržaj za ${fieldType} je uspešno generisan. Preostalo kredita: ${data.credits.remaining}/${data.credits.max}`,
        });
      } else {
        console.warn('No credits in API response, falling back to refresh');
        // Fallback to refresh if API didn't return credits
        refreshCredits();
        toast.success('AI sadržaj generisan', {
          description: `Sadržaj za ${fieldType} je uspešno generisan.`,
        });
      }
    } catch (error: any) {
      toast.error('Greška pri generisanju', {
        description: error.message || 'Neuspešno generisanje AI sadržaja',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fieldLabels: Record<AIButtonProps['fieldType'], string> = {
    hook: 'Hook',
    body: 'Body',
    cta: 'CTA',
    title: 'Naslov',
    fullScript: 'Scenario',
  };

  // Special condition for CTA generator: ONLY requires title and CTA
  const hasTitle = taskContext?.title && taskContext.title.trim().length > 0;
  const hasCTA = taskContext?.cta && taskContext.cta.trim().length > 0;

  const isDisabled =
    isLoading ||
    !hasCredits ||
    (fieldType === 'cta'
      ? !hasTitle || !hasCTA
      : !taskContext?.title?.trim() ||
        !taskContext?.categoryId ||
        !taskContext?.tone ||
        !taskContext?.targetAudience?.trim());
  console.log(taskContext);

  const getTooltipText = () => {
    if (!hasCredits) {
      return `Nema AI kredita. Preostalo: ${credits?.credits_remaining || 0}/${credits?.max_credits || 500}`;
    }

    // Special tooltip for CTA generator
    if (fieldType === 'cta') {
      if (!hasTitle) {
        return 'Unesite naslov (Naziv) pre korišćenja CTA generatora';
      }
      if (!hasCTA) {
        return 'Unesite CTA pre korišćenja CTA generatora';
      }
      return `Generiši ${fieldLabels[fieldType]} pomoću AI (1 kredit)`;
    }

    // Standard tooltips for other generators
    if (!taskContext?.title?.trim()) {
      return 'Unesite naslov pre korišćenja AI generatora';
    }
    if (!taskContext?.categoryId) {
      return 'Izaberite kategoriju pre korišćenja AI generatora';
    }
    if (!taskContext?.tone) {
      return 'Izaberite ton pre korišćenja AI generatora';
    }
    if (!taskContext?.targetAudience?.trim()) {
      return 'Unesite ciljnu publiku pre korišćenja AI generatora';
    }
    return `Generiši ${fieldLabels[fieldType]} pomoću AI (1 kredit)`;
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={handleGenerate}
        disabled={isDisabled}
        className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-purple-700 disabled:to-blue-700 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-all shadow-lg ${isDisabled ? 'opacity-60' : ''}`}
        title={getTooltipText()}
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Generisanje...</span>
          </>
        ) : (
          <>
            <Sparkles size={16} />
            <span>Generiši {fieldLabels[fieldType]} uz pomoć AI</span>
            {credits && (
              <span className="text-xs opacity-75">
                ({credits.credits_remaining} kredita)
              </span>
            )}
          </>
        )}
      </button>
      {/* Notification for CTA generator requirements */}
      {fieldType === 'cta' && !isLoading && (!hasTitle || !hasCTA) && (
        <p className="text-xs text-red-400 font-medium">
          {!hasTitle && !hasCTA
            ? '⚠️ CTA generator zahteva unos Naslova (Naziv) i CTA polja'
            : !hasTitle
              ? '⚠️ CTA generator zahteva unos Naslova (Naziv). Unesite Naslov pre korišćenja CTA generatora.'
              : !hasCTA
                ? '⚠️ CTA generator zahteva unos CTA polja. Unesite CTA polje pre korišćenja CTA generatora.'
                : ''}
        </p>
      )}
    </div>
  );
}
