import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Ambil user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nama: true,
        nip: true,
        jabatan: true,
        telepon: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            nama: true,
            deskripsi: true,
            permissions: true,
          },
        },
        suratMasuk: {
          select: {
            id: true,
            nomorSurat: true,
            perihal: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        suratKeluar: {
          select: {
            id: true,
            nomorSurat: true,
            perihal: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        disposisiDari: {
          select: {
            id: true,
            instruksi: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        disposisiKe: {
          select: {
            id: true,
            instruksi: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data user' },
      { status: 500 }
    )
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      email,
      password,
      nama,
      nip,
      jabatan,
      telepon,
      roleId,
      isActive,
    } = body

    // Cek apakah user ada
    const existingUser = await db.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Jika email diubah, cek apakah sudah ada
    if (email && email !== existingUser.email) {
      const duplicateUser = await db.user.findUnique({
        where: { email },
      })

      if (duplicateUser) {
        return NextResponse.json(
          { success: false, error: 'Email sudah terdaftar' },
          { status: 400 }
        )
      }
    }

    // Jika role diubah, cek apakah role ada
    if (roleId && roleId !== existingUser.roleId) {
      const role = await db.role.findUnique({
        where: { id: roleId },
      })

      if (!role) {
        return NextResponse.json(
          { success: false, error: 'Role tidak ditemukan' },
          { status: 404 }
        )
      }
    }

    // Update user
    const user = await db.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(password && { password }),
        ...(nama && { nama }),
        ...(nip !== undefined && { nip }),
        ...(jabatan !== undefined && { jabatan }),
        ...(telepon !== undefined && { telepon }),
        ...(roleId && { roleId }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        nama: true,
        nip: true,
        jabatan: true,
        telepon: true,
        isActive: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            nama: true,
            deskripsi: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User berhasil diperbarui',
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui user' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Cek apakah user ada
    const existingUser = await db.user.findUnique({
      where: { id },
      include: {
        suratMasuk: true,
        suratKeluar: true,
        disposisiDari: true,
        disposisiKe: true,
      },
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Cek apakah user memiliki data terkait
    const hasRelatedData = 
      existingUser.suratMasuk.length > 0 ||
      existingUser.suratKeluar.length > 0 ||
      existingUser.disposisiDari.length > 0 ||
      existingUser.disposisiKe.length > 0

    if (hasRelatedData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User tidak dapat dihapus karena memiliki data terkait. Set status menjadi non-aktif saja.' 
        },
        { status: 400 }
      )
    }

    // Hapus user
    await db.user.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus user' },
      { status: 500 }
    )
  }
}
