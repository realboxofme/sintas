import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Ambil semua arsip
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const jenisSurat = searchParams.get('jenisSurat') || ''
    const kategori = searchParams.get('kategori') || ''
    const statusArsip = searchParams.get('statusArsip') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { kategori: { contains: search } },
        { lokasiArsip: { contains: search } },
      ]
    }

    if (jenisSurat) {
      where.jenisSurat = jenisSurat
    }

    if (kategori) {
      where.kategori = kategori
    }

    if (statusArsip) {
      where.statusArsip = statusArsip
    }

    const [arsip, total] = await Promise.all([
      db.arsip.findMany({
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
              tanggalSurat: true,
            },
          },
          suratKeluar: {
            select: {
              id: true,
              nomorSurat: true,
              perihal: true,
              penerima: true,
              tanggalSurat: true,
            },
          },
          diarsipkanOleh: {
            select: {
              id: true,
              nama: true,
              jabatan: true,
            },
          },
        },
        orderBy: { tanggalArsip: 'desc' },
      }),
      db.arsip.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: arsip,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching arsip:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data arsip' },
      { status: 500 }
    )
  }
}

// POST - Tambah arsip baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      jenisSurat,
      suratMasukId,
      suratKeluarId,
      kategori,
      lokasiArsip,
      diarsipkanOlehId,
      retensi,
      statusArsip = 'Aktif',
      catatan,
    } = body

    // Validasi required fields
    if (!jenisSurat || !kategori || !diarsipkanOlehId) {
      return NextResponse.json(
        { success: false, error: 'Field wajib tidak lengkap' },
        { status: 400 }
      )
    }

    // Validasi jenis surat dan surat ID
    if (jenisSurat === 'SuratMasuk' && !suratMasukId) {
      return NextResponse.json(
        { success: false, error: 'Surat masuk ID diperlukan' },
        { status: 400 }
      )
    }

    if (jenisSurat === 'SuratKeluar' && !suratKeluarId) {
      return NextResponse.json(
        { success: false, error: 'Surat keluar ID diperlukan' },
        { status: 400 }
      )
    }

    // Create arsip
    const arsip = await db.arsip.create({
      data: {
        jenisSurat,
        suratMasukId: jenisSurat === 'SuratMasuk' ? suratMasukId : null,
        suratKeluarId: jenisSurat === 'SuratKeluar' ? suratKeluarId : null,
        kategori,
        lokasiArsip,
        diarsipkanOlehId,
        retensi,
        statusArsip,
        catatan,
      },
      include: {
        suratMasuk: {
          select: {
            id: true,
            nomorSurat: true,
            perihal: true,
          },
        },
        suratKeluar: {
          select: {
            id: true,
            nomorSurat: true,
            perihal: true,
          },
        },
        diarsipkanOleh: {
          select: {
            id: true,
            nama: true,
            jabatan: true,
          },
        },
      },
    })

    // Update status surat menjadi Diarsipkan
    if (jenisSurat === 'SuratMasuk' && suratMasukId) {
      await db.suratMasuk.update({
        where: { id: suratMasukId },
        data: { status: 'Diarsipkan' },
      })
    } else if (jenisSurat === 'SuratKeluar' && suratKeluarId) {
      await db.suratKeluar.update({
        where: { id: suratKeluarId },
        data: { status: 'Diarsipkan' },
      })
    }

    return NextResponse.json({
      success: true,
      data: arsip,
      message: 'Arsip berhasil ditambahkan',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating arsip:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan arsip' },
      { status: 500 }
    )
  }
}
