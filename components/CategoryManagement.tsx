'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Plus, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { TaskCategory } from './ui/category-select';

const cardBase =
  'bg-gradient-to-b from-background to-muted border border-border rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20';

interface CategoryManagementProps {
  userId: string;
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
];

export default function CategoryManagement({
  userId,
}: CategoryManagementProps) {
  const supabase = createClient();
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, [userId]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCategories((data || []) as TaskCategory[]);
    } catch (error: any) {
      toast.error('Greška pri učitavanju kategorija', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Ime kategorije je obavezno');
      return;
    }

    if (categories.length >= 20) {
      toast.error('Maksimalan broj kategorija je 20');
      return;
    }

    // Check for duplicate name
    if (
      categories.some(
        (cat) =>
          cat.name.toLowerCase() === newCategoryName.trim().toLowerCase(),
      )
    ) {
      toast.error('Kategorija sa tim imenom već postoji');
      return;
    }

    setIsAdding(true);
    try {
      // Get a random color from predefined colors
      const color =
        PREDEFINED_COLORS[Math.floor(Math.random() * PREDEFINED_COLORS.length)];

      const { data, error } = await supabase
        .from('task_categories')
        .insert({
          user_id: userId,
          name: newCategoryName.trim(),
          color,
        })
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data as TaskCategory]);
      setNewCategoryName('');
      toast.success('Kategorija dodata', {
        description: `Kategorija "${data.name}" je uspešno dodata.`,
      });
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation
        toast.error('Kategorija sa tim imenom već postoji');
      } else {
        toast.error('Greška pri dodavanju kategorije', {
          description: error.message,
        });
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('task_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(categories.filter((cat) => cat.id !== categoryId));
      toast.success('Kategorija obrisana');
    } catch (error: any) {
      toast.error('Greška pri brisanju kategorije', {
        description: error.message,
      });
    }
  };

  const handleUpdateCategory = async (categoryId: string, newName: string) => {
    if (!newName.trim()) {
      toast.error('Ime kategorije je obavezno');
      return;
    }

    // Check for duplicate name (excluding current category)
    if (
      categories.some(
        (cat) =>
          cat.id !== categoryId &&
          cat.name.toLowerCase() === newName.trim().toLowerCase(),
      )
    ) {
      toast.error('Kategorija sa tim imenom već postoji');
      return;
    }

    try {
      const { error } = await supabase
        .from('task_categories')
        .update({ name: newName.trim() })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(
        categories.map((cat) =>
          cat.id === categoryId ? { ...cat, name: newName.trim() } : cat,
        ),
      );
      setEditingId(null);
      setEditingName('');
      toast.success('Kategorija ažurirana');
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Kategorija sa tim imenom već postoji');
      } else {
        toast.error('Greška pri ažuriranju kategorije', {
          description: error.message,
        });
      }
    }
  };

  const handleColorChange = async (categoryId: string, newColor: string) => {
    try {
      const { error } = await supabase
        .from('task_categories')
        .update({ color: newColor })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(
        categories.map((cat) =>
          cat.id === categoryId ? { ...cat, color: newColor } : cat,
        ),
      );
    } catch (error: any) {
      toast.error('Greška pri promeni boje', {
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <Card className={cardBase}>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">
            Učitavanje kategorija...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Right column on desktop, top on mobile: Add new category */}
      <Card className={`${cardBase} lg:sticky lg:top-4 order-1 lg:order-2`}>
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col gap-3">
            <Input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCategory();
                }
              }}
              placeholder="Naziv nove kategorije"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
              disabled={isAdding || categories.length >= 20}
            />
            <Button
              onClick={handleAddCategory}
              disabled={
                isAdding || categories.length >= 20 || !newCategoryName.trim()
              }
              className="w-full"
            >
              <Plus size={16} />
              Dodaj kategoriju
            </Button>
          </div>

          {categories.length >= 20 && (
            <p className="text-sm text-chart-5 mt-3">
              Dostigli ste maksimalan broj kategorija (20)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Left column on desktop, below on mobile: Categories list */}
      <Card className={`${cardBase} order-2 lg:order-1`}>
        <CardContent className="p-4 md:p-5">
          {categories.length === 0 ? (
            <div className="text-center py-10 rounded-xl border-2 border-dashed border-border bg-muted/30">
              <Tag size={36} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nemate kategorija. Dodajte prvu kategoriju.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (editingId !== category.id) {
                      setEditingId(category.id);
                      setEditingName(category.name);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (editingId !== category.id && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      setEditingId(category.id);
                      setEditingName(category.name);
                    }
                  }}
                  className="group bg-muted/50 border border-border rounded-lg py-2.5 px-3.5 flex items-center gap-2 hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
                >
                  {editingId === category.id ? (
                    <>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateCategory(category.id, editingName);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditingName('');
                          }
                        }}
                        className="bg-background border border-border rounded-md px-2 py-1 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[100px]"
                        autoFocus
                      />
                      <button
                        onClick={() =>
                          handleUpdateCategory(category.id, editingName)
                        }
                        className="text-chart-2 hover:text-chart-2/80 text-lg transition-colors"
                        aria-label="Sačuvaj"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingName('');
                        }}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                        aria-label="Otkaži"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        className="w-3 h-3 rounded-full cursor-pointer shrink-0 border border-border shadow-sm"
                        style={{ backgroundColor: category.color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentIndex = PREDEFINED_COLORS.indexOf(
                            category.color,
                          );
                          const nextIndex =
                            (currentIndex + 1) % PREDEFINED_COLORS.length;
                          handleColorChange(
                            category.id,
                            PREDEFINED_COLORS[nextIndex],
                          );
                        }}
                        title="Kliknite za promenu boje"
                      />
                      <span className="text-foreground leading-6 text-sm font-medium flex-1">
                        {category.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-all ml-auto"
                        title="Obriši kategoriju"
                        aria-label="Obriši kategoriju"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
