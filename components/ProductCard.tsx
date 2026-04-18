'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useCart } from './CartContext'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  sizes: string
  video: string | null
}

function parseSizes(sizes: string) {
  return sizes
    .split(',')
    .map((size) => size.trim())
    .filter(Boolean)
}

function ProductModal({ product, onClose }: { product: Product, onClose: () => void }) {
  const { addToCart } = useCart()
  const availableSizes = useMemo(() => parseSizes(product.sizes), [product.sizes])
  const [selectedSize, setSelectedSize] = useState<string | null>(availableSizes[0] ?? null)
  const [sizeError, setSizeError] = useState('')

  const handleAddToCart = () => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSizeError('Please choose a size before adding this item.')
      return
    }

    addToCart(product, selectedSize)
    setSizeError('')
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-emerald-500/20 bg-slate-900/95 shadow-2xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <motion.h2
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-2xl font-bold text-transparent"
            >
              {product.name}
            </motion.h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="rounded-full p-1 text-2xl text-white/60 transition-colors hover:bg-slate-700 hover:text-white"
            >
              x
            </motion.button>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {product.video ? (
              <video
                src={product.video}
                controls
                className="mb-4 w-full max-h-[80vh] rounded-xl object-contain shadow-lg"
                autoPlay
                muted
                loop
              />
            ) : (
              <img
                src={product.image}
                alt={product.name}
                className="mb-4 w-full max-h-[80vh] rounded-xl object-contain shadow-lg"
                style={{ maxWidth: '100%' }}
              />
            )}
          </motion.div>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4 text-white/80"
          >
            {product.description}
          </motion.p>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-2 bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-3xl font-bold text-transparent"
          >
            ₵{product.price.toFixed(2)}
          </motion.p>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-4 text-sm text-white/60"
          >
            {availableSizes.length > 0
              ? `Available sizes: ${availableSizes.join(', ')}`
              : 'One size'}
          </motion.p>

          {availableSizes.length > 0 && (
            <div className="mb-5">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                Select size
              </p>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const isSelected = selectedSize === size

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size)
                        setSizeError('')
                      }}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-400 text-slate-900'
                          : 'border-white/15 bg-slate-800 text-white/75 hover:border-emerald-400/70 hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
              {sizeError && (
                <p className="mt-3 text-sm text-rose-300">{sizeError}</p>
              )}
            </div>
          )}

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 font-semibold text-slate-900 shadow-lg transition-all hover:shadow-emerald-500/30"
          >
            Add to Cart
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ProductCard({ product }: { product: Product }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{
          y: -8,
          boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.3)',
        }}
        className="relative cursor-pointer overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-800/60 p-6 shadow-lg transition-all hover:shadow-2xl"
        onClick={() => setShowModal(true)}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <img src={product.image} alt={product.name} className="mb-4 h-48 w-full rounded-xl object-cover" />
        </motion.div>
        <motion.h3
          className="mb-2 bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-lg font-semibold text-transparent"
          whileHover={{ scale: 1.02 }}
        >
          {product.name}
        </motion.h3>
        <motion.p
          className="mb-2 line-clamp-2 text-sm text-white/70"
          whileHover={{ color: '#e5e7eb' }}
        >
          {product.description}
        </motion.p>
        <motion.p
          className="mb-4 text-2xl font-bold text-green-600"
          whileHover={{ scale: 1.1, color: '#059669' }}
        >
          ₵{product.price.toFixed(2)}
        </motion.p>
        <div className="flex items-center justify-between">
          <motion.span
            className="rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-500"
            whileHover={{ backgroundColor: '#F3F4F6', color: '#374151' }}
          >
            {product.category}
          </motion.span>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: '#7C3AED' }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
            }}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg"
          >
            View Details
          </motion.button>
        </div>

        <div className="absolute right-0 top-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-gradient-to-bl from-pink-400/20 to-purple-400/20" />
        <div className="absolute bottom-0 left-0 h-16 w-16 -translate-x-8 translate-y-8 rounded-full bg-gradient-to-tr from-blue-400/20 to-green-400/20" />
      </motion.div>

      {showModal && <ProductModal product={product} onClose={() => setShowModal(false)} />}
    </>
  )
}
