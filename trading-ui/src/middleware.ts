import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value
  const { pathname } = request.nextUrl
  
  // Public paths that do not require authentication
  const isAuthPath = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname.startsWith('/login') || pathname.startsWith('/register')
  const isPublicPath = isAuthPath || pathname === '/landing'

  if (isAuthPath && token) {
    // If user is already logged in, don't let them access login/register pages
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!isPublicPath && !token) {
    // If not logged in and trying to access a protected route, redirect to login
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Example: Redirect /login to /sign-in
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
  
  // Example: Redirect /register to /sign-up
  if (pathname === '/register') {
    return NextResponse.redirect(new URL('/sign-up', request.url))
  }
  
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
