'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserId } from '@/components/UserContext';
import { useProfile } from '@/lib/hooks/useProfile';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  ClipboardList,
  Kanban,
  Layout,
  Shield,
  Sparkles,
  Tag,
} from 'lucide-react';
import Link from 'next/link';

type NavCard = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: { label: string; className?: string };
};

const MAIN_CARDS: NavCard[] = [
  {
    href: '/planner',
    title: 'Planer sadržaja',
    description:
      'Organizujte ideje, zadatke i kalendar objava na jednom mestu.',
    icon: Layout,
  },
  {
    href: '/competitors',
    title: 'Konkurenti',
    description: 'Pratite konkurenciju i nadahnite se njihovim sadržajem.',
    icon: Kanban,
  },
  {
    href: '/casestudy',
    title: 'Studije slučaja',
    description:
      'Pregledajte studije slučaja i najbolje prakse za vaš sadržaj.',
    icon: ClipboardList,
  },
  {
    href: '/statistics',
    title: 'Statistika',
    description: 'Pratite performanse i napredak vašeg sadržaja.',
    icon: BarChart3,
  },
  {
    href: '/ai-credits',
    title: 'AI Krediti',
    description: 'Koristite AI asistenta za ideje i optimizaciju sadržaja.',
    icon: Sparkles,
    tag: { label: 'NOVO', className: 'bg-primary text-primary-foreground' },
  },
  {
    href: '/categories',
    title: 'Kategorije',
    description: 'Upravljajte kategorijama za organizaciju zadataka i ideja.',
    icon: Tag,
  },
];

function NavCardLink({ card }: { card: NavCard }) {
  const Icon = card.icon;
  return (
    <Link href={card.href} className="block h-full group">
      <Card
        className={cn(
          'h-full transition-all duration-200',
          'hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5',
          'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background'
        )}
      >
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base leading-tight">
                {card.title}
              </CardTitle>
              {card.tag && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    card.tag.className
                  )}
                >
                  {card.tag.label}
                </span>
              )}
            </div>
          </div>
          <span
            className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
            aria-hidden
          >
            →
          </span>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {card.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function PocetnaLoader() {
  return (
    <div
      className="flex items-center justify-center py-16"
      aria-busy="true"
      aria-label="Učitavanje"
    >
      <div
        className="h-5 w-5 rounded-full border-2 border-muted border-t-primary motion-safe:animate-spin-smooth"
        aria-hidden
      />
    </div>
  );
}

export default function PocetnaPage() {
  const userId = useUserId();
  const { profile } = useProfile(userId);
  const { roleInfo } = useUserRole(userId);

  // Show loader until we have profile data. Hooks start with loading=false for
  // hydration, so we must gate on data presence to avoid flashing empty content on refresh.
  if (profile === null) {
    return (
      <div className="space-y-8">
        <section>
          <PocetnaLoader />
        </section>
      </div>
    );
  }

  const showAdmin = roleInfo?.isAdmin ?? false;
  const displayName = profile?.business_name?.trim() || null;
  const cards = showAdmin
    ? [
        ...MAIN_CARDS,
        {
          href: '/admin',
          title: 'Admin',
          description: 'Upravljanje korisnicima i sadržajem platforme.',
          icon: Shield,
        } as NavCard,
      ]
    : MAIN_CARDS;

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          Zdravo{displayName ? `, ${displayName}` : ''}
        </h1>
        <p className="mt-2 text-primary-background max-w-2xl">
          Viralio će ti pomoći da kreiraš i organizuješ svoj sadržaj na
          društvenim mrežama.
        </p>
      </section>

      {/* Card grid */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <NavCardLink key={card.href} card={card} />
          ))}
        </div>
      </section>

      {/* Footer link - optional welcome video */}
      {/* <footer className="pt-4 border-t border-border">
        <Link
          href="#"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <span aria-hidden>🎥</span>
          Video dobrodošlice
        </Link>
      </footer> */}
    </div>
  );
}
