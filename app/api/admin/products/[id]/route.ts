import type { NextRequest } from 'next/server'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'

async function removePublicFile(filePath: string | null) {
  if (!filePath) {
    return
  }

  try {
    const absolutePath = join(process.cwd(), 'public', filePath.replace(/^\/+/, ''))
    await unlink(absolutePath)
  } catch (error) {
    console.error('Failed to delete file:', error)
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<'/api/admin/products/[id]'>
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const name = body.name as string
    const description = body.description as string
    const price = parseFloat(body.price)
    const category = body.category as string
    const sizes = (body.sizes as string)
      .split(',')
      .map((size) => size.trim())
      .filter(Boolean)
      .join(', ')

    if (!name || !description || Number.isNaN(price) || !category || !sizes) {
      return Response.json({ error: 'Missing or invalid fields' }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        category,
        sizes,
      },
    })

    return Response.json(product)
  } catch (error) {
    console.error('Update product error:', error)
    return Response.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<'/api/admin/products/[id]'>
) {
  try {
    const { id } = await context.params

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 })
    }

    await removePublicFile(product.image)
    await removePublicFile(product.video)

    await prisma.product.delete({
      where: { id },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return Response.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
