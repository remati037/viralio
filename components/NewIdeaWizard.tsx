'use client';

import { NETWORKS, NICHES } from '@/lib/constants';
import { fetchWithCacheBust } from '@/lib/sanity/client-client';
import { getPublishedTemplatesByNicheQuery } from '@/lib/sanity/template-query';
import { createClient } from '@/lib/supabase/client';
import { getYoutubeThumbnail } from '@/lib/utils/helpers';
import type { TaskInsert, UserTier } from '@/types';
import {
  Calendar,
  ChevronLeft,
  Edit3,
  FileText,
  Link,
  Plus,
  Trash2,
  X,
  Youtube,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AIAssistant from './AIAssistant';
import CategorySelect, { type TaskCategory } from './ui/category-select';
import DatePicker from './ui/date-picker';
import Loader from './ui/loader';
import RichTextEditor from './ui/rich-text-editor';
import Skeleton from './ui/skeleton';

interface NewIdeaWizardProps {
  onClose: () => void;
  onSaveToPlan: (
    task: Omit<TaskInsert, 'user_id'>,
    inspirationLinks?: Array<{
      link: string;
      displayUrl?: string;
      type?: string;
    }>
  ) => Promise<void>;
  userTier?: UserTier;
  userId: string;
}

const WORDS_PER_MINUTE = 150;

export default function NewIdeaWizard({
  onClose,
  onSaveToPlan,
  userTier,
  userId,
}: NewIdeaWizardProps) {
  const supabase = createClient();
  const [step, setStep] = useState<'start' | 'template_select' | 'script_edit'>(
    'start'
  );
  const [selectedNiche, setSelectedNiche] = useState('marketing');
  const [sanityTemplates, setSanityTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState({
    title: '',
    niche: NICHES[0].name,
    format: 'Kratka Forma' as 'Kratka Forma' | 'Duga Forma',
    network: NETWORKS[0].name,
    hook: '',
    hookHtml: '',
    body: '',
    bodyHtml: '',
    cta: '',
    ctaHtml: '',
    fullScript: '',
    fullScriptHtml: '',
    originalTemplate: null as string | null,
    publish_date: null as string | null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [inspirationLinks, setInspirationLinks] = useState<
    Array<{ link: string; displayUrl?: string; type?: string }>
  >([]);
  const [linkInput, setLinkInput] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchCategories();
    }
  }, [userId]);

  const fetchCategories = async () => {
    if (!userId) {
      setLoadingCategories(false);
      return;
    }

    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCategories((data || []) as TaskCategory[]);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Greška pri učitavanju kategorija', {
        description: error?.message || 'Pokušajte ponovo',
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (step === 'template_select') {
      fetchTemplates();
    }
  }, [step, selectedNiche]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const nicheName =
        NICHES.find((n) => n.id === selectedNiche)?.name || 'Marketing';

      // Map niche names from app format to Sanity format
      const sanityNicheMap: Record<string, string> = {
        'Marketing & Biznis': 'Marketing',
        Nekretnine: 'Nekretnine',
        'Fitness & Zdravlje': 'Fitness',
        'E-commerce': 'E-commerce',
      };
      const sanityNiche = sanityNicheMap[nicheName] || nicheName;

      console.log(
        '🔍 Fetching templates for niche:',
        nicheName,
        '(selectedNiche:',
        selectedNiche + ')'
      );
      console.log('🔍 Using Sanity niche:', sanityNiche);

      // Fetch templates from Sanity only
      // Use fetchWithCacheBust to ensure fresh data in development
      const templates = await fetchWithCacheBust<any[]>(
        getPublishedTemplatesByNicheQuery,
        { niche: sanityNiche },
        { forceFresh: true } // Always force fresh to see latest edits
      );

      console.log(
        '✅ Sanity templates fetched:',
        templates?.length || 0,
        'templates for niche:',
        nicheName
      );
      console.log('Sanity templates data:', templates);
      setSanityTemplates(templates || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      setSanityTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Only use Sanity templates
  const activeTemplates = useMemo(
    () =>
      sanityTemplates.map((t) => ({
        id: t._id,
        title: t.title,
        format: t.format,
        concept: t.concept || '',
        structure: {
          hook: t.structure?.hook || '',
          body: t.structure?.body || '',
          cta: t.structure?.cta || '',
        },
        vlads_tip: t.vladsTip || '',
        source: 'sanity' as const,
      })),
    [sanityTemplates]
  );

  // Debug: Log templates
  useEffect(() => {
    if (activeTemplates.length > 0) {
      console.log('📋 Sanity templates:', activeTemplates.length);
    }
  }, [activeTemplates.length, sanityTemplates.length]);

  const activeNicheInfo = NICHES.find((n) => n.id === selectedNiche);

  const handleSelectTemplate = (template: (typeof activeTemplates)[0]) => {
    const topic = formData.title || 'Moja Tema';

    // Determine network based on format
    const networkForFormat =
      template.format === 'Duga Forma'
        ? NETWORKS.find((n) => n.id === 'youtube')?.name || NETWORKS[1].name
        : NETWORKS.find((n) => n.id === 'instagram')?.name || NETWORKS[0].name;

    if (template.format === 'Duga Forma') {
      const generatedScript = `UVOD: U prve 3 sekunde kaži zašto bi trebalo da ostanu do kraja.
GLAVNA TEMA 1: ${template.structure.body
        .replace('[TOPIC]', topic)
        .replace('[RESENJE]', 'koriste automatizaciju')}
GLAVNA TEMA 2: Detaljna analiza i primer
ZAKLJUČAK: ${template.structure.cta}`;

      setFormData((prev) => ({
        ...prev,
        title: prev.title || template.title,
        format: template.format as 'Kratka Forma' | 'Duga Forma',
        network: networkForFormat,
        originalTemplate: template.title,
        fullScript: generatedScript,
        fullScriptHtml: generatedScript,
        niche: activeNicheInfo?.name || prev.niche,
      }));
    } else {
      const hookText = template.structure.hook
        .replace('[TOPIC]', topic)
        .replace('[CENA]', '150.000')
        .replace('[RESENJE]', 'fokusiraju na LTV');
      const bodyText = template.structure.body
        .replace('[TOPIC]', topic)
        .replace('[RESENJE]', 'koriste automatizaciju');
      const ctaText = template.structure.cta;

      setFormData((prev) => ({
        ...prev,
        title: prev.title || template.title,
        format: template.format as 'Kratka Forma' | 'Duga Forma',
        network: networkForFormat,
        originalTemplate: template.title,
        hook: hookText,
        hookHtml: hookText,
        body: bodyText,
        bodyHtml: bodyText,
        cta: ctaText,
        ctaHtml: ctaText,
        niche: activeNicheInfo?.name || prev.niche,
      }));
    }
    setStep('script_edit');
  };

  const handleManualStart = () => {
    setFormData((prev) => ({
      ...prev,
      hook: '',
      hookHtml: '',
      body: '',
      bodyHtml: '',
      cta: '',
      ctaHtml: '',
      originalTemplate: 'Ručni Unos',
    }));
    setStep('script_edit');
  };

  const getDurationEstimate = (script: string) => {
    if (formData.format === 'Kratka Forma') {
      const words = script.trim().split(/\s+/).length;
      const seconds = Math.round(words / 2.5);
      if (seconds > 60) return '> 60 sekundi (Predugo za Reel)';
      return `${seconds} sekundi`;
    } else {
      const words = script.trim().split(/\s+/).length;
      if (words === 0) return '0 minuta';

      const minutes = Math.round(words / WORDS_PER_MINUTE);

      if (minutes < 1) return '< 1 minut';
      if (minutes <= 60) return `${minutes} minuta`;

      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      return `${hours}h ${remainingMinutes} min`;
    }
  };

  const getTotalWordCount = () => {
    if (formData.format === 'Kratka Forma') {
      const hookWords = formData.hook
        .trim()
        .split(/\s+/)
        .filter((w) => w).length;
      const bodyWords = formData.body
        .trim()
        .split(/\s+/)
        .filter((w) => w).length;
      const ctaWords = formData.cta
        .trim()
        .split(/\s+/)
        .filter((w) => w).length;
      return hookWords + bodyWords + ctaWords;
    } else {
      return formData.fullScript
        .trim()
        .split(/\s+/)
        .filter((w) => w).length;
    }
  };

  const handleAddInspirationLink = async () => {
    if (!linkInput.trim()) {
      toast.error('Prazan link', {
        description: 'Molimo unesite validan link.',
      });
      return;
    }

    setIsAddingLink(true);
    try {
      const { url, type } = getYoutubeThumbnail(linkInput);
      setInspirationLinks((prev) => [
        ...prev,
        {
          link: linkInput.trim(),
          displayUrl: url || undefined,
          type: type || undefined,
        },
      ]);
      setLinkInput('');
    } catch (error) {
      // Still add the link even if thumbnail extraction fails
      setInspirationLinks((prev) => [...prev, { link: linkInput.trim() }]);
      setLinkInput('');
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleRemoveInspirationLink = (index: number) => {
    setInspirationLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedCategoryId) {
      toast.error('Kategorija je obavezna', {
        description: 'Molimo izaberite kategoriju pre čuvanja skripte.',
      });
      return;
    }

    if (formData.format === 'Kratka Forma') {
      if (
        !formData.title.trim() ||
        (!formData.hook.trim() && !formData.body.trim() && !formData.cta.trim())
      ) {
        toast.error('Nedostaju podaci', {
          description:
            'Molimo unesite naslov i bar jedan deo skripte (Hook, Body ili CTA) pre čuvanja.',
        });
        return;
      }
    } else {
      if (!formData.title.trim() || !formData.fullScript.trim()) {
        toast.error('Nedostaju podaci', {
          description: 'Molimo unesite naslov i skriptu pre čuvanja.',
        });
        return;
      }
    }

    setIsSaving(true);

    const newTask = {
      title: formData.title.trim(),
      niche: formData.niche,
      format: formData.format,
      hook:
        formData.format === 'Duga Forma'
          ? formData.fullScript.trim()
          : formData.hook.trim(),
      body:
        formData.format === 'Duga Forma'
          ? 'CEO TEKST se nalazi u Hook/Skripta polju u detaljima.'
          : formData.body.trim(),
      cta:
        formData.format === 'Duga Forma'
          ? 'Duga Forma: Nema odvojenog CTA za Kanban.'
          : formData.cta.trim(),
      status: 'idea' as const,
      publish_date: formData.publish_date || null,
      original_template: formData.originalTemplate,
      category_id: selectedCategoryId,
    };

    await onSaveToPlan(
      newTask as Omit<TaskInsert, 'user_id'>,
      inspirationLinks
    );
    setIsSaving(false);
    onClose();
  };

  const IdeaSelectorCard = ({
    template,
  }: {
    template: (typeof activeTemplates)[0];
  }) => (
    <div
      className="group bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-lg p-4 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/10 flex flex-col h-full cursor-pointer"
      onClick={() => handleSelectTemplate(template)}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            template.format === 'Kratka Forma'
              ? 'bg-red-900/30 text-red-300'
              : 'bg-green-900/30 text-green-300'
          }`}
        >
          {template.format}
        </span>
      </div>

      <h3 className="text-md font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
        {template.title}
      </h3>

      <p className="text-slate-400 text-xs mb-4 flex-grow line-clamp-2">
        {template.concept}
      </p>

      <div className="mt-auto">
        <button className="w-full py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-500 transition-colors flex items-center justify-center gap-1">
          <Zap size={14} /> Koristi Šablon
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (step === 'start') {
      return (
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-bold text-white">
            1. Odaberi način kreiranja ideje
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={handleManualStart}
              className="py-4 px-2 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-500/50 cursor-pointer transition-all flex flex-col items-center text-center space-y-2"
            >
              <FileText size={22} className="text-blue-400" />
              <p className="font-bold text-white text-md">Ručni Unos</p>
              <p className="text-sm text-slate-400">
                Počnite od nule sa praznom skriptom.
              </p>
            </div>
            <div
              onClick={() => setStep('template_select')}
              className="py-4 px-2 bg-slate-800 border border-slate-700 rounded-lg hover:border-emerald-500/50 cursor-pointer transition-all flex flex-col items-center text-center space-y-2"
            >
              <Zap size={22} className="text-emerald-400" />
              <p className="font-bold text-white text-md">Koristi Šablon</p>
              <p className="text-sm text-slate-400">
                Izaberite viralni format za brzi start.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (step === 'template_select') {
      return (
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="text-yellow-400 w-5 h-5" /> 2. Odaberi Šablon
            </h3>
            <button
              onClick={() => setStep('start')}
              className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
            >
              <ChevronLeft size={16} /> Nazad
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {NICHES.map((niche) => (
              <button
                key={niche.id}
                onClick={() => setSelectedNiche(niche.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedNiche === niche.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {niche.name}
              </button>
            ))}
          </div>

          {loadingTemplates ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between">
                    <Skeleton height={20} width="60px" />
                    <Skeleton height={20} width="50px" />
                  </div>
                  <Skeleton height={24} width="100%" />
                  <Skeleton height={40} width="100%" />
                  <Skeleton height={32} width="100%" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-2">
              {activeTemplates.length === 0 ? (
                <div className="col-span-full text-center py-8 text-slate-500">
                  Trenutno nema sablona za ovu kategoriju
                </div>
              ) : (
                activeTemplates.map((template) => (
                  <IdeaSelectorCard key={template.id} template={template} />
                ))
              )}
            </div>
          )}
        </div>
      );
    }

    if (step === 'script_edit') {
      const isLongForm = formData.format === 'Duga Forma';

      return (
        <div className="p-4 space-y-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit3 className="text-emerald-400 w-4 h-4" /> 2. Skripta i
              detalji
            </h3>
            <button
              onClick={() => {
                // If user came from manual entry, go back to start
                // Otherwise, go back to template selection
                if (formData.originalTemplate === 'Ručni Unos') {
                  setStep('start');
                } else {
                  setStep('template_select');
                }
              }}
              className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
            >
              <ChevronLeft size={16} />{' '}
              {formData.originalTemplate === 'Ručni Unos'
                ? 'Nazad'
                : 'Izaberi drugi šablon'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Naslov ideje
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Unesite naslov (npr. 3 Alata za brže kreiranje sadržaja)"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Kategorija <span className="text-red-400">*</span>
            </label>
            {loadingCategories ? (
              <div className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-400">
                Učitavanje kategorija...
              </div>
            ) : (
              <CategorySelect
                categories={categories}
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                placeholder="Izaberite kategoriju"
                className="w-full"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Mreža za objavljivanje
            </label>
            <div className="flex gap-2 flex-wrap">
              {NETWORKS.map((net) => {
                const Icon = net.icon;
                // Determine if this network matches the current format
                const isLongFormNetwork = net.id === 'youtube' || net.id === 'facebook';
                const isShortFormNetwork = net.id === 'instagram' || net.id === 'tiktok';
                const matchesFormat =
                  (formData.format === 'Duga Forma' && isLongFormNetwork) ||
                  (formData.format === 'Kratka Forma' && isShortFormNetwork);
                
                // Disable if template is selected and network doesn't match format
                const isDisabled = formData.originalTemplate && 
                  formData.originalTemplate !== 'Ručni Unos' && 
                  !matchesFormat;

                return (
                  <button
                    key={net.id}
                    onClick={() => {
                      if (isDisabled) return;
                      setFormData((p) => ({
                        ...p,
                        network: net.name,
                        format:
                          net.id === 'youtube' || net.id === 'facebook'
                            ? 'Duga Forma'
                            : 'Kratka Forma',
                      }));
                    }}
                    disabled={isDisabled}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors border ${
                      formData.network === net.name
                        ? 'bg-blue-600 text-white border-blue-500'
                        : isDisabled
                        ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    } flex items-center gap-2`}
                  >
                    <Icon
                      size={16}
                      className={
                        formData.network === net.name ? 'text-white' : net.color
                      }
                    />
                    {net.name}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Automatski format:
              <span
                className={`ml-1 font-semibold ${
                  formData.format === 'Kratka Forma'
                    ? 'text-red-400'
                    : 'text-green-400'
                }`}
              >
                {formData.format}
              </span>
            </p>
          </div>

          {isLongForm ? (
            <div className="flex-1 flex flex-col min-h-[300px]">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Ceo scenario / Tekst duge forme
              </label>
              <RichTextEditor
                content={formData.fullScriptHtml || formData.fullScript}
                onChange={(html) => {
                  // Store HTML for rich text
                  setFormData((p) => ({ ...p, fullScriptHtml: html }));
                  // Convert HTML to plain text for word count and duration estimate
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = html;
                  const plainText =
                    tempDiv.textContent || tempDiv.innerText || '';
                  setFormData((p) => ({ ...p, fullScript: plainText }));
                }}
                placeholder="Pišite ceo scenario, uključujući uvod, glavne tačke i zaključak. Nije potrebno odvajati sekcije."
                minHeight="300px"
                className="flex-1"
                aiButton={{
                  fieldType: 'fullScript' as const,
                  taskContext: {
                    title: formData.title,
                    niche: formData.niche,
                    format: formData.format,
                    hook: formData.hook,
                    body: formData.body,
                    cta: formData.cta,
                  },
                }}
              />
              <div className="text-xs text-slate-500 mt-2 flex justify-between items-center">
                <span>
                  Procena trajanja videa:{' '}
                  {getDurationEstimate(formData.fullScript)} (~
                  {WORDS_PER_MINUTE} WPM)
                </span>
                <span className="text-slate-400">
                  {
                    formData.fullScript
                      .trim()
                      .split(/\s+/)
                      .filter((w) => w).length
                  }{' '}
                  reči
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-red-400 text-sm font-bold block mb-2">
                  01. HOOK (Udica)
                </label>
                <RichTextEditor
                  content={formData.hookHtml || formData.hook}
                  onChange={(html) => {
                    setFormData((p) => ({ ...p, hookHtml: html }));
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    const plainText =
                      tempDiv.textContent || tempDiv.innerText || '';
                    setFormData((p) => ({ ...p, hook: plainText }));
                  }}
                  placeholder="Unesite hook ovde (0-3 sekunde)"
                  minHeight="80px"
                  aiButton={{
                    fieldType: 'hook' as const,
                    taskContext: {
                      title: formData.title,
                      niche: formData.niche,
                      format: formData.format,
                      hook: formData.hook,
                      body: formData.body,
                      cta: formData.cta,
                    },
                  }}
                />
              </div>

              <div>
                <label className="text-blue-400 text-sm font-bold block mb-2">
                  02. BODY (Vrednost)
                </label>
                <RichTextEditor
                  content={formData.bodyHtml || formData.body}
                  onChange={(html) => {
                    setFormData((p) => ({ ...p, bodyHtml: html }));
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    const plainText =
                      tempDiv.textContent || tempDiv.innerText || '';
                    setFormData((p) => ({ ...p, body: plainText }));
                  }}
                  placeholder="Unesite ključnu vrednost ovde (3-45 sekundi)"
                  minHeight="120px"
                  aiButton={{
                    fieldType: 'body' as const,
                    taskContext: {
                      title: formData.title,
                      niche: formData.niche,
                      format: formData.format,
                      hook: formData.hook,
                      body: formData.body,
                      cta: formData.cta,
                    },
                  }}
                />
              </div>

              <div>
                <label className="text-emerald-400 text-sm font-bold block mb-2">
                  03. CTA (Poziv na akciju)
                </label>
                <RichTextEditor
                  content={formData.ctaHtml || formData.cta}
                  onChange={(html) => {
                    setFormData((p) => ({ ...p, ctaHtml: html }));
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    const plainText =
                      tempDiv.textContent || tempDiv.innerText || '';
                    setFormData((p) => ({ ...p, cta: plainText }));
                  }}
                  placeholder="Unesite poziv na akciju ovde"
                  minHeight="60px"
                  aiButton={{
                    fieldType: 'cta' as const,
                    taskContext: {
                      title: formData.title,
                      niche: formData.niche,
                      format: formData.format,
                      hook: formData.hook,
                      body: formData.body,
                      cta: formData.cta,
                    },
                  }}
                />
              </div>

              <div className="text-xs text-slate-500 flex justify-between items-center">
                <span>
                  Procena trajanja:{' '}
                  {getDurationEstimate(
                    `${formData.hook} ${formData.body} ${formData.cta}`
                  )}
                </span>
                <span className="text-slate-400">
                  {getTotalWordCount()} reči
                </span>
              </div>
            </div>
          )}

          {/* Inspiration Links Section */}
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <h4 className="text-md font-bold text-slate-200 uppercase flex items-center gap-2">
              <Link size={14} className="text-yellow-400" /> Inspiracija
            </h4>
            <div className="flex gap-2">
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInspirationLink();
                  }
                }}
                placeholder="Paste link (YouTube, Instagram, TikTok...)"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-md"
              />
              <button
                onClick={handleAddInspirationLink}
                disabled={!linkInput.trim() || isAddingLink}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:bg-slate-700 disabled:text-slate-500 flex items-center gap-2"
              >
                {isAddingLink ? (
                  <>
                    <Loader size="sm" />
                    <span>Dodavanje...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Dodaj
                  </>
                )}
              </button>
            </div>
            {inspirationLinks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {inspirationLinks.map((item, index) => (
                  <div
                    key={index}
                    className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 relative group"
                  >
                    {item.displayUrl && item.type === 'youtube' ? (
                      <div className="relative">
                        <img
                          src={item.displayUrl}
                          alt="YouTube Thumbnail"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              'none';
                          }}
                        />
                        <Youtube
                          size={52}
                          fill="red"
                          strokeWidth={1}
                          className="absolute inset-0 m-auto opacity-90"
                        />
                      </div>
                    ) : (
                      <div className="p-2 text-xs text-slate-400 bg-slate-700/50 flex items-center gap-2">
                        <Link size={14} className="text-blue-400" />
                        Eksterni Link
                      </div>
                    )}
                    <div className="p-2 flex justify-between items-center">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline truncate max-w-[70%]"
                      >
                        {item.link
                          .replace(/^https?:\/\//, '')
                          .replace(/^www\./, '')}
                      </a>
                      <button
                        onClick={() => handleRemoveInspirationLink(index)}
                        className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
                        title="Obriši link"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Publish Date Section */}
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <h4 className="text-md font-bold text-slate-200 uppercase flex items-center gap-2">
              <Calendar size={14} className="text-purple-400" /> Raspored
            </h4>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Planirani datum objavljivanja
              </label>
              <DatePicker
                value={
                  formData.publish_date
                    ? formData.publish_date.substring(0, 10)
                    : null
                }
                onChange={(date) =>
                  setFormData((p) => ({
                    ...p,
                    publish_date: date ? new Date(date).toISOString() : null,
                  }))
                }
                placeholder="Izaberi datum objavljivanja"
                className="w-full"
                disablePast={true}
              />
            </div>
          </div>

          <div className="mt-4">
            <AIAssistant
              taskContext={{
                title: formData.title,
                niche: formData.niche,
                format: formData.format,
                hook: formData.hook || undefined,
                body: formData.body || undefined,
                cta: formData.cta || undefined,
              }}
              onGenerateComplete={(field, content) => {
                if (field === 'title') {
                  setFormData((p) => ({ ...p, title: content.trim() }));
                } else if (field === 'hook') {
                  if (isLongForm) {
                    setFormData((p) => ({
                      ...p,
                      fullScript: content.trim(),
                      fullScriptHtml: content.trim(),
                    }));
                  } else {
                    setFormData((p) => ({
                      ...p,
                      hook: content.trim(),
                      hookHtml: content.trim(),
                    }));
                  }
                } else if (field === 'body') {
                  setFormData((p) => ({
                    ...p,
                    body: content.trim(),
                    bodyHtml: content.trim(),
                  }));
                } else if (field === 'cta') {
                  setFormData((p) => ({
                    ...p,
                    cta: content.trim(),
                    ctaHtml: content.trim(),
                  }));
                } else if (field === 'all') {
                  // Parse structured content
                  if (isLongForm) {
                    setFormData((p) => ({
                      ...p,
                      fullScript: content.trim(),
                      fullScriptHtml: content.trim(),
                    }));
                  } else {
                    const hookMatch = content.match(
                      /HOOK:?\s*([\s\S]+?)(?:\n\n|BODY:|CTA:|$)/i
                    );
                    const bodyMatch = content.match(
                      /BODY:?\s*([\s\S]+?)(?:\n\n|CTA:|$)/i
                    );
                    const ctaMatch = content.match(/CTA:?\s*([\s\S]+?)$/i);
                    const titleMatch =
                      content.match(/NASLOV:?\s*([\s\S]+?)(?:\n|$)/i) ||
                      content.match(/^([\s\S]+?)(?:\n|HOOK:|BODY:|CTA:)/i);

                    if (titleMatch?.[1]) {
                      setFormData((p) => ({
                        ...p,
                        title: titleMatch[1].trim(),
                      }));
                    }

                    if (hookMatch?.[1]) {
                      setFormData((p) => ({
                        ...p,
                        hook: hookMatch[1].trim(),
                        hookHtml: hookMatch[1].trim(),
                      }));
                    }
                    if (bodyMatch?.[1]) {
                      setFormData((p) => ({
                        ...p,
                        body: bodyMatch[1].trim(),
                        bodyHtml: bodyMatch[1].trim(),
                      }));
                    }
                    if (ctaMatch?.[1]) {
                      setFormData((p) => ({
                        ...p,
                        cta: ctaMatch[1].trim(),
                        ctaHtml: ctaMatch[1].trim(),
                      }));
                    }
                  }
                }
              }}
            />
          </div>

          <div className="border-t border-slate-800 pt-6">
            <button
              onClick={handleSave}
              disabled={
                isSaving ||
                !formData.title.trim() ||
                !selectedCategoryId ||
                (formData.format === 'Kratka Forma' &&
                  !formData.hook.trim() &&
                  !formData.body.trim() &&
                  !formData.cta.trim()) ||
                (formData.format === 'Duga Forma' &&
                  !formData.fullScript.trim())
              }
              className={`w-full py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                isSaving ||
                !formData.title.trim() ||
                !selectedCategoryId ||
                (formData.format === 'Kratka Forma' &&
                  !formData.hook.trim() &&
                  !formData.body.trim() &&
                  !formData.cta.trim()) ||
                (formData.format === 'Duga Forma' &&
                  !formData.fullScript.trim())
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
              }`}
            >
              <Calendar size={16} />{' '}
              {isSaving ? 'Čuvanje skripte...' : 'Sačuvaj skriptu'}
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-lg shadow-2xl flex flex-col max-h-[95vh] h-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <Plus className="text-emerald-400 w-4 h-4" />
            Nova ideja
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">{renderContent()}</div>
      </div>
    </div>
  );
}
