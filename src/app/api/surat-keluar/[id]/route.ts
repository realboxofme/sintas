import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Ambil surat keluar by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const surat = await db.suratKeluar.findUnique({
      where: { id },
      include: {
        pengirim: {
          select: {
            id: true,
            nama: true,
            email: true,
            nip: true,
            jabatan: true,
          },
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
        { success: false, error: 'Surat keluar tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: surat,
    })
  } catch (error) {
    console.error('Error fetching surat keluar:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data surat keluar' },
      { status: 500 }
    )
  }
}

// PUT - Update surat keluar
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
      penerima,
      alamatPenerima,
      perihal,
      sifatSurat,
      pengirimId,
      fileSurat,
      fileNama,
      catatan,
      status,
    } = body

    // Cek apakah surat ada
    const existingSurat = await db.suratKeluar.findUnique({
      where: { id },
    })

    if (!existingSurat) {
      return NextResponse.json(
        { success: false, error: 'Surat keluar tidak ditemukan' },
        { status: 404 }
      )
    }

    // Jika nomor surat diubah, cek apakah sudah ada
    if (nomorSurat && nomorSurat !== existingSurat.nomorSurat) {
      const duplicateSurat = await db.suratKeluar.findUnique({
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
    const surat = await db.suratKeluar.update({
      where: { id },
      data: {
        ...(nomorSurat && { nomorSurat }),
        ...(tanggalSurat && { tanggalSurat: new Date(tanggalSurat) }),
        ...(penerima && { penerima }),
        ...(alamatPenerima !== undefined && { alamatPenerima }),
        ...(perihal && { perihal }),
        ...(sifatSurat && { sifatSurat }),
        ...(pengirimId && { pengirimId }),
        ...(fileSurat !== undefined && { fileSurat }),
        ...(fileNama !== undefined && { fileNama }),
        ...(catatan !== undefined && { catatan }),
        ...(status && { status }),
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
      message: 'Surat keluar berhasil diperbarui',
    })
  } catch (error) {
    console.error('Error updating surat keluar:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui surat keluar' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus surat keluar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Cek apakah surat ada
    const existingSurat = await db.suratKeluar.findUnique({
      where: { id },
      include: {
        arsip: true,
      },
    })

    if (!existingSurat) {
      return NextResponse.json(
        { success: false, error: 'Surat keluar tidak ditemukan' },
        { status: 404 }
      )
    }

    // Hapus surat
    await db.suratKeluar.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Surat keluar berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting surat keluar:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus surat keluar' },
      { status: 500 }
    )
  }
}
