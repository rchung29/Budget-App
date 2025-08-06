import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function calculateNetPay(grossPay: number, deductions: { amount: number }[]): number {
  const totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
  return grossPay - totalDeductions;
}
