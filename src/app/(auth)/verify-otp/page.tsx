'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Toaster, toast } from 'sonner'

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get email from URL params if available
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!email || !otp) {
      toast.error('Email and OTP are required')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Email verified successfully! Redirecting to sign in...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        toast.error(data.error || 'Verification failed')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
      console.error('OTP verification error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!email) {
      toast.error('Email is required to resend OTP')
      return
    }

    setIsResending(true)

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('New OTP sent to your email!')
      } else {
        toast.error(data.error || 'Failed to resend OTP')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
      console.error('Resend OTP error:', error)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex items-center w-[100vw] justify-center pt-34 pb-10 min-h-screen bg-[#f5f5f5]">
      {/* Main container for the verify OTP form */}
      <div className="bg-white text-black w-lg mx-4 p-8 md:p-10 rounded-4xl shadow-sm border border-gray-200">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-black">Verify Your Email</h1>
          <p className="text-gray-600 mt-2">We've sent a 6-digit verification code to your email address</p>
        </div>

        {/* Verify OTP Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
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

            {/* OTP Input */}
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-600 mb-2">Verification Code</label>
              <input
                type="text"
                id="otp"
                name="otp"
                maxLength={6}
                placeholder="000000"
                required
                className="w-full px-4 py-3 bg-white border text-center tracking-widest border-gray-300 rounded-4xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-300"                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <p className="mt-1 text-xs text-gray-600">
                Enter the 6-digit code sent to your email
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="space-y-4 mt-8">
            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full bg-black text-white font-bold py-3 px-4 rounded-4xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-black transition duration-300 ease-in-out transform hover:scale-101 disabled:opacity-50 disabled:transform-none"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>

            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isResending || !email}
              className="w-full bg-white text-black font-medium py-3 px-4 rounded-4xl border border-gray-300  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition duration-300 disabled:opacity-50"
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <Link href="/sign-up" className="text-sm text-gray-400 ">
            Back to <span className='text-black hover:underline'>Sign Up</span>
          </Link>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
