'use client';

import type { Profile, SocialLink } from '@/types';
import { DollarSign, User } from 'lucide-react';
import { useState } from 'react';
import ProfilePayments from './ProfilePayments';
import ProfileSettingsForm from './ProfileSettingsForm';

interface ProfileSettingsProps {
  profile: Profile | null;
  onSave: (
    profile: Partial<Profile> & { social_links?: SocialLink[] }
  ) => Promise<void>;
}

export default function ProfileSettings({
  profile,
  onSave,
}: ProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'payment'>('profile');

  return (
    <div className="max-w-4xl mx-auto bg-slate-900/50 p-5 lg:p-10 rounded-lg border border-slate-800 shadow-xl">
      <h1 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
        <User className="text-blue-400" size={24} />
        Postavke profila
      </h1>

      {/* Tabs */}
      <div className="flex gap-y-2 gap-x-0 mb-6 border-b border-slate-700 flex-wrap justify-center">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'profile'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Profil
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'payment'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign size={16} /> Plaćanje
        </button>
      </div>

      {activeTab === 'payment' && <ProfilePayments profile={profile} />}
      {activeTab === 'profile' && (
        <ProfileSettingsForm profile={profile} onSave={onSave} />
      )}
    </div>
  );
}
