'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOutUser } from '@/lib/auth/client';

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    const performSignOut = async () => {
      try {
        await signOutUser('/');
      } catch (error) {
        console.error('Signout failed, redirecting anyway:', error);
        // Fallback redirect even if signout fails
        router.push('/');
      }
    };

    performSignOut();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Signing you out...</h1>
        <p className="text-gray-600">Please wait while we securely sign you out.</p>
      </div>
    </div>
  );
}
