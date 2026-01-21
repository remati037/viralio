/**
 * Authentication utility functions
 */

import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

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

/**
 * Parse auth error from Supabase error
 */
export function parseAuthError(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'Došlo je do greške. Pokušajte ponovo.';
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'Lozinka mora imati najmanje 6 karaktera' };
  }
  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
