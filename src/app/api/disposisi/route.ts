import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Ambil semua disposisi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const suratMasukId = searchParams.get('suratMasukId') || ''
    const dariId = searchParams.get('dariId') || ''
    const keId = searchParams.get('keId') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    if (suratMasukId) {
      where.suratMasukId = suratMasukId
    }

    if (dariId) {
      where.dariId = dariId
    }

    if (keId) {
      where.keId = keId
    }

    if (status) {
      where.status = status
    }

    const [disposisi, total] = await Promise.all([
      db.disposisi.findMany({
        where,
        skip,
        take: limit,
        include: {
          suratMasuk: {
            select: {
              id: true,
              nomorSurat: true,
              perihal: true,
              pengirim: true,
            },
          },
          dari: {
            select: {
              id: true,
              nama: true,
              jabatan: true,
            },
          },
          ke: {
            select: {
              id: true,
              nama: true,
              jabatan: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.disposisi.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: disposisi,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching disposisi:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data disposisi' },
      { status: 500 }
    )
  }
}

// POST - Tambah disposisi baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      suratMasukId,
      dariId,
      keId,
      instruksi,
      catatan,
    } = body

    // Validasi required fields
    if (!suratMasukId || !dariId || !keId || !instruksi) {
      return NextResponse.json(
        { success: false, error: 'Field wajib tidak lengkap' },
        { status: 400 }
      )
    }

    // Cek apakah surat masuk ada
    const suratMasuk = await db.suratMasuk.findUnique({
      where: { id: suratMasukId },
    })

    if (!suratMasuk) {
      return NextResponse.json(
        { success: false, error: 'Surat masuk tidak ditemukan' },
        { status: 404 }
      )
    }

    // Create disposisi
    const disposisi = await db.disposisi.create({
      data: {
        suratMasukId,
        dariId,
        keId,
        instruksi,
        catatan,
        status: 'Pending',
      },
      include: {
        suratMasuk: {
          select: {
            id: true,
            nomorSurat: true,
            perihal: true,
            pengirim: true,
          },
        },
        dari: {
          select: {
            id: true,
            nama: true,
            jabatan: true,
          },
        },
        ke: {
          select: {
            id: true,
            nama: true,
            jabatan: true,
          },
        },
      },
    })

    // Update status surat masuk
    await db.suratMasuk.update({
      where: { id: suratMasukId },
      data: { status: 'Diproses' },
    })

    return NextResponse.json({
      success: true,
      data: disposisi,
      message: 'Disposisi berhasil ditambahkan',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating disposisi:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan disposisi' },
      { status: 500 }
    )
  }
}
