'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Toaster, toast } from 'sonner'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Check if it's an unverified email error
        const response = await fetch('/api/auth/check-verification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })
        
        if (response.ok) {
          const data = await response.json()
          if (!data.verified) {
            toast.error('Please verify your email before signing in.')
            // Optionally redirect to verification page
            setTimeout(() => {
              router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
            }, 2000)
            return
          }
        }
        
        toast.error('Invalid email or password')
      } else {
        // Get the session to check if sign in was successful
        const session = await getSession()
        if (session) {
          toast.success('Welcome back!')
          router.push('/dashboard')
          router.refresh()
        }
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen font-inter" style={{ backgroundColor: '#f3f4f6' }}>
      {/* Main container for the signin form */}
      <div className="bg-white text-black w-full max-w-md mx-4 p-8 md:p-10 rounded-[2rem] shadow-sm border border-gray-200">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-black">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        {/* Signin Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-black transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account? 
            <Link href="/sign-up" className="font-medium text-black hover:underline ml-1">Create Account</Link>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Need to verify your email? 
            <Link href="/verify-otp" className="font-medium text-black hover:underline ml-1">Verify Now</Link>
          </p>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
