'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Inbox,
  Send,
  FileText,
  Archive,
  BarChart3,
  Users,
  Menu,
  X,
  Bell,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Download,
  Filter,
  Calendar,
  User as UserIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogOut
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import * as API from '@/lib/api'

type ViewType = 'dashboard' | 'surat-masuk' | 'surat-keluar' | 'disposisi' | 'arsip' | 'laporan' | 'users'

interface SuratMasuk {
  id: string
  nomorSurat: string
  tanggalSurat: string
  tanggalTerima: string
  pengirim: string
  perihal: string
  sifatSurat: string
  status: string
  penerima: string | { nama: string; jabatan?: string }
  penerimaId?: string
}

interface SuratKeluar {
  id: string
  nomorSurat: string
  tanggalSurat: string
  penerima: string
  perihal: string
  sifatSurat: string
  status: string
  pengirim: string | { nama: string; jabatan?: string }
  pengirimId?: string
}

interface User {
  id: string
  nama: string
  email: string
  jabatan?: string
}

interface Role {
  id: string
  nama: string
  deskripsi?: string
}

interface DisposisiData {
  id: string
  suratMasukId: string
  dari: { nama: string; jabatan?: string }
  ke: { nama: string; jabatan?: string }
  instruksi: string
  status: string
  tanggalDisposisi: string
  suratMasuk?: {
    id: string
    nomorSurat: string
    perihal: string
    pengirim: string
  }
}

interface LaporanData {
  totalSuratMasuk: number
  totalSuratKeluar: number
  totalDisposisi: number
  totalArsip: number
}

