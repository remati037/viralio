'use client'

import { createClient } from '@/lib/supabase/client'
import { Plus, X, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { TaskCategory } from './ui/category-select'

interface CategoryManagementProps {
  userId: string
}

const PREDEFINED_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#10b981', // green
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
]

export default function CategoryManagement({ userId }: CategoryManagementProps) {
  const supabase = createClient()
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [userId])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setCategories((data || []) as TaskCategory[])
    } catch (error: any) {
      toast.error('Greška pri učitavanju kategorija', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Ime kategorije je obavezno')
      return
    }

    if (categories.length >= 20) {
      toast.error('Maksimalan broj kategorija je 20')
      return
    }

    // Check for duplicate name
    if (categories.some((cat) => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast.error('Kategorija sa tim imenom već postoji')
      return
    }

    setIsAdding(true)
    try {
      // Get a random color from predefined colors
      const color = PREDEFINED_COLORS[Math.floor(Math.random() * PREDEFINED_COLORS.length)]

      const { data, error } = await supabase
        .from('task_categories')
        .insert({
          user_id: userId,
          name: newCategoryName.trim(),
          color,
        })
        .select()
        .single()

      if (error) throw error

      setCategories([...categories, data as TaskCategory])
      setNewCategoryName('')
      toast.success('Kategorija dodata', {
        description: `Kategorija "${data.name}" je uspešno dodata.`,
      })
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation
        toast.error('Kategorija sa tim imenom već postoji')
      } else {
        toast.error('Greška pri dodavanju kategorije', {
          description: error.message,
        })
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase.from('task_categories').delete().eq('id', categoryId)

      if (error) throw error

      setCategories(categories.filter((cat) => cat.id !== categoryId))
      toast.success('Kategorija obrisana')
    } catch (error: any) {
      toast.error('Greška pri brisanju kategorije', {
        description: error.message,
      })
    }
  }

  const handleUpdateCategory = async (categoryId: string, newName: string) => {
    if (!newName.trim()) {
      toast.error('Ime kategorije je obavezno')
      return
    }

    // Check for duplicate name (excluding current category)
    if (
      categories.some(
        (cat) => cat.id !== categoryId && cat.name.toLowerCase() === newName.trim().toLowerCase()
      )
    ) {
      toast.error('Kategorija sa tim imenom već postoji')
      return
    }

    try {
      const { error } = await supabase
        .from('task_categories')
        .update({ name: newName.trim() })
        .eq('id', categoryId)

      if (error) throw error

      setCategories(
        categories.map((cat) => (cat.id === categoryId ? { ...cat, name: newName.trim() } : cat))
      )
      setEditingId(null)
      setEditingName('')
      toast.success('Kategorija ažurirana')
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Kategorija sa tim imenom već postoji')
      } else {
        toast.error('Greška pri ažuriranju kategorije', {
          description: error.message,
        })
      }
    }
  }

  const handleColorChange = async (categoryId: string, newColor: string) => {
    try {
      const { error } = await supabase
        .from('task_categories')
        .update({ color: newColor })
        .eq('id', categoryId)

      if (error) throw error

      setCategories(
        categories.map((cat) => (cat.id === categoryId ? { ...cat, color: newColor } : cat))
      )
    } catch (error: any) {
      toast.error('Greška pri promeni boje', {
        description: error.message,
      })
    }
  }

  if (loading) {
    return <div className="text-slate-400">Učitavanje kategorija...</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Tag size={20} className="text-blue-400" />
          Kategorije Zadataka
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Organizujte svoje zadatke pomoću kategorija. Maksimalno 20 kategorija.
        </p>
      </div>

      {/* Add new category */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddCategory()
            }
          }}
          placeholder="Naziv nove kategorije"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isAdding || categories.length >= 20}
        />
        <button
          onClick={handleAddCategory}
          disabled={isAdding || categories.length >= 20 || !newCategoryName.trim()}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:bg-slate-700 disabled:text-slate-500 flex items-center gap-2"
        >
          <Plus size={16} />
          Dodaj
        </button>
      </div>

      {categories.length >= 20 && (
        <p className="text-sm text-yellow-400">Dostigli ste maksimalan broj kategorija (20)</p>
      )}

      {/* Categories list */}
      <div className="space-y-2">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-800 rounded-lg">
            <Tag size={32} className="mx-auto mb-2 opacity-50" />
            <p>Nemate kategorija. Dodajte prvu kategoriju iznad.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="group bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center gap-2 hover:border-slate-600 transition-colors"
              >
                {editingId === category.id ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateCategory(category.id, editingName)
                        } else if (e.key === 'Escape') {
                          setEditingId(null)
                          setEditingName('')
                        }
                      }}
                      className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateCategory(category.id, editingName)}
                      className="text-green-400 hover:text-green-300"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null)
                        setEditingName('')
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      className="w-4 h-4 rounded-full cursor-pointer"
                      style={{ backgroundColor: category.color }}
                      onClick={() => {
                        // Cycle through colors
                        const currentIndex = PREDEFINED_COLORS.indexOf(category.color)
                        const nextIndex = (currentIndex + 1) % PREDEFINED_COLORS.length
                        handleColorChange(category.id, PREDEFINED_COLORS[nextIndex])
                      }}
                      title="Kliknite za promenu boje"
                    />
                    <span
                      className="text-white cursor-pointer"
                      onClick={() => {
                        setEditingId(category.id)
                        setEditingName(category.name)
                      }}
                    >
                      {category.name}
                    </span>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity ml-1"
                      title="Obriši kategoriju"
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

