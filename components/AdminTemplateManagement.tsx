'use client'

import { createClient } from '@/lib/supabase/client'
import type { Template, TemplateVisibility, UserTier } from '@/types'
import { NICHES } from '@/lib/constants'
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import RichTextEditor from './ui/rich-text-editor'
import Loader from './ui/loader'
import Skeleton from './ui/skeleton'

interface AdminTemplateManagementProps {
  userId: string
}

export default function AdminTemplateManagement({ userId }: AdminTemplateManagementProps) {
  const supabase = createClient()
  const [templates, setTemplates] = useState<(Template & { visibility?: TemplateVisibility[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    format: 'Kratka Forma' as 'Kratka Forma' | 'Duga Forma',
    niche: NICHES[0].name,
    difficulty: '',
    views_potential: '',
    why_it_works: '',
    structure: { hook: '', body: '', cta: '' },
    vlads_tip: '',
    is_published: false,
    visibility: [] as UserTier[],
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*, template_visibility(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates((data || []) as any)
    } catch (error: any) {
      toast.error('Greška pri učitavanju šablona', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.structure.hook || !formData.structure.body) {
      toast.error('Nedostaju podaci', {
        description: 'Molimo unesite naslov, hook i body.',
      })
      return
    }

    setSavingTemplate(true)
    try {
      if (editingTemplate) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('templates')
          .update({
            title: formData.title,
            format: formData.format,
            niche: formData.niche,
            difficulty: formData.difficulty || null,
            views_potential: formData.views_potential || null,
            why_it_works: formData.why_it_works || null,
            structure: formData.structure,
            vlads_tip: formData.vlads_tip || null,
            is_published: formData.is_published,
          })
          .eq('id', editingTemplate.id)

        if (updateError) throw updateError

        // Update visibility
        await updateVisibility(editingTemplate.id)

        toast.success('Šablon ažuriran')
      } else {
        // Create new template
        const { data: newTemplate, error: insertError } = await supabase
          .from('templates')
          .insert({
            created_by: userId,
            title: formData.title,
            format: formData.format,
            niche: formData.niche,
            difficulty: formData.difficulty || null,
            views_potential: formData.views_potential || null,
            why_it_works: formData.why_it_works || null,
            structure: formData.structure,
            vlads_tip: formData.vlads_tip || null,
            is_published: formData.is_published,
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Set visibility
        await updateVisibility(newTemplate.id)

        toast.success('Šablon kreiran')
      }

      resetForm()
      fetchTemplates()
    } catch (error: any) {
      toast.error('Greška', {
        description: error.message,
      })
    } finally {
      setSavingTemplate(false)
    }
  }

  const updateVisibility = async (templateId: string) => {
    // Delete existing visibility
    await supabase.from('template_visibility').delete().eq('template_id', templateId)

    // Insert new visibility
    if (formData.visibility.length > 0) {
      const visibilityData = formData.visibility.map((tier) => ({
        template_id: templateId,
        tier,
      }))

      await supabase.from('template_visibility').insert(visibilityData)
    }
  }

  const handleEdit = (template: Template & { visibility?: TemplateVisibility[] }) => {
    setEditingTemplate(template)
    setFormData({
      title: template.title,
      format: template.format,
      niche: template.niche,
      difficulty: template.difficulty || '',
      views_potential: template.views_potential || '',
      why_it_works: template.why_it_works || '',
      structure: template.structure as any,
      vlads_tip: template.vlads_tip || '',
      is_published: template.is_published,
      visibility: (template.visibility || []).map((v) => v.tier),
    })
    setIsCreating(true)
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj šablon?')) return

    setDeletingTemplateId(templateId)
    try {
      const { error } = await supabase.from('templates').delete().eq('id', templateId)
      if (error) throw error
      toast.success('Šablon obrisan')
      fetchTemplates()
    } catch (error: any) {
      toast.error('Greška', {
        description: error.message,
      })
    } finally {
      setDeletingTemplateId(null)
    }
  }

  const resetForm = () => {
    setEditingTemplate(null)
    setIsCreating(false)
    setFormData({
      title: '',
      format: 'Kratka Forma',
      niche: NICHES[0].name,
      difficulty: '',
      views_potential: '',
      why_it_works: '',
      structure: { hook: '', body: '', cta: '' },
      vlads_tip: '',
      is_published: false,
      visibility: [],
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton height={32} width="250px" />
            <Skeleton height={20} width="300px" />
          </div>
          <Skeleton height={40} width="150px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-3">
              <Skeleton height={24} width="80%" />
              <Skeleton height={16} width="60%" />
              <Skeleton height={60} width="100%" />
              <div className="flex gap-2">
                <Skeleton height={32} width="80px" />
                <Skeleton height={32} width="80px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Upravljanje Šablonima</h2>
          <p className="text-slate-400">Kreirajte i upravljajte šablonima za korisnike</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus size={16} /> Novi Šablon
        </Button>
      </div>

      {isCreating && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-white">
                  {editingTemplate ? 'Izmeni Šablon' : 'Novi Šablon'}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Popunite sve potrebne informacije
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={resetForm}>
                <X size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Naslov</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
                <select
                  value={formData.format}
                  onChange={(e) =>
                    setFormData({ ...formData, format: e.target.value as 'Kratka Forma' | 'Duga Forma' })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white"
                >
                  <option value="Kratka Forma">Kratka Forma</option>
                  <option value="Duga Forma">Duga Forma</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Niša</label>
              <select
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white"
              >
                {NICHES.map((niche) => (
                  <option key={niche.id} value={niche.name}>
                    {niche.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Težina</label>
                <Input
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  placeholder="Npr. Lako, Srednje, Teško"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Potencijal Pregleda</label>
                <Input
                  value={formData.views_potential}
                  onChange={(e) => setFormData({ ...formData, views_potential: e.target.value })}
                  placeholder="Npr. 10K-50K"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Zašto Radi</label>
              <Textarea
                value={formData.why_it_works}
                onChange={(e) => setFormData({ ...formData, why_it_works: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Hook</label>
              <RichTextEditor
                content={formData.structure.hook}
                onChange={(html) => {
                  const tempDiv = document.createElement('div')
                  tempDiv.innerHTML = html
                  const plainText = tempDiv.textContent || tempDiv.innerText || ''
                  setFormData({
                    ...formData,
                    structure: { ...formData.structure, hook: plainText },
                  })
                }}
                placeholder="Unesite hook..."
                minHeight="100px"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Body</label>
              <RichTextEditor
                content={formData.structure.body}
                onChange={(html) => {
                  const tempDiv = document.createElement('div')
                  tempDiv.innerHTML = html
                  const plainText = tempDiv.textContent || tempDiv.innerText || ''
                  setFormData({
                    ...formData,
                    structure: { ...formData.structure, body: plainText },
                  })
                }}
                placeholder="Unesite body..."
                minHeight="150px"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">CTA</label>
              <RichTextEditor
                content={formData.structure.cta}
                onChange={(html) => {
                  const tempDiv = document.createElement('div')
                  tempDiv.innerHTML = html
                  const plainText = tempDiv.textContent || tempDiv.innerText || ''
                  setFormData({
                    ...formData,
                    structure: { ...formData.structure, cta: plainText },
                  })
                }}
                placeholder="Unesite CTA..."
                minHeight="100px"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Vladov Savet</label>
              <Textarea
                value={formData.vlads_tip}
                onChange={(e) => setFormData({ ...formData, vlads_tip: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                rows={2}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="rounded"
                />
                Objavljeno
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Vidljivo za Tiers</label>
              <div className="flex gap-4">
                {(['free', 'starter', 'pro'] as UserTier[]).map((tier) => (
                  <label key={tier} className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.visibility.includes(tier)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            visibility: [...formData.visibility, tier],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            visibility: formData.visibility.filter((t) => t !== tier),
                          })
                        }
                      }}
                      className="rounded"
                    />
                    {tier.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={savingTemplate} className="flex items-center gap-2">
                {savingTemplate ? (
                  <>
                    <Loader size="sm" />
                    <span>Čuvanje...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} /> Sačuvaj
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Otkaži
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="bg-slate-900 border-slate-700">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white text-lg">{template.title}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {template.niche} • {template.format}
                  </CardDescription>
                </div>
                {template.is_published ? (
                  <Eye className="text-green-400" size={20} />
                ) : (
                  <EyeOff className="text-slate-500" size={20} />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-xs text-slate-500">
                  Tiers: {template.visibility?.map((v) => v.tier.toUpperCase()).join(', ') || 'Nijedan'}
                </div>
                {template.difficulty && (
                  <div className="text-xs text-slate-400">Težina: {template.difficulty}</div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                  className="flex items-center gap-1"
                >
                  <Edit size={14} /> Izmeni
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                  disabled={deletingTemplateId === template.id}
                  className="flex items-center gap-1 text-red-400"
                >
                  {deletingTemplateId === template.id ? (
                    <>
                      <Loader size="sm" />
                      <span>Brisanje...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} /> Obriši
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

