/**
 * @deprecated Use getCurrentUser from '@/lib/auth/utils' instead
 * This file is kept for backward compatibility
 */

import { getCurrentUser as getCurrentUserFromAuth } from '@/lib/auth/utils';
import { signOutAction } from '@/lib/auth/actions';

/**
 * Get the current authenticated user (server-side)
 * @deprecated Use getCurrentUser from '@/lib/auth/utils' instead
 */
export async function getUser() {
  return getCurrentUserFromAuth();
}

/**
 * Sign out the current user
 * @deprecated Use signOutAction from '@/lib/auth/actions' instead
 */
export async function signOut() {
  const result = await signOutAction();
  if (result.error) {
    throw new Error(result.error);
  }
}

