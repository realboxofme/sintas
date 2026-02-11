'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast({
        title: 'Validasi Error',
        description: 'Mohon isi semua field',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        // Save user data to localStorage
        localStorage.setItem('sintas_user', JSON.stringify(result.data.user))
        
        toast({
          title: 'Login Berhasil',
          description: `Selamat datang, ${result.data.user.nama}!`,
        })

        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/')
        }, 1000)
      } else {
        toast({
          title: 'Login Gagal',
          description: result.error || 'Email atau password salah',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat login',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    // Set form data
    setFormData({
      email: 'admin@sintas.com',
      password: 'admin123',
    })

    // Auto submit after a short delay to allow state to update
    setTimeout(() => {
      // Create and dispatch submit event properly
      const form = document.querySelector('form')
      if (form) {
        form.requestSubmit()
      }
    }, 100)
  }

  return (
    <div className="min-h-screen soft-gradient dark:soft-gradient-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2">SINTAS</h1>
          <p className="text-muted-foreground">Sistem Integrasi Administrasi Surat</p>
        </div>

        <Card className="shadow-xl border-0 glass-effect">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Masuk ke Akun</CardTitle>
            <CardDescription>
              Masukkan email dan password untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="•••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-800 px-2 text-muted-foreground">
                    Atau
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleDemoLogin}
              >
                <Lock className="w-4 h-4 mr-2" />
                Login dengan Akun Demo
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Akun Demo: admin@sintas.com / admin123</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 SINTAS - Sistem Integrasi Administrasi Surat</p>
        </div>
      </div>
    </div>
  )
}
