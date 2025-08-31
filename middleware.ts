import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const pathname = req.nextUrl.pathname
    
    console.log('Middleware triggered for:', pathname, 'Auth status:', isAuth)
    
    const isAuthPage = pathname.startsWith('/sign-in') || 
                      pathname.startsWith('/sign-up') ||
                      pathname.startsWith('/verify-otp')
    
    const isPublicPage = pathname === '/' || 
                        pathname.startsWith('/hero') ||
                        pathname.startsWith('/api/auth') ||
                        pathname.startsWith('/api/upload-supabase') ||
                        pathname.startsWith('/api/setup-storage') ||
                        pathname.startsWith('/api/process-documents') ||
                        pathname.startsWith('/api/process-document') ||
                        pathname.startsWith('/api/manual-process') ||
                        pathname.startsWith('/api/test-rag') ||
                        pathname.startsWith('/api/chat') ||
                        pathname.startsWith('/api/courses') ||
                        pathname.startsWith('/api/topics') ||
                        pathname.startsWith('/api/lessons') ||
                        pathname.startsWith('/_next') ||
                        pathname.startsWith('/favicon')

    if (isAuthPage && isAuth) {
      console.log('Redirecting authenticated user away from auth page')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (!isAuth && !isAuthPage && !isPublicPage) {
      console.log('Redirecting unauthenticated user to sign-in')
      let from = pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/sign-in?from=${encodeURIComponent(from)}`, req.url)
      );
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        
        if (pathname.startsWith('/api/auth') ||
            pathname.startsWith('/api/upload-supabase') ||
            pathname.startsWith('/api/setup-storage') ||
            pathname.startsWith('/api/process-documents') ||
            pathname.startsWith('/api/process-document') ||
            pathname.startsWith('/api/manual-process') ||
            pathname.startsWith('/api/test-rag') ||
            pathname.startsWith('/api/chat') ||
            pathname.startsWith('/api/courses') ||
            pathname.startsWith('/api/topics') ||
            pathname.startsWith('/api/lessons')) {
          return true
        }
        
        if (pathname === '/' || 
            pathname.startsWith('/hero') ||
            pathname.startsWith('/sign-in') || 
            pathname.startsWith('/sign-up') ||
            pathname.startsWith('/verify-otp') ||
            pathname.startsWith('/_next') ||
            pathname.startsWith('/favicon')) {
          return true
        }
        
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
   
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
}
