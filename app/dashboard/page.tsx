'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/lib/useAdminAuth'

interface Product {
  id: string
  name: string
  price: number
  category: string
  image: string
}

interface Order {
  id: string
  customerName: string
  customerPhone: string
  total: number
  status: string
  createdAt: string
}

interface Stats {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
}

const MIN_VIDEO_DURATION_SECONDS = 5
const MAX_VIDEO_DURATION_SECONDS = 10

function revokePreviewUrl(url: string | null) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

async function waitForVideoMetadata(video: HTMLVideoElement) {
  await new Promise<void>((resolve, reject) => {
    const handleLoadedMetadata = () => {
      cleanup()
      resolve()
    }

    const handleError = () => {
      cleanup()
      reject(new Error('This video format could not be processed in your browser.'))
    }

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('error', handleError)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
    video.addEventListener('error', handleError, { once: true })
  })
}

async function prepareProductVideo(file: File) {
  const sourceUrl = URL.createObjectURL(file)
  const video = document.createElement('video')
  const videoWithCapture = video as HTMLVideoElement & {
    captureStream?: () => MediaStream
    mozCaptureStream?: () => MediaStream
  }
  video.src = sourceUrl
  video.preload = 'metadata'
  video.playsInline = true
  video.crossOrigin = 'anonymous'

  await waitForVideoMetadata(video)

  if (!Number.isFinite(video.duration) || video.duration < MIN_VIDEO_DURATION_SECONDS) {
    URL.revokeObjectURL(sourceUrl)
    throw new Error(`Video must be at least ${MIN_VIDEO_DURATION_SECONDS} seconds long.`)
  }

  if (video.duration <= MAX_VIDEO_DURATION_SECONDS) {
    return {
      file,
      previewUrl: sourceUrl,
      message: `Video kept at ${video.duration.toFixed(1)}s.`,
    }
  }

  const captureStream =
    typeof videoWithCapture.captureStream === 'function'
      ? videoWithCapture.captureStream.bind(videoWithCapture)
      : typeof videoWithCapture.mozCaptureStream === 'function'
        ? videoWithCapture.mozCaptureStream.bind(videoWithCapture)
        : null

  if (!captureStream) {
    URL.revokeObjectURL(sourceUrl)
    throw new Error('Automatic video trimming is not supported in this browser.')
  }

  const mimeType =
    [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ].find((type) => MediaRecorder.isTypeSupported(type)) ?? ''

  if (!mimeType) {
    URL.revokeObjectURL(sourceUrl)
    throw new Error('Your browser could not encode the trimmed video.')
  }

  video.currentTime = 0
  const stream = captureStream()
  const recorder = new MediaRecorder(stream, { mimeType })
  const chunks: BlobPart[] = []

  const trimmedBlob = await new Promise<Blob>((resolve, reject) => {
    let stopTimer: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      if (stopTimer) {
        clearTimeout(stopTimer)
      }
      stream.getTracks().forEach((track) => track.stop())
      video.pause()
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(sourceUrl)
    }

    const stopRecording = () => {
      if (recorder.state !== 'inactive') {
        recorder.stop()
      }
    }

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    recorder.onerror = () => {
      cleanup()
      reject(new Error('Failed to trim the selected video.'))
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      cleanup()

      if (blob.size === 0) {
        reject(new Error('Failed to trim the selected video.'))
        return
      }

      resolve(blob)
    }

    video.onended = stopRecording
    recorder.start()

    video.play().then(() => {
      stopTimer = setTimeout(stopRecording, MAX_VIDEO_DURATION_SECONDS * 1000)
    }).catch(() => {
      cleanup()
      reject(new Error('Failed to process the selected video.'))
    })
  })

  const trimmedFile = new File(
    [trimmedBlob],
    `${file.name.replace(/\.[^.]+$/, '')}-trimmed.webm`,
    { type: trimmedBlob.type }
  )

  return {
    file: trimmedFile,
    previewUrl: URL.createObjectURL(trimmedBlob),
    message: `Video trimmed to ${MAX_VIDEO_DURATION_SECONDS}s.`,
  }
}

