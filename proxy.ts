import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from './lib/types/database'

// Files a phone needs before anyone signs in: install manifest, service worker, offline page, icons, app links.
const PUBLIC_PATHS = ['/sw.js', '/manifest.webmanifest', '/offline', '/icons', '/.well-known', '/downloads', '/api/push']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all routes under /(app)
  // For the proxy, (app) routes are just regular paths like /dashboard, /service-requests, etc.
  // We need to match those paths. Let's redirect unauthenticated users to /sign-in.
  // Actually, we can check if the user is unauthenticated and trying to access anything other than /sign-in or /auth
  const isAuthRoute = request.nextUrl.pathname.startsWith('/sign-in')
  
  // The app will have these routes (from team rules): 
  // /dashboard, /notifications, /service-requests, /requests, /office, /admin/reports
  // We can just protect everything except /sign-in, auth callbacks, and static files
  
  if (!user && !isAuthRoute && !request.nextUrl.pathname.startsWith('/auth/') && !PUBLIC_PATHS.some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
