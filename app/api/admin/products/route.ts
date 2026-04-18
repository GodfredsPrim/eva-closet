import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { mkdir, writeFile } from 'fs/promises'
import { prisma } from '@/lib/prisma'

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9.-]/g, '')
}

async function saveUploadedFile(file: File, folder: string) {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const filename = `${Date.now()}-${sanitizeFilename(file.name)}`
  const filepath = path.join(process.cwd(), 'public', folder, filename)

  await mkdir(path.dirname(filepath), { recursive: true })
  await writeFile(filepath, buffer)

  return `/${folder}/${filename}`
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
      .map((size) => size.trim())
      .filter(Boolean)
      .join(', ')

    if (!name || !description || Number.isNaN(price) || !category || !sizes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const imagePath = await saveUploadedFile(imageFile, 'images')
    const videoPath =
      videoInput instanceof File && videoInput.size > 0
        ? await saveUploadedFile(videoInput, 'videos')
        : null

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        image: imagePath,
        category,
        sizes,
        video: videoPath,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
