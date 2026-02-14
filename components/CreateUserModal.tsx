'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Modal, {
  modalCancelButtonClass,
  modalInputClass,
  modalPrimaryButtonClass,
} from './ui/modal';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onUserCreated,
}: CreateUserModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [hasUnlimitedFree, setHasUnlimitedFree] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          businessName,
          hasUnlimitedFree,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast.success('Korisnik kreiran!', {
        description: `Korisnik ${email} je uspešno kreiran. ${data.user ? 'Email za verifikaciju bi trebalo da bude poslat.' : 'Proverite Supabase email podešavanja ako email nije poslat.'}`,
      });

      // Reset form
      setEmail('');
      setPassword('');
      setBusinessName('');
      setHasUnlimitedFree(false);

      onUserCreated();
      onClose();
    } catch (error: any) {
      toast.error('Greška pri kreiranju korisnika', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kreiraj Novog Korisnika"
      description="Korisnik će dobiti email za verifikaciju"
      disableClose={loading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email *
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={modalInputClass}
            placeholder="korisnik@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Lozinka *
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className={modalInputClass}
            placeholder="Minimum 6 karaktera"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Ime Biznisa
          </label>
          <Input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className={modalInputClass}
            placeholder="Ime biznisa (opciono)"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="unlimitedFree"
            checked={hasUnlimitedFree}
            onChange={(e) => setHasUnlimitedFree(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-slate-400"
          />
          <label
            htmlFor="unlimitedFree"
            className="text-sm font-medium text-slate-700 cursor-pointer"
          >
            Dodaj neograničenu besplatnu PRO pretplatu
          </label>
        </div>

        {!hasUnlimitedFree && (
          <p className="text-xs text-slate-500">
            Ako ne označite ovo, korisnik će dobiti 7 dana besplatnog probnog
            perioda, nakon čega će biti upitan da se pretplati preko Stripe-a.
          </p>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={`flex-1 ${modalCancelButtonClass}`}
            disabled={loading}
          >
            Otkaži
          </Button>
          <Button
            type="submit"
            className={`flex-1 ${modalPrimaryButtonClass}`}
            disabled={loading}
          >
            {loading ? 'Kreiranje...' : 'Kreiraj Korisnika'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
