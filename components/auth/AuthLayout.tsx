/**
 * Shared layout component for authentication pages
 */

import HashTokenHandler from './HashTokenHandler';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
      <HashTokenHandler />
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        {children}
      </div>
    </div>
  );
}
