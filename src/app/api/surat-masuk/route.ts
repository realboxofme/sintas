import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Ambil semua surat masuk
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const sifat = searchParams.get('sifat') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { nomorSurat: { contains: search } },
        { pengirim: { contains: search } },
        { perihal: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (sifat) {
      where.sifatSurat = sifat
    }

    const [surat, total] = await Promise.all([
      db.suratMasuk.findMany({
        where,
        skip,
        take: limit,
        include: {
          penerima: {
            select: {
              id: true,
              nama: true,
              email: true,
              jabatan: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.suratMasuk.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: surat,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching surat masuk:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data surat masuk' },
      { status: 500 }
    )
  }
}

// POST - Tambah surat masuk baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      nomorSurat,
      tanggalSurat,
      pengirim,
      perihal,
      sifatSurat,
      penerimaId,
      fileSurat,
      fileNama,
      catatan,
    } = body

    // Validasi required fields
    if (!nomorSurat || !tanggalSurat || !pengirim || !perihal || !sifatSurat || !penerimaId) {
      return NextResponse.json(
        { success: false, error: 'Field wajib tidak lengkap' },
        { status: 400 }
      )
    }

    // Cek apakah nomor surat sudah ada
    const existingSurat = await db.suratMasuk.findUnique({
      where: { nomorSurat },
    })

    if (existingSurat) {
      return NextResponse.json(
        { success: false, error: 'Nomor surat sudah ada' },
        { status: 400 }
      )
    }

    // Create surat masuk
    const surat = await db.suratMasuk.create({
      data: {
        nomorSurat,
        tanggalSurat: new Date(tanggalSurat),
        pengirim,
        perihal,
        sifatSurat,
        penerimaId,
        fileSurat,
        fileNama,
        catatan,
        status: 'Diterima',
      },
      include: {
        penerima: {
          select: {
            id: true,
            nama: true,
            email: true,
            jabatan: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: surat,
      message: 'Surat masuk berhasil ditambahkan',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating surat masuk:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan surat masuk' },
      { status: 500 }
    )
  }
}
