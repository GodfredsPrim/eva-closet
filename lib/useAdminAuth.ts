import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useAdminAuth() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if admin is authenticated
    const authData = localStorage.getItem('admin_auth')
    
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        if (parsed.authenticated) {
          setIsAuthenticated(true)
          setLoading(false)
          return
        }
      } catch (error) {
        console.error('Failed to parse auth data:', error)
      }
    }

    setIsAuthenticated(false)
    setLoading(false)
    // Redirect to login
    router.push('/admin/login')
  }, [router])

  const logout = () => {
    localStorage.removeItem('admin_auth')
    router.push('/admin/login')
  }

  return { isAuthenticated, loading, logout }
}
