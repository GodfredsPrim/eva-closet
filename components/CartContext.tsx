'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CartItem {
  id: string
  productId: string
  size: string | null
  quantity: number
  product: {
    id: string
    name: string
    price: number
    image: string
    size: string | null
  }
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (
    product: {
      id: string
      name: string
      price: number
      image: string
    },
    size?: string | null
  ) => void
  removeFromCart: (itemId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as Array<{
          id?: string
          productId: string
          size?: string | null
          quantity: number
          product: {
            id: string
            name: string
            price: number
            image: string
            size?: string | null
          }
        }>

        setCart(
          parsedCart.map((item) => {
            const normalizedSize = item.size?.trim() || item.product.size?.trim() || null
            return {
              id: item.id || `${item.productId}:${normalizedSize ?? 'no-size'}`,
              productId: item.productId,
              size: normalizedSize,
              quantity: item.quantity,
              product: {
                ...item.product,
                size: normalizedSize,
              },
            }
          })
        )
      } catch {
        setCart([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (
    product: {
      id: string
      name: string
      price: number
      image: string
    },
    size?: string | null
  ) => {
    const normalizedSize = size?.trim() || null
    const itemId = `${product.id}:${normalizedSize ?? 'no-size'}`

    setCart(prev => {
      const existing = prev.find(item => item.id === itemId)
      if (existing) {
        return prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prev, {
          id: itemId,
          productId: product.id,
          size: normalizedSize,
          quantity: 1,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            size: normalizedSize,
          }
        }]
      }
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  const clearCart = () => {
    setCart([])
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
