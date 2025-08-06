'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, calculateNetPay } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'

interface Deduction {
  id: string
  name: string
  amount: number
}

export function GrossPaySection({ userId, monthId }: { userId: string, monthId: string }) {
  const [grossPay, setGrossPay] = useState<number | null>(null)
  const [deductions, setDeductions] = useState<Deduction[]>([])
  const [newDeduction, setNewDeduction] = useState({ name: '', amount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGrossPayAndDeductions()
  }, [monthId])

  const fetchGrossPayAndDeductions = async () => {
    setLoading(true)
    
    // Fetch gross pay
    const { data: grossPayData, error: grossPayError } = await supabase
      .from('gross_pay')
      .select('amount')
      .eq('month_id', monthId)
      .single()

    if (grossPayError && grossPayError.code !== 'PGRST116') {
      console.error('Error fetching gross pay:', grossPayError)
    } else if (grossPayData) {
      setGrossPay(grossPayData.amount)
    }

    // Fetch deductions
    const { data: deductionsData, error: deductionsError } = await supabase
      .from('deductions')
      .select('id, name, amount')
      .eq('month_id', monthId)

    if (deductionsError) {
      console.error('Error fetching deductions:', deductionsError)
    } else if (deductionsData) {
      setDeductions(deductionsData)
    }

    setLoading(false)
  }

  const handleSaveGrossPay = async () => {
    if (grossPay === null) return

    // Check if gross pay record already exists for this month
    const { data: existingData, error: fetchError } = await supabase
      .from('gross_pay')
      .select('id')
      .eq('month_id', monthId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching gross pay:', fetchError)
      return
    }

    if (existingData) {
      // Update existing record
      const { data, error } = await supabase
        .from('gross_pay')
        .update({ amount: grossPay })
        .eq('month_id', monthId)

      if (error) {
        console.error('Error updating gross pay:', error)
      } else {
        console.log('Gross pay updated successfully')
      }
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('gross_pay')
        .insert({ 
          month_id: monthId, 
          amount: grossPay
        })

      if (error) {
        console.error('Error inserting gross pay:', error)
      } else {
        console.log('Gross pay inserted successfully')
      }
    }
  }

  const handleAddDeduction = async () => {
    if (!newDeduction.name || newDeduction.amount <= 0) return

    const { data, error } = await supabase
      .from('deductions')
      .insert({
        month_id: monthId,
        name: newDeduction.name,
        amount: newDeduction.amount
      })
      .select()

    if (error) {
      console.error('Error adding deduction:', error)
    } else if (data) {
      setDeductions([...deductions, data[0]])
      setNewDeduction({ name: '', amount: 0 })
    }
  }

  const handleDeleteDeduction = async (id: string) => {
    const { error } = await supabase
      .from('deductions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting deduction:', error)
    } else {
      setDeductions(deductions.filter(deduction => deduction.id !== id))
    }
  }

  if (loading) {
    return <div>Loading gross pay data...</div>
  }

  const netPay = grossPay !== null ? calculateNetPay(grossPay, deductions) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gross Pay</CardTitle>
        <CardDescription>Manage your income and deductions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gross Pay Input */}
        <div className="space-y-2">
          <label htmlFor="gross-pay" className="text-sm font-medium">
            Gross Pay Amount
          </label>
          <div className="flex space-x-2">
            <Input
              id="gross-pay"
              type="number"
              value={grossPay !== null ? grossPay : ''}
              onChange={(e) => setGrossPay(e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="Enter gross pay"
            />
            <Button onClick={handleSaveGrossPay}>Save</Button>
          </div>
        </div>

        {/* Pay Summary */}
        {grossPay !== null && (
          <div className="space-y-2">
            <h4 className="font-medium">Pay Summary</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span>Gross Pay:</span>
                <span className="font-medium">{formatCurrency(grossPay)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Deductions:</span>
                <span className="font-medium">{formatCurrency(deductions.reduce((sum, d) => sum + d.amount, 0))}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Net Pay:</span>
                <span className="font-bold">{formatCurrency(netPay || 0)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Deductions List */}
        <div className="space-y-2">
          <h4 className="font-medium">Deductions</h4>
          {deductions.length > 0 ? (
            <ul className="space-y-2">
              {deductions.map((deduction) => (
                <li key={deduction.id} className="flex justify-between items-center">
                  <span>{deduction.name}: {formatCurrency(deduction.amount)}</span>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteDeduction(deduction.id)}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No deductions added yet.</p>
          )}
        </div>

        {/* Add New Deduction */}
        <div className="space-y-2">
          <h4 className="font-medium">Add Deduction</h4>
          <div className="space-y-2">
            <Input
              type="text"
              value={newDeduction.name}
              onChange={(e) => setNewDeduction({ ...newDeduction, name: e.target.value })}
              placeholder="Deduction name (e.g., 401k, ESPP)"
            />
            <div className="flex space-x-2">
              <Input
                type="number"
                value={newDeduction.amount}
                onChange={(e) => setNewDeduction({ ...newDeduction, amount: parseFloat(e.target.value) || 0 })}
                placeholder="Deduction amount"
              />
              <Button onClick={handleAddDeduction}>Add</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
