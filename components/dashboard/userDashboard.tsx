'use client'

import { useAuth } from '@/context/authContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function UserDashboard() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>User Dashboard</CardTitle>
        <CardDescription>Welcome to your budget app dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm">Signed in as: {user?.email}</p>
          <Button onClick={handleSignOut} className="w-full">
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
