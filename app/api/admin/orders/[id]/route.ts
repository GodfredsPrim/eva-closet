import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  context: RouteContext<'/api/admin/orders/[id]'>
) {
  try {
    const { id } = await context.params
    const { status } = await request.json()

    if (!status || !['pending', 'shipped', 'delivered'].includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    })

    return Response.json(order)
  } catch (error) {
    console.error('Update order error:', error)
    return Response.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