export default function SINTASApp() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loginTime, setLoginTime] = useState<string | null>(null)
  const [sessionDuration, setSessionDuration] = useState<number>(0)
  
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Data states
  const [suratMasuk, setSuratMasuk] = useState<SuratMasuk[]>([])
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluar[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [disposisi, setDisposisi] = useState<DisposisiData[]>([])
  const [laporan, setLaporan] = useState<LaporanData | null>(null)
  const [stats, setStats] = useState({
    suratMasuk: 0,
    suratKeluar: 0,
    disposisi: 0,
    arsip: 0
  })

  // Form states
  const [suratMasukForm, setSuratMasukForm] = useState({
    nomorSurat: '',
    tanggalSurat: '',
    pengirim: '',
    perihal: '',
    sifatSurat: 'Biasa',
    penerimaId: '',
    catatan: ''
  })

  const [suratKeluarForm, setSuratKeluarForm] = useState({
    nomorSurat: '',
    tanggalSurat: '',
    penerima: '',
    alamatPenerima: '',
    perihal: '',
    sifatSurat: 'Biasa',
    pengirimId: '',
    catatan: ''
  })

  const [userForm, setUserForm] = useState({
    nama: '',
    email: '',
    password: '',
    nip: '',
    jabatan: '',
    telepon: '',
    roleId: ''
  })

  const [disposisiForm, setDisposisiForm] = useState({
    suratMasukId: '',
    dariId: '',
    keId: '',
    instruksi: '',
    catatan: ''
  })

  const [laporanForm, setLaporanForm] = useState({
    jenis: 'semua',
    tanggalMulai: '',
    tanggalSelesai: ''
  })

  // Dialog states
  const [suratMasukDialogOpen, setSuratMasukDialogOpen] = useState(false)
  const [suratKeluarDialogOpen, setSuratKeluarDialogOpen] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [disposisiDialogOpen, setDisposisiDialogOpen] = useState(false)

  const [arsipForm, setArsipForm] = useState({
    jenisSurat: 'SuratMasuk',
    suratMasukId: '',
    suratKeluarId: '',
    kategori: '',
    lokasiArsip: '',
    diarsipkanOlehId: '',
    retensi: '5',
    statusArsip: 'Aktif',
    catatan: ''
  })

  const [arsipDialogOpen, setArsipDialogOpen] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    const user = localStorage.getItem('sintas_user')
    const loginTimeStr = localStorage.getItem('sintas_login_time')
    
    if (user) {
      setCurrentUser(JSON.parse(user))
      setIsAuthenticated(true)
      
      // Set waktu login jika ada
      if (loginTimeStr) {
        setLoginTime(loginTimeStr)
        // Hitung durasi session
        const loginTime = new Date(loginTimeStr)
        const now = new Date()
        const duration = Math.floor((now.getTime() - loginTime.getTime()) / 1000) // dalam detik
        setSessionDuration(duration)
      }
    } else {
      router.push('/login')
    }
    
    // Update durasi session setiap 1 menit
    const interval = setInterval(() => {
      if (loginTime) {
        const loginTimeDate = new Date(loginTime)
        const now = new Date()
        const duration = Math.floor((now.getTime() - loginTimeDate.getTime()) / 1000)
        setSessionDuration(duration)
      }
    }, 60000) // Update setiap 1 menit

    setLoading(false)

    return () => clearInterval(interval)
  }, [router])

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      checkAndInitializeData()
      fetchAllData()
    }
  }, [isAuthenticated])

  const handleLogout = async () => {
    if (!confirm('Apakah Anda yakin ingin logout?')) return

    try {
      setLoading(true)
      
      // Panggil API logout untuk mencatat log ke database
      if (currentUser) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: currentUser.id }),
        })
      }

      // Hapus data localStorage
      localStorage.removeItem('sintas_user')
      localStorage.removeItem('sintas_login_time')
      
      setCurrentUser(null)
      setLoginTime(null)
      setSessionDuration(0)
      setIsAuthenticated(false)
      
      toast({
        title: 'Logout Berhasil',
        description: 'Anda telah logout dari sistem',
      })
      
      router.push('/login')
    } catch (error) {
      console.error('Error during logout:', error)
      toast({
        title: 'Error',
        description: 'Gagal logout. Data lokal akan dihapus.',
        variant: 'destructive'
      })
      
      // Force logout bahkan jika API gagal
      localStorage.removeItem('sintas_user')
      localStorage.removeItem('sintas_login_time')
      setCurrentUser(null)
      setLoginTime(null)
      setSessionDuration(0)
      setIsAuthenticated(false)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const checkAndInitializeData = async () => {
    try {
      // Check if data is initialized
      const response = await fetch('/api/init')
      const result = await response.json()
      
      if (result.success && !result.data.initialized) {
        // Initialize default data
        await fetch('/api/init', { method: 'POST' })
      }
    } catch (error) {
      console.error('Error checking initialization:', error)
    }
  }

  // Helper functions to get display values
  const getPenerimaNama = (penerima: string | { nama: string; jabatan?: string }) => {
    if (typeof penerima === 'string') return penerima
    return penerima.nama
  }

  const getPengirimNama = (pengirim: string | { nama: string; jabatan?: string }) => {
    if (typeof pengirim === 'string') return pengirim
    return pengirim.nama
  }

  const fetchAllData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [suratMasukRes, suratKeluarRes, usersRes, statsRes, rolesRes, disposisiRes] = await Promise.all([
        API.suratMasukAPI.getAll({ limit: 100 }),
        API.suratKeluarAPI.getAll({ limit: 100 }),
        API.usersAPI.getAll({ limit: 100 }),
        API.dashboardAPI.getStats(),
        API.rolesAPI.getAll({ limit: 100 }),
        API.disposisiAPI.getAll({ limit: 100 })
      ])

      if (suratMasukRes.success) {
        setSuratMasuk(suratMasukRes.data)
      }
      
      if (suratKeluarRes.success) {
        setSuratKeluar(suratKeluarRes.data)
      }
      
      if (usersRes.success) {
        setUsers(usersRes.data)
      }

      if (rolesRes.success) {
        setRoles(rolesRes.data)
      }

      if (disposisiRes.success) {
        setDisposisi(disposisiRes.data)
      }
      
      if (statsRes.success) {
        setStats({
          suratMasuk: statsRes.data.overview.totalSuratMasuk,
          suratKeluar: statsRes.data.overview.totalSuratKeluar,
          disposisi: statsRes.data.overview.totalDisposisiPending,
          arsip: statsRes.data.overview.totalArsip
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handlers for Surat Masuk
  const handleCreateSuratMasuk = async () => {
    if (!suratMasukForm.nomorSurat || !suratMasukForm.tanggalSurat || 
        !suratMasukForm.pengirim || !suratMasukForm.perihal || !suratMasukForm.penerimaId) {
      toast({
        title: 'Validasi Error',
        description: 'Mohon isi semua field yang wajib diisi',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      const response = await API.suratMasukAPI.create(suratMasukForm)
      
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Surat masuk berhasil ditambahkan'
        })
        setSuratMasukDialogOpen(false)
        resetSuratMasukForm()
        fetchAllData()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan surat masuk',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSuratMasuk = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus surat ini?')) return

    try {
      setLoading(true)
      const response = await API.suratMasukAPI.delete(id)
      
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Surat masuk berhasil dihapus'
        })
        fetchAllData()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus surat masuk',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handlers for Surat Keluar
  const handleCreateSuratKeluar = async (send: boolean = false) => {
    if (!suratKeluarForm.nomorSurat || !suratKeluarForm.tanggalSurat || 
        !suratKeluarForm.penerima || !suratKeluarForm.perihal || !suratKeluarForm.pengirimId) {
      toast({
        title: 'Validasi Error',
        description: 'Mohon isi semua field yang wajib diisi',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      const response = await API.suratKeluarAPI.create({
        ...suratKeluarForm,
        status: send ? 'Dikirim' : 'Disetujui'
      })
      
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: send ? 'Surat keluar berhasil dikirim' : 'Surat keluar berhasil disimpan'
        })
        setSuratKeluarDialogOpen(false)
        resetSuratKeluarForm()
        fetchAllData()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan surat keluar',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSuratKeluar = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus surat ini?')) return

    try {
      setLoading(true)
      const response = await API.suratKeluarAPI.delete(id)
      
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Surat keluar berhasil dihapus'
        })
        fetchAllData()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus surat keluar',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handlers for Users
  const handleCreateUser = async () => {
    if (!userForm.nama || !userForm.email || !userForm.password || !userForm.roleId) {
      toast({
        title: 'Validasi Error',
        description: 'Mohon isi semua field yang wajib diisi',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      const response = await API.usersAPI.create(userForm)
      
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'User berhasil ditambahkan'
        })
        setUserDialogOpen(false)
        resetUserForm()
        fetchAllData()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan user',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return

    try {
      setLoading(true)
      const response = await API.usersAPI.delete(id)
      
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'User berhasil dihapus'
        })
        fetchAllData()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus user',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handler for Disposisi
  const handleCreateDisposisi = async () => {
    if (!disposisiForm.suratMasukId || !disposisiForm.dariId || !disposisiForm.keId || !disposisiForm.instruksi) {
      toast({
        title: 'Validasi Error',
        description: 'Mohon isi semua field yang wajib diisi',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      const response = await API.disposisiAPI.create(disposisiForm)
      
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Disposisi berhasil ditambahkan'
        })
        setDisposisiDialogOpen(false)
        resetDisposisiForm()
        fetchAllData()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan disposisi',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDisposisi = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus disposisi ini?')) return

    try {
      setLoading(true)
      const response = await API.disposisiAPI.delete(id)
      
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Disposisi berhasil dihapus'
        })
        fetchAllData()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus disposisi',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handler for Laporan
  const handleGenerateLaporan = async () => {
    try {
      setLoading(true)
      const response = await API.laporanAPI.generate({
        jenis: laporanForm.jenis,
        tanggalMulai: laporanForm.tanggalMulai || undefined,
        tanggalSelesai: laporanForm.tanggalSelesai || undefined
      })
      
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Laporan berhasil digenerate'
        })
        setLaporan(response.data)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal generate laporan',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handler for Arsip
  const handleCreateArsip = async () => {
    if (!arsipForm.jenisSurat || !arsipForm.kategori || !arsipForm.diarsipkanOlehId) {
      toast({
        title: 'Validasi Error',
        description: 'Mohon isi semua field yang wajib diisi',
        variant: 'destructive'
      })
      return
    }

    // Validasi surat ID berdasarkan jenis
    if (arsipForm.jenisSurat === 'SuratMasuk' && !arsipForm.suratMasukId) {
      toast({
        title: 'Validasi Error',
        description: 'Pilih surat masuk yang akan diarsipkan',
        variant: 'destructive'
      })
      return
    }

    if (arsipForm.jenisSurat === 'SuratKeluar' && !arsipForm.suratKeluarId) {
      toast({
        title: 'Validasi Error',
        description: 'Pilih surat keluar yang akan diarsipkan',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      const response = await API.arsipAPI.create({
        jenisSurat: arsipForm.jenisSurat as 'SuratMasuk' | 'SuratKeluar',
        suratMasukId: arsipForm.jenisSurat === 'SuratMasuk' ? arsipForm.suratMasukId : undefined,
        suratKeluarId: arsipForm.jenisSurat === 'SuratKeluar' ? arsipForm.suratKeluarId : undefined,
        kategori: arsipForm.kategori,
        lokasiArsip: arsipForm.lokasiArsip || undefined,
        diarsipkanOlehId: arsipForm.diarsipkanOlehId,
        retensi: arsipForm.retensi ? parseInt(arsipForm.retensi) : 5,
        statusArsip: arsipForm.statusArsip as 'Aktif' | 'Inaktif' | 'Dimusnahkan',
        catatan: arsipForm.catatan || undefined,
      })
      
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Arsip berhasil ditambahkan'
        })
        setArsipDialogOpen(false)
        resetArsipForm()
        fetchAllData()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan arsip',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteArsip = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus arsip ini?')) return

    try {
      setLoading(true)
      const response = await API.arsipAPI.delete(id)
      
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Arsip berhasil dihapus'
        })
        fetchAllData()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus arsip',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Reset functions
  const resetSuratMasukForm = () => {
    setSuratMasukForm({
      nomorSurat: '',
      tanggalSurat: '',
      pengirim: '',
      perihal: '',
      sifatSurat: 'Biasa',
      penerimaId: '',
      catatan: ''
    })
  }

  const resetSuratKeluarForm = () => {
    setSuratKeluarForm({
      nomorSurat: '',
      tanggalSurat: '',
      penerima: '',
      alamatPenerima: '',
      perihal: '',
      sifatSurat: 'Biasa',
      pengirimId: '',
      catatan: ''
    })
  }

  const resetUserForm = () => {
    setUserForm({
      nama: '',
      email: '',
      password: '',
      nip: '',
      jabatan: '',
      telepon: '',
      roleId: ''
    })
  }

  const resetDisposisiForm = () => {
    setDisposisiForm({
      suratMasukId: '',
      dariId: '',
      keId: '',
      instruksi: '',
      catatan: ''
    })
  }

  const resetArsipForm = () => {
    setArsipForm({
      jenisSurat: 'SuratMasuk',
      suratMasukId: '',
      suratKeluarId: '',
      kategori: '',
      lokasiArsip: '',
      diarsipkanOlehId: '',
      retensi: '5',
      statusArsip: 'Aktif',
      catatan: ''
    })
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'surat-masuk', label: 'Surat Masuk', icon: Inbox },
    { id: 'surat-keluar', label: 'Surat Keluar', icon: Send },
    { id: 'disposisi', label: 'Disposisi', icon: FileText },
    { id: 'arsip', label: 'Arsip', icon: Archive },
    { id: 'laporan', label: 'Laporan', icon: BarChart3 },
    { id: 'users', label: 'Manajemen User', icon: Users },
  ]

  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Dashboard</h2>
        <p className="text-muted-foreground">Ringkasan aktivitas surat hari ini</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card card-hover border border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Surat Masuk</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Inbox className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.suratMasuk}</div>
            <p className="text-xs text-muted-foreground mt-1">Total surat masuk</p>
          </CardContent>
        </Card>

        <Card className="card-hover border border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Surat Keluar</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{stats.suratKeluar}</div>
            <p className="text-xs text-muted-foreground mt-1">Total surat keluar</p>
          </CardContent>
        </Card>

        <Card className="card-hover border border-amber-500/20 bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/30 dark:to-amber-900/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Disposisi</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">{stats.disposisi}</div>
            <p className="text-xs text-muted-foreground mt-1">Perlu tindakan</p>
          </CardContent>
        </Card>

        <Card className="card-hover border border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/30 dark:to-purple-900/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Arsip</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Archive className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.arsip}</div>
            <p className="text-xs text-muted-foreground mt-1">Total arsip</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle>Informasi Sistem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">SINTAS Berjalan</p>
                <p className="text-sm text-muted-foreground">Semua sistem berfungsi normal</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 border border-primary/20">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{users.length} User Terdaftar</p>
                <p className="text-sm text-muted-foreground">Sistem memiliki {users.length} pengguna aktif</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderSuratMasuk = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Surat Masuk</h2>
          <p className="text-muted-foreground">Kelola surat yang masuk ke instansi</p>
        </div>
        <Dialog open={suratMasukDialogOpen} onOpenChange={setSuratMasukDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={() => resetSuratMasukForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Surat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Surat Masuk Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomorSurat">Nomor Surat *</Label>
                  <Input 
                    id="nomorSurat" 
                    placeholder="SM/2024/XXX" 
                    value={suratMasukForm.nomorSurat}
                    onChange={(e) => setSuratMasukForm({...suratMasukForm, nomorSurat: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggalSurat">Tanggal Surat *</Label>
                  <Input 
                    id="tanggalSurat" 
                    type="date" 
                    value={suratMasukForm.tanggalSurat}
                    onChange={(e) => setSuratMasukForm({...suratMasukForm, tanggalSurat: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pengirim">Pengirim *</Label>
                <Input 
                  id="pengirim" 
                  placeholder="Nama instansi/pengirim" 
                  value={suratMasukForm.pengirim}
                  onChange={(e) => setSuratMasukForm({...suratMasukForm, pengirim: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perihal">Perihal *</Label>
                <Input 
                  id="perihal" 
                  placeholder="Perihal surat" 
                  value={suratMasukForm.perihal}
                  onChange={(e) => setSuratMasukForm({...suratMasukForm, perihal: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sifatSurat">Sifat Surat *</Label>
                  <Select value={suratMasukForm.sifatSurat} onValueChange={(value) => setSuratMasukForm({...suratMasukForm, sifatSurat: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih sifat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Biasa">Biasa</SelectItem>
                      <SelectItem value="Penting">Penting</SelectItem>
                      <SelectItem value="Rahasia">Rahasia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="penerima">Penerima *</Label>
                  <Select value={suratMasukForm.penerimaId} onValueChange={(value) => setSuratMasukForm({...suratMasukForm, penerimaId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih penerima" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>{user.nama} {user.jabatan ? `(${user.jabatan})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan</Label>
                <Textarea 
                  id="catatan" 
                  placeholder="Catatan tambahan..." 
                  rows={3}
                  value={suratMasukForm.catatan}
                  onChange={(e) => setSuratMasukForm({...suratMasukForm, catatan: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSuratMasukDialogOpen(false)
                    resetSuratMasukForm()
                  }}
                >
                  Batal
                </Button>
                <Button onClick={handleCreateSuratMasuk} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Simpan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari surat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => fetchAllData()}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Surat List */}
      {loading && suratMasuk.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {suratMasuk.filter(s => 
            s.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.pengirim.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getPenerimaNama(s.penerima).toLowerCase().includes(searchTerm.toLowerCase())
          ).map((surat) => (
            <Card key={surat.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{surat.nomorSurat}</h3>
                      <Badge variant={
                        surat.sifatSurat === 'Penting' ? 'destructive' :
                        surat.sifatSurat === 'Rahasia' ? 'secondary' : 'default'
                      }>
                        {surat.sifatSurat}
                      </Badge>
                      <Badge variant={
                        surat.status === 'Selesai' ? 'default' :
                        surat.status === 'Diproses' ? 'secondary' : 'outline'
                      }>
                        {surat.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{surat.perihal}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        {surat.pengirim}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(surat.tanggalSurat).toLocaleDateString('id-ID')}
                      </span>
                      <span>Penerima: {getPenerimaNama(surat.penerima)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteSuratMasuk(surat.id)} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {suratMasuk.length === 0 && !loading && (
            <Card>
              <CardContent className="p-12 text-center">
                <Inbox className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Belum ada surat masuk</p>
                <Button className="mt-4" onClick={() => setSuratMasukDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Surat Pertama
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )

  const renderSuratKeluar = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Surat Keluar</h2>
          <p className="text-muted-foreground">Kelola surat yang dikirim dari instansi</p>
        </div>
        <Dialog open={suratKeluarDialogOpen} onOpenChange={setSuratKeluarDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={() => resetSuratKeluarForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Surat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Surat Keluar Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sk-nomorSurat">Nomor Surat *</Label>
                  <Input 
                    id="sk-nomorSurat" 
                    placeholder="SK/2024/XXX" 
                    value={suratKeluarForm.nomorSurat}
                    onChange={(e) => setSuratKeluarForm({...suratKeluarForm, nomorSurat: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sk-tanggalSurat">Tanggal Surat *</Label>
                  <Input 
                    id="sk-tanggalSurat" 
                    type="date" 
                    value={suratKeluarForm.tanggalSurat}
                    onChange={(e) => setSuratKeluarForm({...suratKeluarForm, tanggalSurat: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sk-penerima">Penerima *</Label>
                <Input 
                  id="sk-penerima" 
                  placeholder="Nama instansi/penerima" 
                  value={suratKeluarForm.penerima}
                  onChange={(e) => setSuratKeluarForm({...suratKeluarForm, penerima: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sk-alamat">Alamat Penerima</Label>
                <Input 
                  id="sk-alamat" 
                  placeholder="Alamat lengkap" 
                  value={suratKeluarForm.alamatPenerima}
                  onChange={(e) => setSuratKeluarForm({...suratKeluarForm, alamatPenerima: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sk-perihal">Perihal *</Label>
                <Input 
                  id="sk-perihal" 
                  placeholder="Perihal surat" 
                  value={suratKeluarForm.perihal}
                  onChange={(e) => setSuratKeluarForm({...suratKeluarForm, perihal: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sk-sifatSurat">Sifat Surat *</Label>
                  <Select value={suratKeluarForm.sifatSurat} onValueChange={(value) => setSuratKeluarForm({...suratKeluarForm, sifatSurat: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih sifat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Biasa">Biasa</SelectItem>
                      <SelectItem value="Penting">Penting</SelectItem>
                      <SelectItem value="Rahasia">Rahasia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sk-pengirim">Pengirim *</Label>
                  <Select value={suratKeluarForm.pengirimId} onValueChange={(value) => setSuratKeluarForm({...suratKeluarForm, pengirimId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pengirim" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>{user.nama} {user.jabatan ? `(${user.jabatan})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sk-catatan">Catatan</Label>
                <Textarea 
                  id="sk-catatan" 
                  placeholder="Catatan tambahan..." 
                  rows={3}
                  value={suratKeluarForm.catatan}
                  onChange={(e) => setSuratKeluarForm({...suratKeluarForm, catatan: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSuratKeluarDialogOpen(false)
                    resetSuratKeluarForm()
                  }}
                >
                  Batal
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleCreateSuratKeluar(false)}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Simpan Draft
                </Button>
                <Button onClick={() => handleCreateSuratKeluar(true)} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Kirim
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {loading && suratKeluar.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {suratKeluar.filter(s => 
              s.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
              s.penerima.toLowerCase().includes(searchTerm.toLowerCase()) ||
              s.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
              getPengirimNama(s.pengirim).toLowerCase().includes(searchTerm.toLowerCase())
            ).map((surat) => (
              <Card key={surat.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{surat.nomorSurat}</h3>
                        <Badge variant={
                          surat.sifatSurat === 'Penting' ? 'destructive' :
                          surat.sifatSurat === 'Rahasia' ? 'secondary' : 'default'
                        }>
                          {surat.sifatSurat}
                        </Badge>
                        <Badge variant={
                          surat.status === 'Dikirim' ? 'default' :
                          surat.status === 'Disetujui' ? 'secondary' : 'outline'
                        }>
                          {surat.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{surat.perihal}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          Kepada: {surat.penerima}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(surat.tanggalSurat).toLocaleDateString('id-ID')}
                        </span>
                        <span>Pengirim: {getPengirimNama(surat.pengirim)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteSuratKeluar(surat.id)} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {suratKeluar.length === 0 && !loading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Send className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Belum ada surat keluar</p>
                  <Button className="mt-4" onClick={() => setSuratKeluarDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Surat Pertama
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Manajemen User</h2>
          <p className="text-muted-foreground">Kelola pengguna dan hak akses</p>
        </div>
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={() => resetUserForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-nama">Nama Lengkap *</Label>
                  <Input 
                    id="user-nama" 
                    placeholder="Nama lengkap user" 
                    value={userForm.nama}
                    onChange={(e) => setUserForm({...userForm, nama: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email *</Label>
                  <Input 
                    id="user-email" 
                    type="email" 
                    placeholder="email@example.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-password">Password *</Label>
                  <Input 
                    id="user-password" 
                    type="password" 
                    placeholder="Password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-nip">NIP</Label>
                  <Input 
                    id="user-nip" 
                    placeholder="Nomor Induk Pegawai"
                    value={userForm.nip}
                    onChange={(e) => setUserForm({...userForm, nip: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-jabatan">Jabatan</Label>
                  <Input 
                    id="user-jabatan" 
                    placeholder="Jabatan user"
                    value={userForm.jabatan}
                    onChange={(e) => setUserForm({...userForm, jabatan: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-telepon">No. Telepon</Label>
                  <Input 
                    id="user-telepon" 
                    placeholder="08xxxxxxxxxx"
                    value={userForm.telepon}
                    onChange={(e) => setUserForm({...userForm, telepon: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-role">Role *</Label>
                <Select value={userForm.roleId} onValueChange={(value) => setUserForm({...userForm, roleId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>{role.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setUserDialogOpen(false)
                    resetUserForm()
                  }}
                >
                  Batal
                </Button>
                <Button onClick={handleCreateUser} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Simpan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{user.nama}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {user.jabatan && <Badge variant="outline">{user.jabatan}</Badge>}
                      <Badge variant="default">Aktif</Badge>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {users.length === 0 && !loading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <UserIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Belum ada user</p>
                  <Button className="mt-4" onClick={() => setUserDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah User Pertama
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )

  const renderDisposisi = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Disposisi Surat</h2>
          <p className="text-muted-foreground">Kelola alur disposisi surat masuk</p>
        </div>
        <Dialog open={disposisiDialogOpen} onOpenChange={setDisposisiDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={() => resetDisposisiForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Disposisi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Disposisi Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="disp-suratMasuk">Pilih Surat Masuk *</Label>
                <Select value={disposisiForm.suratMasukId} onValueChange={(value) => setDisposisiForm({...disposisiForm, suratMasukId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih surat" />
                  </SelectTrigger>
                  <SelectContent>
                    {suratMasuk.map((surat) => (
                      <SelectItem key={surat.id} value={surat.id}>
                        {surat.nomorSurat} - {surat.perihal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disp-dari">Dari *</Label>
                  <Select value={disposisiForm.dariId} onValueChange={(value) => setDisposisiForm({...disposisiForm, dariId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pengirim disposisi" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>{user.nama} {user.jabatan ? `(${user.jabatan})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disp-ke">Kepada *</Label>
                  <Select value={disposisiForm.keId} onValueChange={(value) => setDisposisiForm({...disposisiForm, keId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih penerima disposisi" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>{user.nama} {user.jabatan ? `(${user.jabatan})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="disp-instruksi">Instruksi *</Label>
                <Textarea 
                  id="disp-instruksi" 
                  placeholder="Instruksi disposisi..."
                  value={disposisiForm.instruksi}
                  onChange={(e) => setDisposisiForm({...disposisiForm, instruksi: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disp-catatan">Catatan</Label>
                <Textarea 
                  id="disp-catatan" 
                  placeholder="Catatan tambahan..."
                  value={disposisiForm.catatan}
                  onChange={(e) => setDisposisiForm({...disposisiForm, catatan: e.target.value})}
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDisposisiDialogOpen(false)
                    resetDisposisiForm()
                  }}
                >
                  Batal
                </Button>
                <Button onClick={handleCreateDisposisi} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Simpan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {loading && disposisi.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {disposisi.map((disp) => (
              <Card key={disp.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {disp.suratMasuk && (
                        <div>
                          <h3 className="font-semibold">{disp.suratMasuk.nomorSurat}</h3>
                          <p className="text-sm text-muted-foreground">{disp.suratMasuk.perihal}</p>
                          <p className="text-xs text-muted-foreground">Pengirim: {disp.suratMasuk.pengirim}</p>
                        </div>
                      )}
                      <Badge variant={
                        disp.status === 'Selesai' ? 'default' :
                        disp.status === 'Pending' ? 'secondary' : 'outline'
                      }>
                        {disp.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <div className="px-3 py-1 bg-primary/10 rounded-full">
                        <span className="font-medium">{disp.dari.nama}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      <div className="px-3 py-1 bg-primary/10 rounded-full">
                        <span className="font-medium">{disp.ke.nama}</span>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm font-medium mb-1">Instruksi:</p>
                      <p className="text-sm">{disp.instruksi}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(disp.tanggalDisposisi).toLocaleDateString('id-ID')}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteDisposisi(disp.id)} disabled={loading}>
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {disposisi.length === 0 && !loading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Belum ada disposisi</p>
                  <Button className="mt-4" onClick={() => setDisposisiDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Disposisi Pertama
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )

  const renderArsip = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Arsip Surat</h2>
          <p className="text-muted-foreground">Kelola arsip surat masuk dan keluar</p>
        </div>
        <Dialog open={arsipDialogOpen} onOpenChange={setArsipDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={() => resetArsipForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Arsip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Arsip Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="arsip-jenisSurat">Jenis Surat *</Label>
                  <Select value={arsipForm.jenisSurat} onValueChange={(value) => {
                    setArsipForm({...arsipForm, jenisSurat: value, suratMasukId: '', suratKeluarId: ''})
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis surat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SuratMasuk">Surat Masuk</SelectItem>
                      <SelectItem value="SuratKeluar">Surat Keluar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arsip-kategori">Kategori Arsip *</Label>
                  <Input 
                    id="arsip-kategori" 
                    placeholder="Contoh: Undangan, Perintah, Laporan"
                    value={arsipForm.kategori}
                    onChange={(e) => setArsipForm({...arsipForm, kategori: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="arsip-surat">
                  {arsipForm.jenisSurat === 'SuratMasuk' ? 'Pilih Surat Masuk' : 'Pilih Surat Keluar'} *
                </Label>
                <Select 
                  value={arsipForm.jenisSurat === 'SuratMasuk' ? arsipForm.suratMasukId : arsipForm.suratKeluarId} 
                  onValueChange={(value) => {
                    setArsipForm({...arsipForm, suratMasukId: arsipForm.jenisSurat === 'SuratMasuk' ? value : '', suratKeluarId: arsipForm.jenisSurat === 'SuratKeluar' ? value : ''})
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih surat" />
                  </SelectTrigger>
                  <SelectContent>
                    {arsipForm.jenisSurat === 'SuratMasuk' ? (
                      suratMasuk.map((surat) => (
                        <SelectItem key={surat.id} value={surat.id}>
                          {surat.nomorSurat} - {surat.perihal}
                        </SelectItem>
                      ))
                    ) : (
                      suratKeluar.map((surat) => (
                        <SelectItem key={surat.id} value={surat.id}>
                          {surat.nomorSurat} - {surat.perihal}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="arsip-lokasi">Lokasi Arsip</Label>
                  <Input 
                    id="arsip-lokasi" 
                    placeholder="Contoh: Rak A-1, Lemari B"
                    value={arsipForm.lokasiArsip}
                    onChange={(e) => setArsipForm({...arsipForm, lokasiArsip: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arsip-retensi">Retensi (Tahun) *</Label>
                  <Input 
                    id="arsip-retensi" 
                    type="number"
                    min="1"
                    max="50"
                    value={arsipForm.retensi}
                    onChange={(e) => setArsipForm({...arsipForm, retensi: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="arsip-diarsipkanOleh">Diarsipkan Oleh *</Label>
                  <Select value={arsipForm.diarsipkanOlehId} onValueChange={(value) => setArsipForm({...arsipForm, diarsipkanOlehId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>{user.nama} {user.jabatan ? `(${user.jabatan})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arsip-statusArsip">Status Arsip *</Label>
                  <Select value={arsipForm.statusArsip} onValueChange={(value) => setArsipForm({...arsipForm, statusArsip: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Inaktif">Inaktif</SelectItem>
                      <SelectItem value="Dimusnahkan">Dimusnahkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="arsip-catatan">Catatan</Label>
                <Textarea 
                  id="arsip-catatan" 
                  placeholder="Catatan tambahan..."
                  rows={3}
                  value={arsipForm.catatan}
                  onChange={(e) => setArsipForm({...arsipForm, catatan: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setArsipDialogOpen(false)
                    resetArsipForm()
                  }}
                >
                  Batal
                </Button>
                <Button onClick={handleCreateArsip} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Simpan Arsip
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari arsip..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => fetchAllData()}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Arsip List */}
      <div className="space-y-4">
        {suratMasuk.length === 0 && suratKeluar.length === 0 && !loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Archive className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Belum ada arsip</p>
              <Button className="mt-4" onClick={() => setArsipDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Buat Arsip Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Surat Masuk yang bisa diarsipkan */}
            {suratMasuk.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-blue-500" />
                  Surat Masuk Belum Diarsipkan
                </h3>
                {suratMasuk
                  .filter(s => !s.status.toLowerCase().includes('diarsipkan'))
                  .map((surat) => (
                    <Card key={surat.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{surat.nomorSurat}</h4>
                            <p className="text-sm text-muted-foreground">{surat.perihal}</p>
                            <p className="text-xs text-muted-foreground">
                              Dari: {surat.pengirim} | Tanggal: {new Date(surat.tanggalSurat).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setArsipForm({
                                ...arsipForm,
                                jenisSurat: 'SuratMasuk',
                                suratMasukId: surat.id,
                              })
                              setArsipDialogOpen(true)
                            }}
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Arsipkan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}

            {/* Surat Keluar yang bisa diarsipkan */}
            {suratKeluar.length > 0 && (
              <div className="space-y-2 mt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-500" />
                  Surat Keluar Belum Diarsipkan
                </h3>
                {suratKeluar
                  .filter(s => !s.status.toLowerCase().includes('diarsipkan'))
                  .map((surat) => (
                    <Card key={surat.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{surat.nomorSurat}</h4>
                            <p className="text-sm text-muted-foreground">{surat.perihal}</p>
                            <p className="text-xs text-muted-foreground">
                              Kepada: {surat.penerima} | Tanggal: {new Date(surat.tanggalSurat).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setArsipForm({
                                ...arsipForm,
                                jenisSurat: 'SuratKeluar',
                                suratKeluarId: surat.id,
                              })
                              setArsipDialogOpen(true)
                            }}
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Arsipkan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}

            {suratMasuk.filter(s => s.status.toLowerCase().includes('diarsipkan')).length === 0 && 
             suratKeluar.filter(s => s.status.toLowerCase().includes('diarsipkan')).length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Archive className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Semua surat sudah diarsipkan</p>
                  <Button className="mt-4" onClick={() => setArsipDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Arsip Manual
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )

  const renderLaporan = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Laporan</h2>
        <p className="text-muted-foreground">Generate dan download laporan surat</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Pengaturan Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lap-jenis">Jenis Laporan *</Label>
              <Select value={laporanForm.jenis} onValueChange={(value) => setLaporanForm({...laporanForm, jenis: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis laporan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Data</SelectItem>
                  <SelectItem value="surat-masuk">Surat Masuk</SelectItem>
                  <SelectItem value="surat-keluar">Surat Keluar</SelectItem>
                  <SelectItem value="disposisi">Disposisi</SelectItem>
                  <SelectItem value="arsip">Arsip</SelectItem>
                  <SelectItem value="bulanan">Laporan Bulanan</SelectItem>
                  <SelectItem value="tahunan">Laporan Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lap-tanggalMulai">Tanggal Mulai</Label>
              <Input 
                id="lap-tanggalMulai" 
                type="date" 
                value={laporanForm.tanggalMulai}
                onChange={(e) => setLaporanForm({...laporanForm, tanggalMulai: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lap-tanggalSelesai">Tanggal Selesai</Label>
              <Input 
                id="lap-tanggalSelesai" 
                type="date" 
                value={laporanForm.tanggalSelesai}
                onChange={(e) => setLaporanForm({...laporanForm, tanggalSelesai: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setLaporanForm({ jenis: 'semua', tanggalMulai: '', tanggalSelesai: '' })
              setLaporan(null)
            }}>
              Reset
            </Button>
            <Button onClick={handleGenerateLaporan} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
              Generate Laporan
            </Button>
          </div>
        </CardContent>
      </Card>

      {laporan && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Laporan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">Surat Masuk</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {laporan.totalSuratMasuk}
                </p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Surat Keluar</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {laporan.totalSuratKeluar}
                </p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <p className="text-sm text-amber-600 dark:text-amber-400">Disposisi</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {laporan.totalDisposisi}
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-sm text-purple-600 dark:text-purple-400">Arsip</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {laporan.totalArsip}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: 'Laporan Surat Masuk', desc: 'Laporan semua surat masuk', icon: Inbox, color: 'text-blue-500' },
          { title: 'Laporan Surat Keluar', desc: 'Laporan semua surat keluar', icon: Send, color: 'text-emerald-500' },
          { title: 'Laporan Disposisi', desc: 'Laporan alur disposisi', icon: FileText, color: 'text-amber-500' },
          { title: 'Laporan Arsip', desc: 'Laporan arsip surat', icon: Archive, color: 'text-purple-500' },
          { title: 'Laporan Bulanan', desc: 'Laporan statistik bulanan', icon: BarChart3, color: 'text-rose-500' },
          { title: 'Laporan Tahunan', desc: 'Laporan statistik tahunan', icon: BarChart3, color: 'text-cyan-500' },
        ].map((item, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLaporanForm({...laporanForm, jenis: item.title.toLowerCase().replace(/ /g, '-')})}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`p-3 rounded-full bg-muted ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={(e) => {
                  e.stopPropagation()
                  handleGenerateLaporan()
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Memuat aplikasi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">SINTAS</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Sistem Integrasi Administrasi Surat</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => fetchAllData()} disabled={loading} className="hover:bg-primary/10">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Bell className="w-5 h-5 text-muted-foreground" />}
            </Button>
            <div className="flex items-center gap-2">
              {currentUser && (
                <>
                  <div className="hidden sm:flex items-center gap-2 mr-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/10">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                      <UserIcon className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{currentUser.nama}</span>
                    <Badge variant="outline" className="hidden md:inline-flex bg-primary/5 border-primary/20 text-primary">
                      {currentUser.role?.nama}
                    </Badge>
                  </div>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Logout"
                className="sm:hidden"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 bg-background border-r
          ${sidebarOpen ? 'translate-x-0 pt-16' : '-translate-x-full'}
        `}>
          <nav className="p-4 space-y-2 h-full overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id as ViewType)
                  setSidebarOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${currentView === item.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6">
            {currentView === 'dashboard' && renderDashboard()}
            {currentView === 'surat-masuk' && renderSuratMasuk()}
            {currentView === 'surat-keluar' && renderSuratKeluar()}
            {currentView === 'disposisi' && renderDisposisi()}
            {currentView === 'arsip' && renderArsip()}
            {currentView === 'laporan' && renderLaporan()}
            {currentView === 'users' && renderUsers()}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>© 2024 SINTAS - Sistem Integrasi Administrasi Surat</p>
            <p className="flex items-center gap-1">
              Dibuat dengan <span className="text-pink-500">❤</span> untuk efisiensi administrasi
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
