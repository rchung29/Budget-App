'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'

interface BudgetCategory {
  id: string
  name: string
  budget_amount: number
  color?: string
}

export function BudgetCategoriesSection({ userId }: { userId: string }) {
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [newCategory, setNewCategory] = useState({ name: '', budget_amount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBudgetCategories()
  }, [])

  const fetchBudgetCategories = async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('budget_categories')
      .select('id, name, budget_amount, color')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching budget categories:', error)
    } else {
      setCategories(data || [])
    }

    setLoading(false)
  }

  const handleAddCategory = async () => {
    if (!newCategory.name || newCategory.budget_amount <= 0) return

    const { data, error } = await supabase
      .from('budget_categories')
      .insert({
        user_id: userId,
        name: newCategory.name,
        budget_amount: newCategory.budget_amount
      })
      .select()

    if (error) {
      console.error('Error adding budget category:', error)
    } else if (data) {
      setCategories([...categories, data[0]])
      setNewCategory({ name: '', budget_amount: 0 })
    }
  }

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('budget_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting budget category:', error)
    } else {
      setCategories(categories.filter(category => category.id !== id))
    }
  }

  if (loading) {
    return <div>Loading budget categories...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Categories</CardTitle>
        <CardDescription>Manage your spending categories</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Categories List */}
        <div className="space-y-2">
          <h4 className="font-medium">Your Categories</h4>
          {categories.length > 0 ? (
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id} className="flex justify-between items-center">
                  <span>{category.name}: {formatCurrency(category.budget_amount)}</span>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No budget categories added yet.</p>
          )}
        </div>

        {/* Add New Category */}
        <div className="space-y-2">
          <h4 className="font-medium">Add Category</h4>
          <div className="space-y-2">
            <Input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Category name"
            />
            <div className="flex space-x-2">
              <Input
                type="number"
                value={newCategory.budget_amount}
                onChange={(e) => setNewCategory({ ...newCategory, budget_amount: parseFloat(e.target.value) || 0 })}
                placeholder="Budget amount"
              />
              <Button onClick={handleAddCategory}>Add</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
