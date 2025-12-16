import { createClient } from '@/lib/supabase/server';

export async function getUser() {
  const supabase = await createClient()

  // The middleware proxy handles token refresh automatically
  // We can safely use getUser() here as the proxy ensures tokens are valid
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

