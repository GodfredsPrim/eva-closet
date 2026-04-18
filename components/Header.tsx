'use client'

import Link from 'next/link'
import { useCart } from './CartContext'
import { motion } from 'framer-motion'

export default function Header() {
  const { cart } = useCart()

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 backdrop-blur-lg border-b border-emerald-500/30 shadow-2xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-5">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2"
          >
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-3xl font-black bg-gradient-to-r from-emerald-500 to-cyan-400 bg-clip-text text-transparent">Eva's</span>
              <span className="text-2xl font-bold text-white">Closet</span>
            </Link>
          </motion.div>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            {/* Search Bar */}
            <motion.div 
              className="hidden md:flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-full px-4 py-2 hover:border-emerald-500/50 transition-colors"
              whileHover={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.1)" }}
            >
              <span className="text-white/60">🔍</span>
              <input 
                type="text" 
                placeholder="Search products..." 
                className="bg-transparent text-white/80 placeholder-white/40 focus:outline-none w-32"
              />
            </motion.div>

            {/* Products */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Link href="/products" className="text-white/90 hover:text-emerald-400 font-medium transition-colors flex items-center gap-1">
                <span>🛍️</span> Products
              </Link>
            </motion.div>

            {/* Cart */}
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Link href="/cart" className="text-white/90 hover:text-emerald-400 font-medium transition-colors relative flex items-center gap-1">
                <span>🛒</span> Cart
                {cart.length > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </motion.span>
                )}
              </Link>
            </motion.div>


          </nav>
        </div>
      </div>
    </motion.header>
  )
}