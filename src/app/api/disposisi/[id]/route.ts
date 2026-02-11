import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Ambil disposisi by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const disposisi = await db.disposisi.findUnique({
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
          },
        },
        dari: {
          select: {
            id: true,
            nama: true,
            email: true,
            nip: true,
            jabatan: true,
          },
        },
        ke: {
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

    if (!disposisi) {
      return NextResponse.json(
        { success: false, error: 'Disposisi tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: disposisi,
    })
  } catch (error) {
    console.error('Error fetching disposisi:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data disposisi' },
      { status: 500 }
    )
  }
}

// PUT - Update disposisi
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      instruksi,
      catatan,
      status,
    } = body

    // Cek apakah disposisi ada
    const existingDisposisi = await db.disposisi.findUnique({
      where: { id },
    })

    if (!existingDisposisi) {
      return NextResponse.json(
        { success: false, error: 'Disposisi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update disposisi
    const disposisi = await db.disposisi.update({
      where: { id },
      data: {
        ...(instruksi && { instruksi }),
        ...(catatan !== undefined && { catatan }),
        ...(status && { status }),
      },
      include: {
        suratMasuk: {
          select: {
            id: true,
            nomorSurat: true,
            perihal: true,
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

    // Update status surat masuk jika disposisi selesai
    if (status === 'Selesai') {
      // Cek apakah ada disposisi lain yang masih pending
      const pendingDisposisi = await db.disposisi.findFirst({
        where: {
          suratMasukId: disposisi.suratMasukId,
          status: 'Pending',
        },
      })

      if (!pendingDisposisi) {
        await db.suratMasuk.update({
          where: { id: disposisi.suratMasukId },
          data: { status: 'Selesai' },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: disposisi,
      message: 'Disposisi berhasil diperbarui',
    })
  } catch (error) {
    console.error('Error updating disposisi:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui disposisi' },
      { status: 500 }
    )
  }
}

// DELETE - Hapus disposisi
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Cek apakah disposisi ada
    const existingDisposisi = await db.disposisi.findUnique({
      where: { id },
    })

    if (!existingDisposisi) {
      return NextResponse.json(
        { success: false, error: 'Disposisi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Hapus disposisi
    await db.disposisi.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Disposisi berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting disposisi:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus disposisi' },
      { status: 500 }
    )
  }
}
