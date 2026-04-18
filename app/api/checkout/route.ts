import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderNotification } from '@/lib/email'

type CheckoutItem = {
  productId: string
  size?: string | null
  quantity: number
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const items = Array.isArray(body.items) ? (body.items as CheckoutItem[]) : []
    const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : ''
    const customerPhone = typeof body.customerPhone === 'string' ? body.customerPhone.trim() : ''
    const customerAddress = typeof body.customerAddress === 'string' ? body.customerAddress.trim() : ''

    if (!customerName || !customerPhone || !customerAddress) {
      return NextResponse.json(
        { error: 'Please complete your name, phone, and address.' },
        { status: 400 }
      )
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 })
    }

    const productIds = items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    })

    if (products.length !== items.length) {
      return NextResponse.json(
        { error: 'Some products in your cart are no longer available.' },
        { status: 400 }
      )
    }

    const productMap = new Map(products.map((product) => [product.id, product]))

    const orderItemsData = items.map((item) => {
      const product = productMap.get(item.productId)

      if (!product || !Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new Error('INVALID_CART_ITEM')
      }

      return {
        productId: product.id,
        size: typeof item.size === 'string' && item.size.trim() ? item.size.trim() : null,
        quantity: item.quantity,
        price: product.price,
      }
    })

    const total = orderItemsData.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    const order = await prisma.order.create({
      data: {
        customerName,
        customerPhone,
        customerAddress,
        total,
        status: 'pending',
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    })

    try {
      await sendOrderNotification(order)
    } catch (notifyError) {
      console.error('Order notification failed:', notifyError)
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      total,
      adminMomoNumber: process.env.ADMIN_MOMO_NUMBER || '',
      paymentInstructions:
        'Send the full amount to the MTN MOMO admin number, then share your name and order ID as the payment reference.',
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CART_ITEM') {
      return NextResponse.json(
        { error: 'Your cart contains an invalid item.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to place order. Please try again.' },
      { status: 500 }
    )
  }
}
