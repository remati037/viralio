'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAICredits } from '@/lib/hooks/useAICredits';
import { useUserId } from '@/components/UserContext';
import AICreditBadge from './ai-credit-badge';

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
  };
  onGenerate: (content: string) => void;
  className?: string;
}

const fieldPrompts: Record<
  AIButtonProps['fieldType'],
  (context: AIButtonProps['taskContext'], currentContent: string) => string
> = {
  hook: (context, currentContent) => {
    const hasContent = currentContent.trim().length > 0;
    return `Kreiraj moćan hook (udicu) za ${
      context?.format || 'video'
    } koji će privući pažnju u prve 3 sekunde. ${
      hasContent
        ? `Trenutni sadržaj: ${currentContent.substring(0, 200)}. `
        : ''
    }Neka bude intrigantan, izazove radoznalost i zadrži gledaoce. Format: ${
      context?.format || 'Kratka Forma'
    }. Niša: ${context?.niche || 'marketing'}.`;
  },
  body: (context, currentContent) => {
    const hasContent = currentContent.trim().length > 0;
    return `Napiši vrednosni deo (body) za ${
      context?.format || 'video'
    } koji će zadržati gledaoce i pružiti korisne informacije. ${
      hasContent
        ? `Trenutni sadržaj: ${currentContent.substring(0, 200)}. `
        : ''
    }Format: ${context?.format || 'Kratka Forma'}. Niša: ${
      context?.niche || 'marketing'
    }. Naslov: ${context?.title || 'N/A'}.`;
  },
  cta: (context, currentContent) => {
    const hasContent = currentContent.trim().length > 0;
    return `Kreiraj jasan i akcijski poziv na akciju (CTA) koji će motivisati gledaoce da reaguju. ${
      hasContent
        ? `Trenutni sadržaj: ${currentContent.substring(0, 200)}. `
        : ''
    }Format: ${context?.format || 'Kratka Forma'}. Niša: ${
      context?.niche || 'marketing'
    }.`;
  },
  title: (context, currentContent) => {
    const hasContent = currentContent.trim().length > 0;
    return `Generiši kreativan i privlačan naslov za ${
      context?.format || 'video'
    } u niši ${context?.niche || 'marketing'}. ${
      hasContent
        ? `Trenutni sadržaj: ${currentContent.substring(0, 200)}. `
        : ''
    }Naslov treba da bude kratak, jasan i privlačan.`;
  },
  fullScript: (context, currentContent) => {
    const hasContent = currentContent.trim().length > 0;
    return `Kreiraj kompletan scenario/tekst za ${
      context?.format || 'Duga Forma'
    } u niši ${context?.niche || 'marketing'}. ${
      hasContent
        ? `Trenutni sadržaj: ${currentContent.substring(0, 200)}. `
        : ''
    }Uključi ceo tekst bez razdvajanja na delove. Format: ${
      context?.format || 'Duga Forma'
    }.`;
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
  const { credits, refreshCredits, hasCredits } = useAICredits(userId);

  const handleGenerate = async () => {
    if (isLoading) return;

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
      
      // Refresh credits after successful generation
      if (data.credits) {
        refreshCredits();
        toast.success('AI sadržaj generisan', {
          description: `Sadržaj za ${fieldType} je uspešno generisan. Preostalo kredita: ${data.credits.remaining}/${data.credits.max}`,
        });
      } else {
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

  const isDisabled = isLoading || !hasCredits;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={handleGenerate}
        disabled={isDisabled}
        className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-purple-700 disabled:to-blue-700 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-all shadow-lg ${isDisabled ? 'opacity-60' : ''}`}
        title={
          !hasCredits
            ? `Nema AI kredita. Preostalo: ${credits?.credits_remaining || 0}/${credits?.max_credits || 500}`
            : `Generiši ${fieldLabels[fieldType]} pomoću AI (1 kredit)`
        }
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
              <span className="text-xs opacity-75">({credits.credits_remaining} kredita)</span>
            )}
          </>
        )}
      </button>
      {credits && (
        <AICreditBadge
          creditsRemaining={credits.credits_remaining}
          maxCredits={credits.max_credits}
          compact={true}
          showWarning={true}
        />
      )}
    </div>
  );
}
