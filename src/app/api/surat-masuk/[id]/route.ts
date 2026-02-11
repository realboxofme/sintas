import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Ambil surat masuk by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const surat = await db.suratMasuk.findUnique({
      where: { id },
      include: {
        penerima: {
          select: {
            id: true,
            nama: true,
            email: true,
            nip: true,
            jabatan: true,
          },
        },
        disposisi: {
          include: {
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
        },
        arsip: {
          select: {
            id: true,
            kategori: true,
            tanggalArsip: true,
            statusArsip: true,
          },
        },
      },
    })

    if (!surat) {
      return NextResponse.json(
        { success: false, error: 'Surat masuk tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: surat,
    })
  } catch (error) {
    console.error('Error fetching surat masuk:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data surat masuk' },
      { status: 500 }
    )
  }
}

// PUT - Update surat masuk
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      status,
    } = body

    // Cek apakah surat ada
    const existingSurat = await db.suratMasuk.findUnique({
      where: { id },
    })

    if (!existingSurat) {
      return NextResponse.json(
        { success: false, error: 'Surat masuk tidak ditemukan' },
        { status: 404 }
      )
    }

    // Jika nomor surat diubah, cek apakah sudah ada
    if (nomorSurat && nomorSurat !== existingSurat.nomorSurat) {
      const duplicateSurat = await db.suratMasuk.findUnique({
        where: { nomorSurat },
      })

      if (duplicateSurat) {
        return NextResponse.json(
          { success: false, error: 'Nomor surat sudah ada' },
          { status: 400 }
        )
      }
    }

    // Update surat
    const surat = await db.suratMasuk.update({
      where: { id },
      data: {
        ...(nomorSurat && { nomorSurat }),
        ...(tanggalSurat && { tanggalSurat: new Date(tanggalSurat) }),
        ...(pengirim && { pengirim }),
        ...(perihal && { perihal }),
        ...(sifatSurat && { sifatSurat }),
        ...(penerimaId && { penerimaId }),
        ...(fileSurat !== undefined && { fileSurat }),
        ...(fileNama !== undefined && { fileNama }),
        ...(catatan !== undefined && { catatan }),
        ...(status && { status }),
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
      message: 'Surat masuk berhasil diperbarui',
    })
  } catch (error) {
    console.error('Error updating surat masuk:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui surat masuk' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus surat masuk
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Cek apakah surat ada
    const existingSurat = await db.suratMasuk.findUnique({
      where: { id },
      include: {
        disposisi: true,
        arsip: true,
      },
    })

    if (!existingSurat) {
      return NextResponse.json(
        { success: false, error: 'Surat masuk tidak ditemukan' },
        { status: 404 }
      )
    }

    // Hapus surat (cascade akan menghapus disposisi dan arsip terkait)
    await db.suratMasuk.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Surat masuk berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting surat masuk:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus surat masuk' },
      { status: 500 }
    )
  }
}
