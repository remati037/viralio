import {
  TrendingUp,
  Home,
  Dumbbell,
  ShoppingBag,
  Instagram,
  Youtube,
  Facebook,
  Move,
} from 'lucide-react'
import type { Niche, Network, ViralTemplate } from '@/types'

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

export const VIRAL_TEMPLATES: Record<string, ViralTemplate[]> = {
  marketing: [
    {
      id: 'm1',
      title: 'Mit vs. Istina (30s Reel)',
      format: 'Kratka Forma',
      difficulty: 'Lako',
      views_potential: 'Visok',
      why_it_works:
        'Ljudi vole da čuju da su većina "gurua" u krivu. Ovo gradi tvoj autoritet kroz kontroverzu.',
      structure: {
        hook: 'Svi vam govore da morate da radite [TOPIC], ali to je najveća laž u marketingu.',
        body: 'Istina je zapravo suprotna. Dok se svi fokusiraju na [TOPIC], pametni igrači rade ovo: [RESENJE].',
        cta: 'Ako želiš da saznaš strategiju koja zapravo radi, pročitaj opis.',
      },
      vlads_tip: 'Snimaj ovo u krupnom planu (talking head). Govori malo tiše nego obično, kao da odaješ tajnu.',
    },
    {
      id: 'm2',
      title: 'Iza Scene: Brojke (YouTube Video)',
      format: 'Duga Forma',
      difficulty: 'Srednje',
      views_potential: 'Veoma visok',
      why_it_works:
        'Transparentnost gradi ogromno poverenje. Ljudi su voajeri, vole da vide tuđi novčanik/rezultate.',
      structure: {
        hook: 'Evo tačno koliko sam zaradio/potrošio na [TOPIC] u poslednjih 30 dana.',
        body: 'Nije sve išlo glatko. Prva nedelja je bila katastrofa, ali onda se desilo ovo...',
        cta: 'Lajkuj, komentariši i pretplati se za nedeljne izveštaje.',
      },
      vlads_tip: 'Prikaži ekran (screen recording) dok pričaš. Dokaz je jači od priče.',
    },
  ],
  realestate: [
    {
      id: 'r1',
      title: 'Tura luksuza (Reel / TikTok)',
      format: 'Kratka Forma',
      difficulty: 'Srednje',
      views_potential: 'Viralno',
      why_it_works:
        'ASMR za oči. Brzi rezovi drže pažnju (retention), a luksuz izaziva aspiraciju.',
      structure: {
        hook: 'Ovo je šta [CENA] evra kupuje danas u [TOPIC].',
        body: 'Pogledajte ovu terasu... a tek kupatilo. Ali čekajte da vidite glavnu spavaću sobu.',
        cta: 'Da li biste živeli ovde? Pišite u komentarima.',
      },
      vlads_tip: 'Prve 3 sekunde moraju imati 6 kadrova. Muzika mora da bude u beatu sa rezovima.',
    },
  ],
  fitness: [
    {
      id: 'f1',
      title: 'Jedna Promena (30s Reel)',
      format: 'Kratka Forma',
      difficulty: 'Lako',
      views_potential: 'Srednje',
      why_it_works: 'Ljudima je dosta komplikovanih dijeta. Žele "magic bullet" rešenje.',
      structure: {
        hook: 'Prestao sam da radim [TOPIC] i salo je počelo samo da se topi.',
        body: 'Mislio sam da je to ključno, ali zapravo mi je samo dizalo kortizol. Umesto toga...',
        cta: 'Probaj ovo 7 dana i javi mi rezultate.',
      },
      vlads_tip: 'Pokaži sliku "Pre i Posle" u prve 2 sekunde videa.',
    },
  ],
  ecommerce: [
    {
      id: 'e1',
      title: 'Proizvod u akciji (ASMR Reel)',
      format: 'Kratka Forma',
      difficulty: 'Srednje',
      views_potential: 'Visok',
      why_it_works:
        'Zadovoljavajući vizuelni sadržaj. Ne prodaješ proizvod, prodaješ osećaj korišćenja.',
      structure: {
        hook: '(Bez reči, samo zvuk otvaranja/korišćenja [TOPIC])',
        body: 'Gledaj kako lako rešava problem. Nema više nereda, nema više stresa.',
        cta: 'Link je u opisu profila.',
      },
      vlads_tip: 'Zvuk je ovde 50% videa. Koristi dobar mikrofon blizu proizvoda.',
    },
  ],
}

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

