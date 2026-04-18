'use client'

import { useEffect } from 'react'
import { useCart } from '@/components/CartContext'
import Link from 'next/link'

export default function SuccessPage() {
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
      <p className="text-lg mb-8">Thank you for your purchase. You will receive an email confirmation shortly.</p>
      <Link href="/products" className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600">
        Continue Shopping
      </Link>
    </div>
  )
}