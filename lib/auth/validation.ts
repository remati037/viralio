/**
 * Client-safe validation utilities
 * These functions can be used in both client and server components
 */

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
