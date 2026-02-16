'use client';

import { createClient } from '@/lib/supabase/client';
import { getTierLimits } from '@/lib/utils/tierRestrictions';
import type { Task, UserTier } from '@/types';
import { ExternalLink, Eye, Heart, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card } from './ui/card';
import Skeleton from './ui/skeleton';

const cardBase =
  'bg-gradient-to-b from-background to-muted border border-border rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer';

interface CaseStudyViewProps {
  tasks: Task[];
  onCaseStudyClick: (task: Task) => void;
  userId: string;
  userTier?: UserTier;
  isAdmin?: boolean;
}

export default function CaseStudyView({
  tasks,
  onCaseStudyClick,
  userId,
  userTier,
  isAdmin,
}: CaseStudyViewProps) {
  const [adminCaseStudies, setAdminCaseStudies] = useState<Task[]>([]);
  const [loadingCaseStudies, setLoadingCaseStudies] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [syncingFromSanity, setSyncingFromSanity] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const supabase = createClient();

  // Fetch all admin case studies (stable effect: createClient inside to avoid re-runs)
  useEffect(() => {
    const client = createClient();
    let cancelled = false;
    setFetchError(null);

    async function fetchAdminCaseStudies() {
      try {
        const { data, error } = await client
          .from('tasks')
          .select('*')
          .eq('is_admin_case_study', true)
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (error) throw error;
        setAdminCaseStudies((data || []) as Task[]);
      } catch (error: any) {
        if (cancelled) return;
        console.error('Error fetching admin case studies:', error);
        setFetchError(error.message ?? 'Greška pri učitavanju');
        toast.error('Greška pri učitavanju studija slučaja', {
          description: error.message,
        });
      } finally {
        if (!cancelled) setLoadingCaseStudies(false);
      }
    }

    fetchAdminCaseStudies();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // When real (Sanity) case studies exist, hide demo ones; otherwise show all
  const displayableCaseStudies = useMemo(() => {
    const hasReal = adminCaseStudies.some(
      (t) => !(t as Task & { is_demo_case_study?: boolean }).is_demo_case_study
    );
    if (hasReal) {
      return adminCaseStudies.filter(
        (t) => !(t as Task & { is_demo_case_study?: boolean }).is_demo_case_study
      );
    }
    return adminCaseStudies;
  }, [adminCaseStudies]);

  // Store shuffled case studies in state to maintain consistency
  const [shuffledCaseStudies, setShuffledCaseStudies] = useState<Task[]>([]);

  // Shuffle case studies once when displayable list changes
  useEffect(() => {
    if (displayableCaseStudies.length === 0) {
      setShuffledCaseStudies([]);
      return;
    }

    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    setShuffledCaseStudies(shuffleArray(displayableCaseStudies));
  }, [displayableCaseStudies]);

  // Apply tier-based limits to displayable case studies with stable random selection
  const visibleCaseStudies = useMemo(() => {
    if (!userTier)
      return shuffledCaseStudies.length > 0
        ? shuffledCaseStudies
        : displayableCaseStudies;

    const limits = getTierLimits(userTier);
    if (limits.maxCaseStudies === null) {
      return displayableCaseStudies;
    }
    if (shuffledCaseStudies.length <= limits.maxCaseStudies) {
      return shuffledCaseStudies;
    }
    return shuffledCaseStudies.slice(0, limits.maxCaseStudies);
  }, [displayableCaseStudies, shuffledCaseStudies, userTier]);

  const handleLoadDemoCaseStudies = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/seed-case-studies', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? 'Greška pri učitavanju demo studija', {
          description: json.details,
        });
        return;
      }
      toast.success('Demo studije dodate!', {
        description: `${json.count ?? 3} studija slučaja je učitano.`,
      });
      setRefreshKey((k) => k + 1);
    } catch (error: any) {
      toast.error('Greška', { description: error.message });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSyncFromSanity = async () => {
    setSyncingFromSanity(true);
    try {
      const res = await fetch('/api/sanity/sync-case-studies', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? 'Greška pri sinhronizaciji', {
          description: json.details ?? json.hint,
        });
        return;
      }
      const found = json.foundInSanity ?? json.synced ?? 0;
      toast.success(
        found > 0 ? 'Studije slučaja sinhronizovane' : 'Sinhronizacija završena',
        {
          description:
            found > 0
              ? `Pronađeno ${found} u Sanity-u, sinhronizovano ${json.synced}.`
              : json.hint ?? json.message,
        }
      );
      if (json.synced > 0) setRefreshKey((k) => k + 1);
    } catch (error: any) {
      toast.error('Greška', { description: error.message });
    } finally {
      setSyncingFromSanity(false);
    }
  };

  // Helper function to strip HTML and get plain text preview
  const getPlainTextPreview = (
    html: string | null,
    maxLength: number = 150,
  ) => {
    if (!html) return 'Nema dodate analize zašto je ovaj video prošao viralno.';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  };

  return (
    <>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            Studije Slučaja
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Analizirane objave koje su ostvarile najbolje rezultate. Klikni na
            karticu za detaljnu analizu.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={handleSyncFromSanity}
            disabled={syncingFromSanity}
            className="shrink-0 inline-flex items-center justify-center rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/80 disabled:opacity-50"
          >
            {syncingFromSanity ? 'Sinhronizacija...' : 'Sinhronizuj iz Sanity'}
          </button>
        )}
      </header>

      <div className="space-y-8">
        {loadingCaseStudies ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="rounded-xl border-border bg-card overflow-hidden flex flex-col">
                <Skeleton className="aspect-[9/16] w-full rounded-t-xl shrink-0" />
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <Skeleton height={20} width={64} className="rounded" />
                    <Skeleton height={20} width={48} className="rounded" />
                  </div>
                  <Skeleton height={20} width="90%" className="rounded" />
                  <Skeleton height={16} width="70%" className="rounded" />
                  <Skeleton height={40} className="rounded" />
                  <div className="flex gap-4 pt-2">
                    <Skeleton height={16} width={48} />
                    <Skeleton height={16} width={48} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : visibleCaseStudies.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-xl bg-muted/30 space-y-4">
            {fetchError ? (
              <p className="text-destructive text-sm">{fetchError}</p>
            ) : (
              <p className="text-muted-foreground">
                Još uvek nema objavljenih studija slučaja.
              </p>
            )}
            <p className="text-muted-foreground text-sm">
              {isAdmin
                ? 'Sinhronizujte iz Sanity CMS-a da prikažete studije slučaja.'
                : 'Možete učitati demo studije da vidite kako izgledaju.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleSyncFromSanity}
                  disabled={syncingFromSanity}
                  className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {syncingFromSanity ? 'Sinhronizacija...' : 'Sinhronizuj iz Sanity'}
                </button>
              )}
              <button
                type="button"
                onClick={handleLoadDemoCaseStudies}
                disabled={isSeeding}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSeeding ? 'Učitavanje...' : 'Učitaj demo studije'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleCaseStudies.map((task) => (
              <Card
                key={task.id}
                onClick={() => onCaseStudyClick(task)}
                className={`group overflow-hidden flex flex-col ${cardBase}`}
              >
                {/* 9:16 portrait image on top */}
                <div className="w-full relative shrink-0">
                  {task.cover_image_url ? (
                    <div className="aspect-[9/16] w-full bg-muted overflow-hidden rounded-t-xl">
                      <img
                        src={task.cover_image_url}
                        alt={task.title ? `Naslovna slika: ${task.title}` : 'Naslovna slika studije slučaja'}
                        className="h-full w-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.02]"
                        loading="lazy"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement;
                          el.style.display = 'none';
                          const fallback = el.nextElementSibling as HTMLElement;
                          if (fallback) fallback.className = 'absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xs';
                        }}
                      />
                      <div
                        className="absolute inset-0 hidden items-center justify-center bg-muted text-muted-foreground text-xs"
                        aria-hidden
                      >
                        Slika nije učitana
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[9/16] w-full bg-muted rounded-t-xl flex items-center justify-center text-muted-foreground text-sm">
                      Nema slike
                    </div>
                  )}
                  {task.format && (
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                        task.format === 'Kratka Forma'
                          ? 'bg-chart-1 text-primary-foreground'
                          : 'bg-chart-2 text-primary-foreground'
                      }`}
                    >
                      {task.format}
                    </span>
                  )}
                </div>

                {/* All data below image */}
                <div className="flex flex-1 flex-col p-4 min-h-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {task.category && (
                      <span
                        className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded border"
                        style={{
                          color: task.category.color,
                          backgroundColor: `${task.category.color}18`,
                          borderColor: `${task.category.color}50`,
                        }}
                      >
                        {task.category.name}
                      </span>
                    )}
                    {task.format && !task.cover_image_url && (
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-1 rounded border ${
                          task.format === 'Kratka Forma'
                            ? 'bg-chart-1/15 text-chart-1 border-chart-1/40'
                            : 'bg-chart-2/15 text-chart-2 border-chart-2/40'
                        }`}
                      >
                        {task.format}
                      </span>
                    )}
                  </div>

                  <h2 className="text-base font-bold text-card-foreground mb-1.5 leading-tight line-clamp-2">
                    {task.title}
                  </h2>

                  {task.original_template && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1" title={task.original_template}>
                      Šablon: {task.original_template}
                    </p>
                  )}

                  {task.analysis && task.analysis.trim() !== '' && (
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-3 flex-1">
                      {getPlainTextPreview(task.analysis, 120)}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-border mt-auto">
                    {task.result_views != null && task.result_views !== '' && (
                      <span className="flex items-center gap-1.5 text-xs text-chart-2">
                        <Eye size={12} className="shrink-0" />
                        {task.result_views}
                      </span>
                    )}
                    {task.result_engagement != null && task.result_engagement !== '' && (
                      <span className="flex items-center gap-1.5 text-xs text-chart-4">
                        <Heart size={12} className="shrink-0" />
                        {task.result_engagement}
                      </span>
                    )}
                    {task.result_conversions != null && task.result_conversions !== '' && (
                      <span className="flex items-center gap-1.5 text-xs text-chart-3">
                        <Target size={12} className="shrink-0" />
                        {task.result_conversions}
                      </span>
                    )}
                    {task.viral_video_url && (
                      <a
                        href={task.viral_video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <ExternalLink size={12} className="shrink-0" />
                        Video
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
