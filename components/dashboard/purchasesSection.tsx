'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'

interface Purchase {
  id: string
  name: string
  amount: number
  purchase_date: string
  description?: string
  budget_category_id?: string
}

interface BudgetCategory {
  id: string
  name: string
}

export function PurchasesSection({ monthId, userId }: { monthId: string, userId: string }) {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [newPurchase, setNewPurchase] = useState({
    name: '',
    amount: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    description: '',
    budget_category_id: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPurchasesAndCategories()
  }, [monthId])

  const fetchPurchasesAndCategories = async () => {
    setLoading(true)
    
    // Fetch purchases
    const { data: purchasesData, error: purchasesError } = await supabase
      .from('purchases')
      .select('id, name, amount, purchase_date, description, budget_category_id')
      .eq('month_id', monthId)

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError)
    } else {
      setPurchases(purchasesData || [])
    }

    // Fetch budget categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('budget_categories')
      .select('id, name')
      .eq('user_id', userId)

    if (categoriesError) {
      console.error('Error fetching budget categories:', categoriesError)
    } else {
      setCategories(categoriesData || [])
    }

    setLoading(false)
  }

  const handleAddPurchase = async () => {
    if (!newPurchase.name || newPurchase.amount <= 0) return

    const { data, error } = await supabase
      .from('purchases')
      .insert({
        month_id: monthId,
        name: newPurchase.name,
        amount: newPurchase.amount,
        purchase_date: newPurchase.purchase_date,
        description: newPurchase.description,
        budget_category_id: newPurchase.budget_category_id || null
      })
      .select()

    if (error) {
      console.error('Error adding purchase:', error)
    } else if (data) {
      setPurchases([...purchases, data[0]])
      setNewPurchase({
        name: '',
        amount: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        description: '',
        budget_category_id: ''
      })
    }
  }

  const handleDeletePurchase = async (id: string) => {
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting purchase:', error)
    } else {
      setPurchases(purchases.filter(purchase => purchase.id !== id))
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.name : 'Uncategorized'
  }

  if (loading) {
    return <div>Loading purchases...</div>
  }

  const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchases</CardTitle>
        <CardDescription>Track your spending</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Purchases List */}
        <div className="space-y-2">
          <h4 className="font-medium">Recent Purchases</h4>
          {purchases.length > 0 ? (
            <ul className="space-y-2">
              {purchases.map((purchase) => (
                <li key={purchase.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="font-medium">{purchase.name}</div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(purchase.amount)} on {purchase.purchase_date}
                      {purchase.budget_category_id && (
                        <span> in {getCategoryName(purchase.budget_category_id)}</span>
                      )}
                    </div>
                    {purchase.description && (
                      <div className="text-sm">{purchase.description}</div>
                    )}
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeletePurchase(purchase.id)}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No purchases added yet.</p>
          )}
        </div>

        {/* Total Spent */}
        <div className="flex justify-between items-center border-t pt-2">
          <span className="font-medium">Total Spent:</span>
          <span className="font-bold">{formatCurrency(totalSpent)}</span>
        </div>

        {/* Add New Purchase */}
        <div className="space-y-2">
          <h4 className="font-medium">Add Purchase</h4>
          <div className="space-y-2">
            <Input
              type="text"
              value={newPurchase.name}
              onChange={(e) => setNewPurchase({ ...newPurchase, name: e.target.value })}
              placeholder="Purchase name"
            />
            <Input
              type="number"
              value={newPurchase.amount}
              onChange={(e) => setNewPurchase({ ...newPurchase, amount: parseFloat(e.target.value) || 0 })}
              placeholder="Purchase amount"
            />
            <Input
              type="date"
              value={newPurchase.purchase_date}
              onChange={(e) => setNewPurchase({ ...newPurchase, purchase_date: e.target.value })}
            />
            <Input
              type="text"
              value={newPurchase.description}
              onChange={(e) => setNewPurchase({ ...newPurchase, description: e.target.value })}
              placeholder="Description (optional)"
            />
            {categories.length > 0 && (
              <select
                value={newPurchase.budget_category_id}
                onChange={(e) => setNewPurchase({ ...newPurchase, budget_category_id: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Select category (optional)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
            <Button onClick={handleAddPurchase}>Add Purchase</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
