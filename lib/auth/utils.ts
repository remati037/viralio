/**
 * Server-side authentication utility functions
 * These functions use server-only APIs and cannot be imported in client components
 */

import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import { mapAuthErrorToSerbian } from './error-messages';

/**
 * Get the current authenticated user (server-side)
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Get the redirect URL for auth callbacks
 */
export function getAuthRedirectUrl(origin: string, path: string = '/auth/callback'): string {
  return `${origin}${path}`;
}

// mapAuthErrorToSerbian is now exported from './error-messages' to avoid server/client import issues

/**
 * Parse auth error from Supabase error and translate to Serbian
 */
export function parseAuthError(error: any): string {
  // If error is already a string, try to map it
  if (typeof error === 'string') {
    return mapAuthErrorToSerbian(error);
  }

  // If error has a message property, map it
  if (error?.message) {
    return mapAuthErrorToSerbian(error.message);
  }

  // If error has a status or code, we might want to handle specific codes
  if (error?.status) {
    switch (error.status) {
      case 400:
        return 'Neispravan zahtev. Proverite unete podatke.';
      case 401:
        return 'Neispravni podaci za prijavu.';
      case 403:
        return 'Nemate dozvolu za ovu akciju.';
      case 404:
        return 'Korisnik nije pronađen.';
      case 429:
        return 'Previše zahteva. Molimo sačekajte i pokušajte ponovo.';
      case 500:
        return 'Greška na serveru. Pokušajte ponovo kasnije.';
      default:
        return 'Došlo je do greške. Pokušajte ponovo.';
    }
  }

  // Default fallback
  return 'Došlo je do greške. Pokušajte ponovo.';
}
