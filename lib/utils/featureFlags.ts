/**
 * Feature flag: when true, Duga forma (long form) is temporarily hidden.
 * Set NEXT_PUBLIC_HIDE_LONG_FORM=true in .env.local to enable.
 */
export function isLongFormHidden(): boolean {
  return process.env.NEXT_PUBLIC_HIDE_LONG_FORM === 'true';
}
