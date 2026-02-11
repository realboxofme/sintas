// API Service for SINTAS Application

const API_BASE = '/api'

// Helper function for API calls
async function apiFetch(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE}${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong')
  }

  return data
}

// ============ SURAT MASUK ============
export const suratMasukAPI = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    sifat?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.search) queryParams.set('search', params.search)
    if (params?.status) queryParams.set('status', params.status)
    if (params?.sifat) queryParams.set('sifat', params.sifat)

    return apiFetch(`/surat-masuk?${queryParams.toString()}`)
  },

  async getById(id: string) {
    return apiFetch(`/surat-masuk/${id}`)
  },

  async create(data: {
    nomorSurat: string
    tanggalSurat: string
    pengirim: string
    perihal: string
    sifatSurat: string
    penerimaId: string
    fileSurat?: string
    fileNama?: string
    catatan?: string
  }) {
    return apiFetch('/surat-masuk', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<{
    nomorSurat: string
    tanggalSurat: string
    pengirim: string
    perihal: string
    sifatSurat: string
    penerimaId: string
    fileSurat?: string
    fileNama?: string
    catatan?: string
    status?: string
  }>) {
    return apiFetch(`/surat-masuk/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string) {
    return apiFetch(`/surat-masuk/${id}`, {
      method: 'DELETE',
    })
  },
}

// ============ SURAT KELUAR ============
export const suratKeluarAPI = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    sifat?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.search) queryParams.set('search', params.search)
    if (params?.status) queryParams.set('status', params.status)
    if (params?.sifat) queryParams.set('sifat', params.sifat)

    return apiFetch(`/surat-keluar?${queryParams.toString()}`)
  },

  async getById(id: string) {
    return apiFetch(`/surat-keluar/${id}`)
  },

  async create(data: {
    nomorSurat: string
    tanggalSurat: string
    penerima: string
    alamatPenerima?: string
    perihal: string
    sifatSurat: string
    pengirimId: string
    fileSurat?: string
    fileNama?: string
    catatan?: string
    status?: string
  }) {
    return apiFetch('/surat-keluar', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<{
    nomorSurat: string
    tanggalSurat: string
    penerima: string
    alamatPenerima?: string
    perihal: string
    sifatSurat: string
    pengirimId: string
    fileSurat?: string
    fileNama?: string
    catatan?: string
    status?: string
  }>) {
    return apiFetch(`/surat-keluar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string) {
    return apiFetch(`/surat-keluar/${id}`, {
      method: 'DELETE',
    })
  },
}

// ============ DISPOSISI ============
export const disposisiAPI = {
  async getAll(params?: {
    page?: number
    limit?: number
    suratMasukId?: string
    dariId?: string
    keId?: string
    status?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.suratMasukId) queryParams.set('suratMasukId', params.suratMasukId)
    if (params?.dariId) queryParams.set('dariId', params.dariId)
    if (params?.keId) queryParams.set('keId', params.keId)
    if (params?.status) queryParams.set('status', params.status)

    return apiFetch(`/disposisi?${queryParams.toString()}`)
  },

  async getById(id: string) {
    return apiFetch(`/disposisi/${id}`)
  },

  async create(data: {
    suratMasukId: string
    dariId: string
    keId: string
    instruksi: string
    catatan?: string
  }) {
    return apiFetch('/disposisi', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<{
    instruksi: string
    catatan?: string
    status?: string
  }>) {
    return apiFetch(`/disposisi/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string) {
    return apiFetch(`/disposisi/${id}`, {
      method: 'DELETE',
    })
  },
}

// ============ ARSIP ============
export const arsipAPI = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    jenisSurat?: string
    kategori?: string
    statusArsip?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.search) queryParams.set('search', params.search)
    if (params?.jenisSurat) queryParams.set('jenisSurat', params.jenisSurat)
    if (params?.kategori) queryParams.set('kategori', params.kategori)
    if (params?.statusArsip) queryParams.set('statusArsip', params.statusArsip)

    return apiFetch(`/arsip?${queryParams.toString()}`)
  },

  async getById(id: string) {
    return apiFetch(`/arsip/${id}`)
  },

  async create(data: {
    jenisSurat: string
    suratMasukId?: string
    suratKeluarId?: string
    kategori: string
    lokasiArsip?: string
    diarsipkanOlehId: string
    retensi?: number
    statusArsip?: string
    catatan?: string
  }) {
    return apiFetch('/arsip', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<{
    kategori: string
    lokasiArsip?: string
    retensi?: number
    statusArsip?: string
    catatan?: string
  }>) {
    return apiFetch(`/arsip/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string) {
    return apiFetch(`/arsip/${id}`, {
      method: 'DELETE',
    })
  },
}

// ============ USERS ============
export const usersAPI = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    roleId?: string
    isActive?: boolean
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.search) queryParams.set('search', params.search)
    if (params?.roleId) queryParams.set('roleId', params.roleId)
    if (params?.isActive !== undefined) queryParams.set('isActive', params.isActive.toString())

    return apiFetch(`/users?${queryParams.toString()}`)
  },

  async getById(id: string) {
    return apiFetch(`/users/${id}`)
  },

  async create(data: {
    email: string
    password: string
    nama: string
    nip?: string
    jabatan?: string
    telepon?: string
    roleId: string
    isActive?: boolean
  }) {
    return apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<{
    email?: string
    password?: string
    nama?: string
    nip?: string
    jabatan?: string
    telepon?: string
    roleId?: string
    isActive?: boolean
  }>) {
    return apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string) {
    return apiFetch(`/users/${id}`, {
      method: 'DELETE',
    })
  },
}

// ============ ROLES ============
export const rolesAPI = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.search) queryParams.set('search', params.search)

    return apiFetch(`/roles?${queryParams.toString()}`)
  },

  async getById(id: string) {
    return apiFetch(`/roles/${id}`)
  },

  async create(data: {
    nama: string
    deskripsi?: string
    permissions?: string
  }) {
    return apiFetch('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: Partial<{
    nama?: string
    deskripsi?: string
    permissions?: string
  }>) {
    return apiFetch(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string) {
    return apiFetch(`/roles/${id}`, {
      method: 'DELETE',
    })
  },
}

// ============ DASHBOARD ============
export const dashboardAPI = {
  async getStats(params?: {
    month?: number
    year?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.month) queryParams.set('month', params.month.toString())
    if (params?.year) queryParams.set('year', params.year.toString())

    return apiFetch(`/dashboard/stats?${queryParams.toString()}`)
  },
}

// ============ LAPORAN ============
export const laporanAPI = {
  async generate(params?: {
    jenis?: string
    tanggalMulai?: string
    tanggalSelesai?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params?.jenis) queryParams.set('jenis', params.jenis)
    if (params?.tanggalMulai) queryParams.set('tanggalMulai', params.tanggalMulai)
    if (params?.tanggalSelesai) queryParams.set('tanggalSelesai', params.tanggalSelesai)

    return apiFetch(`/laporan/generate?${queryParams.toString()}`)
  },
}
