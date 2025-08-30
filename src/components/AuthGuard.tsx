'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (status === 'unauthenticated') {
      // Get current path to redirect back after login
      const currentPath = window.location.pathname + window.location.search
      router.push(`/sign-in?from=${encodeURIComponent(currentPath)}`)
    }
  }, [status, router])

  // Show loading state
  if (status === 'loading') {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )
    )
  }

  // Show nothing while redirecting
  if (status === 'unauthenticated') {
    return null
  }

  // User is authenticated, show the protected content
  return <>{children}</>
}

// Hook for checking auth status
export function useAuthGuard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const redirectToSignIn = (from?: string) => {
    const redirectPath = from || window.location.pathname + window.location.search
    router.push(`/sign-in?from=${encodeURIComponent(redirectPath)}`)
  }

  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    session,
    redirectToSignIn
  }
}
