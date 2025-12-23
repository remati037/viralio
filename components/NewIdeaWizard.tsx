'use client'

import { NETWORKS, NICHES, VIRAL_TEMPLATES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { getTierLimits } from '@/lib/utils/tierRestrictions'
import type { TaskInsert, Template, UserTier } from '@/types'
import { Calendar, ChevronLeft, Edit3, FileText, Plus, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import AIAssistant from './AIAssistant'
import RichTextEditor from './ui/rich-text-editor'
import Loader from './ui/loader'
import Skeleton from './ui/skeleton'

interface NewIdeaWizardProps {
  onClose: () => void
  onSaveToPlan: (task: Omit<TaskInsert, 'user_id'>) => Promise<void>
  userTier?: UserTier
}

const WORDS_PER_MINUTE = 150

export default function NewIdeaWizard({ onClose, onSaveToPlan, userTier }: NewIdeaWizardProps) {
  const supabase = createClient()
  const [step, setStep] = useState<'start' | 'template_select' | 'script_edit'>('start')
  const [selectedNiche, setSelectedNiche] = useState('marketing')
  const [dbTemplates, setDbTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
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
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (step === 'template_select') {
      fetchTemplates()
    }
  }, [step, selectedNiche])

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_published', true)
        .eq('niche', NICHES.find((n) => n.id === selectedNiche)?.name || 'Marketing')

      if (error) throw error

      // Get all published templates
      const allTemplates = (data || []) as Template[]

      // Apply tier-based random selection
      if (!userTier) {
        setDbTemplates([])
        return
      }

      const limits = getTierLimits(userTier)

      let filtered: Template[]
      if (limits.maxTemplates === null) {
        // Pro tier: show all templates
        filtered = allTemplates
      } else {
        // Free (2) or Starter (5): show random templates
        const shuffled = [...allTemplates].sort(() => Math.random() - 0.5)
        filtered = shuffled.slice(0, limits.maxTemplates)
      }

      setDbTemplates(filtered)
    } catch (error: any) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // Combine DB templates with static templates (for backward compatibility)
  const activeTemplates = [
    ...dbTemplates.map((t) => ({
      id: t.id,
      title: t.title,
      format: t.format,
      difficulty: t.difficulty || 'Srednje',
      views_potential: t.views_potential || 'N/A',
      why_it_works: t.why_it_works || '',
      structure: t.structure as { hook: string; body: string; cta: string },
      vlads_tip: t.vlads_tip || '',
    })),
    ...(VIRAL_TEMPLATES[selectedNiche] || []),
  ]

  const activeNicheInfo = NICHES.find((n) => n.id === selectedNiche)

  const handleSelectTemplate = (template: typeof activeTemplates[0]) => {
    const topic = formData.title || 'Moja Tema'

    if (template.format === 'Duga Forma') {
      const generatedScript = `UVOD: U prve 3 sekunde kaži zašto bi trebalo da ostanu do kraja.
GLAVNA TEMA 1: ${template.structure.body.replace('[TOPIC]', topic).replace('[RESENJE]', 'koriste automatizaciju')}
GLAVNA TEMA 2: Detaljna analiza i primer
ZAKLJUČAK: ${template.structure.cta}`

      setFormData((prev) => ({
        ...prev,
        title: prev.title || template.title,
        format: template.format as 'Kratka Forma' | 'Duga Forma',
        originalTemplate: template.title,
        fullScript: generatedScript,
        fullScriptHtml: generatedScript,
        niche: activeNicheInfo?.name || prev.niche,
      }))
    } else {
      const hookText = template.structure.hook.replace('[TOPIC]', topic).replace('[CENA]', '150.000').replace('[RESENJE]', 'fokusiraju na LTV')
      const bodyText = template.structure.body.replace('[TOPIC]', topic).replace('[RESENJE]', 'koriste automatizaciju')
      const ctaText = template.structure.cta

      setFormData((prev) => ({
        ...prev,
        title: prev.title || template.title,
        format: template.format as 'Kratka Forma' | 'Duga Forma',
        originalTemplate: template.title,
        hook: hookText,
        hookHtml: hookText,
        body: bodyText,
        bodyHtml: bodyText,
        cta: ctaText,
        ctaHtml: ctaText,
        niche: activeNicheInfo?.name || prev.niche,
      }))
    }
    setStep('script_edit')
  }

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
    }))
    setStep('script_edit')
  }

  const getDurationEstimate = (script: string) => {
    if (formData.format === 'Kratka Forma') {
      const words = script.trim().split(/\s+/).length
      const seconds = Math.round(words / 2.5)
      if (seconds > 60) return '> 60 sekundi (Predugo za Reel)'
      return `${seconds} sekundi`
    } else {
      const words = script.trim().split(/\s+/).length
      if (words === 0) return '0 minuta'

      const minutes = Math.round(words / WORDS_PER_MINUTE)

      if (minutes < 1) return '< 1 minut'
      if (minutes <= 60) return `${minutes} minuta`

      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60

      return `${hours}h ${remainingMinutes} min`
    }
  }

  const getTotalWordCount = () => {
    if (formData.format === 'Kratka Forma') {
      const hookWords = formData.hook.trim().split(/\s+/).filter(w => w).length
      const bodyWords = formData.body.trim().split(/\s+/).filter(w => w).length
      const ctaWords = formData.cta.trim().split(/\s+/).filter(w => w).length
      return hookWords + bodyWords + ctaWords
    } else {
      return formData.fullScript.trim().split(/\s+/).filter(w => w).length
    }
  }

  const handleSave = async () => {
    if (formData.format === 'Kratka Forma') {
      if (!formData.title.trim() || (!formData.hook.trim() && !formData.body.trim() && !formData.cta.trim())) {
        toast.error('Nedostaju podaci', {
          description: 'Molimo unesite naslov i bar jedan deo skripte (Hook, Body ili CTA) pre čuvanja.',
        })
        return
      }
    } else {
      if (!formData.title.trim() || !formData.fullScript.trim()) {
        toast.error('Nedostaju podaci', {
          description: 'Molimo unesite naslov i skriptu pre čuvanja.',
        })
        return
      }
    }

    setIsSaving(true)

    const newTask = {
      title: formData.title.trim(),
      niche: formData.niche,
      format: formData.format,
      hook: formData.format === 'Duga Forma' ? formData.fullScript.trim() : formData.hook.trim(),
      body: formData.format === 'Duga Forma' ? 'CEO TEKST se nalazi u Hook/Skripta polju u detaljima.' : formData.body.trim(),
      cta: formData.format === 'Duga Forma' ? 'Duga Forma: Nema odvojenog CTA za Kanban.' : formData.cta.trim(),
      status: 'idea' as const,
      publish_date: null,
      original_template: formData.originalTemplate,
    }

    await onSaveToPlan(newTask as Omit<TaskInsert, 'user_id'>)
    setIsSaving(false)
    onClose()
  }

  const IdeaSelectorCard = ({ template }: { template: typeof activeTemplates[0] }) => (
    <div
      className="group bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/10 flex flex-col h-full cursor-pointer"
      onClick={() => handleSelectTemplate(template)}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${template.format === 'Kratka Forma' ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'
            }`}
        >
          {template.format}
        </span>
        <span className="text-xs font-bold text-slate-500">{template.difficulty}</span>
      </div>

      <h3 className="text-md font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{template.title}</h3>

      <p className="text-slate-400 text-xs mb-4 flex-grow line-clamp-2">{template.why_it_works}</p>

      <div className="mt-auto">
        <button className="w-full py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-500 transition-colors flex items-center justify-center gap-1">
          <Zap size={14} /> Koristi Šablon
        </button>
      </div>
    </div>
  )

  const renderContent = () => {
    if (step === 'start') {
      return (
        <div className="p-6 space-y-6">
          <h3 className="text-xl font-bold text-white">1. Odaberi Način Kreiranja Ideje</h3>
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={handleManualStart}
              className="p-6 bg-slate-800 border border-slate-700 rounded-xl hover:border-blue-500/50 cursor-pointer transition-all flex flex-col items-center text-center space-y-2"
            >
              <FileText size={24} className="text-blue-400" />
              <p className="font-bold text-white">Ručni Unos</p>
              <p className="text-xs text-slate-400">Počnite od nule sa praznom skriptom.</p>
            </div>
            <div
              onClick={() => setStep('template_select')}
              className="p-6 bg-slate-800 border border-slate-700 rounded-xl hover:border-emerald-500/50 cursor-pointer transition-all flex flex-col items-center text-center space-y-2"
            >
              <Zap size={24} className="text-emerald-400" />
              <p className="font-bold text-white">Koristi Šablon</p>
              <p className="text-xs text-slate-400">Izaberite viralni format za brzi start.</p>
            </div>
          </div>
        </div>
      )
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
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedNiche === niche.id
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
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
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
                  Nema dostupnih šablona za ovu nišu.
                </div>
              ) : (
                activeTemplates.map((template) => (
                  <IdeaSelectorCard key={template.id} template={template} />
                ))
              )}
            </div>
          )}
        </div>
      )
    }

    if (step === 'script_edit') {
      const isLongForm = formData.format === 'Duga Forma'

      return (
        <div className="p-6 space-y-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Edit3 className="text-emerald-400 w-5 h-5" /> 3. Skripta i Detalji
            </h3>
            <button
              onClick={() => setStep('template_select')}
              className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
            >
              <ChevronLeft size={16} /> {formData.originalTemplate === 'Ručni Unos' ? 'Nazad' : 'Izaberi drugi šablon'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Naslov Video Zapisa</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              placeholder="Unesite naslov (Npr. 3 Alata za Brzi Viral)"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mreža za Objavljivanje</label>
            <div className="flex gap-3">
              {NETWORKS.map((net) => {
                const Icon = net.icon
                return (
                  <button
                    key={net.id}
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        network: net.name,
                        format: net.id === 'youtube' || net.id === 'facebook' ? 'Duga Forma' : 'Kratka Forma',
                      }))
                    }
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${formData.network === net.name
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      } flex items-center gap-2`}
                  >
                    <Icon size={16} className={formData.network === net.name ? 'text-white' : net.color} />
                    {net.name}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Automatski format:{' '}
              <span
                className={`ml-1 font-semibold ${formData.format === 'Kratka Forma' ? 'text-red-400' : 'text-green-400'}`}
              >
                {formData.format}
              </span>
            </p>
          </div>

          {isLongForm ? (
            <div className="flex-1 flex flex-col min-h-[300px]">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Ceo Scenario / Tekst Duge Forme (YouTube)
              </label>
              <RichTextEditor
                content={formData.fullScriptHtml || formData.fullScript}
                onChange={(html) => {
                  // Store HTML for rich text
                  setFormData((p) => ({ ...p, fullScriptHtml: html }))
                  // Convert HTML to plain text for word count and duration estimate
                  const tempDiv = document.createElement('div')
                  tempDiv.innerHTML = html
                  const plainText = tempDiv.textContent || tempDiv.innerText || ''
                  setFormData((p) => ({ ...p, fullScript: plainText }))
                }}
                placeholder="Pišite ceo scenario, uključujući uvod, glavne tačke i zaključak. Nije potrebno odvajati sekcije."
                minHeight="300px"
                className="flex-1"
              />
              <div className="text-xs text-slate-500 mt-2 flex justify-between items-center">
                <span>
                  Procena Trajanja Videa: {getDurationEstimate(formData.fullScript)} (~{WORDS_PER_MINUTE} WPM)
                </span>
                <span className="text-slate-400 font-mono">{formData.fullScript.trim().split(/\s+/).filter(w => w).length} reči</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-red-400 text-xs font-bold block mb-1">01. HOOK (Udica)</label>
                <RichTextEditor
                  content={formData.hookHtml || formData.hook}
                  onChange={(html) => {
                    setFormData((p) => ({ ...p, hookHtml: html }))
                    const tempDiv = document.createElement('div')
                    tempDiv.innerHTML = html
                    const plainText = tempDiv.textContent || tempDiv.innerText || ''
                    setFormData((p) => ({ ...p, hook: plainText }))
                  }}
                  placeholder="Unesite udicu ovde (0-3 sekunde)"
                  minHeight="80px"
                />
              </div>

              <div>
                <label className="text-blue-400 text-xs font-bold block mb-1">02. BODY (Vrednost)</label>
                <RichTextEditor
                  content={formData.bodyHtml || formData.body}
                  onChange={(html) => {
                    setFormData((p) => ({ ...p, bodyHtml: html }))
                    const tempDiv = document.createElement('div')
                    tempDiv.innerHTML = html
                    const plainText = tempDiv.textContent || tempDiv.innerText || ''
                    setFormData((p) => ({ ...p, body: plainText }))
                  }}
                  placeholder="Unesite ključnu vrednost ovde (3-45 sekundi)"
                  minHeight="120px"
                />
              </div>

              <div>
                <label className="text-emerald-400 text-xs font-bold block mb-1">03. CTA (Poziv na akciju)</label>
                <RichTextEditor
                  content={formData.ctaHtml || formData.cta}
                  onChange={(html) => {
                    setFormData((p) => ({ ...p, ctaHtml: html }))
                    const tempDiv = document.createElement('div')
                    tempDiv.innerHTML = html
                    const plainText = tempDiv.textContent || tempDiv.innerText || ''
                    setFormData((p) => ({ ...p, cta: plainText }))
                  }}
                  placeholder="Unesite poziv na akciju ovde"
                  minHeight="60px"
                />
              </div>

              <div className="text-xs text-slate-500 flex justify-between items-center">
                <span>
                  Procena Trajanja: {getDurationEstimate(`${formData.hook} ${formData.body} ${formData.cta}`)}
                </span>
                <span className="text-slate-400 font-mono">{getTotalWordCount()} reči</span>
              </div>
            </div>
          )}

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
                  setFormData((p) => ({ ...p, title: content.trim() }))
                } else if (field === 'hook') {
                  if (isLongForm) {
                    setFormData((p) => ({
                      ...p,
                      fullScript: content.trim(),
                      fullScriptHtml: content.trim(),
                    }))
                  } else {
                    setFormData((p) => ({
                      ...p,
                      hook: content.trim(),
                      hookHtml: content.trim(),
                    }))
                  }
                } else if (field === 'body') {
                  setFormData((p) => ({
                    ...p,
                    body: content.trim(),
                    bodyHtml: content.trim(),
                  }))
                } else if (field === 'cta') {
                  setFormData((p) => ({
                    ...p,
                    cta: content.trim(),
                    ctaHtml: content.trim(),
                  }))
                } else if (field === 'all') {
                  // Parse structured content
                  if (isLongForm) {
                    setFormData((p) => ({
                      ...p,
                      fullScript: content.trim(),
                      fullScriptHtml: content.trim(),
                    }))
                  } else {
                    const hookMatch = content.match(/HOOK:?\s*([\s\S]+?)(?:\n\n|BODY:|CTA:|$)/i)
                    const bodyMatch = content.match(/BODY:?\s*([\s\S]+?)(?:\n\n|CTA:|$)/i)
                    const ctaMatch = content.match(/CTA:?\s*([\s\S]+?)$/i)
                    const titleMatch = content.match(/NASLOV:?\s*([\s\S]+?)(?:\n|$)/i) || content.match(/^([\s\S]+?)(?:\n|HOOK:|BODY:|CTA:)/i)

                    if (titleMatch?.[1]) {
                      setFormData((p) => ({ ...p, title: titleMatch[1].trim() }))
                    }

                    if (hookMatch?.[1]) {
                      setFormData((p) => ({
                        ...p,
                        hook: hookMatch[1].trim(),
                        hookHtml: hookMatch[1].trim(),
                      }))
                    }
                    if (bodyMatch?.[1]) {
                      setFormData((p) => ({
                        ...p,
                        body: bodyMatch[1].trim(),
                        bodyHtml: bodyMatch[1].trim(),
                      }))
                    }
                    if (ctaMatch?.[1]) {
                      setFormData((p) => ({
                        ...p,
                        cta: ctaMatch[1].trim(),
                        ctaHtml: ctaMatch[1].trim(),
                      }))
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
                (formData.format === 'Kratka Forma' && !formData.hook.trim() && !formData.body.trim() && !formData.cta.trim()) ||
                (formData.format === 'Duga Forma' && !formData.fullScript.trim())
              }
              className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isSaving ||
                !formData.title.trim() ||
                (formData.format === 'Kratka Forma' && !formData.hook.trim() && !formData.body.trim() && !formData.cta.trim()) ||
                (formData.format === 'Duga Forma' && !formData.fullScript.trim())
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                }`}
            >
              <Calendar size={20} /> {isSaving ? 'Čuvanje...' : 'Sačuvaj u Planer Sadržaja'}
            </button>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] h-full md:h-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="text-emerald-400 w-5 h-5" />
            Nova Ideja (Čarobnjak)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">{renderContent()}</div>
      </div>
    </div>
  )
}

