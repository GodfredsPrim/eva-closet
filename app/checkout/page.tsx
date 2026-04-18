'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCart } from '@/components/CartContext'

type CheckoutResult = {
  orderId: string
  total: number
  adminMomoNumber: string
  paymentInstructions: string
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null)

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const items = cart.map((item) => ({
      productId: item.productId,
      size: item.size,
      quantity: item.quantity,
    }))

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          customerName: formData.name,
          customerPhone: formData.phone,
          customerAddress: formData.address,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data?.error || 'Unable to place your order right now.')
        return
      }

      setCheckoutResult({
        orderId: data.orderId,
        total: data.total,
        adminMomoNumber: data.adminMomoNumber,
        paymentInstructions: data.paymentInstructions,
      })
      clearCart()
    } catch {
      setError('Unable to place your order right now.')
    } finally {
      setSubmitting(false)
    }
  }

  if (cart.length === 0 && !checkoutResult) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black px-4"
      >
        <div className="rounded-2xl bg-white/10 p-8 text-center backdrop-blur-sm">
          <p className="mb-4 text-xl text-white">Your cart is empty.</p>
          <a
            href="/products"
            className="inline-block rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-3 font-semibold text-white transition-transform hover:scale-105"
          >
            Start Shopping
          </a>
        </div>
      </motion.div>
    )
  }

  if (checkoutResult) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black px-4 py-12"
      >
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-emerald-500/20 bg-white/10 p-8 shadow-2xl backdrop-blur-sm md:p-10">
            <h1 className="mb-4 text-4xl font-bold text-white">MTN MOMO Payment</h1>
            <p className="mb-8 text-lg text-white/70">
              Your order has been received. Complete payment using the admin MTN MOMO number below.
            </p>

            <div className="mb-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <p className="mb-2 text-sm uppercase tracking-[0.2em] text-white/50">Order ID</p>
                <p className="break-all font-mono text-white">{checkoutResult.orderId}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <p className="mb-2 text-sm uppercase tracking-[0.2em] text-white/50">Amount</p>
                <p className="text-3xl font-bold text-emerald-400">₵{checkoutResult.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-yellow-400/30 bg-gradient-to-r from-yellow-400/15 to-emerald-400/15 p-6">
              <p className="mb-2 text-sm uppercase tracking-[0.2em] text-yellow-300/80">Admin MTN MOMO Number</p>
              <p className="text-3xl font-black text-white md:text-4xl">
                {checkoutResult.adminMomoNumber || 'Set ADMIN_MOMO_NUMBER in .env'}
              </p>
            </div>

            <div className="mb-8 space-y-3 text-white/80">
              <p>{checkoutResult.paymentInstructions}</p>
              <p>Use your full name or order ID as the payment reference.</p>
              <p>After payment, the admin can confirm your order from the dashboard.</p>
            </div>

            <a
              href="/products"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-lg font-bold text-slate-900 shadow-xl transition-transform hover:scale-105"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black px-4 py-12"
    >
      <div className="mx-auto max-w-6xl">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-12 text-center text-4xl font-bold text-white drop-shadow-lg"
        >
          Checkout
        </motion.h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/10 p-8 shadow-xl backdrop-blur-sm"
          >
            <h2 className="mb-6 text-2xl font-bold text-white">Order Summary</h2>
            <div className="space-y-4">
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-white/5 p-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div>
                    <span className="font-medium text-white">
                      {item.product.name} x {item.quantity}
                    </span>
                    {item.size && (
                      <p className="text-sm text-white/60">Size: {item.size}</p>
                    )}
                  </div>
                  <span className="font-bold text-white">
                    ₵{(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </motion.div>
              ))}
              <motion.div
                className="mt-6 border-t border-white/20 pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex justify-between text-2xl font-bold text-white">
                  <span>Total:</span>
                  <span>₵{total.toFixed(2)}</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white/10 p-8 shadow-xl backdrop-blur-sm"
          >
            <h2 className="mb-2 text-2xl font-bold text-white">Shipping Information</h2>
            <p className="mb-6 text-white/60">
              After placing the order, you will receive the MTN MOMO admin number and payment steps.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="mb-2 block text-sm font-bold text-white">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-white/30 bg-white/20 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Enter your full name"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="mb-2 block text-sm font-bold text-white">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-white/30 bg-white/20 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Enter your phone number"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="mb-2 block text-sm font-bold text-white">Address</label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full resize-none rounded-xl border border-white/30 bg-white/20 px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  rows={4}
                  placeholder="Enter your shipping address"
                />
              </motion.div>

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 text-xl font-bold text-slate-900 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {submitting ? 'Processing Order...' : 'Place Order for MTN MOMO Payment'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
