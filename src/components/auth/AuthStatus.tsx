'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';

export function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="flex items-center space-x-4">
        <a
          href="/sign-in"
          className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          Sign In
        </a>
        <a
          href="/sign-up"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign Up
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
          {session.user?.name?.charAt(0)?.toUpperCase() || session.user?.email?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <span className="text-sm text-gray-700 hidden sm:inline">
          {session.user?.name || session.user?.email}
        </span>
      </div>
      
      <button 
        onClick={() => signOut()}
        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}

export function UserProfileSection() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <p className="mt-1 text-sm text-gray-900">{session.user?.name || 'Not provided'}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <p className="mt-1 text-sm text-gray-900">{session.user?.email}</p>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Account Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => signOut()}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sign Out
            </button>
            
            <button 
              onClick={() => alert('Account deletion should be done from the dashboard')}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
