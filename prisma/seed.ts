import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = [
    {
      name: 'Classic White T-Shirt',
      description: 'A comfortable and versatile white t-shirt made from 100% cotton.',
      price: 19.99,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      category: 'T-Shirts',
      sizes: 'S,M,L,XL',
      video: null
    },
    {
      name: 'Blue Denim Jeans',
      description: 'Classic blue denim jeans with a straight fit, perfect for everyday wear.',
      price: 49.99,
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
      category: 'Jeans',
      sizes: '28,30,32,34,36',
      video: null
    },
    {
      name: 'Black Leather Jacket',
      description: 'Stylish black leather jacket with a modern cut and premium leather material.',
      price: 129.99,
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      category: 'Jackets',
      sizes: 'S,M,L,XL',
      video: null
    },
    {
      name: 'Red Summer Dress',
      description: 'Elegant red summer dress with floral patterns, ideal for warm weather.',
      price: 39.99,
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
      category: 'Dresses',
      sizes: 'XS,S,M,L',
      video: null
    },
    {
      name: 'Gray Hoodie',
      description: 'Cozy gray hoodie made from soft fleece material, perfect for casual outings.',
      price: 34.99,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
      category: 'Hoodies',
      sizes: 'S,M,L,XL,XXL',
      video: null
    },
    {
      name: 'White Sneakers',
      description: 'Comfortable white sneakers with a minimalist design and excellent support.',
      price: 59.99,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
      category: 'Shoes',
      sizes: '6,7,8,9,10,11',
      video: null
    }
  ]

  for (const product of products) {
    await prisma.product.create({
      data: product
    })
  }

  console.log('Database seeded with sample products')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })