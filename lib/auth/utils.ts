/**
 * Server-side authentication utility functions
 * These functions use server-only APIs and cannot be imported in client components
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
 * Map authentication errors to Serbian translations
 * This function is client-safe and can be used in both client and server components
 */
export function mapAuthErrorToSerbian(errorMessage: string): string {
  const lowerMessage = errorMessage.toLowerCase();

  // Login errors
  if (
    lowerMessage.includes('invalid login credentials') ||
    lowerMessage.includes('invalid credentials') ||
    lowerMessage.includes('email or password is incorrect')
  ) {
    return 'Neispravni podaci za prijavu. Proverite email i lozinku.';
  }

  // Email errors
  if (
    lowerMessage.includes('email not confirmed') ||
    lowerMessage.includes('email not verified')
  ) {
    return 'Email nije potvrđen. Proverite svoju email poštu i kliknite na link za verifikaciju.';
  }

  if (
    lowerMessage.includes('email already registered') ||
    lowerMessage.includes('user already registered') ||
    lowerMessage.includes('email address is already registered')
  ) {
    return 'Email adresa je već registrovana. Pokušajte se prijaviti ili zatražite resetovanje lozinke.';
  }

  if (
    lowerMessage.includes('invalid email format') ||
    lowerMessage.includes('unable to validate email address: invalid format') ||
    lowerMessage.includes('email format is invalid')
  ) {
    return 'Neispravan format email adrese.';
  }

  // Password errors
  if (
    lowerMessage.includes('password should be at least') ||
    lowerMessage.includes('password must be at least') ||
    lowerMessage.includes('password is too short')
  ) {
    return 'Lozinka mora imati najmanje 6 karaktera.';
  }

  if (
    lowerMessage.includes('password is too weak') ||
    lowerMessage.includes('password does not meet requirements')
  ) {
    return 'Lozinka je previše slaba. Koristite jaču lozinku.';
  }

  // Token errors
  if (
    lowerMessage.includes('token has expired') ||
    lowerMessage.includes('token expired') ||
    lowerMessage.includes('expired token')
  ) {
    return 'Link je istekao. Molimo zatražite novi link.';
  }

  if (
    lowerMessage.includes('invalid token') ||
    lowerMessage.includes('token is invalid') ||
    lowerMessage.includes('invalid or expired')
  ) {
    return 'Neispravan ili istekao link. Molimo koristite novi link iz emaila.';
  }

  // Session errors
  if (
    lowerMessage.includes('session not found') ||
    lowerMessage.includes('no session found') ||
    lowerMessage.includes('session expired')
  ) {
    return 'Sesija je istekla. Molimo prijavite se ponovo.';
  }

  if (
    lowerMessage.includes('session creation failed') ||
    lowerMessage.includes('failed to create session')
  ) {
    return 'Neuspešno kreiranje sesije. Pokušajte ponovo.';
  }

  // Rate limiting
  if (
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('too many requests') ||
    lowerMessage.includes('for security purposes, you can only request this once every')
  ) {
    return 'Previše zahteva. Molimo sačekajte nekoliko trenutaka i pokušajte ponovo.';
  }

  // Network errors
  if (
    lowerMessage.includes('network error') ||
    lowerMessage.includes('connection error') ||
    lowerMessage.includes('fetch failed')
  ) {
    return 'Greška u konekciji. Proverite internet konekciju i pokušajte ponovo.';
  }

  // User not found
  if (
    lowerMessage.includes('user not found') ||
    lowerMessage.includes('no user found')
  ) {
    return 'Korisnik sa ovim emailom ne postoji.';
  }

  // Password reset errors
  if (
    lowerMessage.includes('password reset link expired') ||
    lowerMessage.includes('reset link expired')
  ) {
    return 'Link za resetovanje lozinke je istekao. Zatražite novi link.';
  }

  if (
    lowerMessage.includes('password reset failed') ||
    lowerMessage.includes('unable to reset password')
  ) {
    return 'Neuspešno resetovanje lozinke. Pokušajte ponovo.';
  }

  // OAuth errors
  if (lowerMessage.includes('oauth')) {
    return 'Greška pri prijavljivanju preko društvenih mreža. Pokušajte ponovo.';
  }

  // Generic Supabase errors
  if (lowerMessage.includes('supabase')) {
    return 'Greška u autentifikaciji. Pokušajte ponovo.';
  }

  // If no specific match, return the original message (might already be in Serbian)
  // or a generic error message
  return errorMessage;
}

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
