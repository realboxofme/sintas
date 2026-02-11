import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Ambil semua surat keluar
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
        { penerima: { contains: search } },
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
      db.suratKeluar.findMany({
        where,
        skip,
        take: limit,
        include: {
          pengirim: {
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
      db.suratKeluar.count({ where }),
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
    console.error('Error fetching surat keluar:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data surat keluar' },
      { status: 500 }
    )
  }
}

// POST - Tambah surat keluar baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      nomorSurat,
      tanggalSurat,
      penerima,
      alamatPenerima,
      perihal,
      sifatSurat,
      pengirimId,
      fileSurat,
      fileNama,
      catatan,
      status = 'Draft',
    } = body

    // Validasi required fields
    if (!nomorSurat || !tanggalSurat || !penerima || !perihal || !sifatSurat || !pengirimId) {
      return NextResponse.json(
        { success: false, error: 'Field wajib tidak lengkap' },
        { status: 400 }
      )
    }

    // Cek apakah nomor surat sudah ada
    const existingSurat = await db.suratKeluar.findUnique({
      where: { nomorSurat },
    })

    if (existingSurat) {
      return NextResponse.json(
        { success: false, error: 'Nomor surat sudah ada' },
        { status: 400 }
      )
    }

    // Create surat keluar
    const surat = await db.suratKeluar.create({
      data: {
        nomorSurat,
        tanggalSurat: new Date(tanggalSurat),
        penerima,
        alamatPenerima,
        perihal,
        sifatSurat,
        pengirimId,
        fileSurat,
        fileNama,
        catatan,
        status,
      },
      include: {
        pengirim: {
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
      message: 'Surat keluar berhasil ditambahkan',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating surat keluar:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan surat keluar' },
      { status: 500 }
    )
  }
}
