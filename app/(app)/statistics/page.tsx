'use client';

import UserStatisticsComponent from '@/components/UserStatistics';
import Loader from '@/components/ui/loader';
import { useUserId } from '@/components/UserContext';
import { BarChart3 } from 'lucide-react';

export default function StatisticsPage() {
  const userId = useUserId();

  if (!userId) {
    return <Loader fullScreen text="Učitavanje..." />;
  }

  return (
    <>
      <header className="mb-4 md:mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="text-blue-400" size={28} />
            Statistika
          </h1>
          <p className="text-slate-400 text-sm text-balance">
            Pregled vaših performansi i rezultata objavljenog sadržaja
          </p>
        </div>
      </header>
      <UserStatisticsComponent userId={userId} />
    </>
  );
}

