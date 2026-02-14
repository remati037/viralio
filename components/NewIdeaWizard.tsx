'use client';

import { NETWORKS, NICHES } from '@/lib/constants';
import { useAICredits } from '@/lib/hooks/useAICredits';
import { fetchWithCacheBust } from '@/lib/sanity/client-client';
import { getPublishedTemplatesByNicheQuery } from '@/lib/sanity/template-query';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { isLongFormHidden } from '@/lib/utils/featureFlags';
import { getYoutubeThumbnail } from '@/lib/utils/helpers';
import type { TaskInsert, UserTier } from '@/types';
import {
  Calendar,
  ChevronLeft,
  Edit3,
  FileText,
  Info,
  Link,
  Plus,
  Trash2,
  Youtube,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AICreditBadge from './ui/ai-credit-badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import CategorySelect, { type TaskCategory } from './ui/category-select';
import DatePicker from './ui/date-picker';
import { Input } from './ui/input';
import { Label } from './ui/label';
import Loader from './ui/loader';
import Modal, { modalInputClass, modalPrimaryButtonClass } from './ui/modal';
import RichTextEditor from './ui/rich-text-editor';
import Skeleton from './ui/skeleton';
import ToneSelect, { type Tone } from './ui/tone-select';

interface NewIdeaWizardProps {
  onClose: () => void;
  onSaveToPlan: (
    task: Omit<TaskInsert, 'user_id'>,
    inspirationLinks?: Array<{
      link: string;
      displayUrl?: string;
      type?: string;
    }>,
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
    'start',
  );
  const [selectedNiche, setSelectedNiche] = useState('marketing');
  const [sanityTemplates, setSanityTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
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
    tone: null as Tone | null,
    targetAudience: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [inspirationLinks, setInspirationLinks] = useState<
    Array<{ link: string; displayUrl?: string; type?: string }>
  >([]);
  const [linkInput, setLinkInput] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const { credits } = useAICredits(userId);

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
        selectedNiche + ')',
      );
      console.log('🔍 Using Sanity niche:', sanityNiche);

      // Fetch templates from Sanity only
      // Use fetchWithCacheBust to ensure fresh data in development
      const templates = await fetchWithCacheBust<any[]>(
        getPublishedTemplatesByNicheQuery,
        { niche: sanityNiche },
        { forceFresh: true }, // Always force fresh to see latest edits
      );

      console.log(
        '✅ Sanity templates fetched:',
        templates?.length || 0,
        'templates for niche:',
        nicheName,
      );
      console.log('Sanity templates data:', templates);
      setSanityTemplates(templates || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);

      // Show user-friendly error message for CORS issues
      if (error.name === 'SanityCORSError' || error.message?.includes('CORS')) {
        toast.error(
          'Sanity CORS Error: Your domain needs to be added to Sanity CORS origins. Check console for instructions.',
          { duration: 10000 },
        );
      } else {
        toast.error(
          'Failed to fetch templates from Sanity. Please try again later.',
        );
      }

      setSanityTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Only use Sanity templates; filter out Duga Forma when flag is on
  const activeTemplates = useMemo(() => {
    const mapped = sanityTemplates.map((t) => ({
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
    }));
    return isLongFormHidden()
      ? mapped.filter((t) => t.format === 'Kratka Forma')
      : mapped;
  }, [sanityTemplates]);

  // Debug: Log templates
  useEffect(() => {
    if (activeTemplates.length > 0) {
      console.log('📋 Sanity templates:', activeTemplates.length);
    }
  }, [activeTemplates.length, sanityTemplates.length]);

  const activeNicheInfo = NICHES.find((n) => n.id === selectedNiche);

  const handleSelectTemplate = (template: (typeof activeTemplates)[0]) => {
    const topic = formData.title || 'Moja Tema';
    const effectiveFormat = isLongFormHidden()
      ? ('Kratka Forma' as const)
      : template.format;

    // Determine network based on format
    const networkForFormat =
      effectiveFormat === 'Duga Forma'
        ? NETWORKS.find((n) => n.id === 'youtube')?.name || NETWORKS[1].name
        : NETWORKS.find((n) => n.id === 'instagram')?.name || NETWORKS[0].name;

    if (effectiveFormat === 'Duga Forma') {
      const generatedScript = `UVOD: U prve 3 sekunde kaži zašto bi trebalo da ostanu do kraja.
GLAVNA TEMA 1: ${template.structure.body
        .replace('[TOPIC]', topic)
        .replace('[RESENJE]', 'koriste automatizaciju')}
GLAVNA TEMA 2: Detaljna analiza i primer
ZAKLJUČAK: ${template.structure.cta}`;

      setFormData((prev) => ({
        ...prev,
        title: prev.title || template.title,
        format: effectiveFormat as 'Kratka Forma' | 'Duga Forma',
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
        format: effectiveFormat as 'Kratka Forma' | 'Duga Forma',
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

    const effectiveFormat = isLongFormHidden()
      ? 'Kratka Forma'
      : formData.format;
    const newTask = {
      title: formData.title.trim(),
      niche: formData.niche,
      format: effectiveFormat,
      hook:
        effectiveFormat === 'Duga Forma'
          ? formData.fullScript.trim()
          : formData.hook.trim(),
      body:
        effectiveFormat === 'Duga Forma'
          ? 'CEO TEKST se nalazi u Hook/Skripta polju u detaljima.'
          : formData.body.trim(),
      cta:
        effectiveFormat === 'Duga Forma'
          ? 'Duga Forma: Nema odvojenog CTA za Kanban.'
          : formData.cta.trim(),
      status: 'idea' as const,
      publish_date: formData.publish_date || null,
      original_template: formData.originalTemplate,
      category_id: selectedCategoryId,
    };

    await onSaveToPlan(
      newTask as Omit<TaskInsert, 'user_id'>,
      inspirationLinks,
    );
    setIsSaving(false);
    onClose();
  };

  const IdeaSelectorCard = ({
    template,
  }: {
    template: (typeof activeTemplates)[0];
  }) => (
    <Card
      className="group flex h-full cursor-pointer flex-col border border-slate-200 bg-slate-50 p-4 rounded-xl transition-all duration-200 hover:border-chart-2/50 hover:bg-white hover:shadow-md"
      onClick={() => handleSelectTemplate(template)}
    >
      <div className="mb-2 flex items-start justify-between">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            template.format === 'Kratka Forma'
              ? 'bg-chart-1/20 text-chart-1'
              : 'bg-chart-2/20 text-chart-2'
          }`}
        >
          {template.format}
        </span>
      </div>

      <h3 className="mb-2 text-base font-semibold text-slate-900 transition-colors group-hover:text-chart-2">
        {template.title}
      </h3>

      <p className="mb-4 flex-grow line-clamp-2 text-xs text-slate-600">
        {template.concept}
      </p>

      <div className="mt-auto">
        <Button
          type="button"
          size="sm"
          className="w-full gap-1 text-xs font-semibold bg-chart-2/90 hover:bg-chart-2 text-white border-0"
        >
          <Zap size={14} /> Koristi šablon
        </Button>
      </div>
    </Card>
  );

  const renderContent = () => {
    if (step === 'start') {
      return (
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-slate-900">
            1. Odaberi način kreiranja skripte
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Card
              className="flex cursor-pointer flex-col items-center space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center transition-all duration-200 hover:border-chart-2/50 hover:bg-white hover:shadow-md"
              onClick={handleManualStart}
            >
              <div className="rounded-xl bg-slate-100 p-3">
                <FileText size={24} className="text-chart-2" />
              </div>
              <p className="text-base font-semibold text-slate-900">
                Ručni unos
              </p>
              <p className="text-sm text-slate-600">
                Počni od nule sa praznom skriptom.
              </p>
            </Card>
            <Card
              className="flex cursor-pointer flex-col items-center space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center transition-all duration-200 hover:border-chart-3/50 hover:bg-white hover:shadow-md"
              onClick={() => setStep('template_select')}
            >
              <div className="rounded-xl bg-slate-100 p-3">
                <Zap size={24} className="text-chart-2" />
              </div>
              <p className="text-base font-semibold text-slate-900">
                Koristi šablon
              </p>
              <p className="text-sm text-slate-600">
                Izaberi viralni format za brzi start.
              </p>
            </Card>
          </div>
        </div>
      );
    }

    if (step === 'template_select') {
      return (
        <div className="space-y-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <Zap className="h-5 w-5 text-chart-3" /> 2. Odaberi Šablon
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep('start')}
              className="gap-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg"
            >
              <ChevronLeft size={16} /> Nazad
            </Button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {NICHES.map((niche) => (
              <Button
                key={niche.id}
                variant={selectedNiche === niche.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedNiche(niche.id)}
                className={
                  selectedNiche === niche.id
                    ? 'bg-chart-3 text-white border-chart-3 hover:bg-chart-3/90'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }
              >
                {niche.name}
              </Button>
            ))}
          </div>

          {loadingTemplates ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card
                  key={i}
                  className="space-y-3 border border-slate-200 bg-slate-50 p-4 rounded-xl"
                >
                  <div className="flex justify-between">
                    <Skeleton
                      height={20}
                      width="60px"
                      className="bg-slate-200"
                    />
                    <Skeleton
                      height={20}
                      width="50px"
                      className="bg-slate-200"
                    />
                  </div>
                  <Skeleton height={24} width="100%" className="bg-slate-200" />
                  <Skeleton height={40} width="100%" className="bg-slate-200" />
                  <Skeleton height={32} width="100%" className="bg-slate-200" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid max-h-[50vh] grid-cols-2 gap-4 overflow-y-auto pr-2 md:grid-cols-3">
              {activeTemplates.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-500">
                  Trenutno nema šablona za ovu kategoriju
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
      const isLongForm =
        formData.format === 'Duga Forma' && !isLongFormHidden();

      // Check which required fields are missing for AI generation
      const missingFields = [];
      if (!formData.title?.trim()) missingFields.push('Naslov');
      if (!selectedCategoryId) missingFields.push('Kategorija');
      if (!formData.tone) missingFields.push('Ton / Stil');
      if (!formData.targetAudience?.trim())
        missingFields.push('Ciljna Publika');
      const hasAllRequiredFields = missingFields.length === 0;

      return (
        <div className="flex flex-1 flex-col space-y-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Edit3 className="h-4 w-4 text-chart-2" />{' '}
              {formData.originalTemplate === 'Ručni Unos'
                ? '2. Detalji skripte'
                : '3. Detalji skripte'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (formData.originalTemplate === 'Ručni Unos') {
                  setStep('start');
                } else {
                  setStep('template_select');
                }
              }}
              className="gap-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg"
            >
              <ChevronLeft size={16} />{' '}
              {formData.originalTemplate === 'Ručni Unos'
                ? 'Nazad'
                : 'Izaberi drugi šablon'}
            </Button>
          </div>

          {/* AI Generator Requirements Notification */}
          {!hasAllRequiredFields && (
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-semibold text-slate-900">
                    Potrebno za AI generator
                  </h4>
                  <p className="mb-2 text-xs text-slate-600">
                    Za korišćenje AI generatora, molim te popuni sledeća polja:
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
                    {missingFields.map((field) => (
                      <li key={field} className="flex items-center gap-2">
                        <span className="text-amber-600">•</span>
                        <span>{field}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-700">Naslov skripte</Label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Unesi naslov (npr. 3 alata za brže kreiranje sadržaja)"
              className={cn('w-full rounded-lg', modalInputClass)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">
              Kategorija <span className="text-red-500">*</span>
            </Label>
            {loadingCategories ? (
              <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-500 text-sm">
                Učitavanje kategorija...
              </div>
            ) : (
              <CategorySelect
                categories={categories}
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                placeholder="Izaberi kategoriju"
                className="w-full"
                variant="light"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">
              Ton / Stil <span className="text-red-500">*</span>
            </Label>
            <ToneSelect
              value={formData.tone}
              onChange={(tone) => setFormData((p) => ({ ...p, tone }))}
              placeholder="Izaberi ton"
              className="w-full"
              variant="light"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">
              Ciljna Publika <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              value={formData.targetAudience}
              onChange={(e) =>
                setFormData((p) => ({ ...p, targetAudience: e.target.value }))
              }
              placeholder="npr. Preduzetnici 25-40 godina, Marketinški stručnjaci..."
              className={cn('w-full rounded-lg', modalInputClass)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Mreža za objavljivanje</Label>
            <div className="flex flex-wrap gap-2">
              {NETWORKS.filter(
                (net) =>
                  !isLongFormHidden() ||
                  (net.id !== 'youtube' && net.id !== 'facebook'),
              ).map((net) => {
                const Icon = net.icon;
                const isLongFormNetwork =
                  net.id === 'youtube' || net.id === 'facebook';
                const isShortFormNetwork =
                  net.id === 'instagram' || net.id === 'tiktok';
                const matchesFormat =
                  (formData.format === 'Duga Forma' && isLongFormNetwork) ||
                  (formData.format === 'Kratka Forma' && isShortFormNetwork);

                const isDisabled = !!(
                  formData.originalTemplate &&
                  formData.originalTemplate !== 'Ručni Unos' &&
                  !matchesFormat
                );

                return (
                  <Button
                    key={net.id}
                    type="button"
                    variant={
                      formData.network === net.name ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => {
                      if (isDisabled) return;
                      setFormData((p) => ({
                        ...p,
                        network: net.name,
                        format: isLongFormHidden()
                          ? 'Kratka Forma'
                          : net.id === 'youtube' || net.id === 'facebook'
                            ? 'Duga Forma'
                            : 'Kratka Forma',
                      }));
                    }}
                    disabled={isDisabled}
                    className={
                      formData.network === net.name
                        ? 'gap-2 bg-chart-2 text-white border-chart-2'
                        : isDisabled
                          ? 'cursor-not-allowed opacity-50'
                          : 'gap-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }
                  >
                    <Icon
                      size={16}
                      className={
                        formData.network === net.name
                          ? 'text-primary-foreground'
                          : net.color
                      }
                    />
                    {net.name}
                  </Button>
                );
              })}
            </div>
            {!isLongFormHidden() && (
              <p className="mt-2 text-xs text-slate-600">
                Automatski format:
                <span
                  className={`ml-1 font-semibold ${
                    formData.format === 'Kratka Forma'
                      ? 'text-chart-1'
                      : 'text-chart-2'
                  }`}
                >
                  {formData.format}
                </span>
              </p>
            )}
          </div>

          {isLongForm && !isLongFormHidden() ? (
            <div className="flex-1 flex flex-col min-h-[300px]">
              <label className="block text-sm font-medium text-slate-700 mb-2">
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
                variant="light"
                aiButton={{
                  fieldType: 'fullScript' as const,
                  taskContext: {
                    title: formData.title,
                    niche: formData.niche,
                    format: formData.format,
                    hook: formData.hook,
                    body: formData.body,
                    cta: formData.cta,
                    categoryId: selectedCategoryId,
                    categoryName: categories.find(
                      (c) => c.id === selectedCategoryId,
                    )?.name,
                    tone: formData.tone,
                    targetAudience: formData.targetAudience || undefined,
                  },
                }}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Procena trajanja videa:{' '}
                  {getDurationEstimate(formData.fullScript)} (~
                  {WORDS_PER_MINUTE} WPM)
                </span>
                <span>
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
                <Label className="mb-2 block text-base font-semibold text-primary">
                  01. HOOK (Udica)
                </Label>
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
                  placeholder="Unesi hook ovde (0-3 sekunde)"
                  minHeight="80px"
                  variant="light"
                  aiButton={{
                    fieldType: 'hook' as const,
                    taskContext: {
                      title: formData.title,
                      niche: formData.niche,
                      format: formData.format,
                      hook: formData.hook,
                      body: formData.body,
                      cta: formData.cta,
                      categoryId: selectedCategoryId,
                      categoryName: categories.find(
                        (c) => c.id === selectedCategoryId,
                      )?.name,
                      tone: formData.tone,
                      targetAudience: formData.targetAudience || undefined,
                    },
                  }}
                />
              </div>

              <div>
                <Label className="mb-2 block text-base font-semibold text-primary">
                  02. BODY (Vrednost)
                </Label>
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
                  placeholder="Unesi tekst skripte ovde (3-45 sekundi)"
                  minHeight="120px"
                  variant="light"
                  aiButton={{
                    fieldType: 'body' as const,
                    taskContext: {
                      title: formData.title,
                      niche: formData.niche,
                      format: formData.format,
                      hook: formData.hook,
                      body: formData.body,
                      cta: formData.cta,
                      categoryId: selectedCategoryId,
                      categoryName: categories.find(
                        (c) => c.id === selectedCategoryId,
                      )?.name,
                      tone: formData.tone,
                      targetAudience: formData.targetAudience || undefined,
                    },
                  }}
                />
              </div>

              <div>
                <Label className="mb-2 block text-base font-semibold text-primary">
                  03. CTA (Poziv na akciju)
                </Label>
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
                  placeholder="Unesi poziv na akciju ovde"
                  minHeight="60px"
                  variant="light"
                  aiButton={{
                    fieldType: 'cta' as const,
                    taskContext: {
                      title: formData.title,
                      niche: formData.niche,
                      format: formData.format,
                      hook: formData.hook,
                      body: formData.body,
                      cta: formData.cta,
                      categoryId: selectedCategoryId,
                      categoryName: categories.find(
                        (c) => c.id === selectedCategoryId,
                      )?.name,
                      tone: formData.tone,
                      targetAudience: formData.targetAudience || undefined,
                    },
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Procena trajanja:{' '}
                  {getDurationEstimate(
                    `${formData.hook} ${formData.body} ${formData.cta}`,
                  )}
                </span>
                <span>{getTotalWordCount()} reči</span>
              </div>
            </div>
          )}

          {/* Inspiration Links Section */}
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <h4 className="flex items-center gap-2 text-base font-semibold uppercase tracking-wide text-primary">
              <Link size={14} className="text-chart-3" /> Inspiracija
            </h4>
            <div className="flex gap-2">
              <Input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInspirationLink();
                  }
                }}
                placeholder="Unesi link (YouTube, Instagram, TikTok...)"
                className={cn('flex-1 rounded-lg', modalInputClass)}
              />
              <Button
                type="button"
                onClick={handleAddInspirationLink}
                disabled={!linkInput.trim() || isAddingLink}
                className={cn('gap-2 rounded-lg', modalPrimaryButtonClass)}
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
              </Button>
            </div>
            {inspirationLinks.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {inspirationLinks.map((item, index) => (
                  <Card
                    key={index}
                    className="group relative overflow-hidden border border-slate-200 bg-slate-50 rounded-xl"
                  >
                    {item.displayUrl && item.type === 'youtube' ? (
                      <div className="relative">
                        <img
                          src={item.displayUrl}
                          alt="YouTube Thumbnail"
                          className="h-full w-full object-cover"
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
                      <div className="flex items-center gap-2 bg-slate-100 p-2 text-xs text-slate-600">
                        <Link size={14} className="text-chart-2" />
                        Eksterni Link
                      </div>
                    )}
                    <div className="flex items-center justify-between p-2">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="max-w-[70%] truncate text-xs text-chart-2 hover:underline"
                      >
                        {item.link
                          .replace(/^https?:\/\//, '')
                          .replace(/^www\./, '')}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveInspirationLink(index)}
                        className="h-8 w-8 shrink-0 text-slate-500 hover:text-chart-1"
                        title="Obriši link"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Publish Date Section */}
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <h4 className="flex items-center gap-2 text-base font-semibold uppercase tracking-wide text-primary">
              <Calendar size={14} className="text-chart-4" /> Raspored
            </h4>
            <div className="space-y-2">
              <Label className="text-slate-700">
                Planirani datum objavljivanja
              </Label>
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

          {/* <div className="mt-4">
            <AIAssistant
              taskContext={{
                title: formData.title,
                niche: formData.niche,
                format: formData.format,
                hook: formData.hook || undefined,
                body: formData.body || undefined,
                cta: formData.cta || undefined,
                categoryId: selectedCategoryId,
                categoryName: categories.find(
                  (c) => c.id === selectedCategoryId
                )?.name,
                tone: formData.tone,
                targetAudience: formData.targetAudience || undefined,
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
          </div> */}

          <div className="border-t border-slate-200 pt-6">
            <Button
              type="button"
              size="lg"
              onClick={handleSave}
              disabled={
                isSaving ||
                !formData.title.trim() ||
                !selectedCategoryId ||
                (isLongForm && !formData.fullScript.trim()) ||
                (!isLongForm &&
                  !formData.hook.trim() &&
                  !formData.body.trim() &&
                  !formData.cta.trim())
              }
              className={cn(
                'w-full gap-2 text-base font-semibold border-0 rounded-xl py-6',
                modalPrimaryButtonClass,
              )}
            >
              <Calendar size={16} />{' '}
              {isSaving ? 'Čuvanje skripte...' : 'Sačuvaj skriptu'}
            </Button>
          </div>
        </div>
      );
    }
  };

  const modalTitle = (
    <div className="flex items-center gap-2">
      {/* <Plus className="h-4 w-4 text-chart-2" /> */}
      <span>Nova skripta</span>
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

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={modalTitle}
      maxWidth="4xl"
      className="max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="flex flex-1 flex-col min-h-0 overflow-y-auto">
        {renderContent()}
      </div>
    </Modal>
  );
}
