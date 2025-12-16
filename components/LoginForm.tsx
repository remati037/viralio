'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (signUpError) throw signUpError

        // Profile will be automatically created by database trigger
        toast.success('Nalog kreiran!', {
          description: 'Proverite email za verifikaciju naloga.',
        })
        setEmail('')
        setPassword('')
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          throw signInError
        }

        if (!data.session) {
          setError('Failed to create session. Please try again.')
          toast.error('Greška pri prijavljivanju', {
            description: 'Neuspešno kreiranje sesije. Pokušajte ponovo.',
          })
          setLoading(false)
          return
        }

        toast.success('Uspešno prijavljivanje!', {
          description: 'Preusmeravanje...',
        })

        // Wait for cookies to be set by the updated @supabase/ssr package
        // The new version handles cookies better
        await new Promise((resolve) => setTimeout(resolve, 400))

        // Use full page reload to ensure cookies are sent
        window.location.href = '/'
      }
    } catch (err: any) {
      setError(err.message)
      toast.error('Greška', {
        description: err.message || 'Došlo je do greške. Pokušajte ponovo.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">ViralVault</h1>
          <p className="text-slate-400">Sign in to your account</p>
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
          <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
          <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">ViralVault</h1>
        <p className="text-slate-400">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4" suppressHydrationWarning>
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            suppressHydrationWarning
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            suppressHydrationWarning
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:bg-slate-700 disabled:text-slate-500"
        >
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-blue-400 hover:text-blue-300"
          type="button"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </>
  )
}
