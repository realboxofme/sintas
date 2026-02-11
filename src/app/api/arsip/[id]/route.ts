import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Ambil arsip by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const arsip = await db.arsip.findUnique({
      where: { id },
      include: {
        suratMasuk: {
          include: {
            penerima: {
              select: {
                id: true,
                nama: true,
                jabatan: true,
              },
            },
            disposisi: true,
          },
        },
        suratKeluar: {
          include: {
            pengirim: {
              select: {
                id: true,
                nama: true,
                jabatan: true,
              },
            },
          },
        },
        diarsipkanOleh: {
          select: {
            id: true,
            nama: true,
            email: true,
            nip: true,
            jabatan: true,
          },
        },
      },
    })

    if (!arsip) {
      return NextResponse.json(
        { success: false, error: 'Arsip tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: arsip,
    })
  } catch (error) {
    console.error('Error fetching arsip:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data arsip' },
      { status: 500 }
    )
  }
}

// PUT - Update arsip
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      kategori,
      lokasiArsip,
      retensi,
      statusArsip,
      catatan,
    } = body

    // Cek apakah arsip ada
    const existingArsip = await db.arsip.findUnique({
      where: { id },
    })

    if (!existingArsip) {
      return NextResponse.json(
        { success: false, error: 'Arsip tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update arsip
    const arsip = await db.arsip.update({
      where: { id },
      data: {
        ...(kategori && { kategori }),
        ...(lokasiArsip !== undefined && { lokasiArsip }),
        ...(retensi !== undefined && { retensi }),
        ...(statusArsip && { statusArsip }),
        ...(catatan !== undefined && { catatan }),
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

    return NextResponse.json({
      success: true,
      data: arsip,
      message: 'Arsip berhasil diperbarui',
    })
  } catch (error) {
    console.error('Error updating arsip:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui arsip' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus arsip
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Cek apakah arsip ada
    const existingArsip = await db.arsip.findUnique({
      where: { id },
    })

    if (!existingArsip) {
      return NextResponse.json(
        { success: false, error: 'Arsip tidak ditemukan' },
        { status: 404 }
      )
    }

    // Hapus arsip
    await db.arsip.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Arsip berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting arsip:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus arsip' },
      { status: 500 }
    )
  }
}
