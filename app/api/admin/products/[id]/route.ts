import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set')
  return createClient(url, key)
}

function storagePathFromUrl(publicUrl: string | null): string | null {
  if (!publicUrl) return null
  // Extract path after /storage/v1/object/public/products/
  const marker = '/object/public/products/'
  const idx = publicUrl.indexOf(marker)
  return idx !== -1 ? publicUrl.slice(idx + marker.length) : null
}

async function deleteStorageFile(publicUrl: string | null) {
  const path = storagePathFromUrl(publicUrl)
  if (!path) return
  try {
    const supabase = getSupabase()
    await supabase.storage.from('products').remove([path])
  } catch (error) {
    console.error('Failed to delete storage file:', error)
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
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ')

    if (!name || !description || Number.isNaN(price) || !category || !sizes) {
      return Response.json({ error: 'Missing or invalid fields' }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: { name, description, price, category, sizes },
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

    const product = await prisma.product.findUnique({ where: { id } })

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 })
    }

    await deleteStorageFile(product.image)
    await deleteStorageFile(product.video)

    await prisma.product.delete({ where: { id } })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return Response.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
