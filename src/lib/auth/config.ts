// Auth Protection Configuration

export const AUTH_CONFIG = {
  // Pages that require authentication
  PROTECTED_ROUTES: [
    '/dashboard',
    '/chat',
    '/quiz',
    '/library',
    '/upload',
    '/profile',
    '/settings',
    '/home'
  ],

  // Pages that should redirect authenticated users away (like sign-in, sign-up)
  AUTH_ROUTES: [
    '/sign-in',
    '/sign-up',
    '/verify-otp'
  ],

  // Public routes that don't require authentication
  PUBLIC_ROUTES: [
    '/',
    '/hero',
    '/sign-out'
  ],

  // Default redirect destinations
  DEFAULT_REDIRECT_AFTER_LOGIN: '/dashboard',
  DEFAULT_REDIRECT_FOR_UNAUTHENTICATED: '/sign-in',
  DEFAULT_REDIRECT_FOR_AUTHENTICATED: '/dashboard'
}

// Helper function to check if a route requires authentication
export function isProtectedRoute(pathname: string): boolean {
  return AUTH_CONFIG.PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  )
}

// Helper function to check if a route is an auth route
export function isAuthRoute(pathname: string): boolean {
  return AUTH_CONFIG.AUTH_ROUTES.some(route => 
    pathname.startsWith(route)
  )
}

// Helper function to check if a route is public
export function isPublicRoute(pathname: string): boolean {
  return AUTH_CONFIG.PUBLIC_ROUTES.includes(pathname) || 
         pathname.startsWith('/api/')
}

// Helper function to get redirect URL with preserved original destination
export function getRedirectUrl(
  originalPath: string, 
  searchParams?: string
): string {
  const fullPath = originalPath + (searchParams ? `?${searchParams}` : '')
  return `${AUTH_CONFIG.DEFAULT_REDIRECT_FOR_UNAUTHENTICATED}?from=${encodeURIComponent(fullPath)}`
}
