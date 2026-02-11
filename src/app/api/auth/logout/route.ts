import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Logout user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    // Validasi input
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID diperlukan' },
        { status: 400 }
      )
    }

    // Cari user
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Catat log aktivitas logout
    // TODO: Fix Prisma client caching issue
    // await db.logAktivitas.create({
    //   userId: user.id,
    //   aktivitas: `User ${user.nama} berhasil logout`,
    //   modul: 'Authentication',
    //   aksi: 'Logout',
    //   ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
    //   userAgent: request.headers.get('user-agent') || 'Unknown',
    // })

    return NextResponse.json({
      success: true,
      message: 'Logout berhasil',
    })
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat logout' },
      { status: 500 }
    )
  }
}
