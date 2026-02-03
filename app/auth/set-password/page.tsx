import AuthLayout from '@/components/auth/AuthLayout';
import SetPasswordForm from '@/components/auth/SetPasswordForm';
import { parseAuthError } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Postavite lozinku',
  description: 'Postavite lozinku za svoj Viralio nalog',
  robots: {
    index: false,
    follow: false,
  },
};

function SetPasswordFormSkeleton() {
  return (
    <>
      <div className="mb-8 text-center">
        <div className="h-8 bg-slate-800 rounded-lg animate-pulse mb-2 w-32 mx-auto"></div>
        <div className="h-4 bg-slate-800 rounded-lg animate-pulse w-48 mx-auto"></div>
      </div>
      <div className="space-y-4">
        <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
        <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
        <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
      </div>
    </>
  );
}

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; type?: string; error?: string }>;
}) {
  const params = await searchParams;
  const code = params.code;
  const type = params.type;
  const errorParam = params.error;

  // If we have a code, exchange it for a session server-side
  // This ensures cookies are properly set
  if (code) {
    const supabase = await createClient();

    try {
      // First check if we already have a valid session
      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession();

      // If we already have a session and it's a recovery/invite flow, just clean up the URL
      if (existingSession && (type === 'recovery' || type === 'invite')) {
        redirect('/auth/set-password' + (type ? `?type=${type}` : ''));
      }

      // If we have a session but it's not recovery/invite, redirect to planner
      if (existingSession && type !== 'recovery' && type !== 'invite') {
        redirect('/planner');
      }

      // Exchange code for session
      const { data: sessionData, error } =
        await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        // Redirect with error - client will handle displaying it
        const errorParams = new URLSearchParams();
        errorParams.set('error', parseAuthError(error));
        if (type) {
          errorParams.set('type', type);
        }
        redirect(`/auth/set-password?${errorParams.toString()}`);
      }

      // Verify session was created
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Session not created - redirect with error
        const errorParams = new URLSearchParams();
        errorParams.set(
          'error',
          'Neuspešno kreiranje sesije. Molimo zatražite novi link.'
        );
        if (type) {
          errorParams.set('type', type);
        }
        redirect(`/auth/set-password?${errorParams.toString()}`);
      }

      // If this is not a recovery/invite flow, redirect to planner
      if (type && type !== 'recovery' && type !== 'invite') {
        redirect('/planner');
      }

      // For recovery/invite flows (or if type is missing, assume recovery), continue to show the password form
      // The session is now established, so the form can proceed
      // Remove the code from URL to prevent re-processing
      const finalType = type || 'recovery';
      redirect(`/auth/set-password?type=${finalType}`);
    } catch (err: any) {
      console.error('Error in code exchange:', err);
      const errorParams = new URLSearchParams();
      errorParams.set('error', parseAuthError(err));
      if (type) {
        errorParams.set('type', type);
      }
      redirect(`/auth/set-password?${errorParams.toString()}`);
    }
  }

  // Don't redirect authenticated users - they might be here to set password via invitation
  // The SetPasswordForm component will handle the logic
  // HashTokenHandler will catch any hash tokens that Supabase might send

  return (
    <AuthLayout>
      <Suspense fallback={<SetPasswordFormSkeleton />}>
        <SetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
