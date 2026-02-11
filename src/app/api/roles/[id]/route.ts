import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Ambil role by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const role = await db.role.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            nama: true,
            email: true,
            jabatan: true,
            isActive: true,
          },
        },
      },
    })

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role tidak ditemukan' },
        { status: 404 }
      )
    }

    // Parse permissions JSON
    let permissions = []
    try {
      permissions = JSON.parse(role.permissions)
    } catch (e) {
      permissions = []
    }

    return NextResponse.json({
      success: true,
      data: {
        ...role,
        permissions,
        userCount: role.users.length,
      },
    })
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data role' },
      { status: 500 }
    )
  }
}

// PUT - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      nama,
      deskripsi,
      permissions,
    } = body

    // Cek apakah role ada
    const existingRole = await db.role.findUnique({
      where: { id },
    })

    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role tidak ditemukan' },
        { status: 404 }
      )
    }

    // Jika nama diubah, cek apakah sudah ada
    if (nama && nama !== existingRole.nama) {
      const duplicateRole = await db.role.findUnique({
        where: { nama },
      })

      if (duplicateRole) {
        return NextResponse.json(
          { success: false, error: 'Role dengan nama ini sudah ada' },
          { status: 400 }
        )
      }
    }

    // Update role
    const role = await db.role.update({
      where: { id },
      data: {
        ...(nama && { nama }),
        ...(deskripsi !== undefined && { deskripsi }),
        ...(permissions !== undefined && { 
          permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions) 
        }),
      },
    })

    return NextResponse.json({
      success: true,
      data: role,
      message: 'Role berhasil diperbarui',
    })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui role' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Cek apakah role ada
    const existingRole = await db.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role tidak ditemukan' },
        { status: 404 }
      )
    }

    // Cek apakah role memiliki users
    if (existingRole._count.users > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Role tidak dapat dihapus karena masih memiliki users' 
        },
        { status: 400 }
      )
    }

    // Hapus role
    await db.role.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Role berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus role' },
      { status: 500 }
    )
  }
}
