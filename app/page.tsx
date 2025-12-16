import ViralVaultApp from '@/components/ViralVaultApp';
import { getUser } from '@/lib/utils/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  // The middleware proxy has already refreshed the session
  // So we can safely check for user here
  const user = await getUser()

  if (!user) {
    // If no user, redirect to login
    // This should only happen if cookies aren't set or session is invalid
    redirect('/login')
  }

  return <ViralVaultApp userId={user.id} />
}
