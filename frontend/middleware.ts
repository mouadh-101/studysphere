import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard'];

// Define auth routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Get the access token from cookies or you can check headers
  // Note: Since we're using localStorage in the client, we'll need to handle this client-side
  // This middleware serves as an additional layer but main protection is in AuthGuard
  
  if (isProtectedRoute) {
    // Let the AuthGuard component handle the authentication check
    // This middleware can be extended to check server-side tokens if needed
    return NextResponse.next();
  }

  if (isAuthRoute) {
    // If user is already authenticated (has token in cookie), redirect to dashboard
    // This would require setting httpOnly cookies instead of localStorage
    // For now, we'll let the client-side handle this
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configure which routes should trigger the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
