'use client'

import { useSession } from 'next-auth/react'
import { FaArrowRight } from "react-icons/fa";
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PiTimer } from "react-icons/pi";
import { IoBookOutline } from "react-icons/io5";
import { AiOutlineThunderbolt } from "react-icons/ai";
import Image from 'next/image'
import { signOutUser, deleteAccount } from '@/lib/auth/client'
export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/sign-in')
    }
  }, [session, status, router])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOutUser('/')
    } catch (error) {
      console.error('Sign out failed:', error)
      setIsSigningOut(false)
    }
  }

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type "DELETE" to confirm')
      return
    }

    if (!deletePassword) {
      setDeleteError('Password is required')
      return
    }

    setIsDeleting(true)
    setDeleteError('')

    try {
      const result = await deleteAccount({ password: deletePassword })
      
      if (result.success) {
        // User will be automatically signed out and redirected
      } else {
        setDeleteError(result.error || 'Failed to delete account')
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setIsDeleting(false)
    }
  }

  const resetDeleteModal = () => {
    setDeletePassword('')
    setDeleteConfirmText('')
    setDeleteError('')
    setIsDeleting(false)
    setShowDeleteModal(false)
  }

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
    <div className="min-h-screen w-[100vw] bg-[#f5f5f5]">
      <div className=" mx-auto max-w-11/12 pt-34 pb-12">
        <div className=" ">
          <div className="">
            <h1 className="text-2xl font-bold text-black mb-4">
              Welcome to your Dashboard, <span className="text-navy">{session.user?.name}!</span>
            </h1>
            <p className="text-neutral-600 mb-8">
              You have successfully signed in to your account.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="shadow-sm p-6 hover:shadow-xl bg-white transition-all duration-300 rounded-4xl ">
                <h3 className="text-lg font-semibold text-black mb-2">Chat</h3>
                <p className="text-navy mb-4">Start a conversation with AI</p>
                <button 
                  onClick={() => router.push('/chat')}
                  className="bg-black text-white flex items-center gap-2 px-4 py-2 cursor-pointer rounded-4xl hover:scale-101 transition-colors"
                >
                  Go to chat
                                    <FaArrowRight className="inline-block ml-2" />

                </button>
              </div>

              <div className="shadow-sm p-6 hover:shadow-xl bg-white transition-all duration-300 rounded-4xl ">
                <h3 className="text-lg font-semibold  text-black mb-2">Library</h3>
                <p className="text-navy mb-4">Access your document library</p>
                <button 
                  onClick={() => router.push('/library')}
                  className="bg-black text-white  px-4 flex items-center gap-2 py-2 cursor-pointer rounded-4xl hover:scale-101 transition-colors"
                >
                  View library
                  <FaArrowRight className="inline-block ml-2" />
                </button>
              </div>

              <div className="shadow-sm p-6 hover:shadow-xl bg-white transition-all duration-300 rounded-4xl ">
                <h3 className="text-lg font-semibold text-black mb-2">Quizzes</h3>
                <p className="text-navy mb-4">Explore challenging quizzes</p>
                <button 
                  onClick={() => router.push('/quiz')}
                  className="bg-black text-white flex gap-2 items-center px-4 py-2 cursor-pointer rounded-4xl hover:scale-101 transition-colors"
                >
                  
                  Start quiz
                                    <FaArrowRight className="inline-block ml-2" />

                </button>
              </div>
            </div>

            <div className='flex mt-8 gap-8 justify-between'>
              <div className=" bg-white p-6 flex-col flex justify-between flex-1 rounded-4xl shadow-sm">
                <div className="text-2xl font-semibold text-black ">Account Information</div>
                <div className="space-y-2 pt-2">
                  <p className='text-navy text-xl'><span className="font-medium text-black">Name:</span> {session.user?.name}</p>
                  <p className='text-navy text-xl'><span className="font-medium text-black">Email:</span> {session.user?.email}</p>
                  <p className='text-navy text-xl'><span className="font-medium text-black">User ID:</span> {(session.user as any)?.id}</p>
                </div>
              </div>
              <div className='p-6 rounded-4xl shadow-sm hover:shadow-xl bg-white gap-2 flex flex-col transition-all duration-300'>
                <h3 className='text-lg font-semibold text-black'>Recent activity</h3>
                <p className='text-navy pt-2'>This is a sample activity in under 1 line</p>
                <p className='text-navy'>This is sample activity 2 </p>
                <p className='text-navy'>This is sample activity 3 </p>
                <p className='text-navy'>This is sample activity 4 </p>

              </div>
            </div>
            <div className='flex justify-between gap-8 mt-8'>
              <div className='p-6 rounded-4xl bg-white   transition-all flex flex-col  duration-300 shadow-sm'>

                <h3 className='text-lg font-semibold text-black'>Your learning snapshot</h3>
                <div className='gap-6  flex pt-4'>
                  <div className=' flex items-center rounded-4xl shadow-sm hover:shadow-xl transition-all duration-300 p-4 px-8 gap-3'>
                    <PiTimer className='text-3xl text-black mr-2' />
                    <div className='flex flex-col'>
                      <p className='text-lg font-semibold'>7.2 Hours</p>
                      <p className='text-navy'>This week</p>
                    </div>
                    
                  </div>
                  <div className=' flex items-center rounded-4xl shadow-sm hover:shadow-xl transition-all duration-300 p-4 px-8 gap-3'>
                    <IoBookOutline className='text-3xl text-black mr-2' />
                    <div className='flex flex-col'>
                      <p className='text-lg font-semibold'>12 Lessons</p>
                      <p className='text-navy'>Completed</p>
                    </div>
                    
                  </div>
                  <div className=' flex items-center rounded-4xl shadow-sm hover:shadow-xl transition-all duration-300 p-4 px-8 gap-3'>
                    <AiOutlineThunderbolt className='text-3xl text-black mr-2' />
                    <div className='flex flex-col'>
                      <p className='text-lg font-semibold'>4 Days</p>
                      <p className='text-navy'>Streak</p>
                    </div>
                    
                  </div>
                </div>


              </div>
              

              <div className='flex justify-between p-4 flex- flex-col'>
                <button 
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className='rounded-4xl bg-black text-white px-6 py-4 cursor-pointer text-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isSigningOut ? 'Signing out...' : 'Log out'}
                </button>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className='rounded-4xl bg-red-500/20 border border-red-500/20 hover:bg-red-500 transition-all duration-150 cursor-pointer text-white px-6 py-4 text-xl mt-4'
                >
                  Delete account
                </button>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-red-600 mb-4">Delete Account</h2>
            
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                <strong>Warning:</strong> This action cannot be undone. This will permanently delete your account and all associated data including courses, lessons, and uploaded files.
              </p>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm by typing "DELETE":
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Type DELETE to confirm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password to confirm:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{deleteError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetDeleteModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || deleteConfirmText !== 'DELETE' || !deletePassword}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
