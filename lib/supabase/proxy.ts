import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // The proxy automatically refreshes expired tokens
  // We use getUser() here to check authentication status
  // Supabase SSR will automatically parse cookies and refresh tokens
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()


  // Allow access to login, auth callback, static files, and API routes without authentication
  const publicPaths = ['/login', '/auth/callback', '/_next', '/api', '/favicon.ico']
  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // If user is authenticated and on login page, redirect to planner
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/planner'
    return NextResponse.redirect(url)
  }

  // For root path, always return the response to allow cookies to be refreshed
  // The page component will handle authentication checks
  if (request.nextUrl.pathname === '/') {
    return supabaseResponse
  }

  // If user is not authenticated and trying to access protected route, redirect to login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse

}

