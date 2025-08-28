'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/sign-in')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to sign-in
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to your Dashboard, {session.user?.name}!
            </h1>
            <p className="text-gray-600 mb-8">
              You have successfully signed in to your account.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Chat</h3>
                <p className="text-blue-700 mb-4">Start a conversation with AI</p>
                <button 
                  onClick={() => router.push('/chat')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Go to Chat
                </button>
              </div>

              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Library</h3>
                <p className="text-green-700 mb-4">Access your document library</p>
                <button 
                  onClick={() => router.push('/library')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  View Library
                </button>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Learning</h3>
                <p className="text-purple-700 mb-4">Explore learning materials</p>
                <button 
                  onClick={() => router.push('/learning')}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                >
                  Start Learning
                </button>
              </div>
            </div>

            <div className="mt-8 bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {session.user?.name}</p>
                <p><span className="font-medium">Email:</span> {session.user?.email}</p>
                <p><span className="font-medium">User ID:</span> {(session.user as any)?.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
