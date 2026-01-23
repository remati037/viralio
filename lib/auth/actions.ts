/**
 * Server actions for authentication
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { SetPasswordData, SignInData, SignUpData } from './types';
import { parseAuthError } from './utils';

/**
 * Sign up a new user
 */
export async function signUpAction(data: SignUpData) {
  try {
    const supabase = await createClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          business_name: data.businessName.trim(),
        },
      },
    });

    if (signUpError) {
      return { error: parseAuthError(signUpError), user: null };
    }

    // Update profile with business name immediately after signup
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          business_name: data.businessName.trim(),
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Greška pri ažuriranju profila:', profileError);
        // Don't fail signup if profile update fails, but log it
      }
    }

    return { error: null, user: authData.user };
  } catch (error) {
    return { error: parseAuthError(error), user: null };
  }
}

/**
 * Sign in an existing user
 */
export async function signInAction(data: SignInData) {
  try {
    const supabase = await createClient();

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      return { error: parseAuthError(signInError), session: null };
    }

    if (!authData.session) {
      return { error: 'Neuspešno kreiranje sesije. Pokušajte ponovo.', session: null };
    }

    return { error: null, session: authData.session };
  } catch (error) {
    return { error: parseAuthError(error), session: null };
  }
}

/**
 * Sign out the current user
 */
export async function signOutAction() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: parseAuthError(error) };
    }

    return { error: null };
  } catch (error) {
    return { error: parseAuthError(error) };
  }
}

/**
 * Request password reset email
 * Only sends email if user exists in database
 */
export async function requestPasswordResetAction(email: string) {
  try {
    const supabase = await createClient();
    
    // First, check if user exists
    const { data: userExists, error: checkError } = await supabase
      .rpc('check_user_exists_by_email', { user_email: email });

    if (checkError) {
      console.error('Error checking user existence:', checkError);
      // If function doesn't exist or there's an error, proceed with reset
      // (fallback behavior for backwards compatibility)
    } else if (userExists === false) {
      // User doesn't exist
      return { error: 'Korisnik sa ovim emailom ne postoji u bazi podataka.' };
    }

    // User exists, proceed with password reset
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback`,
    });

    if (resetError) {
      return { error: parseAuthError(resetError) };
    }

    return { error: null };
  } catch (error) {
    return { error: parseAuthError(error) };
  }
}

/**
 * Update user password (for password reset or initial setup)
 */
export async function updatePasswordAction(data: SetPasswordData) {
  try {
    const supabase = await createClient();

    // Verify we have a valid session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { error: 'Nedostaje sesija. Molimo koristite link iz emaila.' };
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (updateError) {
      return { error: parseAuthError(updateError) };
    }

    // Verify session is still valid after password update
    const {
      data: { session: updatedSession },
    } = await supabase.auth.getSession();

    if (!updatedSession) {
      // Try to refresh session
      const {
        data: { session: refreshedSession },
      } = await supabase.auth.refreshSession();

      if (!refreshedSession) {
        return { error: 'Neuspešno kreiranje sesije. Molimo pokušajte ponovo.' };
      }
    }

    return { error: null };
  } catch (error) {
    return { error: parseAuthError(error) };
  }
}
