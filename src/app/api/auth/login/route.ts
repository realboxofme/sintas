import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Login user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validasi input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password wajib diisi' },
        { status: 400 }
      )
    }

    // Cari user berdasarkan email
    const user = await db.user.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            id: true,
            nama: true,
            permissions: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Cek apakah user aktif
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Akun Anda telah dinonaktifkan' },
        { status: 403 }
      )
    }

    // Validasi password (untuk demo, kita compare langsung, di production gunakan bcrypt)
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Catat log aktivitas login
    // TODO: Fix Prisma client caching issue
    // await db.logAktivitas.create({
    //   userId: user.id,
    //   aktivitas: `User ${user.nama} berhasil login`,
    //   modul: 'Authentication',
    //   aksi: 'Login',
    //   ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
    //   userAgent: request.headers.get('user-agent') || 'Unknown',
    // })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
      },
      message: 'Login berhasil',
    })
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    )
  }
}