export default function DashboardPage() {
  const { isAuthenticated, loading: authLoading, logout } = useAdminAuth()

  const [activeTab, setActiveTab] = useState('overview')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  })
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [videoStatus, setVideoStatus] = useState('')
  const [processingVideo, setProcessingVideo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    sizes: '',
  })
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    sizes: '',
  })

  useEffect(() => {
    fetchProducts()
    fetchOrders()
    fetchStats()
  }, [])

  useEffect(() => {
    return () => {
      revokePreviewUrl(imagePreview)
      revokePreviewUrl(videoPreview)
    }
  }, [imagePreview, videoPreview])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      if (res.ok && Array.isArray(data)) {
        setOrders(data)
      } else if (data.error) {
        console.error('API error:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMessage('Product deleted successfully.')
        fetchProducts()
        fetchStats()
      }
    } catch (error) {
      setMessage('Failed to delete product.')
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        fetchOrders()
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to update order:', error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImage(file)
    setMessage('')

    if (!file) {
      setImagePreview(null)
      return
    }

    revokePreviewUrl(imagePreview)

    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    revokePreviewUrl(videoPreview)
    setVideoFile(null)
    setVideoPreview(null)
    setVideoStatus('')

    if (!file) {
      return
    }

    setProcessingVideo(true)

    try {
      const processed = await prepareProductVideo(file)
      setVideoFile(processed.file)
      setVideoPreview(processed.previewUrl)
      setVideoStatus(processed.message)
    } catch (error) {
      setVideoStatus(error instanceof Error ? error.message : 'Unable to prepare the selected video.')
      e.target.value = ''
    } finally {
      setProcessingVideo(false)
    }
  }

  const resetForm = () => {
    revokePreviewUrl(imagePreview)
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      sizes: '',
    })
    setImage(null)
    setImagePreview(null)
    revokePreviewUrl(videoPreview)
    setVideoFile(null)
    setVideoPreview(null)
    setVideoStatus('')
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!image) {
      setMessage('Please select an image.')
      return
    }

    setLoading(true)
    setMessage('')

    const data = new FormData()
    data.append('name', formData.name)
    data.append('description', formData.description)
    data.append('price', formData.price)
    data.append('category', formData.category)
    data.append('sizes', formData.sizes)
    data.append('image', image)

    if (videoFile) {
      data.append('video', videoFile)
    }

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        body: data,
      })

      if (res.ok) {
        setMessage('Product added successfully.')
        resetForm()
        fetchProducts()
        fetchStats()
      } else {
        const error = await res.json()
        setMessage(error.error || 'Failed to add product.')
      }
    } catch (error) {
      setMessage('Error adding product.')
    } finally {
      setLoading(false)
    }
  }

  const startEditProduct = (product: Product) => {
    setEditingProduct(product)
    setEditFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      sizes: product.sizes,
    })
    setMessage('')
  }

  const cancelEdit = () => {
    setEditingProduct(null)
    setEditFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      sizes: '',
    })
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          description: editFormData.description,
          price: parseFloat(editFormData.price),
          category: editFormData.category,
          sizes: editFormData.sizes,
        }),
      })

      if (res.ok) {
        setMessage('Product updated successfully.')
        cancelEdit()
        fetchProducts()
        fetchStats()
      } else {
        const error = await res.json()
        setMessage(error.error || 'Failed to update product.')
      }
    } catch (error) {
      setMessage('Error updating product.')
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  if (authLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="h-16 w-16 rounded-full border-4 border-emerald-500 border-t-cyan-500"
        />
      </motion.div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black px-4 py-8"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="mb-2 bg-gradient-to-r from-emerald-500 to-cyan-400 bg-clip-text text-4xl font-black text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-white/60">Manage your e-commerce platform</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/"
              className="rounded-lg bg-slate-700 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-600"
            >
              Back to Store
            </Link>
            <motion.button
              onClick={logout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg bg-red-500/20 px-6 py-3 font-medium text-red-400 transition-colors hover:bg-red-500/40"
            >
              Logout
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4"
        >
          {[
            { label: 'Total Products', value: stats.totalProducts, icon: 'Products' },
            { label: 'Total Orders', value: stats.totalOrders, icon: 'Orders' },
            { label: 'Pending Orders', value: stats.pendingOrders, icon: 'Pending' },
            { label: 'Total Revenue', value: `₵${(stats.totalRevenue ?? 0).toFixed(2)}`, icon: 'Revenue' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg transition-colors hover:border-emerald-500/50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-2 text-sm text-white/60">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <span className="text-sm uppercase tracking-[0.2em] text-white/40">{stat.icon}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex gap-2 overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/50 p-2"
        >
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'products', label: 'Products' },
            { id: 'orders', label: 'Orders' },
            { id: 'add-product', label: 'Add Product' },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`whitespace-nowrap rounded-lg px-6 py-3 font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 shadow-lg shadow-emerald-500/50'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-lg">
                <h2 className="mb-4 text-2xl font-bold text-white">Dashboard Overview</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-lg bg-slate-900/50 p-4">
                    <p className="mb-2 text-white/70">Platform Status</p>
                    <p className="text-2xl font-bold text-emerald-400">Operational</p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-4">
                    <p className="mb-2 text-white/70">Last Sync</p>
                    <p className="text-2xl font-bold text-white">Real-time</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              {editingProduct && (
                <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">Edit Product</h3>
                      <p className="text-sm text-white/60">Update product details and save changes.</p>
                    </div>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-white/80 transition hover:border-red-400 hover:text-red-300"
                    >
                      Cancel
                    </button>
                  </div>
                  <form onSubmit={handleUpdateProduct} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Product Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Category</label>
                      <input
                        type="text"
                        value={editFormData.category}
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                        className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-white">Description</label>
                      <textarea
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        rows={4}
                        className="w-full resize-none rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Price (GHS)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.price}
                        onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                        className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white">Sizes (comma separated)</label>
                      <input
                        type="text"
                        value={editFormData.sizes}
                        onChange={(e) => setEditFormData({ ...editFormData, sizes: e.target.value })}
                        className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-500 px-6 py-3 text-sm font-bold text-slate-900 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <p className="text-sm text-white/60">
                        Only text details can be edited here. Image and video updates can be added later.
                      </p>
                    </div>
                  </form>
                </div>
              )}
              {message && (
                <motion.div
                  className={`rounded-xl border p-4 text-center font-bold ${
                    !message.toLowerCase().includes('fail') && !message.toLowerCase().includes('error')
                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200'
                      : 'border-red-500/50 bg-red-500/20 text-red-200'
                  }`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {message}
                </motion.div>
              )}
              <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg">
                <div className="border-b border-slate-700 p-6">
                  <h2 className="text-2xl font-bold text-white">
                    Product Inventory ({products.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-900/50">
                        <th className="px-6 py-4 text-left font-semibold text-white/80">Product</th>
                        <th className="px-6 py-4 text-left font-semibold text-white/80">Category</th>
                        <th className="px-6 py-4 text-left font-semibold text-white/80">Price</th>
                        <th className="px-6 py-4 text-left font-semibold text-white/80">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product, index) => (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-slate-700 transition-colors hover:bg-slate-800/30"
                        >
                          <td className="flex items-center gap-3 px-6 py-4">
                            <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                            <span className="font-medium text-white">{product.name}</span>
                          </td>
                          <td className="px-6 py-4 text-white/70">{product.category}</td>
                          <td className="px-6 py-4 font-bold text-emerald-400">₵{product.price.toFixed(2)}</td>
                          <td className="px-6 py-4 flex items-center gap-2">
                            <motion.button
                              onClick={() => startEditProduct(product)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="rounded-lg bg-cyan-500/20 px-4 py-2 font-medium text-cyan-200 transition-colors hover:bg-cyan-500/40"
                            >
                              Edit
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteProduct(product.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="rounded-lg bg-red-500/20 px-4 py-2 font-medium text-red-400 transition-colors hover:bg-red-500/40"
                            >
                              Delete
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg">
                <div className="border-b border-slate-700 p-6">
                  <h2 className="text-2xl font-bold text-white">
                    Order Management ({orders.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-900/50">
                        <th className="px-6 py-4 text-left font-semibold text-white/80">Order ID</th>
                        <th className="px-6 py-4 text-left font-semibold text-white/80">Customer</th>
                        <th className="px-6 py-4 text-left font-semibold text-white/80">Total</th>
                        <th className="px-6 py-4 text-left font-semibold text-white/80">Status</th>
                        <th className="px-6 py-4 text-left font-semibold text-white/80">Date</th>
                        <th className="px-6 py-4 text-left font-semibold text-white/80">Action</th>
                      </tr>
                    </thead>
<tbody>
                      {Array.isArray(orders) && orders.length > 0 ? (
                        orders.map((order, index) => (
                          <motion.tr
                            key={order.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-slate-700 transition-colors hover:bg-slate-800/30"
                          >
                            <td className="px-6 py-4 font-mono text-sm text-white/80">
                              {order.id.slice(0, 8)}...
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-white">{order.customerName}</p>
                                <p className="text-sm text-white/60">{order.customerPhone}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-emerald-400">₵{(order.total ?? 0).toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-sm font-medium ${
                                  order.status === 'pending'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : order.status === 'shipped'
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : 'bg-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-white/60">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                              >
                                <option value="pending">Pending</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                              </select>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-white/60">
                            No orders yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'add-product' && (
            <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-lg">
              <h2 className="mb-8 text-2xl font-bold text-white">Add New Product</h2>
              <form onSubmit={handleAddProduct} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-semibold text-white">Product Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none"
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-semibold text-white">Price (GHS)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-white">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none"
                    placeholder="Describe your product"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-semibold text-white">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none"
                      placeholder="e.g. Dresses, Shirts"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-semibold text-white">Sizes (comma separated)</label>
                    <input
                      type="text"
                      value={formData.sizes}
                      onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                      className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none"
                      placeholder="S, M, L, XL"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-white">Product Video (optional)</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-900 hover:file:bg-cyan-400"
                  />
                  <p className="mt-2 text-sm text-white/50">
                    Upload from device. Videos shorter than 5 seconds are rejected, and anything over 10 seconds is trimmed automatically.
                  </p>
                  {videoStatus && (
                    <p className={`mt-3 text-sm ${videoFile ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {videoStatus}
                    </p>
                  )}
                  {videoPreview && (
                    <motion.div
                      className="mt-4"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <video
                        src={videoPreview}
                        controls
                        className="max-w-xs rounded-lg border border-emerald-500/30 shadow-lg"
                      />
                    </motion.div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-white">Product Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-900 hover:file:bg-emerald-400"
                    required
                  />
                  {imagePreview && (
                    <motion.div
                      className="mt-4"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-xs rounded-lg border border-emerald-500/30 shadow-lg"
                      />
                    </motion.div>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || processingVideo}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4 text-lg font-bold text-slate-900 shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading || processingVideo ? 'Adding Product...' : 'Add Product'}
                </motion.button>
              </form>

              {message && (
                <motion.div
                  className={`mt-6 rounded-lg border p-4 text-center font-bold ${
                    !message.toLowerCase().includes('fail') && !message.toLowerCase().includes('error')
                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200'
                      : 'border-red-500/50 bg-red-500/20 text-red-200'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {message}
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
