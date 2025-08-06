'use client'

import { useAuth } from '@/context/authContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { GrossPaySection } from './grossPaySection'
import { BudgetCategoriesSection } from './budgetCategoriesSection'
import { FixedExpensesSection } from './fixedExpensesSection'
import { PurchasesSection } from './purchasesSection'
import { CategoryProgressBars } from './categoryProgressBars'
import { supabase } from '@/lib/supabaseClient'

export function UserDashboard() {
  const { user, signOut } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [monthId, setMonthId] = useState<string | null>(null)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // When currentMonth changes, we need to ensure a month record exists in Supabase
  useEffect(() => {
    const fetchOrCreateMonth = async () => {
      if (!user) return

      // Format the date to be the first day of the month
      const monthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const formattedMonthDate = monthDate.toISOString().split('T')[0]

      // Check if month already exists
      const { data: existingMonth, error: fetchError } = await supabase
        .from('months')
        .select('id')
        .eq('user_id', user.id)
        .eq('month_date', formattedMonthDate)
        .single()

      if (existingMonth) {
        setMonthId(existingMonth.id)
      } else if (fetchError && fetchError.code === 'PGRST116') {
        // Month doesn't exist, create it
        const { data: newMonth, error: insertError } = await supabase
          .from('months')
          .insert({
            user_id: user.id,
            month_date: formattedMonthDate
          })
          .select()
          .single()

        if (newMonth) {
          setMonthId(newMonth.id)
        } else if (insertError) {
          console.error('Error creating month:', insertError)
        }
      } else if (fetchError) {
        console.error('Error fetching month:', fetchError)
      }
    }

    fetchOrCreateMonth()
  }, [currentMonth, user])

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex justify-between items-center">
        <Button onClick={() => navigateMonth('prev')} variant="outline">
          Previous Month
        </Button>
        <h2 className="text-2xl font-bold">{formatMonth(currentMonth)}</h2>
        <Button onClick={() => navigateMonth('next')} variant="outline">
          Next Month
        </Button>
      </div>

      {/* Budget Category Progress Bars */}
      {user && monthId && (
        <CategoryProgressBars userId={user.id} monthId={monthId} />
      )}

      {/* Gross Pay Section */}
      {user && monthId && (
        <GrossPaySection userId={user.id} monthId={monthId} />
      )}

      {/* Budget Categories Section */}
      {user && (
        <BudgetCategoriesSection userId={user.id} />
      )}

      {/* Fixed Expenses Section */}
      {user && monthId && (
        <FixedExpensesSection monthId={monthId} />
      )}

      {/* Purchases Section */}
      {user && monthId && (
        <PurchasesSection userId={user.id} monthId={monthId} />
      )}

      {/* Sign Out Button */}
      <Button onClick={handleSignOut} className="w-full">
        Sign Out
      </Button>
    </div>
  )
}
