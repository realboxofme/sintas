import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Ambil semua roles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { deskripsi: { contains: search } },
      ]
    }

    const [roles, total] = await Promise.all([
      db.role.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { users: true },
          },
        },
        orderBy: { nama: 'asc' },
      }),
      db.role.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: roles.map(role => ({
        ...role,
        userCount: role._count.users,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data roles' },
      { status: 500 }
    )
  }
}

// POST - Tambah role baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      nama,
      deskripsi,
      permissions = '[]', // JSON string of permissions
    } = body

    // Validasi required fields
    if (!nama) {
      return NextResponse.json(
        { success: false, error: 'Nama role wajib diisi' },
        { status: 400 }
      )
    }

    // Cek apakah role sudah ada
    const existingRole = await db.role.findUnique({
      where: { nama },
    })

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role dengan nama ini sudah ada' },
        { status: 400 }
      )
    }

    // Create role
    const role = await db.role.create({
      data: {
        nama,
        deskripsi,
        permissions,
      },
    })

    return NextResponse.json({
      success: true,
      data: role,
      message: 'Role berhasil ditambahkan',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan role' },
      { status: 500 }
    )
  }
}
