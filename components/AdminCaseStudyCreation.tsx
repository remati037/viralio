'use client'

import { NICHES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { TaskInsert } from '@/types'
import { Plus, Save, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import RichTextEditor from './ui/rich-text-editor'

interface AdminCaseStudyCreationProps {
  userId: string
  onCaseStudyCreated?: () => void
}

export default function AdminCaseStudyCreation({ userId, onCaseStudyCreated }: AdminCaseStudyCreationProps) {
  const supabase = createClient()
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    niche: NICHES[0].name,
    format: 'Kratka Forma' as 'Kratka Forma' | 'Duga Forma',
    hook: '',
    body: '',
    cta: '',
    analysis: '',
    cover_image_url: '',
    result_views: '',
    result_engagement: '',
    result_conversions: '',
    original_template: '',
  })

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.analysis.trim()) {
      toast.error('Nedostaju podaci', {
        description: 'Molimo unesite naslov i analizu.',
      })
      return
    }

    try {
      const caseStudy: TaskInsert = {
        user_id: userId, // Will be set to a system user or null
        title: formData.title,
        niche: formData.niche,
        format: formData.format,
        hook: formData.hook || null,
        body: formData.body || null,
        cta: formData.cta || null,
        status: 'published',
        publish_date: new Date().toISOString(),
        original_template: formData.original_template || null,
        cover_image_url: formData.cover_image_url || null,
        result_views: formData.result_views || null,
        result_engagement: formData.result_engagement || null,
        result_conversions: formData.result_conversions || null,
        analysis: formData.analysis,
        created_by: userId,
        is_admin_case_study: true,
      }

      const { error } = await supabase.from('tasks').insert(caseStudy)

      if (error) throw error

      toast.success('Studija slučaja kreirana i objavljena')
      resetForm()
      if (onCaseStudyCreated) onCaseStudyCreated()
    } catch (error: any) {
      toast.error('Greška', {
        description: error.message,
      })
    }
  }

  const resetForm = () => {
    setIsCreating(false)
    setFormData({
      title: '',
      niche: NICHES[0].name,
      format: 'Kratka Forma',
      hook: '',
      body: '',
      cta: '',
      analysis: '',
      cover_image_url: '',
      result_views: '',
      result_engagement: '',
      result_conversions: '',
      original_template: '',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Kreiranje Studije Slučaja</h2>
          <p className="text-slate-400">Kreirajte i objavite studije slučaja za sve korisnike</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus size={16} /> Nova Studija Slučaja
        </Button>
      </div>

      {isCreating && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-white">Nova Studija Slučaja</CardTitle>
                <CardDescription className="text-slate-400">
                  Popunite sve potrebne informacije za studiju slučaja
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

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Hook</label>
              <RichTextEditor
                content={formData.hook}
                onChange={(html) => {
                  const tempDiv = document.createElement('div')
                  tempDiv.innerHTML = html
                  const plainText = tempDiv.textContent || tempDiv.innerText || ''
                  setFormData({ ...formData, hook: plainText })
                }}
                placeholder="Unesite hook..."
                minHeight="100px"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Body</label>
              <RichTextEditor
                content={formData.body}
                onChange={(html) => {
                  const tempDiv = document.createElement('div')
                  tempDiv.innerHTML = html
                  const plainText = tempDiv.textContent || tempDiv.innerText || ''
                  setFormData({ ...formData, body: plainText })
                }}
                placeholder="Unesite body..."
                minHeight="150px"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">CTA</label>
              <RichTextEditor
                content={formData.cta}
                onChange={(html) => {
                  const tempDiv = document.createElement('div')
                  tempDiv.innerHTML = html
                  const plainText = tempDiv.textContent || tempDiv.innerText || ''
                  setFormData({ ...formData, cta: plainText })
                }}
                placeholder="Unesite CTA..."
                minHeight="100px"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Detaljna Analiza</label>
              <RichTextEditor
                content={formData.analysis}
                onChange={(html) => {
                  const tempDiv = document.createElement('div')
                  tempDiv.innerHTML = html
                  const plainText = tempDiv.textContent || tempDiv.innerText || ''
                  setFormData({ ...formData, analysis: plainText })
                }}
                placeholder="Opišite detaljno zašto je ova objava bila uspešna..."
                minHeight="200px"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Pregledi</label>
                <Input
                  value={formData.result_views}
                  onChange={(e) => setFormData({ ...formData, result_views: e.target.value })}
                  placeholder="Npr. 1.2M"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Angažman</label>
                <Input
                  value={formData.result_engagement}
                  onChange={(e) => setFormData({ ...formData, result_engagement: e.target.value })}
                  placeholder="Npr. 85k lajkova"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Konverzije</label>
                <Input
                  value={formData.result_conversions}
                  onChange={(e) => setFormData({ ...formData, result_conversions: e.target.value })}
                  placeholder="Npr. 320 pretplatnika"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Cover Slika URL</label>
              <Input
                value={formData.cover_image_url}
                onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                placeholder="https://..."
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Originalni Šablon</label>
              <Input
                value={formData.original_template}
                onChange={(e) => setFormData({ ...formData, original_template: e.target.value })}
                placeholder="Naziv šablona"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save size={16} /> Kreiraj i Objavi
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Otkaži
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

