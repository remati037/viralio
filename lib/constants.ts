import type { Network, Niche } from '@/types'
import {
  Dumbbell,
  Facebook,
  Home,
  Instagram,
  Move,
  ShoppingBag,
  TrendingUp,
  Youtube,
} from 'lucide-react'

export const NICHES: Niche[] = [
  { id: 'marketing', name: 'Marketing & Biznis', icon: TrendingUp, color: 'text-blue-500' },
  { id: 'realestate', name: 'Nekretnine', icon: Home, color: 'text-emerald-500' },
  { id: 'fitness', name: 'Fitness & Zdravlje', icon: Dumbbell, color: 'text-rose-500' },
  { id: 'ecommerce', name: 'E-commerce', icon: ShoppingBag, color: 'text-purple-500' },
]

export const NETWORKS: Network[] = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-rose-500' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-600' },
  { id: 'tiktok', name: 'TikTok', icon: Move, color: 'text-slate-800' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-700' },
]

export const KANBAN_COLUMNS = [
  {
    id: 'idea',
    title: '💡 Ideja',
    color: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500',
  },
  {
    id: 'ready',
    title: '🎬 Spremno za snimanje',
    color: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
  },
  {
    id: 'scheduled',
    title: '📅 Zakazano',
    color: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
  },
  {
    id: 'published',
    title: '✅ Objavljeno',
    color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
  },
]

export const BUSINESS_CATEGORIES = [
  { value: 'marketing', label: 'Marketing & Reklama' },
  { value: 'ecommerce', label: 'E-commerce & Online Prodaja' },
  { value: 'fitness', label: 'Fitness & Zdravlje' },
  { value: 'realestate', label: 'Nekretnine' },
  { value: 'education', label: 'Edukacija & Online Kursevi' },
  { value: 'coaching', label: 'Kočing & Konsalting' },
  { value: 'restaurant', label: 'Restorani & Hrana' },
  { value: 'beauty', label: 'Kozmetika & Lepota' },
  { value: 'technology', label: 'Tehnologija & SaaS' },
  { value: 'finance', label: 'Finansije & Investiranje' },
  { value: 'travel', label: 'Putovanja & Turizam' },
  { value: 'fashion', label: 'Moda & Stil' },
  { value: 'entertainment', label: 'Zabava & Mediji' },
  { value: 'automotive', label: 'Automobili & Transport' },
  { value: 'home', label: 'Dom & Enterijer' },
  { value: 'sports', label: 'Sport & Rekreacija' },
  { value: 'healthcare', label: 'Zdravstvena Zaštita' },
  { value: 'legal', label: 'Pravne Usluge' },
  { value: 'other', label: 'Ostalo' },
]

