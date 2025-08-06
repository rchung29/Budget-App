'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'

interface FixedExpense {
  id: string
  name: string
  amount: number
}

export function FixedExpensesSection({ monthId }: { monthId: string }) {
  const [expenses, setExpenses] = useState<FixedExpense[]>([])
  const [newExpense, setNewExpense] = useState({ name: '', amount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFixedExpenses()
  }, [monthId])

  const fetchFixedExpenses = async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select('id, name, amount')
      .eq('month_id', monthId)

    if (error) {
      console.error('Error fetching fixed expenses:', error)
    } else {
      setExpenses(data || [])
    }

    setLoading(false)
  }

  const handleAddExpense = async () => {
    if (!newExpense.name || newExpense.amount <= 0) return

    const { data, error } = await supabase
      .from('fixed_expenses')
      .insert({
        month_id: monthId,
        name: newExpense.name,
        amount: newExpense.amount
      })
      .select()

    if (error) {
      console.error('Error adding fixed expense:', error)
    } else if (data) {
      setExpenses([...expenses, data[0]])
      setNewExpense({ name: '', amount: 0 })
    }
  }

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase
      .from('fixed_expenses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting fixed expense:', error)
    } else {
      setExpenses(expenses.filter(expense => expense.id !== id))
    }
  }

  if (loading) {
    return <div>Loading fixed expenses...</div>
  }

  const totalFixedExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fixed Expenses</CardTitle>
        <CardDescription>Regular monthly expenses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Expenses List */}
        <div className="space-y-2">
          <h4 className="font-medium">Your Fixed Expenses</h4>
          {expenses.length > 0 ? (
            <ul className="space-y-2">
              {expenses.map((expense) => (
                <li key={expense.id} className="flex justify-between items-center">
                  <span>{expense.name}: {formatCurrency(expense.amount)}</span>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteExpense(expense.id)}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No fixed expenses added yet.</p>
          )}
        </div>

        {/* Total Fixed Expenses */}
        <div className="flex justify-between items-center border-t pt-2">
          <span className="font-medium">Total Fixed Expenses:</span>
          <span className="font-bold">{formatCurrency(totalFixedExpenses)}</span>
        </div>

        {/* Add New Expense */}
        <div className="space-y-2">
          <h4 className="font-medium">Add Fixed Expense</h4>
          <div className="space-y-2">
            <Input
              type="text"
              value={newExpense.name}
              onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
              placeholder="Expense name (e.g., Netflix, Car Payment)"
            />
            <div className="flex space-x-2">
              <Input
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                placeholder="Expense amount"
              />
              <Button onClick={handleAddExpense}>Add</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
