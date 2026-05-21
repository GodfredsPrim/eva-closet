'use client'

import { useEffect, useState } from 'react'
import ProductCard from '@/components/ProductCard'
import { motion } from 'framer-motion'

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products')
      .then(async res => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error || data?.message || 'Failed to fetch products')
        }
        setProducts(data)
      })
      .catch(err => {
        console.error('Failed to load products:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      })
      .finally(() => setLoading(false))
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black py-12 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <motion.h1 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-4xl font-bold mb-12 text-center text-white drop-shadow-lg"
        >
          Discover Amazing Products ✨
        </motion.h1>
        {loading ? (
          <div className="text-center text-white">Loading products...</div>
        ) : error ? (
          <div className="text-center text-red-400">
            Failed to load products: {error}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-white">No products found.</div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {products.map((product, index) => (
              <motion.div key={product.id} variants={item}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}