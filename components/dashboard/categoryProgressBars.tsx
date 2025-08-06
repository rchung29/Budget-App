'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'

interface BudgetCategory {
  id: string
  name: string
  budget_amount: number
  color?: string
}

interface CategorySpending {
  category_id: string
  total_spent: number
}

export function CategoryProgressBars({ userId, monthId }: { userId: string, monthId: string }) {
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [spending, setSpending] = useState<CategorySpending[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategoryProgress()
  }, [userId, monthId])

  const fetchCategoryProgress = async () => {
    setLoading(true)
    
    // Fetch budget categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('budget_categories')
      .select('id, name, budget_amount, color')
      .eq('user_id', userId)

    if (categoriesError) {
      console.error('Error fetching budget categories:', categoriesError)
    } else {
      setCategories(categoriesData || [])
    }

    // Fetch spending per category
    const { data: spendingData, error: spendingError } = await supabase
      .from('purchases')
      .select('budget_category_id, amount')
      .eq('month_id', monthId)

    if (spendingError) {
      console.error('Error fetching category spending:', spendingError)
    } else {
      // Aggregate spending by category
      const aggregatedSpending = spendingData?.reduce((acc, purchase) => {
        if (purchase.budget_category_id) {
          const existing = acc.find(item => item.category_id === purchase.budget_category_id)
          if (existing) {
            existing.total_spent += purchase.amount
          } else {
            acc.push({
              category_id: purchase.budget_category_id,
              total_spent: purchase.amount
            })
          }
        }
        return acc
      }, [] as CategorySpending[]) || []
      
      setSpending(aggregatedSpending)
    }

    setLoading(false)
  }

  const getSpentAmount = (categoryId: string) => {
    const categorySpending = spending.find(item => item.category_id === categoryId)
    return categorySpending ? categorySpending.total_spent : 0
  }

  const getPercentage = (categoryId: string, budgetAmount: number) => {
    const spent = getSpentAmount(categoryId)
    return budgetAmount > 0 ? Math.min(100, (spent / budgetAmount) * 100) : 0
  }

  if (loading) {
    return <div>Loading category progress...</div>
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-center text-gray-500">No budget categories yet. Add some to see progress tracking.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold mb-4">Budget Progress</h3>
        <div className="space-y-4">
          {categories.map((category) => {
            const spent = getSpentAmount(category.id)
            const percentage = getPercentage(category.id, category.budget_amount)
            const isOverBudget = spent > category.budget_amount
            
            return (
              <div key={category.id} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">{category.name}</span>
                  <span className={isOverBudget ? "text-red-500 font-bold" : ""}>
                    {formatCurrency(spent)} / {formatCurrency(category.budget_amount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      isOverBudget ? "bg-red-600" : category.color || "bg-blue-600"
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-right text-sm">
                  {percentage.toFixed(0)}% used
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
