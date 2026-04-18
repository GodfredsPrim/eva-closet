'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useCart } from '@/components/CartContext'

export default function CartPage() {
  const { cart, removeFromCart } = useCart()

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, x: -50 },
    show: { opacity: 1, x: 0 },
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black px-4 py-12"
    >
      <div className="mx-auto max-w-4xl">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-12 text-center text-4xl font-bold text-white drop-shadow-lg"
        >
          Your Shopping Cart
        </motion.h1>

        {cart.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-white/10 p-8 text-center backdrop-blur-sm"
          >
            <p className="mb-4 text-xl text-white">Your cart is empty.</p>
            <Link
              href="/products"
              className="inline-block rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-3 font-semibold text-white transition-transform hover:scale-105"
            >
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="mb-8 space-y-6"
            >
              {cart.map((cartItem) => (
                <motion.div
                  key={cartItem.id}
                  variants={item}
                  className="flex items-center rounded-2xl bg-white/10 p-6 shadow-xl backdrop-blur-sm"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.img
                    src={cartItem.product.image}
                    alt={cartItem.product.name}
                    className="mr-6 h-20 w-20 rounded-xl object-cover shadow-lg"
                    whileHover={{ scale: 1.1 }}
                  />
                  <div className="flex-1">
                    <h3 className="mb-2 text-xl font-bold text-white">{cartItem.product.name}</h3>
                    {cartItem.size && (
                      <p className="mb-1 text-sm text-white/60">Size: {cartItem.size}</p>
                    )}
                    <p className="text-white/80">
                      ₵{cartItem.product.price} × {cartItem.quantity}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => removeFromCart(cartItem.id)}
                    className="rounded-xl bg-red-500/80 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-600"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Remove
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-white/10 p-8 text-center shadow-xl backdrop-blur-sm"
            >
              <p className="mb-6 text-3xl font-bold text-white drop-shadow-lg">
                Total: ₵{total.toFixed(2)}
              </p>
              <Link
                href="/checkout"
                className="inline-block rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 text-xl font-bold text-slate-900 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/50"
              >
                Proceed to Checkout
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  )
}
