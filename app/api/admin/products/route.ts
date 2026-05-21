import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set')
  return createClient(url, key)
}

async function uploadFile(file: File, folder: string): Promise<string> {
  const supabase = getSupabase()
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '')
  const path = `${folder}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage
    .from('products')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from('products').getPublicUrl(path)
  return data.publicUrl
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const imageFile = formData.get('image')
    const videoInput = formData.get('video')

    if (!(imageFile instanceof File) || imageFile.size === 0) {
      return NextResponse.json({ error: 'No image file uploaded' }, { status: 400 })
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const category = formData.get('category') as string
    const sizes = (formData.get('sizes') as string)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .join(', ')

    if (!name || !description || Number.isNaN(price) || !category || !sizes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const imageUrl = await uploadFile(imageFile, 'images')
    const videoUrl =
      videoInput instanceof File && videoInput.size > 0
        ? await uploadFile(videoInput, 'videos')
        : null

    const product = await prisma.product.create({
      data: { name, description, price, image: imageUrl, category, sizes, video: videoUrl },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('POST /api/admin/products error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create product', details: message }, { status: 500 })
  }
}
