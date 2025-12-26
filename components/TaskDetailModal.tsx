'use client';

import { KANBAN_COLUMNS } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { getYoutubeThumbnail } from '@/lib/utils/helpers';
import type { Task, TaskUpdate } from '@/types';
import {
  Calendar,
  Check,
  ClipboardList,
  Edit3,
  Eye,
  FileText,
  Link,
  Trash2,
  Trello,
  X,
  Youtube,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import AIAssistant from './AIAssistant';
import CategorySelect, { type TaskCategory } from './ui/category-select';
import DatePicker from './ui/date-picker';
import Loader from './ui/loader';
import RichTextEditor from './ui/rich-text-editor';
import StatusSelect from './ui/status-select';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onDelete: (taskId: string) => Promise<void>;
  onUpdate: (task: TaskUpdate) => Promise<void>;
  onAddInspirationLink: (
    taskId: string,
    link: string,
    displayUrl?: string,
    type?: string
  ) => Promise<{ data: any | null; error: string | null }>;
  onRemoveInspirationLink: (linkId: string) => Promise<void>;
}

export default function TaskDetailModal({
  task,
  onClose,
  onDelete,
  onUpdate,
  onAddInspirationLink,
  onRemoveInspirationLink,
}: TaskDetailModalProps) {
  const supabase = createClient();
  const [editedTask, setEditedTask] = useState<Task>({
    ...task,
    inspiration_links: task.inspiration_links || [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [removingLinkId, setRemovingLinkId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'script' | 'inspiration' | 'schedule' | 'results'
  >('script');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const pendingLinksRef = useRef<Map<string, any>>(new Map());
  const isManagingLinksRef = useRef<boolean>(false);

  const isLongForm = editedTask.format === 'Duga Forma';

  // Helper function to convert plain text to HTML if needed
  const textToHtml = (text: string | null | undefined): string => {
    if (!text) return '';
    // If it already contains HTML tags, return as is
    if (text.trim().startsWith('<') && text.includes('>')) {
      return text;
    }
    // Otherwise, wrap in paragraph tags and preserve line breaks
    const lines = text.split('\n');
    if (lines.length === 1 && lines[0].trim()) {
      // Single line - just wrap in paragraph
      return `<p>${lines[0]}</p>`;
    }
    // Multiple lines - wrap each in paragraph
    return lines
      .map((line) => (line.trim() ? `<p>${line}</p>` : '<p><br></p>'))
      .join('');
  };

  // Helper function to get HTML content for editor
  const getHtmlContent = (field: string | null | undefined): string => {
    return textToHtml(field);
  };

  const initialScriptValue = isLongForm ? getHtmlContent(editedTask.hook) : '';
  const [fullScriptText, setFullScriptText] = useState(initialScriptValue);
  const [hookHtml, setHookHtml] = useState(getHtmlContent(editedTask.hook));
  const [bodyHtml, setBodyHtml] = useState(getHtmlContent(editedTask.body));
  const [ctaHtml, setCtaHtml] = useState(getHtmlContent(editedTask.cta));
  const [analysisHtml, setAnalysisHtml] = useState(
    getHtmlContent(editedTask.analysis)
  );

  useEffect(() => {
    // If we're actively managing links (adding/removing), don't overwrite inspiration_links
    // This prevents race conditions when parent updates task state
    if (isManagingLinksRef.current) {
      // Only update other fields, preserve inspiration_links
      setEditedTask((prev) => ({
        ...task,
        inspiration_links: prev.inspiration_links || [],
      }));
    } else {
      // Normal update - use task's inspiration_links
      setEditedTask({
        ...task,
        inspiration_links: task.inspiration_links || [],
      });
    }

    const isLong = task.format === 'Duga Forma';
    setFullScriptText(isLong ? getHtmlContent(task.hook) : '');
    setHookHtml(getHtmlContent(task.hook));
    setBodyHtml(getHtmlContent(task.body));
    setCtaHtml(getHtmlContent(task.cta));
    setAnalysisHtml(getHtmlContent(task.analysis));
  }, [task]);

  useEffect(() => {
    if (task.user_id) {
      fetchCategories();
    }
  }, [task.user_id]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .eq('user_id', task.user_id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCategories((data || []) as TaskCategory[]);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleUpdate = (field: keyof Task, value: any) => {
    setEditedTask((prev) => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = async (
    newStatus: 'idea' | 'ready' | 'scheduled' | 'published'
  ) => {
    // Update local state immediately
    setEditedTask((prev) => ({ ...prev, status: newStatus }));

    // Persist to database
    try {
      await onUpdate({ status: newStatus });
      toast.success('Status ažuriran', {
        description: `Zadatak je premešten u "${
          KANBAN_COLUMNS.find((col) => col.id === newStatus)?.title || newStatus
        }".`,
      });
    } catch (error: any) {
      // Revert on error
      setEditedTask((prev) => ({ ...prev, status: task.status }));
      toast.error('Greška pri ažuriranju statusa', {
        description: error?.message || 'Pokušajte ponovo.',
      });
    }
  };

  const handleUpdateFullScript = (html: string) => {
    setFullScriptText(html);
  };

  // Helper to extract plain text from HTML for saving (if needed)
  const htmlToText = (html: string): string => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const isValidUrl = (string: string): boolean => {
    if (!string || string.trim().length === 0) return false;

    const trimmed = string.trim();

    // Reject strings that are clearly not URLs (no dots, no slashes, no protocol indicators)
    // This catches random strings like "asdfghjkl" or "random text"
    const hasUrlIndicators =
      trimmed.includes('.') ||
      trimmed.includes('/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.includes('://');

    if (!hasUrlIndicators) {
      return false;
    }

    try {
      // Try to create a URL object - this will throw if invalid
      let urlToTest = trimmed;
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        urlToTest = `https://${trimmed}`;
      }

      const url = new URL(urlToTest);

      // Check if it's http or https
      const isValidProtocol =
        url.protocol === 'http:' || url.protocol === 'https:';

      // Check if hostname is valid (not empty and has at least one dot for domain)
      const hasValidHost = Boolean(
        url.hostname &&
          url.hostname.length > 0 &&
          (url.hostname.includes('.') || url.hostname === 'localhost')
      );

      // Additional check: hostname should not be just numbers or random characters
      // It should have at least one letter (for domain names) or be localhost
      const hostnameParts = url.hostname.split('.');
      const hasValidDomainStructure =
        url.hostname === 'localhost' ||
        hostnameParts.some((part) => /[a-zA-Z]/.test(part));

      return isValidProtocol && hasValidHost && hasValidDomainStructure;
    } catch (_) {
      return false;
    }
  };

  const handleAddLink = async () => {
    const trimmedLink = linkInput.trim();

    if (!trimmedLink) {
      toast.error('Prazan link', {
        description: 'Molimo unesite validan link.',
      });
      return;
    }

    // Validate URL format BEFORE any processing
    // First check if it looks like a URL at all
    if (!isValidUrl(trimmedLink)) {
      toast.error('Nevažeći URL', {
        description:
          'Molimo unesite validan URL. Link mora biti u formatu: https://youtube.com/watch?v=... ili youtube.com/watch?v=...',
      });
      return;
    }

    // If validation passes, prepare the URL
    let urlToAdd = trimmedLink;
    if (
      !trimmedLink.startsWith('http://') &&
      !trimmedLink.startsWith('https://')
    ) {
      urlToAdd = `https://${trimmedLink}`;
    }

    // Double-check the final URL is valid
    if (!isValidUrl(urlToAdd)) {
      toast.error('Nevažeći URL', {
        description:
          'Molimo unesite validan URL. Link mora biti u formatu: https://youtube.com/watch?v=... ili youtube.com/watch?v=...',
      });
      return;
    }

    setIsAddingLink(true);
    isManagingLinksRef.current = true;

    // Get thumbnail info before API call
    const { url: thumbnailUrl, type } = getYoutubeThumbnail(urlToAdd);

    // Create unique temp ID for this link
    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const newLink = {
      id: tempId,
      task_id: editedTask.id,
      link: urlToAdd,
      display_url: thumbnailUrl || null,
      type: type || null,
      created_at: new Date().toISOString(),
    };

    // Track this pending link
    pendingLinksRef.current.set(tempId, newLink);

    // Update state immediately for instant UI feedback
    setEditedTask((prev) => ({
      ...prev,
      inspiration_links: [...(prev.inspiration_links || []), newLink],
    }));

    // Clear input immediately
    setLinkInput('');

    try {
      const result = await onAddInspirationLink(
        editedTask.id,
        urlToAdd,
        thumbnailUrl || undefined,
        type || undefined
      );

      // If API call succeeded, update with real ID from server
      if (result && !result.error && result.data) {
        const realLink = Array.isArray(result.data)
          ? result.data[0]
          : result.data;
        const realId = realLink?.id;

        if (realId) {
          // Remove from pending ref
          pendingLinksRef.current.delete(tempId);

          // Update the link with real ID and server data
          setEditedTask((prev) => ({
            ...prev,
            inspiration_links: (prev.inspiration_links || []).map((link) =>
              link.id === tempId
                ? {
                    ...link,
                    id: realId,
                    display_url: realLink.display_url || link.display_url,
                    type: realLink.type || link.type,
                    link: realLink.link || link.link,
                    created_at: realLink.created_at || link.created_at,
                  }
                : link
            ),
          }));

          // Show success notification
          toast.success('Link dodat', {
            description: 'Inspiracija je uspešno dodata.',
          });
        } else {
          // If no ID returned, keep the temp link but remove from pending
          pendingLinksRef.current.delete(tempId);
          toast.warning('Link dodat', {
            description: 'Link je dodat, ali nije moguće potvrditi sa servera.',
          });
        }

        // If no more pending links, allow parent updates
        if (pendingLinksRef.current.size === 0) {
          isManagingLinksRef.current = false;
        }
      } else if (result?.error) {
        // If API call failed, remove the optimistically added link
        pendingLinksRef.current.delete(tempId);
        setEditedTask((prev) => ({
          ...prev,
          inspiration_links: (prev.inspiration_links || []).filter(
            (link) => link.id !== tempId
          ),
        }));

        // If no more pending links, allow parent updates
        if (pendingLinksRef.current.size === 0) {
          isManagingLinksRef.current = false;
        }

        toast.error('Greška pri dodavanju linka', {
          description: result.error || 'Pokušajte ponovo.',
        });
      }
    } catch (error: any) {
      // If API call failed, remove the optimistically added link
      pendingLinksRef.current.delete(tempId);
      setEditedTask((prev) => ({
        ...prev,
        inspiration_links: (prev.inspiration_links || []).filter(
          (link) => link.id !== tempId
        ),
      }));

      // If no more pending links, allow parent updates
      if (pendingLinksRef.current.size === 0) {
        isManagingLinksRef.current = false;
      }

      toast.error('Greška pri dodavanju linka', {
        description: error?.message || 'Pokušajte ponovo.',
      });
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleSave = async () => {
    if (!editedTask.title.trim()) {
      toast.error('Nedostaje naslov', {
        description: 'Molimo unesite naslov zadatka.',
      });
      return;
    }

    if (!editedTask.category_id) {
      toast.error('Kategorija je obavezna', {
        description: 'Molimo izaberite kategoriju pre čuvanja skripte.',
      });
      return;
    }

    setIsSaving(true);

    const updatedTask: TaskUpdate = {
      title: editedTask.title,
      niche: editedTask.niche,
      format: editedTask.format,
      // Store HTML directly to preserve formatting
      hook: isLongForm ? fullScriptText : hookHtml,
      body: isLongForm
        ? 'CEO TEKST se nalazi u Hook/Skripta polju u detaljima.'
        : bodyHtml,
      cta: isLongForm ? 'Duga Forma: Nema odvojenog CTA za Kanban.' : ctaHtml,
      status: editedTask.status,
      publish_date: editedTask.publish_date,
      original_template: editedTask.original_template,
      cover_image_url: editedTask.cover_image_url,
      result_views: editedTask.result_views,
      result_engagement: editedTask.result_engagement,
      result_conversions: editedTask.result_conversions,
      analysis: analysisHtml,
      category_id: editedTask.category_id,
    };

    await onUpdate(updatedTask);
    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (task.is_admin_case_study) {
      toast.error('Ne možete obrisati', {
        description: 'Ne možete obrisati admin studiju slučaja.',
      });
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(task.id);
      onClose();
    } catch (error: any) {
      toast.error('Greška pri brisanju', {
        description:
          error.message || 'Došlo je do greške pri brisanju zadatka.',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const taskFormat =
    editedTask.format === 'Kratka Forma' ? 'text-red-400' : 'text-green-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-3 border-b border-slate-800">
          <div className="flex flex-col gap-2 w-full">
            <div
              className={`flex ${
                editedTask.category ? 'justify-between' : 'justify-end'
              } items-center w-full`}
            >
              {editedTask.category && (
                <span
                  className="text-xs font-bold uppercase tracking-wider bg-slate-800 px-2 py-1 rounded border w-fit"
                  style={{
                    color: editedTask.category.color,
                    borderColor: `${editedTask.category.color}40`,
                  }}
                >
                  {editedTask.category.name}
                </span>
              )}
              <div className="flex items-center gap-2">
                {!task.is_admin_case_study && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-900/20 rounded-lg"
                    title="Obriši zadatak"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {editedTask.title}
            </h3>
            <span className={`text-sm font-bold ${taskFormat}`}>
              {editedTask.format}
            </span>
            <p className="text-slate-400 text-xs mt-1">
              Kreirano:{' '}
              {new Date(editedTask.created_at).toLocaleDateString('sr-RS')}{' '}
              {editedTask.publish_date && (
                <span className="font-semibold text-purple-300">
                  | Planirano:{' '}
                  {new Date(editedTask.publish_date).toLocaleDateString(
                    'sr-RS'
                  )}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex border-b border-slate-800 flex-wrap justify-center">
          <button
            onClick={() => setActiveTab('script')}
            className={`py-3 px-6 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'script'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileText size={14} /> Skripta
          </button>
          <button
            onClick={() => setActiveTab('inspiration')}
            className={`py-3 px-6 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'inspiration'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Link size={14} /> Inspiracija
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-3 px-6 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Calendar size={14} /> Raspored
          </button>
          {editedTask.status === 'published' && (
            <button
              onClick={() => setActiveTab('results')}
              className={`py-3 px-6 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'results'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <ClipboardList size={14} /> Rezultati
            </button>
          )}
        </div>

        <div className="p-2 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'script' && (
            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 space-y-4">
              <h4 className="text-sm font-bold text-slate-100 uppercase mb-2 flex items-center gap-2">
                <Edit3 size={14} className="text-blue-100" />
                Skripta
                {/* <span
                  className={`ml-1 font-bold ${
                    isLongForm ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {editedTask.format}
                </span> */}
              </h4>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Status
                </label>
                <StatusSelect
                  value={editedTask.status}
                  onChange={handleStatusChange}
                  className="w-full"
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Kategorija <span className="text-red-400">*</span>
                </label>
                {loadingCategories ? (
                  <div className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-slate-400">
                    Učitavanje kategorija...
                  </div>
                ) : (
                  <CategorySelect
                    categories={categories}
                    value={editedTask.category_id || null}
                    onChange={(categoryId) => {
                      setEditedTask((prev) => ({
                        ...prev,
                        category_id: categoryId,
                      }));
                    }}
                    placeholder="Izaberi kategoriju"
                    className="w-full"
                  />
                )}
              </div>

              {isLongForm ? (
                <div className="flex-1 flex flex-col min-h-[300px]">
                  <label className="text-green-400 text-xs font-bold block mb-1">
                    CEO SCENARIO / TEKST (Duga Forma)
                  </label>
                  <RichTextEditor
                    content={fullScriptText}
                    onChange={(html) => {
                      handleUpdateFullScript(html);
                    }}
                    placeholder="Pišite ceo scenario bez razdvajanja na HOOK/BODY/CTA"
                    minHeight="350px"
                    aiButton={{
                      fieldType: 'fullScript',
                      taskContext: {
                        title: editedTask.title,
                        niche: editedTask.niche,
                        format: editedTask.format,
                        hook: editedTask.hook || undefined,
                        body: editedTask.body || undefined,
                        cta: editedTask.cta || undefined,
                      },
                    }}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    *Napomena: Za Dugu Formu koristi se jedno polje. Procena
                    trajanja bi bila: ~
                    {Math.round(
                      fullScriptText.trim().split(/\s+/).length / 150
                    )}{' '}
                    min
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-red-400 text-xs font-bold block mb-1">
                      01. HOOK (Udica)
                    </label>
                    <RichTextEditor
                      content={hookHtml}
                      onChange={(html) => {
                        setHookHtml(html);
                      }}
                      placeholder="Unesite udicu ovde (0-3 sekunde)"
                      minHeight="80px"
                      aiButton={{
                        fieldType: 'hook',
                        taskContext: {
                          title: editedTask.title,
                          niche: editedTask.niche,
                          format: editedTask.format,
                          hook: editedTask.hook || undefined,
                          body: editedTask.body || undefined,
                          cta: editedTask.cta || undefined,
                        },
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-blue-400 text-xs font-bold block mb-1">
                      02. BODY (Vrednost)
                    </label>
                    <RichTextEditor
                      content={bodyHtml}
                      onChange={(html) => {
                        setBodyHtml(html);
                      }}
                      placeholder="Unesite ključnu vrednost ovde (3-45 sekundi)"
                      minHeight="120px"
                      aiButton={{
                        fieldType: 'body',
                        taskContext: {
                          title: editedTask.title,
                          niche: editedTask.niche,
                          format: editedTask.format,
                          hook: editedTask.hook || undefined,
                          body: editedTask.body || undefined,
                          cta: editedTask.cta || undefined,
                        },
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-emerald-400 text-xs font-bold block mb-1">
                      03. CTA (Poziv na akciju)
                    </label>
                    <RichTextEditor
                      content={ctaHtml}
                      onChange={(html) => {
                        setCtaHtml(html);
                      }}
                      placeholder="Unesite poziv na akciju ovde"
                      minHeight="60px"
                      aiButton={{
                        fieldType: 'cta',
                        taskContext: {
                          title: editedTask.title,
                          niche: editedTask.niche,
                          format: editedTask.format,
                          hook: editedTask.hook || undefined,
                          body: editedTask.body || undefined,
                          cta: editedTask.cta || undefined,
                        },
                      }}
                    />
                  </div>
                </>
              )}

              <div className="mt-4">
                <AIAssistant
                  taskContext={{
                    title: editedTask.title,
                    niche: editedTask.niche,
                    format: editedTask.format,
                    hook: editedTask.hook || undefined,
                    body: editedTask.body || undefined,
                    cta: editedTask.cta || undefined,
                  }}
                  onGenerateComplete={(field, content) => {
                    if (field === 'title') {
                      handleUpdate('title', content.trim());
                    } else if (field === 'hook') {
                      if (isLongForm) {
                        handleUpdateFullScript(content.trim());
                      } else {
                        handleUpdate('hook', content.trim());
                      }
                    } else if (field === 'body') {
                      handleUpdate('body', content.trim());
                    } else if (field === 'cta') {
                      handleUpdate('cta', content.trim());
                    } else if (field === 'all') {
                      // Parse structured content
                      if (isLongForm) {
                        handleUpdateFullScript(content.trim());
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
                          handleUpdate('title', titleMatch[1].trim());
                        }
                        if (hookMatch?.[1]) {
                          handleUpdate('hook', hookMatch[1].trim());
                        }
                        if (bodyMatch?.[1]) {
                          handleUpdate('body', bodyMatch[1].trim());
                        }
                        if (ctaMatch?.[1]) {
                          handleUpdate('cta', ctaMatch[1].trim());
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'inspiration' && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-blue-100 uppercase flex items-center gap-2 mt-2">
                <Trello size={14} className="text-blue-100" /> Dodaj Linkove
                Konkurenata
              </h4>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      linkInput.trim() &&
                      !isAddingLink
                    ) {
                      e.preventDefault();
                      handleAddLink();
                    }
                  }}
                  placeholder="Paste link (YouTube, Instagram, TikTok...)"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  onClick={handleAddLink}
                  disabled={!linkInput.trim() || isAddingLink}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition-colors disabled:bg-slate-700 disabled:text-slate-500 flex items-center gap-2"
                >
                  {isAddingLink ? (
                    <>
                      <Loader size="sm" />
                      <span>Dodavanje...</span>
                    </>
                  ) : (
                    'Dodaj'
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {(editedTask.inspiration_links || []).length === 0 ? (
                  <div className="col-span-full text-center py-10 text-slate-600 border-2 border-dashed border-slate-800 rounded-md text-sm">
                    Nema dodatih linkova za inspiraciju.
                  </div>
                ) : (
                  (editedTask.inspiration_links || []).map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 relative group"
                    >
                      {item.display_url && item.type === 'youtube' ? (
                        <div className="relative">
                          <img
                            src={item.display_url}
                            alt="YouTube Thumbnail"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                'none';
                            }}
                          />
                          <Youtube
                            size={32}
                            fill="red"
                            className="text-white absolute inset-0 m-auto opacity-70 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      ) : (
                        <div className="p-3 text-sm text-slate-400 bg-slate-700/50 flex items-center gap-2">
                          <Link size={16} className="text-blue-400" />
                          Eksterni Link
                        </div>
                      )}
                      <div className="p-3 flex justify-between items-center">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline truncate max-w-[80%]"
                        >
                          {item.link
                            .replace(/^https?:\/\//, '')
                            .replace(/^www\./, '')}
                        </a>
                        <button
                          onClick={async () => {
                            setRemovingLinkId(item.id);
                            isManagingLinksRef.current = true;
                            try {
                              await onRemoveInspirationLink(item.id);
                              // Update local state immediately
                              setEditedTask((prev) => ({
                                ...prev,
                                inspiration_links:
                                  prev.inspiration_links?.filter(
                                    (link) => link.id !== item.id
                                  ) || [],
                              }));
                            } finally {
                              setRemovingLinkId(null);
                              // Small delay to ensure parent state update completes
                              setTimeout(() => {
                                isManagingLinksRef.current = false;
                              }, 100);
                            }
                          }}
                          disabled={removingLinkId === item.id}
                          className="text-slate-600 hover:text-red-400 transition-colors shrink-0 disabled:opacity-50"
                          title="Obriši link"
                        >
                          {removingLinkId === item.id ? (
                            <Loader size="sm" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-blue-100 uppercase mt-2 flex items-center gap-2">
                <Calendar size={14} className="text-blue-100" /> Datum
                Objavljivanja
              </h4>

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Planirani Datum
              </label>
              <DatePicker
                value={
                  editedTask.publish_date
                    ? editedTask.publish_date.substring(0, 10)
                    : null
                }
                onChange={(date) => {
                  if (date) {
                    // DatePicker returns YYYY-MM-DD (local date)
                    // Store as UTC midnight to avoid timezone shifts
                    // This ensures the date stays the same regardless of user's timezone
                    const isoString = `${date}T00:00:00.000Z`;
                    handleUpdate('publish_date', isoString);
                  } else {
                    handleUpdate('publish_date', null);
                  }
                }}
                placeholder="Izaberi datum objavljivanja"
                className="w-full"
                disablePast={true}
              />
            </div>
          )}

          {editedTask.status === 'published' && activeTab === 'results' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                <Eye size={14} className="text-emerald-400" /> Analiza Rezultata
                (za Case Study)
              </h4>

              <div>
                <label className="text-blue-400 text-xs font-bold block mb-1">
                  Detaljna Analiza (Zašto je radilo?)
                </label>
                <RichTextEditor
                  content={analysisHtml}
                  onChange={(html) => {
                    setAnalysisHtml(html);
                  }}
                  placeholder="Opišite detaljno zašto je ova objava bila uspešna i koje ste lekcije naučili."
                  minHeight="120px"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-emerald-400 text-xs font-bold block mb-1">
                    Pregleda (Views)
                  </label>
                  <input
                    type="text"
                    value={editedTask.result_views || ''}
                    onChange={(e) =>
                      handleUpdate('result_views', e.target.value)
                    }
                    className="w-full bg-slate-700 p-3 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-purple-400 text-xs font-bold block mb-1">
                    Angažman (Engagement)
                  </label>
                  <input
                    type="text"
                    value={editedTask.result_engagement || ''}
                    onChange={(e) =>
                      handleUpdate('result_engagement', e.target.value)
                    }
                    className="w-full bg-slate-700 p-3 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-yellow-400 text-xs font-bold block mb-1">
                    Konverzije
                  </label>
                  <input
                    type="text"
                    value={editedTask.result_conversions || ''}
                    onChange={(e) =>
                      handleUpdate('result_conversions', e.target.value)
                    }
                    className="w-full bg-slate-700 p-3 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-red-400 text-xs font-bold block mb-1">
                  Cover Slika URL (Thumbnail)
                </label>
                <input
                  type="url"
                  value={editedTask.cover_image_url || ''}
                  onChange={(e) =>
                    handleUpdate('cover_image_url', e.target.value)
                  }
                  placeholder="Paste link do slike (ili YouTube link za automatski thumbnail)"
                  className="w-full bg-slate-700 p-3 rounded-lg text-white"
                />
                {editedTask.cover_image_url && (
                  <div className="mt-2 text-xs text-slate-500">
                    Trenutna slika:{' '}
                    <img
                      src={editedTask.cover_image_url}
                      alt="Preview"
                      className="h-10 w-auto inline-block ml-2 rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-800 flex justify-between items-center gap-2">
          {!task.is_admin_case_study && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="w-full py-3 px-4 rounded-md font-medium flex items-center justify-center gap-2 transition-colors bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 disabled:bg-red-800 disabled:text-red-300"
            >
              {isDeleting ? (
                <>
                  <Loader className="w-4 h-4" />
                  <span className="text-md">Brisanje...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span className="text-md">Obriši Zadatak</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-3 px-4 rounded-md font-medium flex items-center justify-center gap-2 transition-colors ${
              isSaving
                ? 'bg-blue-800 text-blue-300'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
            }`}
          >
            {isSaving ? (
              <>
                <Loader className="w-4 h-4" />
                <span>Čuvanje...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Sačuvaj izmene
              </>
            )}
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Trash2 size={24} className="text-red-400" />
                Potvrdite Brisanje
              </h3>
              <p className="text-slate-400 mb-6">
                Da li ste sigurni da želite da obrišete zadatak{' '}
                <span className="font-semibold text-white">"{task.title}"</span>
                ? Ova akcija se ne može poništiti.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="py-2 px-4 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Otkaži
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="py-2 px-4 rounded-lg font-medium bg-red-600 hover:bg-red-500 text-white transition-colors disabled:bg-red-800 disabled:text-red-300 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader size="sm" />
                      <span>Brisanje...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Obriši
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
