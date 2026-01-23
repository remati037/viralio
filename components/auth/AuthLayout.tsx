/**
 * Shared layout component for authentication pages
 */

import { Rocket } from 'lucide-react';
import HashTokenHandler from './HashTokenHandler';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <HashTokenHandler />
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-bold text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0E172A] text-[#CA8A03]">
            <Rocket className="size-5" />
          </div>
          Viralio App
        </div>
        {children}
      </div>
    </div>
  );
}
