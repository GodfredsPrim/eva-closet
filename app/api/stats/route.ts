import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const totalProducts = await prisma.product.count()
    const totalOrders = await prisma.order.count()
    const pendingOrders = await prisma.order.count({
      where: { status: 'pending' }
    })

    const orders = await prisma.order.findMany()
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)

    return Response.json({
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders
    })
  } catch (error) {
    return Response.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
