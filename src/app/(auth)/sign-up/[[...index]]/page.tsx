'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Toaster, toast } from 'sonner'
import { AuroraBackground } from '@/components/ui/aurora-background'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get the redirect URL from query params
  const from = searchParams.get('from') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Basic validation
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.requiresVerification) {
          toast.success('Account created successfully! Redirecting to email verification...')
          setTimeout(() => {
            router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
          }, 2000)
        } else {
          toast.success('Account created successfully! Redirecting to sign in...')
          setTimeout(() => {
            router.push('/sign-in')
          }, 2000)
        }
      } else {
        toast.error(data.error || 'An error occurred during registration')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center w-[100vw] justify-center pt-34 pb-10 min-h-screen bg-[#f5f5f5]" >
      {/* Main container for the signup form */}
      <div className="bg-white text-black w-lg  mx-4 p-10 rounded-4xl shadow-sm ">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold  text-black">Create Account</h1>
          <p className="text-gray-600 mt-2">Join our community today!</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Full Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-2">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="enter your name"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-4xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-300"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="email@example.com"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-4xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-2">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-4xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600 mb-2">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-4xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-300"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white font-bold py-3 px-4 rounded-4xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-black transition duration-300 ease-in-out transform hover:scale-101 disabled:opacity-50 disabled:transform-none"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Already have an account? 
            <Link href="/sign-in" className="font-medium text-black hover:underline ml-1">Sign In</Link>
          </p>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
