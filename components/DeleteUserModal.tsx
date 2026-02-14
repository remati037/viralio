'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import Modal, { modalCancelButtonClass } from './ui/modal';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserDeleted: () => void;
  user: {
    id: string;
    email?: string;
    business_name?: string;
  } | null;
}

export default function DeleteUserModal({
  isOpen,
  onClose,
  onUserDeleted,
  user,
}: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const userDisplayName =
    user.business_name || user.email || user.id.substring(0, 8);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      toast.success('Korisnik obrisan', {
        description: `Korisnik ${userDisplayName} je uspešno obrisan.`,
      });

      onUserDeleted();
      onClose();
    } catch (error: any) {
      toast.error('Greška pri brisanju korisnika', {
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
      title="Obriši Korisnika"
      description="Ova akcija je nepovratna"
      disableClose={loading}
    >
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">
            Da li ste sigurni da želite da obrišete korisnika{' '}
            <strong>{userDisplayName}</strong>?
          </p>
          <p className="text-red-600 text-xs mt-2">
            Svi podaci korisnika, zadaci, statistike i plaćanja će biti trajno
            obrisani.
          </p>
        </div>

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
            type="button"
            onClick={handleDelete}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            disabled={loading}
          >
            {loading ? 'Brisanje...' : 'Obriši Korisnika'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
