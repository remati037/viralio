'use client'

import { createClient } from '@/lib/supabase/client'
import { getYoutubeThumbnail } from '@/lib/utils/helpers'
import { KANBAN_COLUMNS } from '@/lib/constants'
import type { Task, TaskUpdate } from '@/types'
import { Calendar, Check, ClipboardList, Edit3, Eye, FileText, Link, Trash2, Trello, X, Youtube } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import AIAssistant from './AIAssistant'
import CategorySelect, { type TaskCategory } from './ui/category-select'
import StatusSelect from './ui/status-select'
import RichTextEditor from './ui/rich-text-editor'
import Loader from './ui/loader'

interface TaskDetailModalProps {
  task: Task
  onClose: () => void
  onDelete: (taskId: string) => Promise<void>
  onUpdate: (task: TaskUpdate) => Promise<void>
  onAddInspirationLink: (
    taskId: string,
    link: string,
    displayUrl?: string,
    type?: string
  ) => Promise<{ data: any | null; error: string | null }>
  onRemoveInspirationLink: (linkId: string) => Promise<void>
}

export default function TaskDetailModal({
  task,
  onClose,
  onDelete,
  onUpdate,
  onAddInspirationLink,
  onRemoveInspirationLink,
}: TaskDetailModalProps) {
  const supabase = createClient()
  const [editedTask, setEditedTask] = useState<Task>(task)
  const [isSaving, setIsSaving] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [isAddingLink, setIsAddingLink] = useState(false)
  const [removingLinkId, setRemovingLinkId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'script' | 'inspiration' | 'schedule' | 'results'>('script')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const isLongForm = editedTask.format === 'Duga Forma'
  
  // Helper function to convert plain text to HTML if needed
  const textToHtml = (text: string | null | undefined): string => {
    if (!text) return ''
    // If it already contains HTML tags, return as is
    if (text.trim().startsWith('<') && text.includes('>')) {
      return text
    }
    // Otherwise, wrap in paragraph tags and preserve line breaks
    const lines = text.split('\n')
    if (lines.length === 1 && lines[0].trim()) {
      // Single line - just wrap in paragraph
      return `<p>${lines[0]}</p>`
    }
    // Multiple lines - wrap each in paragraph
    return lines.map(line => line.trim() ? `<p>${line}</p>` : '<p><br></p>').join('')
  }
  
  // Helper function to get HTML content for editor
  const getHtmlContent = (field: string | null | undefined): string => {
    return textToHtml(field)
  }
  
  const initialScriptValue = isLongForm ? getHtmlContent(editedTask.hook) : ''
  const [fullScriptText, setFullScriptText] = useState(initialScriptValue)
  const [hookHtml, setHookHtml] = useState(getHtmlContent(editedTask.hook))
  const [bodyHtml, setBodyHtml] = useState(getHtmlContent(editedTask.body))
  const [ctaHtml, setCtaHtml] = useState(getHtmlContent(editedTask.cta))
  const [analysisHtml, setAnalysisHtml] = useState(getHtmlContent(editedTask.analysis))

  useEffect(() => {
    setEditedTask(task)
    const isLong = task.format === 'Duga Forma'
    setFullScriptText(isLong ? getHtmlContent(task.hook) : '')
    setHookHtml(getHtmlContent(task.hook))
    setBodyHtml(getHtmlContent(task.body))
    setCtaHtml(getHtmlContent(task.cta))
    setAnalysisHtml(getHtmlContent(task.analysis))
  }, [task])

  useEffect(() => {
    if (task.user_id) {
      fetchCategories()
    }
  }, [task.user_id])

  const fetchCategories = async () => {
    setLoadingCategories(true)
    try {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .eq('user_id', task.user_id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setCategories((data || []) as TaskCategory[])
    } catch (error: any) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleUpdate = (field: keyof Task, value: any) => {
    setEditedTask((prev) => ({ ...prev, [field]: value }))
  }

  const handleStatusChange = async (newStatus: 'idea' | 'ready' | 'scheduled' | 'published') => {
    // Update local state immediately
    setEditedTask((prev) => ({ ...prev, status: newStatus }))
    
    // Persist to database
    try {
      await onUpdate({ status: newStatus })
      toast.success('Status ažuriran', {
        description: `Zadatak je premešten u "${KANBAN_COLUMNS.find(col => col.id === newStatus)?.title || newStatus}".`,
      })
    } catch (error: any) {
      // Revert on error
      setEditedTask((prev) => ({ ...prev, status: task.status }))
      toast.error('Greška pri ažuriranju statusa', {
        description: error?.message || 'Pokušajte ponovo.',
      })
    }
  }

  const handleUpdateFullScript = (html: string) => {
    setFullScriptText(html)
  }
  
  // Helper to extract plain text from HTML for saving (if needed)
  const htmlToText = (html: string): string => {
    if (!html) return ''
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    return tempDiv.textContent || tempDiv.innerText || ''
  }

  const handleAddLink = async () => {
    if (!linkInput.trim()) {
      toast.error('Prazan link', {
        description: 'Molimo unesite validan link.',
      })
      return
    }

    setIsAddingLink(true)
    try {
      const { url, type } = getYoutubeThumbnail(linkInput)
      const result = await onAddInspirationLink(editedTask.id, linkInput.trim(), url || undefined, type || undefined)
      
      // Update local state immediately to show the new link
      if (result && !result.error) {
        const newLink = {
          id: result.data?.id || `temp-${Date.now()}`,
          task_id: editedTask.id,
          link: linkInput.trim(),
          display_url: url || null,
          type: type || null,
          created_at: new Date().toISOString(),
        }
        setEditedTask((prev) => ({
          ...prev,
          inspiration_links: [...(prev.inspiration_links || []), newLink],
        }))
      }
      setLinkInput('')
    } finally {
      setIsAddingLink(false)
    }
  }

  const handleSave = async () => {
    if (!editedTask.title.trim()) {
      toast.error('Nedostaje naslov', {
        description: 'Molimo unesite naslov zadatka.',
      })
      return
    }

    setIsSaving(true)

    const updatedTask: TaskUpdate = {
      title: editedTask.title,
      niche: editedTask.niche,
      format: editedTask.format,
      // Store HTML directly to preserve formatting
      hook: isLongForm ? fullScriptText : hookHtml,
      body: isLongForm ? 'CEO TEKST se nalazi u Hook/Skripta polju u detaljima.' : bodyHtml,
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
    }

    await onUpdate(updatedTask)
    setIsSaving(false)
    onClose()
  }

  const handleDelete = async () => {
    if (task.is_admin_case_study) {
      toast.error('Ne možete obrisati', {
        description: 'Ne možete obrisati admin studiju slučaja.',
      })
      return
    }

    setIsDeleting(true)
    try {
      await onDelete(task.id)
      onClose()
    } catch (error: any) {
      toast.error('Greška pri brisanju', {
        description: error.message || 'Došlo je do greške pri brisanju zadatka.',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const taskFormat = editedTask.format === 'Kratka Forma' ? 'text-red-400' : 'text-green-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            {editedTask.category && (
              <span
                className="text-xs font-bold uppercase tracking-wider bg-slate-800 px-2 py-1 rounded border"
                style={{
                  color: editedTask.category.color,
                  borderColor: `${editedTask.category.color}40`,
                }}
              >
                {editedTask.category.name}
              </span>
            )}
            <h3 className="text-xl font-bold text-white mt-2 flex items-center gap-2">
              <span className={`text-sm font-bold ${taskFormat}`}>[{editedTask.format}]</span>
              {editedTask.title}
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Kreirano: {new Date(editedTask.created_at).toLocaleDateString('sr-RS')}
              {editedTask.publish_date && (
                <span className="ml-3 font-semibold text-purple-300">
                  | Planirano: {new Date(editedTask.publish_date).toLocaleDateString('sr-RS')}
                </span>
              )}
            </p>
          </div>
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
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('script')}
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'script' ? 'text-white border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <FileText size={16} /> Skripta
          </button>
          <button
            onClick={() => setActiveTab('inspiration')}
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'inspiration'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <Link size={16} /> Inspiracija ({editedTask.inspiration_links?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'schedule' ? 'text-white border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <Calendar size={16} /> Raspored
          </button>
          {editedTask.status === 'published' && (
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'results' ? 'text-white border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <ClipboardList size={16} /> Rezultati
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'script' && (
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                <Edit3 size={14} className="text-blue-400" />
                Skripta (Edit) - <span className={`ml-1 font-bold ${isLongForm ? 'text-green-400' : 'text-red-400'}`}>{editedTask.format}</span>
              </h4>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                <StatusSelect
                  value={editedTask.status}
                  onChange={handleStatusChange}
                  className="w-full"
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Kategorija</label>
                {loadingCategories ? (
                  <div className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-slate-400">
                    Učitavanje kategorija...
                  </div>
                ) : (
                  <CategorySelect
                    categories={categories}
                    value={editedTask.category_id || null}
                    onChange={(categoryId) => {
                      setEditedTask((prev) => ({ ...prev, category_id: categoryId }))
                    }}
                    placeholder="Izaberi kategoriju (opciono)"
                    className="w-full"
                  />
                )}
              </div>

              {isLongForm ? (
                <div className="flex-1 flex flex-col min-h-[300px]">
                  <label className="text-green-400 text-xs font-bold block mb-1">CEO SCENARIO / TEKST (Duga Forma)</label>
                  <RichTextEditor
                    content={fullScriptText}
                    onChange={(html) => {
                      handleUpdateFullScript(html)
                    }}
                    placeholder="Pišite ceo scenario bez razdvajanja na HOOK/BODY/CTA"
                    minHeight="350px"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    *Napomena: Za Dugu Formu koristi se jedno polje. Procena trajanja bi bila:{' '}
                    **~{Math.round(fullScriptText.trim().split(/\s+/).length / 150)} min**
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-red-400 text-xs font-bold block mb-1">01. HOOK (Udica)</label>
                    <RichTextEditor
                      content={hookHtml}
                      onChange={(html) => {
                        setHookHtml(html)
                      }}
                      placeholder="Unesite udicu ovde (0-3 sekunde)"
                      minHeight="80px"
                    />
                  </div>

                  <div>
                    <label className="text-blue-400 text-xs font-bold block mb-1">02. BODY (Vrednost)</label>
                    <RichTextEditor
                      content={bodyHtml}
                      onChange={(html) => {
                        setBodyHtml(html)
                      }}
                      placeholder="Unesite ključnu vrednost ovde (3-45 sekundi)"
                      minHeight="120px"
                    />
                  </div>

                  <div>
                    <label className="text-emerald-400 text-xs font-bold block mb-1">03. CTA (Poziv na akciju)</label>
                    <RichTextEditor
                      content={ctaHtml}
                      onChange={(html) => {
                        setCtaHtml(html)
                      }}
                      placeholder="Unesite poziv na akciju ovde"
                      minHeight="60px"
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
                      handleUpdate('title', content.trim())
                    } else if (field === 'hook') {
                      if (isLongForm) {
                        handleUpdateFullScript(content.trim())
                      } else {
                        handleUpdate('hook', content.trim())
                      }
                    } else if (field === 'body') {
                      handleUpdate('body', content.trim())
                    } else if (field === 'cta') {
                      handleUpdate('cta', content.trim())
                    } else if (field === 'all') {
                      // Parse structured content
                      if (isLongForm) {
                        handleUpdateFullScript(content.trim())
                      } else {
                        const hookMatch = content.match(/HOOK:?\s*([\s\S]+?)(?:\n\n|BODY:|CTA:|$)/i)
                        const bodyMatch = content.match(/BODY:?\s*([\s\S]+?)(?:\n\n|CTA:|$)/i)
                        const ctaMatch = content.match(/CTA:?\s*([\s\S]+?)$/i)
                        const titleMatch = content.match(/NASLOV:?\s*([\s\S]+?)(?:\n|$)/i) || content.match(/^([\s\S]+?)(?:\n|HOOK:|BODY:|CTA:)/i)

                        if (titleMatch?.[1]) {
                          handleUpdate('title', titleMatch[1].trim())
                        }
                        if (hookMatch?.[1]) {
                          handleUpdate('hook', hookMatch[1].trim())
                        }
                        if (bodyMatch?.[1]) {
                          handleUpdate('body', bodyMatch[1].trim())
                        }
                        if (ctaMatch?.[1]) {
                          handleUpdate('cta', ctaMatch[1].trim())
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'inspiration' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                <Trello size={14} className="text-yellow-400" /> Dodaj Linkove Konkurenata
              </h4>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="Paste link (YouTube, Instagram, TikTok...)"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  onClick={handleAddLink}
                  disabled={!linkInput.trim() || isAddingLink}
                  className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:bg-slate-700 disabled:text-slate-500 flex items-center gap-2"
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
                  <div className="col-span-full text-center py-10 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                    Nema dodatih linkova za inspiraciju.
                  </div>
                ) : (
                  (editedTask.inspiration_links || []).map((item) => (
                    <div key={item.id} className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 relative group">
                      {item.display_url && item.type === 'youtube' ? (
                        <div className="relative">
                          <img
                            src={item.display_url}
                            alt="YouTube Thumbnail"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              ; (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                          <Youtube size={32} fill="red" className="text-white absolute inset-0 m-auto opacity-70 group-hover:opacity-100 transition-opacity" />
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
                          {item.link.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                        </a>
                        <button
                          onClick={async () => {
                            setRemovingLinkId(item.id)
                            try {
                              await onRemoveInspirationLink(item.id)
                              // Update local state immediately
                              setEditedTask((prev) => ({
                                ...prev,
                                inspiration_links: prev.inspiration_links?.filter((link) => link.id !== item.id) || [],
                              }))
                            } finally {
                              setRemovingLinkId(null)
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
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                <Calendar size={14} className="text-purple-400" /> Datum Objavljivanja
              </h4>

              <label className="block text-sm font-medium text-slate-300 mb-2">Planirani Datum</label>
              <input
                type="date"
                value={editedTask.publish_date ? editedTask.publish_date.substring(0, 10) : ''}
                onChange={(e) =>
                  handleUpdate('publish_date', e.target.value ? new Date(e.target.value).toISOString() : null)
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />

              {editedTask.publish_date && (
                <button
                  onClick={() => handleUpdate('publish_date', null)}
                  className="text-red-400 text-sm hover:text-red-300 flex items-center gap-1 mt-2"
                >
                  <Trash2 size={14} /> Ukloni Datum
                </button>
              )}
            </div>
          )}

          {editedTask.status === 'published' && activeTab === 'results' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                <Eye size={14} className="text-emerald-400" /> Analiza Rezultata (za Case Study)
              </h4>

              <div>
                <label className="text-blue-400 text-xs font-bold block mb-1">Detaljna Analiza (Zašto je radilo?)</label>
                <RichTextEditor
                  content={analysisHtml}
                  onChange={(html) => {
                    setAnalysisHtml(html)
                  }}
                  placeholder="Opišite detaljno zašto je ova objava bila uspešna i koje ste lekcije naučili."
                  minHeight="120px"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-emerald-400 text-xs font-bold block mb-1">Pregleda (Views)</label>
                  <input
                    type="text"
                    value={editedTask.result_views || ''}
                    onChange={(e) => handleUpdate('result_views', e.target.value)}
                    className="w-full bg-slate-700 p-3 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-purple-400 text-xs font-bold block mb-1">Angažman (Engagement)</label>
                  <input
                    type="text"
                    value={editedTask.result_engagement || ''}
                    onChange={(e) => handleUpdate('result_engagement', e.target.value)}
                    className="w-full bg-slate-700 p-3 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-yellow-400 text-xs font-bold block mb-1">Konverzije</label>
                  <input
                    type="text"
                    value={editedTask.result_conversions || ''}
                    onChange={(e) => handleUpdate('result_conversions', e.target.value)}
                    className="w-full bg-slate-700 p-3 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-red-400 text-xs font-bold block mb-1">Cover Slika URL (Thumbnail)</label>
                <input
                  type="url"
                  value={editedTask.cover_image_url || ''}
                  onChange={(e) => handleUpdate('cover_image_url', e.target.value)}
                  placeholder="Paste link do slike (ili YouTube link za automatski thumbnail)"
                  className="w-full bg-slate-700 p-3 rounded-lg text-white"
                />
                {editedTask.cover_image_url && (
                  <div className="mt-2 text-xs text-slate-500">
                    Trenutna slika:{' '}
                    <img src={editedTask.cover_image_url} alt="Preview" className="h-10 w-auto inline-block ml-2 rounded" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-between items-center gap-3">
          {!task.is_admin_case_study && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 disabled:bg-red-800 disabled:text-red-300"
            >
              {isDeleting ? (
                <>
                  <Loader size="sm" />
                  <span>Brisanje...</span>
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Obriši Zadatak
                </>
              )}
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${isSaving
                ? 'bg-blue-800 text-blue-300'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                }`}
            >
              {isSaving ? (
                <>
                  <Loader size="sm" />
                  <span>Čuvanje...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  Sačuvaj Izmene i Zatvori
                </>
              )}
            </button>
          </div>
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
                Da li ste sigurni da želite da obrišete zadatak <span className="font-semibold text-white">"{task.title}"</span>?
                Ova akcija se ne može poništiti.
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
  )
}

