'use client'

import { useAuth } from '@/context/authContext'
import { SignUpForm } from '@/components/auth/signupForm'
import { SignInForm } from '@/components/auth/signinForm'
import { UserDashboard } from '@/components/dashboard/userDashboard'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
      <h1 className="text-3xl font-bold">Budget App</h1>
      {user ? (
        <UserDashboard />
      ) : (
        <div className="space-y-8 w-full max-w-md">
          <SignInForm />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>
          <SignUpForm />
        </div>
      )}
    </div>
  )
}
