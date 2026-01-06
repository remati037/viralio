'use client';

import { useUserId } from '@/components/UserContext';
import { useAICredits } from '@/lib/hooks/useAICredits';
import { Copy, Loader2, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import AICreditBadge from './ui/ai-credit-badge';
import Skeleton from './ui/skeleton';

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
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
  onGenerateComplete?: (
    field: 'title' | 'hook' | 'body' | 'cta' | 'all',
    content: string
  ) => void;
  className?: string;
}

export default function AIAssistant({
  taskContext,
  onGenerateComplete,
  className,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userId = useUserId();
  const { credits, refreshCredits, updateCreditsFromResponse, hasCredits } =
    useAICredits(userId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

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
    // Tone can be a string (valid tone value) or null/undefined
    const toneValue = taskContext?.tone;
    const hasValidTone =
      toneValue && typeof toneValue === 'string' && toneValue.trim() !== '';
    console.log(taskContext);

    if (!hasValidTone) {
      toast.error('Ton je obavezan', {
        description: 'Molimo izaberite ton pre korišćenja AI generatora.',
        duration: 5000,
      });
      return;
    }

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

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }].map(
            (m) => ({
              role: m.role,
              content: m.content,
            })
          ),
          taskContext,
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        // Handle insufficient credits error
        if (error.error_code === 'INSUFFICIENT_CREDITS') {
          refreshCredits();
          setMessages((prev) => prev.slice(0, -1)); // Remove user message on error
          throw new Error(
            `Nedovoljno AI kredita. Preostalo: ${error.credits_remaining}/${error.max_credits}. Krediti se resetuju: ${new Date(error.reset_at).toLocaleDateString('sr-RS')}`
          );
        }

        throw new Error(error.error || 'Failed to get AI response');
      }

      const data = await response.json();
      const aiMessage = data.message;

      // Update credits directly from API response to avoid race conditions
      if (data.credits) {
        console.log(
          'AIAssistant: Updating credits from API response:',
          data.credits
        );
        updateCreditsFromResponse(data.credits);
      } else {
        console.warn(
          'AIAssistant: No credits in API response, falling back to refresh'
        );
        // Fallback to refresh if API didn't return credits
        refreshCredits();
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: aiMessage },
      ]);
    } catch (error: any) {
      toast.error('Greška', {
        description: error.message || 'Neuspešno generisanje AI odgovora',
      });
      setMessages((prev) => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = async (prompt: string) => {
    setInput(prompt);
    // Auto-send after a brief delay
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopirano', {
      description: 'Tekst je kopiran u clipboard',
    });
  };

  const handleUseInField = (
    field: 'title' | 'hook' | 'body' | 'cta' | 'all',
    content: string
  ) => {
    if (onGenerateComplete) {
      onGenerateComplete(field, content);
      toast.success('Primenjeno', {
        description:
          field === 'all'
            ? 'Kompletan sadržaj je primenjen'
            : `Sadržaj je primenjen u polje: ${field}`,
      });
    }
  };

  const categoryInfo = taskContext?.categoryName
    ? ` Kategorija: ${taskContext.categoryName}.`
    : '';
  const toneInfo = taskContext?.tone
    ? (() => {
        const toneOptions = [
          {
            value: 'friendly',
            label: 'Friendly',
            description: 'Warm, approachable',
          },
          {
            value: 'contrarian',
            label: 'Contrarian',
            description: 'Bold, challenging',
          },
          {
            value: 'expert',
            label: 'Expert',
            description: 'Authoritative, credible',
          },
          {
            value: 'playful',
            label: 'Playful',
            description: 'Fun, lighthearted',
          },
          {
            value: 'cinematic',
            label: 'Cinematic',
            description: 'Dramatic, visual',
          },
          {
            value: 'educational',
            label: 'Educational',
            description: 'Informative, teaching',
          },
          {
            value: 'entertaining',
            label: 'Entertaining',
            description: 'Engaging, amusing',
          },
          {
            value: 'inspirational',
            label: 'Inspirational',
            description: 'Motivating, uplifting',
          },
        ];
        const toneOption = toneOptions.find(
          (t) => t.value === taskContext?.tone
        );
        return toneOption
          ? ` Ton: ${toneOption.label} (${toneOption.description}).`
          : '';
      })()
    : '';
  const audienceInfo = taskContext?.targetAudience
    ? ` Ciljna publika: ${taskContext.targetAudience}.`
    : '';
  const quickPrompts = [
    {
      label: 'Generiši naslov',
      prompt: `Generiši kreativan i privlačan naslov za ${
        taskContext?.format || 'video'
      } u niši ${
        taskContext?.niche || 'marketing'
      }. Naslov treba da bude kratak, jasan i privlačan.${categoryInfo}${toneInfo}${audienceInfo}`,
    },
    {
      label: 'Generiši Hook',
      prompt: `Kreiraj moćan hook za ${
        taskContext?.format || 'video'
      } koji će privući pažnju u prve 3 sekunde. Neka bude intrigantan i izazove radoznalost.${categoryInfo}${toneInfo}${audienceInfo}`,
    },
    {
      label: 'Generiši Body',
      prompt: `Napiši vrednosni deo (body) za ${
        taskContext?.format || 'video'
      } koji će zadržati gledaoce i pružiti korisne informacije.${categoryInfo}${toneInfo}${audienceInfo}`,
    },
    {
      label: 'Generiši CTA',
      prompt: `Kreiraj jasan i akcijski poziv na akciju (CTA) koji će motivisati gledaoce da reaguju.${categoryInfo}${toneInfo}${audienceInfo}`,
    },
    {
      label: 'Generiši kompletan sadržaj',
      prompt: `Kreiraj kompletan sadržaj za ${
        taskContext?.format || 'video'
      } u niši ${
        taskContext?.niche || 'marketing'
      }. Uključi naslov, hook, body i CTA. Formatiraj jasno sa oznakama HOOK:, BODY:, CTA:${categoryInfo}${toneInfo}${audienceInfo}`,
    },
  ];

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all shadow-lg w-full justify-center ${className}`}
      >
        <Sparkles size={16} />
        <span className="text-md">AI Asistent</span>
      </button>
    );
  }

  console.log(taskContext);

  return (
    <div
      className={`bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col ${className}`}
      style={{ maxHeight: '600px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-purple-400" />
          <h3 className="text-white font-bold text-md">AI Asistent</h3>
        </div>
        <div className="flex items-center gap-3">
          {credits && (
            <AICreditBadge
              creditsRemaining={credits.credits_remaining}
              maxCredits={credits.max_credits}
              compact={true}
              showWarning={false}
            />
          )}
          <button
            onClick={() => setIsExpanded(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Quick Prompts */}
      {messages.length === 0 && (
        <div className="p-2 border-b border-slate-700 bg-slate-900/50">
          <p className="text-xs text-slate-400 mb-2">Brzi promptovi:</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((qp, idx) => {
              const hasValidTone =
                taskContext?.tone &&
                typeof taskContext.tone === 'string' &&
                taskContext.tone.trim() !== '';
              const isDisabled =
                !taskContext?.title?.trim() ||
                !taskContext?.categoryId ||
                !hasValidTone ||
                !taskContext?.targetAudience?.trim();
              const tooltipText = !taskContext?.title?.trim()
                ? 'Unesite naslov pre korišćenja'
                : !taskContext?.categoryId
                  ? 'Izaberite kategoriju pre korišćenja'
                  : !hasValidTone
                    ? 'Izaberite ton pre korišćenja'
                    : !taskContext?.targetAudience?.trim()
                      ? 'Unesite ciljnu publiku pre korišćenja'
                      : undefined;
              console.log(taskContext);

              return (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(qp.prompt)}
                  disabled={isDisabled}
                  className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={tooltipText}
                >
                  {qp.label}
                </button>
              );
            })}
          </div>
          {(() => {
            const hasValidTone =
              taskContext?.tone &&
              typeof taskContext.tone === 'string' &&
              taskContext.tone.trim() !== '';
            console.log(taskContext);
            return (
              (!taskContext?.title?.trim() ||
                !taskContext?.categoryId ||
                !hasValidTone ||
                !taskContext?.targetAudience?.trim()) && (
                <p className="text-xs text-red-400 mt-2">
                  ⚠️{' '}
                  {!taskContext?.title?.trim()
                    ? 'Unesite naslov pre korišćenja AI generatora'
                    : !taskContext?.categoryId
                      ? 'Izaberite kategoriju pre korišćenja AI generatora'
                      : !hasValidTone
                        ? 'Izaberite ton pre korišćenja AI generatora'
                        : 'Unesite ciljnu publiku pre korišćenja AI generatora'}
                </p>
              )
            );
          })()}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[300px]">
        {messages.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            <Sparkles size={24} className="mx-auto mb-2 text-slate-600" />
            <p>Počni razgovor sa AI asistentom</p>
            <p className="text-xs mt-1">Ili koristi brze promptove iznad</p>
          </div>
        )}

        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.role === 'assistant' && (
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-600">
                  <button
                    onClick={() => handleCopy(message.content)}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <Copy size={12} />
                    Kopiraj
                  </button>
                  {/* {onGenerateComplete && (
                    <div className="flex flex-wrap">
                      {taskContext?.format === 'Kratka Forma' ? (
                        <>
                          <button
                            onClick={() =>
                              handleUseInField('hook', message.content)
                            }
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                          >
                            Koristi za Hook
                          </button>
                          <button
                            onClick={() =>
                              handleUseInField('body', message.content)
                            }
                            className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors"
                          >
                            Koristi za Body
                          </button>
                          <button
                            onClick={() =>
                              handleUseInField('cta', message.content)
                            }
                            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                          >
                            Koristi za CTA
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() =>
                            handleUseInField('hook', message.content)
                          }
                          className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors"
                        >
                          Koristi za Skriptu
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleUseInField('title', message.content)
                        }
                        className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 transition-colors"
                      >
                        Koristi za Naslov
                      </button>
                      {(message.content.match(/HOOK:|BODY:|CTA:|NASLOV:/i) ||
                        message.content.split('\n\n').length > 2) && (
                        <button
                          onClick={() =>
                            handleUseInField('all', message.content)
                          }
                          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors font-semibold"
                        >
                          Koristi Sve
                        </button>
                      )}
                    </div>
                  )} */}
                </div>
              )}
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
                <span className="text-xs text-white">TY</span>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="bg-slate-700 rounded-lg p-3 max-w-[80%]">
              <div className="space-y-2">
                <Skeleton height={16} width="200px" />
                <Skeleton height={16} width="180px" />
                <Skeleton height={16} width="150px" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-slate-700 bg-slate-900/50">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Pitaj AI asistenta..."
            rows={2}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
          />
          <button
            onClick={handleSend}
            disabled={
              !input.trim() ||
              isLoading ||
              !hasCredits ||
              !taskContext?.title?.trim() ||
              !taskContext?.categoryId ||
              !(
                taskContext?.tone &&
                typeof taskContext.tone === 'string' &&
                taskContext.tone.trim() !== ''
              ) ||
              !taskContext?.targetAudience?.trim()
            }
            className="px-3 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-fit"
            title={
              !taskContext?.title?.trim()
                ? 'Unesite naslov pre korišćenja AI generatora'
                : !taskContext?.categoryId
                  ? 'Izaberite kategoriju pre korišćenja AI generatora'
                  : !(
                        taskContext?.tone &&
                        typeof taskContext.tone === 'string' &&
                        taskContext.tone.trim() !== ''
                      )
                    ? 'Izaberite ton pre korišćenja AI generatora'
                    : !taskContext?.targetAudience?.trim()
                      ? 'Unesite ciljnu publiku pre korišćenja AI generatora'
                      : !hasCredits
                        ? 'Nema AI kredita'
                        : 'Pošalji poruku (1 kredit)'
            }
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Pritisnite Enter za slanje ili Shift+Enter za novi red. Svaka poruka
          koristi 1 AI kredit.
        </p>
      </div>
    </div>
  );
}
