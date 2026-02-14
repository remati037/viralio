'use client';

import CategoryManagement from '@/components/CategoryManagement';
import Loader from '@/components/ui/loader';
import { useUserId } from '@/components/UserContext';

export default function CategoriesPage() {
  const userId = useUserId();

  if (!userId) {
    return <Loader fullScreen text="Učitavanje..." />;
  }

  return (
    <div className="space-y-6 md:space-y-8 min-w-0">
      <header>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            Kategorije
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Organizuj svoje skripte pomoću kategorija. Maksimalno 20 kategorija.
          </p>
        </div>
      </header>
      <CategoryManagement userId={userId} />
    </div>
  );
}
