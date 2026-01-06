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
    return `Kreiraj moćan hook (udicu) za ${
      context?.format || 'video'
    } koji će privući pažnju u prve 3 sekunde. Neka bude intrigantan, izazove radoznalost i zadrži gledaoce. Format: ${
      context?.format || 'Kratka Forma'
    }. Niša: ${context?.niche || 'marketing'}.${categoryInfo}${toneInfo}${audienceInfo}

VAŽNO: Vrati SAMO tekst hooka, bez objašnjenja, bez dodatnog teksta, bez labela. Samo hook.`;
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
    return `Napiši vrednosni deo (body) za ${
      context?.format || 'video'
    } koji će zadržati gledaoce i pružiti korisne informacije. ${
      hasContent
        ? `Trenutni sadržaj: ${currentContent.substring(0, 200)}. `
        : ''
    }Format: ${context?.format || 'Kratka Forma'}. Niša: ${
      context?.niche || 'marketing'
    }. Naslov: ${context?.title || 'N/A'}.${categoryInfo}${toneInfo}${audienceInfo}`;
  },
  cta: (context, currentContent) => {
    const hasContent = currentContent.trim().length > 0;
    const categoryInfo = context?.categoryName
      ? ` Kategorija: ${context.categoryName}.`
      : '';
    const toneInfo = getToneInfo(context?.tone);
    const audienceInfo = context?.targetAudience
      ? ` Ciljna publika: ${context.targetAudience}.`
      : '';
    return `Kreiraj jasan i akcijski poziv na akciju (CTA) koji će motivisati gledaoce da reaguju. ${
      hasContent
        ? `Trenutni sadržaj: ${currentContent.substring(0, 200)}. `
        : ''
    }Format: ${context?.format || 'Kratka Forma'}. Niša: ${
      context?.niche || 'marketing'
    }.${categoryInfo}${toneInfo}${audienceInfo}`;
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
      let cleanedContent = generatedContent.trim();

      // For hooks, extract only the hook text (first sentence/paragraph)
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

        // Extract only the first sentence/paragraph (hook should be short)
        // Split by newlines and take the first non-empty line
        const lines = cleanedContent
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line);
        if (lines.length > 0) {
          // Take the first line, but if it's too long (likely an explanation), take first sentence
          let hookText = lines[0];

          // If first line contains common explanation words, try to extract just the hook
          const explanationIndicators = [
            'ovo je',
            'evo',
            'primer',
            'hook bi',
            'udica bi',
            'može biti',
          ];
          const lowerFirstLine = hookText.toLowerCase();

          // Check if first line seems like an explanation
          if (
            explanationIndicators.some((indicator) =>
              lowerFirstLine.includes(indicator)
            ) &&
            lines.length > 1
          ) {
            // Look for the actual hook in subsequent lines
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              // Skip lines that look like explanations
              if (
                !explanationIndicators.some((indicator) =>
                  line.toLowerCase().includes(indicator)
                )
              ) {
                hookText = line;
                break;
              }
            }
          }

          // Take only first sentence if it ends with punctuation
          const sentenceEnd = hookText.match(/^[^.!?]*[.!?]/);
          if (sentenceEnd) {
            hookText = sentenceEnd[0].trim();
          }

          cleanedContent = hookText;
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

  const isDisabled =
    isLoading ||
    !hasCredits ||
    !taskContext?.title?.trim() ||
    !taskContext?.categoryId ||
    !taskContext?.tone ||
    !taskContext?.targetAudience?.trim();
  console.log(taskContext);

  const getTooltipText = () => {
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
    if (!hasCredits) {
      return `Nema AI kredita. Preostalo: ${credits?.credits_remaining || 0}/${credits?.max_credits || 500}`;
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
    </div>
  );
}
