import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Ambil semua users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const roleId = searchParams.get('roleId') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { email: { contains: search } },
        { nip: { contains: search } },
      ]
    }

    if (roleId) {
      where.roleId = roleId
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data users' },
      { status: 500 }
    )
  }
}

// POST - Tambah user baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      email,
      password,
      nama,
      nip,
      jabatan,
      telepon,
      roleId,
      isActive = true,
    } = body

    // Validasi required fields
    if (!email || !password || !nama || !roleId) {
      return NextResponse.json(
        { success: false, error: 'Field wajib tidak lengkap' },
        { status: 400 }
      )
    }

    // Cek apakah email sudah ada
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    // Cek apakah role ada
    const role = await db.role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role tidak ditemukan' },
        { status: 404 }
      )
    }

    // In production, password should be hashed using bcrypt
    // For now, we'll store it as is (not recommended for production)
    const user = await db.user.create({
      data: {
        email,
        password,
        nama,
        nip,
        jabatan,
        telepon,
        roleId,
        isActive,
      },
      select: {
        id: true,
        email: true,
        nama: true,
        nip: true,
        jabatan: true,
        telepon: true,
        isActive: true,
        createdAt: true,
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
      message: 'User berhasil ditambahkan',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan user' },
      { status: 500 }
    )
  }
}
