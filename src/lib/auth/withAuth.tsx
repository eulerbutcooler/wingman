'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, ComponentType } from 'react'

interface WithAuthOptions {
  redirectTo?: string
  loadingComponent?: ComponentType
}

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const {
    redirectTo = '/sign-in',
    loadingComponent: LoadingComponent
  } = options

  return function AuthenticatedComponent(props: P) {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
      if (status === 'loading') return // Still loading

      if (status === 'unauthenticated') {
        // Get current path to redirect back after login
        const currentPath = window.location.pathname + window.location.search
        router.push(`${redirectTo}?from=${encodeURIComponent(currentPath)}`)
      }
    }, [status, router])

    // Show loading state
    if (status === 'loading') {
      if (LoadingComponent) {
        return <LoadingComponent />
      }
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600">Loading...</div>
        </div>
      )
    }

    // Show nothing while redirecting
    if (status === 'unauthenticated') {
      return null
    }

    // User is authenticated, show the protected component
    return <Component {...props} />
  }
}

// Hook for checking if user should have access to certain features
export function useRequireAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const requireAuth = (callback?: () => void, redirectTo = '/sign-in') => {
    if (status === 'loading') return false

    if (status === 'unauthenticated') {
      const currentPath = window.location.pathname + window.location.search
      router.push(`${redirectTo}?from=${encodeURIComponent(currentPath)}`)
      return false
    }

    if (callback) callback()
    return true
  }

  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    session,
    requireAuth
  }
}
